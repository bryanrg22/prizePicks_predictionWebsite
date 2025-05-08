import os
import datetime
import requests
from firebase_admin import credentials, firestore, initialize_app
from nba_api.stats.endpoints import ScoreboardV2, BoxScoreTraditionalV2

# Initialize Firestore
cred = credentials.ApplicationDefault()
initialize_app(cred, {'projectId': os.environ['GCP_PROJECT']})
db = firestore.client()

def check_games(request):
    # 1) Find all docs still Scheduled
    docs = db.collection('players')\
             .where('gameStatus', '==', 'Scheduled')\
             .stream()

    for doc in docs:
        data = doc.to_dict()
        game_id = data.get('gameId')
        game_date = data.get('gameDate')    # e.g. '05/06/2025'
        if not game_id or not game_date:
            continue

        # 2) Fetch scoreboard for that date
        sb = ScoreboardV2(game_date=game_date, league_id='00')
        hdr = sb.game_header.get_data_frame()
        row = hdr[hdr['GAME_ID'] == int(game_id)]
        if row.empty:
            continue

        status = row.iloc[0]['GAME_STATUS_TEXT']
        if status.lower().startswith('final'):
            # 3) Fetch box score for this player in that game
            bb = BoxScoreTraditionalV2(game_id=game_id)
            players = bb.player_stats.get_data_frame()
            mine = players[players['PLAYER_ID'] == data['playerId']]
            if not mine.empty:
                pts    = int(mine.iloc[0]['PTS'])
                # MIN might be '32:15' so take minutes only
                rawmin = mine.iloc[0]['MIN'] or '0'
                minutes = int(rawmin.split(':')[0]) if ':' in rawmin else int(rawmin)

                # 4) Patch Firestore
                doc.reference.update({
                    'gameStatus': 'Concluded',
                    'points': pts,
                    'minutes': minutes,
                    'finishedAt': datetime.datetime.utcnow()
                })
    return 'OK', 200