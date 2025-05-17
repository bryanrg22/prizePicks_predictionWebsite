# main.py
import os

from flask import Flask
from firebase_admin import credentials, firestore, initialize_app
from nba_api.stats.endpoints import ScoreboardV2, BoxScoreTraditionalV2

db = firestore.client()

# Helper functions
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
    mins = int(raw_min.split(":")[0].split(".")[0])
    
    return pts, mins

def update_doc(ref, data):
    
    pts, mins = fetch_player_stats(data["gameId"], data["playerId"])
    if pts is None:
        return False
        
    update = {
        "gameStatus": "Concluded",
        "points": pts,
        "minutes": mins,
        "finishedAt": firestore.SERVER_TIMESTAMP
    }
    update["bet_result"] = "WIN" if pts > data['threshold'] else "LOSS"

    ref.update(update)
    return True


# Main Functions
def check_active_players():
    coll = (
        db.collection("processedPlayers")
          .document("players")
          .collection("active")
    )
    for doc in coll.stream():
        data = doc.to_dict()
        if fetch_game_status(data):
            update_doc(doc.reference, data)


def check_user_picks():
    for user in db.collection("users").stream():
        picks = user.to_dict().get("picks", [])
        for pick in picks:
            if fetch_game_status(pick):
                update_doc(pick.reference, pick)
            

def check_active_bets():
    for user in db.collection("users").stream():
        sub = db.collection("users").document(user.id).collection("activeBets")
        for bet_doc in sub.stream():
            bet = bet_doc.to_dict()

            # 1) Conclude each pick
            for p in bet.get("picks", []):
                if fetch_game_status(p):
                    update_doc(p.reference, p)


            # 2) If all picks concluded, settle the bet
            if all(p.get("gameStatus") == "Concluded" for p in bet.get("picks", [])):
                overall = "WIN" if all(p.get("bet_result") == "WIN" for p in bet["picks"]) else "LOSS"
                bet_doc.reference.update({
                    "status": "Concluded",
                    "bet_result": overall,
                })


def check_games_handler():
    try:
        check_active_players
        #check_user_picks()
        #check_active_bets()
        return "OK", 200
    except Exception as e:
        print("ERROR in check_games:", e)
        return str(e), 500
