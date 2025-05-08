import os
import datetime
import pytz
import requests
from firebase_admin import credentials, firestore, initialize_app
from nba_api.stats.endpoints import ScoreboardV2, BoxScoreTraditionalV2

# Initialize Firestore
cred = credentials.ApplicationDefault()
initialize_app(cred, {'projectId': os.environ['GCP_PROJECT']})
db = firestore.client()


def has_tipoff_passed(game_date, game_time):
    # game_date: "MM/DD/YYYY", game_time: "8:30 pm ET"
    # parse date + time
    dt_str = f"{game_date} {game_time.replace('ET','').strip()}"
    # Eastern timezone
    eastern = pytz.timezone("US/Eastern")
    # parse e.g. "05/08/2025 8:30 pm"
    tipoff_naive = datetime.datetime.strptime(dt_str, "%m/%d/%Y %I:%M %p")
    tipoff = eastern.localize(tipoff_naive)
    # now in UTC
    now_utc = datetime.datetime.utcnow().replace(tzinfo=pytz.utc)
    return now_utc >= tipoff.astimezone(pytz.utc)


def check_active_processedPlayers():
    # 1) Find all docs still Scheduled
    docs = (
      db
        .collection("processedPlayers")
        .document("players")
        .collection("active")
        .where("gameStatus", "==", "Scheduled")
        .stream()
    )

    for doc in docs:
        try:
            data = doc.to_dict()
            game_id = data.get('gameId')
            game_date = data.get('gameDate')    
            game_id   = data.get("gameId")
            game_date = data.get("gameDate")
            game_time = data.get("gameTime") 
            if not game_id or not game_date:
                continue

            # 0) only poll after tipoff—and only scheduled games
            if data.get("gameStatus") != "Scheduled":
                continue
            if not (game_id and game_date and game_time):
                continue
            if not has_tipoff_passed(game_date, game_time):
                # game hasn't started yet
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
                    #p MIN might be '32:15' so take minutes only
                    rawmin = mine.iloc[0]['MIN'] or '0'
                    minutes = int(rawmin.split(':')[0]) if ':' in rawmin else int(rawmin)
            
                    # 4) Patch Firestore
                    doc.reference.update({
                        'gameStatus': 'Concluded',
                        'points': pts,
                        'minutes': minutes,
                        'finishedAt': datetime.datetime.utcnow(),
                    })
        except Exception as e:
            print(f"⚠️  failed to update {doc.id}: {e} in processedPlayers/active")
            continue

    return 'OK', 200


def check_user_picks():
    users = db.collection("users").stream()
    for u in users:
        picks = u.to_dict().get("picks", [])
        if not picks:
            continue

        updated = False
        for pick in picks:
            if pick.get("gameStatus") != "Scheduled":
                continue

            gid  = pick.get("gameId")
            gdate= pick.get("gameDate")
            game_time = pick.get("gameTime")
            game_id   = pick.get("gameId")
            if not gid or not gdate:
                continue

            # 0) only poll after tipoff—and only scheduled games
            if pick.get("gameStatus") != "Scheduled":
                continue
            if not (game_id and gdate and game_time):
                continue
            if not has_tipoff_passed(gdate, game_time):
                # game hasn't started yet
                continue

            # 1) check status
            sb  = ScoreboardV2(game_date=gdate, league_id="00")
            hdr = sb.game_header.get_data_frame()
            row = hdr[hdr["GAME_ID"] == int(gid)]
            if row.empty:
                continue

            status = row.iloc[0]["GAME_STATUS_TEXT"]
            if status.lower().startswith("final"):
                # 2) pull box score
                bb      = BoxScoreTraditionalV2(game_id=gid)
                stats   = bb.player_stats.get_data_frame()
                mine    = stats[stats["PLAYER_ID"] == pick["playerId"]]
                if mine.empty:
                    continue

                pts     = int(mine.iloc[0]["PTS"])
                rawmin  = mine.iloc[0]["MIN"] or "0"
                mins    = int(rawmin.split(":")[0]) if ":" in rawmin else int(rawmin)
                result  = "WIN" if pts > pick.get("threshold", 0) else "LOSS"

                # 3) update that pick in the array
                pick.update({
                    "gameStatus": "Concluded",
                    "points":      pts,
                    "minutes":     mins,
                    "bet_result":  result
                })
                updated = True

        if updated:
            db.collection("users").document(u.id).update({"picks": picks})


def check_user_active_bets():
    users = db.collection("users").stream()
    for u in users:
        bets_coll = db.collection("users").document(u.id).collection("activeBets")
        for bdoc in bets_coll.stream():
            bet    = bdoc.to_dict()
            picks  = bet.get("picks", [])
            if not picks:
                continue

            picks_changed = False
            # 1) update each pick exactly like above
            for pick in picks:
                if pick.get("gameStatus") != "Scheduled":
                    continue

                gid   = pick.get("gameId")
                gdate = pick.get("gameDate")
                game_time = pick.get("gameTime") 
                game_id   = pick.get("gameId")
                if not gid or not gdate:
                    continue

                # 0) only poll after tipoff—and only scheduled games
                if pick.get("gameStatus") != "Scheduled":
                    continue
                if not (game_id and gdate and game_time):
                    continue
                if not has_tipoff_passed(gdate, game_time):
                    # game hasn't started yet
                    continue



                sb  = ScoreboardV2(game_date=gdate, league_id="00")
                hdr = sb.game_header.get_data_frame()
                row = hdr[hdr["GAME_ID"] == int(gid)]
                if row.empty:
                    continue

                status = row.iloc[0]["GAME_STATUS_TEXT"]
                if status.lower().startswith("final"):
                    bb     = BoxScoreTraditionalV2(game_id=gid)
                    stats  = bb.player_stats.get_data_frame()
                    mine   = stats[stats["PLAYER_ID"] == pick["playerId"]]
                    if mine.empty:
                        continue

                    pts     = int(mine.iloc[0]["PTS"])
                    rawmin  = mine.iloc[0]["MIN"] or "0"
                    mins    = int(rawmin.split(":")[0]) if ":" in rawmin else int(rawmin)
                    result  = "WIN" if pts > pick.get("threshold", 0) else "LOSS"

                    pick.update({
                        "gameStatus": "Concluded",
                        "points":      pts,
                        "minutes":     mins,
                        "bet_result":  result
                    })
                    picks_changed = True

            # 2) write back updated picks if needed
            if picks_changed:
                bdoc.reference.update({"picks": picks})

            # 3) once *all* picks are concluded, settle the bet
            if all(p.get("gameStatus") == "Concluded" for p in picks):
                overall = "WIN" if all(p.get("bet_result")=="WIN" for p in picks) else "LOSS"
                bdoc.reference.update({
                    "status":     "Concluded",
                    "bet_result": overall
                })


def check_games(request):
    check_active_processedPlayers()
    check_user_picks()
    check_user_active_bets()