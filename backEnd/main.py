import os
import datetime
import pytz
from flask import Flask, request
from firebase_admin import credentials, firestore, initialize_app
from nba_api.stats.endpoints import ScoreboardV2, BoxScoreTraditionalV2

# Initialize Firebase Admin
cred = credentials.ApplicationDefault()
initialize_app(cred, {"projectId": os.getenv("GOOGLE_CLOUD_PROJECT")})
db = firestore.client()

# Utility to check if tipoff has passed
def has_tipoff_passed(game_date, game_time):
    eastern = pytz.timezone("US/Eastern")
    dt_str = f"{game_date} {game_time.replace('ET','').strip()}"
    tipoff_naive = datetime.datetime.strptime(dt_str, "%m/%d/%Y %I:%M %p")
    tipoff = eastern.localize(tipoff_naive).astimezone(pytz.utc)
    now_utc = datetime.datetime.utcnow().replace(tzinfo=pytz.utc)
    return now_utc >= tipoff

# Fetch and calculate game outcome; returns None if not concluded yet
def get_player_game_outcome(game_date, game_time, game_id, player_id, threshold=None):
    # Only after tipoff
    if not has_tipoff_passed(game_date, game_time):
        return None

    # Fetch scoreboard
    sb = ScoreboardV2(game_date=game_date, league_id="00").game_header.get_data_frame()
    filtered_sb = sb[sb['GAME_ID'] == int(game_id)]
    if filtered_sb.empty:
        return None
    status = filtered_sb['GAME_STATUS_TEXT'].values[0]
    if not status.lower().startswith('final'):
        return None

    # Fetch box score and extract player stats
    bb = BoxScoreTraditionalV2(game_id=game_id).player_stats.get_data_frame()
    filtered_bb = bb[bb['PLAYER_ID'] == int(player_id)]
    if filtered_bb.empty:
        return None

    pts = int(filtered_bb['PTS'].values[0])
    rawmin = filtered_bb['MIN'].values[0] or '0'
    mins = int(rawmin.split(':')[0]) if ':' in rawmin else int(rawmin)

    outcome = {'points': pts, 'minutes': mins}
    # Compute bet_result if threshold supplied
    if threshold is not None:
        thr = float(threshold)
        outcome['bet_result'] = 'WIN' if pts > thr else 'LOSS'
    return outcome

# 1) Processed players: move from active → concluded when final
def check_active_players():
    coll = db.collection("processedPlayers").document("players").collection("active")
    for doc_snap in coll.where("gameStatus", "==", "Scheduled").stream():
        data = doc_snap.to_dict()
        stats = get_player_game_outcome(
            data.get('gameDate'), data.get('gameTime'), data.get('gameId'), data.get('playerId')
        )
        if stats:
            doc_snap.reference.update({
                'gameStatus': 'Concluded',
                'points': stats['points'],
                'minutes': stats['minutes'],
                'finishedAt': firestore.SERVER_TIMESTAMP
            })

# 2) User picks: update picks array when each pick concludes
def check_user_picks():
    for user_snap in db.collection("users").stream():
        user_data = user_snap.to_dict()
        picks = user_data.get('picks', []) or []
        updated = False
        for pick in picks:
            if pick.get('gameStatus') != 'Scheduled':
                continue
            stats = get_player_game_outcome(
                pick.get('gameDate'), pick.get('gameTime'), pick.get('gameId'), pick.get('playerId'), pick.get('threshold')
            )
            if stats:
                pick['gameStatus'] = 'Concluded'
                pick['points'] = stats['points']
                pick['minutes'] = stats['minutes']
                pick['bet_result'] = stats['bet_result']
                updated = True
        if updated:
            db.collection("users").document(user_snap.id).update({'picks': picks})

# 3) Active bets: update nested picks, then settle bet when all picks done
def check_active_bets():
    for user_snap in db.collection("users").stream():
        bets_coll = db.collection("users").document(user_snap.id).collection("activeBets")
        for bet_doc in bets_coll.stream():
            bet = bet_doc.to_dict()
            picks_list = bet.get('picks', []) or []
            changed = False
            for pick in picks_list:
                if pick.get('gameStatus') != 'Scheduled':
                    continue
                stats = get_player_game_outcome(
                    pick.get('gameDate'), pick.get('gameTime'), pick.get('gameId'), pick.get('playerId'), pick.get('threshold')
                )
                if stats:
                    pick['gameStatus'] = 'Concluded'
                    pick['points'] = stats['points']
                    pick['minutes'] = stats['minutes']
                    pick['bet_result'] = stats['bet_result']
                    changed = True
            if changed:
                bet_doc.reference.update({'picks': picks_list})
            # Once all picks concluded, settle the bet
            if picks_list and all(p.get('gameStatus') == 'Concluded' for p in picks_list):
                overall = 'WIN' if all(p.get('bet_result') == 'WIN' for p in picks_list) else 'LOSS'
                bet_doc.reference.update({
                    'status': 'Concluded',
                    'bet_result': overall
                })

# Flask app and endpoint
app = Flask(__name__)

@app.route("/check_games", methods=["GET", "POST"])
def check_games_handler():
    try:
        check_active_players()
        check_user_picks()
        check_active_bets()
        return "OK", 200
    except Exception as e:
        print("ERROR in check_games:", e)
        return f"Error: {e}", 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
