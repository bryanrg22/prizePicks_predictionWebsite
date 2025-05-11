# main.py
import os
import datetime
import pytz

from firebase_admin import credentials, firestore, initialize_app
from nba_api.stats.endpoints import ScoreboardV2, BoxScoreTraditionalV2

# Initialize Firebase Admin SDK
cred = credentials.ApplicationDefault()
initialize_app(cred, {"projectId": os.getenv("GOOGLE_CLOUD_PROJECT")})
db = firestore.client()

def fetch_game_status(data):
    sb = ScoreboardV2(game_date=data["gameDate"], league_id="00").game_header.get_data_frame()
    if sb.empty:
        print("No game data available.")
    
    if data['gameId'] in sb['GAME_ID'].values:
        mask = sb["GAME_ID"] == data['gameId']
        # row = sb.loc[mask].iloc[0]
        
    if sb.loc[mask, "GAME_STATUS_TEXT"].iloc[0] == "Final":
        return True


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
    i = 1
    for doc in coll.stream():
        if i == 1:
            data = doc.to_dict()
            if fetch_game_status(data):
                conclude_doc

            

            i += 1
        
        #if data.get("gameDate") and data.get("gameTime") \
        #   and has_tipoff_passed(data["gameDate"], data["gameTime"]):
        #    conclude_doc(doc.reference, data)

#def check_user_picks():
#    for user in db.collection("users").stream():
#        picks = user.to_dict().get("picks", [])
#        updated = False
#        for pick in picks:
#            if pick.get("gameStatus") != "Scheduled":
#                continue
#            if pick.get("gameDate") and has_tipoff_passed(pick["gameDate"], pick["gameTime"]):
#                # patch with threshold so bet_result is set
#                if conclude_doc(user.reference, pick, threshold=pick.get("threshold", 0)):
#                    pick["gameStatus"] = "Concluded"
#                    updated = True
#        if updated:
#            db.collection("users").document(user.id).update({"picks": picks})
#
#def check_active_bets():
#    for user in db.collection("users").stream():
#        sub = db.collection("users").document(user.id).collection("activeBets")
#        for bet_doc in sub.stream():
#            bet = bet_doc.to_dict()
#            changed = False
#
#            # 1) Conclude each pick
#            for p in bet.get("picks", []):
#                if p.get("gameStatus") == "Scheduled" \
#                   and has_tipoff_passed(p["gameDate"], p["gameTime"]):
#                    if conclude_doc(bet_doc.reference, p, threshold=p.get("threshold", 0)):
#                        p["gameStatus"] = "Concluded"
#                        changed = True
#
#            # 2) Write back updated picks
#            if changed:
#                bet_doc.reference.update({"picks": bet["picks"]})
#
#            # 3) If all picks concluded, settle the bet
#            if all(p.get("gameStatus") == "Concluded" for p in bet.get("picks", [])):
#                overall = "WIN" if all(p.get("bet_result") == "WIN" for p in bet["picks"]) else "LOSS"
#                bet_doc.reference.update({
#                    "status": "Concluded",
#                    "bet_result": overall,
#                })


check_active_players()
