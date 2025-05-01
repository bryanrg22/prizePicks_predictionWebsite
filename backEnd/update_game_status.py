"""
Loop over today's processedPlayers/*/thresholds/* docs,
check each gameId and patch gameStatus when it flips to Final.
"""
import time, datetime, firebase_admin
from firebase_admin import credentials, firestore
import requests

API = "http://127.0.0.1:5000/api/get_game_status"
cred = credentials.Certificate("prizepicksproject-15337-firebase-adminsdk-fbsvc-c967e4c17d.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def tick():
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    pp_root = db.collection("processedPlayers")
    for player_doc in pp_root.stream():
        thr_coll = player_doc.reference.collection("thresholds")
        for thr_doc in thr_coll.stream():
            d = thr_doc.to_dict()
            if d.get("gameStatus") == "Final":
                continue
            gid = d.get("gameId")
            if not gid:
                continue
            resp = requests.post(API, json={"gameId": gid}, timeout=10).json()
            if resp.get("status") == "Final":
                thr_doc.reference.update({"gameStatus": "Final"})
                print("✓", player_doc.id, d["threshold"], "is FINAL")

if __name__ == "__main__":
    while True:
        tick()
        time.sleep(10 * 60)        # every 10-min
