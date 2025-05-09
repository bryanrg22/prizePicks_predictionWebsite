# main.py
import os, datetime, pytz
from firebase_admin import credentials, firestore, initialize_app
from flask import Flask, request
from nba_api.stats.endpoints import ScoreboardV2, BoxScoreTraditionalV2

# initialize Firebase Admin
cred = credentials.ApplicationDefault()
initialize_app(cred, {"projectId": os.getenv("GOOGLE_CLOUD_PROJECT")})
db = firestore.client()

def has_tipoff_passed(date, time):
    eastern = pytz.timezone("US/Eastern")
    dt = datetime.datetime.strptime(f"{date} {time.replace('ET','').strip()}", "%m/%d/%Y %I:%M %p")
    return datetime.datetime.utcnow().replace(tzinfo=pytz.utc) >= eastern.localize(dt).astimezone(pytz.utc)

def conclude_doc(ref, data):
    sb = ScoreboardV2(game_date=data["gameDate"], league_id="00").game_header.get_data_frame()
    if sb.empty or not sb.iloc[ sb['GAME_ID']==int(data["gameId"]) ]['GAME_STATUS_TEXT'].iloc[0].lower().startswith("final"):
        return False
    bb = BoxScoreTraditionalV2(game_id=data["gameId"]).player_stats.get_data_frame()
    me = bb[bb["PLAYER_ID"]==data["playerId"]]
    if me.empty: return False
    pts = int(me.iloc[0]["PTS"])
    raw = me.iloc[0]["MIN"] or "0"
    mins = int(raw.split(":")[0]) if ":" in raw else int(raw)
    ref.update({
      "gameStatus": "Concluded",
      "points": pts,
      "minutes": mins,
      "finishedAt": firestore.SERVER_TIMESTAMP
    })
    return True

def check_active_players():
    for d in db.collection("processedPlayers").document("players").collection("active") \
               .where("gameStatus","==","Scheduled").stream():
        data = d.to_dict()
        if data.get("gameDate") and data.get("gameTime") and has_tipoff_passed(data["gameDate"], data["gameTime"]):
            conclude_doc(d.reference, data)

def check_user_picks():
    for u in db.collection("users").stream():
        picks = u.to_dict().get("picks", [])
        updated = False
        for p in picks:
            if p.get("gameStatus")=="Scheduled" and p.get("gameDate") and has_tipoff_passed(p["gameDate"], p["gameTime"]):
                if conclude_doc(u.reference.collection("dummy").document(), p):  # use our same concl routine
                    p.update({"gameStatus":"Concluded","bet_result": "WIN" if p["points"]>p["threshold"] else "LOSS"})
                    updated = True
        if updated:
            db.collection("users").document(u.id).update({"picks": picks})

def check_active_bets():
    for u in db.collection("users").stream():
        for b in db.collection("users").document(u.id).collection("activeBets").stream():
            bet = b.to_dict(); changed=False
            for p in bet.get("picks", []):
                if p.get("gameStatus")=="Scheduled" and has_tipoff_passed(p["gameDate"],p["gameTime"]):
                    if conclude_doc(b.reference, p):
                        p.update({"gameStatus":"Concluded","bet_result": "WIN" if p["points"]>p["threshold"] else "LOSS"})
                        changed=True
            if changed:
                b.reference.update({"picks": bet["picks"]})
            if all(p.get("gameStatus")=="Concluded" for p in bet["picks"]):
                overall = "WIN" if all(p["bet_result"]=="WIN" for p in bet["picks"]) else "LOSS"
                b.reference.update({"status": "Concluded", "bet_result": overall})

app = Flask(__name__)
@app.route("/check_games", methods=["POST","GET"])
def check_games_handler(request=None):
    try:
        check_active_players()
        check_user_picks()
        check_active_bets()
        return "OK", 200
    except Exception as e:
        print("ERROR in check_games:", e)
        return f"Error: {e}", 500