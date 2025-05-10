# main.py
import os
import datetime
import pytz

from flask import Flask
from firebase_admin import credentials, firestore, initialize_app
from nba_api.stats.endpoints import ScoreboardV2, BoxScoreTraditionalV2

# Initialize Firebase Admin SDK
cred = credentials.ApplicationDefault()
initialize_app(cred, {"projectId": os.getenv("GOOGLE_CLOUD_PROJECT")})
db = firestore.client()

def has_tipoff_passed(date_str, time_str):
    # date_str: "MM/DD/YYYY", time_str: "8:30 pm ET"
    eastern = pytz.timezone("US/Eastern")
    dt = datetime.datetime.strptime(
        f"{date_str} {time_str.replace('ET', '').strip()}",
        "%m/%d/%Y %I:%M %p",
    )
    tipoff_utc = eastern.localize(dt).astimezone(pytz.utc)
    return datetime.datetime.utcnow().replace(tzinfo=pytz.utc) >= tipoff_utc

def fetch_game_status(game_date, game_id):
    """Return the GAME_STATUS_TEXT (e.g. 'Final') or None."""
    sb = ScoreboardV2(game_date=game_date, league_id="00").game_header.get_data_frame()
    if sb.empty:
        return None
    mask = sb["GAME_ID"] == int(game_id)
    if not mask.any():
        return None
    return sb.loc[mask, "GAME_STATUS_TEXT"].iloc[0]

def fetch_player_stats(game_id, player_id):
    """Return (points, minutes) or (None, None)."""
    bb = BoxScoreTraditionalV2(game_id=game_id).player_stats.get_data_frame()
    if bb.empty:
        return None, None
    mask = bb["PLAYER_ID"] == player_id
    if not mask.any():
        return None, None
    row = bb.loc[mask].iloc[0]
    pts = int(row["PTS"])
    raw_min = row["MIN"] or "0"
    mins = int(raw_min.split(":")[0]) if ":" in raw_min else int(raw_min)
    return pts, mins

def conclude_doc(ref, data, threshold=None):
    """
    If the game is final, patch the document reference:
      - gameStatus, points, minutes, finishedAt
      - if threshold is provided, also compute bet_result
    Returns True if we wrote anything.
    """
    status = fetch_game_status(data["gameDate"], data["gameId"])
    if not status or not status.lower().startswith("final"):
        return False

    pts, mins = fetch_player_stats(data["gameId"], data["playerId"])
    if pts is None:
        return False

    update = {
        "gameStatus": "Concluded",
        "points": pts,
        "minutes": mins,
        "finishedAt": firestore.SERVER_TIMESTAMP,
    }
    if threshold is not None:
        update["bet_result"] = "WIN" if pts > threshold else "LOSS"

    ref.update(update)
    return True

def check_active_players():
    coll = (
        db.collection("processedPlayers")
          .document("players")
          .collection("active")
          .where("gameStatus", "==", "Scheduled")
    )
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
            if pick.get("gameDate") and has_tipoff_passed(pick["gameDate"], pick["gameTime"]):
                # patch with threshold so bet_result is set
                if conclude_doc(user.reference, pick, threshold=pick.get("threshold", 0)):
                    pick["gameStatus"] = "Concluded"
                    updated = True
        if updated:
            db.collection("users").document(user.id).update({"picks": picks})

def check_active_bets():
    for user in db.collection("users").stream():
        sub = db.collection("users").document(user.id).collection("activeBets")
        for bet_doc in sub.stream():
            bet = bet_doc.to_dict()
            changed = False

            # 1) Conclude each pick
            for p in bet.get("picks", []):
                if p.get("gameStatus") == "Scheduled" \
                   and has_tipoff_passed(p["gameDate"], p["gameTime"]):
                    if conclude_doc(bet_doc.reference, p, threshold=p.get("threshold", 0)):
                        p["gameStatus"] = "Concluded"
                        changed = True

            # 2) Write back updated picks
            if changed:
                bet_doc.reference.update({"picks": bet["picks"]})

            # 3) If all picks concluded, settle the bet
            if all(p.get("gameStatus") == "Concluded" for p in bet.get("picks", [])):
                overall = "WIN" if all(p.get("bet_result") == "WIN" for p in bet["picks"]) else "LOSS"
                bet_doc.reference.update({
                    "status": "Concluded",
                    "bet_result": overall,
                })

app = Flask(__name__)

@app.route("/check_games", methods=["GET", "POST"])
def check_games_handler(request):
    try:
        check_active_players()
        check_user_picks()
        check_active_bets()
        return "OK", 200
    except Exception as e:
        print("ERROR in check_games:", e)
        return str(e), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
