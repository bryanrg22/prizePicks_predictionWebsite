import datetime, traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

import firebase_admin
from firebase_admin import credentials, firestore

import player_analyzer
from prediction_analyzer import calculate_poisson_probability
from monte_carlo import monte_carlo_for_player
from chatgpt_bet_explainer import get_bet_explanation_from_chatgpt
import injury_report, game_results

from screenshot_parser import parse_image_data_url
import base64
import requests

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

cred = credentials.Certificate("prizepicksproject-15337-firebase-adminsdk-fbsvc-c967e4c17d.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def pkey(name: str) -> str:
    return name.lower().replace(" ", "_")

def thr_doc_ref(name: str, threshold: float):
    doc_id = f"{pkey(name)}_{threshold}"
    # now under processedPlayers → players → active → {doc_id}
    return (
        db
        .collection("processedPlayers")
        .document("players")
        .collection("active")
        .document(doc_id)
    )

@app.route("/api/player", methods=["POST"])
def analyze_player_endpoint():
    body      = request.json or {}
    name      = body.get("playerName")
    threshold = float(body.get("threshold", 0))
    key       = name.lower().replace(" ", "_")
    ref = db.collection("processedPlayers") \
            .document("players") \
            .collection("active") \
            .document(f"{key}_{threshold}")

    snap = ref.get()
    if snap.exists:
        return jsonify(snap.to_dict()), 200

    # 1) run your pipeline
    first, last = name.split(maxsplit=1)
    pdata = player_analyzer.analyze_player(first, last, threshold)
    pdata["threshold"]           = threshold
    # make sure both fields exist even if analyzer couldn’t find a game
    pdata.setdefault("gameId", None)
    pdata.setdefault("gameStatus", "Scheduled")
    pdata["injuryReport"]        = injury_report.get_player_injury_status(name)
    pdata["poissonProbability"]   = calculate_poisson_probability(pdata["seasonAvgPoints"], threshold)
    pdata["monteCarloProbability"]= monte_carlo_for_player(name, threshold) or 0.0  
    pdata["betExplanation"]      = get_bet_explanation_from_chatgpt(pdata)

    # 2) persist it
    ref.set(pdata)

    # 3) return it
    return jsonify(pdata), 200



@app.route("/api/parse_screenshot", methods=["POST"])
def parse_screenshot_endpoint():
    """
    1) Accepts multipart/form-data images under 'images'
    2) For each: encode → parse_image_data_url → get list of {player,threshold}
    3) For each pair: POST to /api/player so it goes through your normal pipeline.
    4) Return the flat list of all parsed entries.
    """
    files = request.files.getlist("images")
    if not files:
        return jsonify({"error": "No images uploaded"}), 400

    parsed = []
    base = request.url_root.rstrip("/")  # e.g. http://127.0.0.1:5000

    for img in files:
        raw = img.read()
        ext = img.filename.rsplit(".", 1)[-1].lower()
        mime = f"image/{'jpeg' if ext=='jpg' else ext}"
        data_url = f"data:{mime};base64," + base64.b64encode(raw).decode()

        try:
            result = parse_image_data_url(data_url)
            players = result.get("players", [])
        except Exception:
            continue

        for entry in players:
            name      = entry.get("player")
            threshold = entry.get("threshold")
            if not name or threshold is None:
                continue

            # Fire off your existing analyze route:
            try:
                requests.post(
                    f"{base}/api/player",
                    json={"playerName": name, "threshold": threshold},
                    timeout=10
                )
            except Exception:
                # swallow any network or timeout errors
                pass

            parsed.append({"playerName": name, "threshold": threshold})
            print(f"[→ POST]/api/player  {name}  @ {threshold}")

    return jsonify({"status": "ok", "parsedPlayers": parsed}), 200


@app.route("/api/player/<player_id>/more_games", methods=["GET"])
def more_games_endpoint(player_id):
    """
    Returns the “extra” regular-season games beyond the first 5.
    Optional query-param: ?season=YYYY-YY; otherwise uses current season.
    """
    
    games = player_analyzer.fetch_more_games(player_id, season)
    return jsonify(games), 200
    


# include game-results endpoints
game_results.add_game_results_endpoints(app, db)

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
