from datetime import datetime
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

import firebase_admin
from firebase_admin import firestore

try:
    firebase_admin.initialize_app()
except ValueError:
    # already initialized
    pass
db = firestore.client()

import player_analyzer

from prediction_analyzer import calculate_poisson_probability
from monte_carlo import monte_carlo_for_player
from chatgpt_bet_explainer import get_bet_explanation_from_chatgpt
from volatility import fetch_point_series, forecast_volatility, forecast_playoff_volatility
import injury_report

from screenshot_parser import parse_image_data_url
import base64
import requests

from main import check_games_handler

app = Flask(__name__)
CORS(app, resources={r"/api/*": {
    "origins": [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://prizepicksproject-15337.web.app",
        "https://prizepicksproject-15337.firebaseapp.com",
        "https://prizepicks-backend-***.us-west2.run.app"
    ]
}})

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


@app.route("/", methods=["GET"])
def root():
    return "OK", 200


@app.route("/api/player", methods=["POST"])
def analyze_player_endpoint():
    body      = request.json or {}
    name      = body.get("playerName")
    threshold = float(body.get("threshold", 0))
    key       = name.lower().replace(" ", "_")
    ref = (
        db.collection("processedPlayers")
          .document("players")
          .collection("active")
    )
    
    #for doc in ref.stream():
    #    data = doc.to_dict()
    #    if key in data['pick_id'] and data["threshold"] == threshold:
    #        return jsonify(data), 200
        

    # 1) run your pipeline
    first, last = name.split(maxsplit=1)
    pdata = player_analyzer.analyze_player(first, last, threshold)
    # make sure both fields exist even if analyzer couldn’t find a game
    pdata.setdefault("gameId", None)
    pdata.setdefault("gameStatus", "Scheduled")
    pdata["injuryReport"]        = injury_report.get_player_injury_status(name)
    pdata["poissonProbability"]   = calculate_poisson_probability(pdata["seasonAvgPoints"], threshold)
    pdata["monteCarloProbability"]= monte_carlo_for_player(name, threshold) or 0.0  
    pdata["betExplanation"]      = get_bet_explanation_from_chatgpt(pdata)

    gd = pdata.get("gameDate")
    game_dt = datetime.strptime(gd, "%m/%d/%Y")
    ts_str = game_dt.strftime("%Y%m%d")
    pdata["pick_id"]      = f"{pkey(name)}_{threshold}_{ts_str}"

    # — GARCH vol forecast —
    series = fetch_point_series(pdata, n_games=50)
    vol   = forecast_volatility(series)
    pdata["volatilityForecast"] = vol

    if pdata["num_playoff_games"] >= 5:
        pdata["volatilityPlayOffsForecast"] = forecast_playoff_volatility(pdata)


    # 2) persist it (writes to processedPlayers/players/active/{player_threshold})
    ref = db.collection("processedPlayers") \
            .document("players") \
            .collection("active") \
            .document(f"{pkey(name)}_{threshold}_{ts_str}")
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

    parsed = []
    files = request.files.getlist("images")
    for img in files:
        raw = img.read()
        ext = img.filename.rsplit(".", 1)[-1].lower()
        mime = f"image/{'jpeg' if ext=='jpg' else ext}"
        data_url = f"data:{mime};base64," + base64.b64encode(raw).decode()

        try:
            result = parse_image_data_url(data_url)
            players = result.get("players", [])
        except Exception:
            app.logger.exception("Screenshot parsing failed")
            players = []

        # Collect all names + thresholds, but do NOT call /api/player here
        for entry in players:
            name      = entry.get("player")
            threshold = entry.get("threshold")
            image = entry.get("image")
            if name and threshold is not None:
                parsed.append({ "playerName": name, "threshold": threshold, "image": image })

    return jsonify({
        "status":       "ok",
        "parsedPlayers": parsed,
        "count":         len(parsed)
    }), 200

    


    ######################## OLD CODE THAT WORKS ###########################

    #files = request.files.getlist("images")
    #if not files:
    #    return jsonify({"error": "No images uploaded"}), 400


@app.route("/api/player/<player_id>/more_games", methods=["GET"])
def more_games_endpoint(player_id):
    """
    Returns the “extra” regular-season games beyond the first 5.
    Optional query-param: ?season=YYYY-YY; otherwise uses current season.
    """
    try:
        games = player_analyzer.fetch_more_games(player_id)
        return jsonify(games), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


app.add_url_rule(
    "/check_games",
    endpoint="check_games",
    view_func=check_games_handler,
    methods=["GET", "POST"],
)


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)