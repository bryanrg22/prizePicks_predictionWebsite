# main.py
import os
import datetime
import pytz
from flask import Flask, request
from firebase_admin import credentials, firestore, initialize_app
from nba_api.stats.endpoints import ScoreboardV2, BoxScoreTraditionalV2

# Initialize Firebase
cred = credentials.ApplicationDefault()
initialize_app(cred, {"projectId": os.getenv("GOOGLE_CLOUD_PROJECT")})
db = firestore.client()

def has_tipoff_passed(date, time):
    eastern = pytz.timezone("US/Eastern")
    dt = datetime.datetime.strptime(f"{date} {time.replace('ET','').strip()}",
                                    "%m/%d/%Y %I:%M %p")
    tipoff = eastern.localize(dt).astimezone(pytz.utc)
    return datetime.datetime.utcnow().replace(tzinfo=pytz.utc) >= tipoff

def conclude_doc(ref, data):
    # 1) fetch scoreboard
    sb = ScoreboardV2(game_date=data["gameDate"], league_id="00") \
           .game_header.get_data_frame()
    if sb.empty:
        return False

    mask = sb['GAME_ID'] == int(data["gameId"])
    if not mask.any():
        return False

    status = sb.loc[mask, 'GAME_STATUS_TEXT'].iloc[0]
    if not status.lower().startswith("final"):
        return False

    # 2) fetch box score
    bb = BoxScoreTraditionalV2(game_id=data["gameId"]) \
           .player_stats.get_data_frame()
    me = bb[bb["PLAYER_ID"] == data["playerId"]]
    if me.empty:
        return False

    pts = int(me.iloc[0]["PTS"])
    raw = me.iloc[0]["MIN"] or "0"
    mins = int(raw.split(":")[0]) if ":" in raw else int(raw)

    # 3) patch the document
    ref.update({
        "gameStatus": "Concluded",
        "points":      pts,
        "minutes":     mins,
        "finishedAt":  firestore.SERVER_TIMESTAMP
    })
    return True

def check_active_players():
    coll = db.collection("processedPlayers") \
             .document("players") \
             .collection("active") \
             .where("gameStatus", "==", "Scheduled")
    for doc in coll.stream():
        data = doc.to_dict()
        if data.get("gameDate") and data.get("gameTime") \
           and has_tipoff_passed(data["gameDate"], data["gameTime"]):
            conclude_doc(doc.reference, data)

def check_user_picks():
    for user in db.collection("users").stream():
        picks = user.to_dict().get("picks", [])
        updated = False

        for pick in picks:
            if pick.get("gameStatus") != "Scheduled":
                continue
            if (pick.get("gameDate") and has_tipoff_passed(pick["gameDate"], pick["gameTime"])
                and conclude_doc(user.reference, pick)):
                # mark that pick concluded
                pick["gameStatus"] = "Concluded"
                pick["bet_result"] = "WIN" if pick["points"] > pick.get("threshold", 0) else "LOSS"
                updated = True

        if updated:
            db.collection("users").document(user.id).update({"picks": picks})

def check_active_bets():
    for user in db.collection("users").stream():
        bets = db.collection("users").document(user.id).collection("activeBets")
        for bet_doc in bets.stream():
            bet = bet_doc.to_dict()
            changed = False

            # 1) conclude any scheduled picks
            for pick in bet.get("picks", []):
                if (pick.get("gameStatus") == "Scheduled"
                    and has_tipoff_passed(pick["gameDate"], pick["gameTime"])
                    and conclude_doc(bet_doc.reference, pick)):
                    pick["gameStatus"] = "Concluded"
                    pick["bet_result"] = "WIN" if pick["points"] > pick.get("threshold", 0) else "LOSS"
                    changed = True

            # 2) write updated picks back
            if changed:
                bet_doc.reference.update({"picks": bet["picks"]})

            # 3) if *all* picks done, settle the bet
            if all(p.get("gameStatus") == "Concluded" for p in bet["picks"]):
                overall = "WIN" if all(p["bet_result"] == "WIN" for p in bet["picks"]) else "LOSS"
                bet_doc.reference.update({
                    "status":     "Concluded",
                    "bet_result": overall
                })

app = Flask(__name__)

@app.route("/check_games", methods=["POST","GET"])
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