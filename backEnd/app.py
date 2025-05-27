import datetime, traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

import firebase_admin
from firebase_admin import firestore
import firebase_admin 

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

# On Cloud Run the default service account is already bound to your project,
# so this will pick it up automatically.
firebase_admin.initialize_app()
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
    # make sure both fields exist even if analyzer couldn’t find a game
    pdata.setdefault("gameId", None)
    pdata.setdefault("gameStatus", "Scheduled")
    pdata["injuryReport"]        = injury_report.get_player_injury_status(name)
    pdata["poissonProbability"]   = calculate_poisson_probability(pdata["seasonAvgPoints"], threshold)
    pdata["monteCarloProbability"]= monte_carlo_for_player(name, threshold) or 0.0  
    pdata["betExplanation"]      = get_bet_explanation_from_chatgpt(pdata)
    pdata["pick_id"]      = f"{pkey(name)}_{threshold}"

    # — GARCH vol forecast —
    series = fetch_point_series(pdata, n_games=50)
    vol   = forecast_volatility(series)
    pdata["volatilityForecast"] = vol

    if pdata["num_playoff_games"] >= 5:
        pdata["volatilityPlayOffsForecast"] = forecast_playoff_volatility(pdata)


    # 2) persist it (writes to processedPlayers/players/active/{player_threshold})
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
    base = request.url_root.rstrip("/").replace("http://", "https://", 1)

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
            parsed = {"players": [], "count": 0}
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
    try:
        games = player_analyzer.fetch_more_games(player_id)
        return jsonify(games), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/overview", methods=["GET"])
def admin_overview():
    """Get system overview data for admin dashboard"""
    try:
        # Get total users
        users_ref = db.collection("users")
        users = list(users_ref.stream())
        total_users = len(users)
        
        # Get active bets
        active_bets = 0
        total_winnings = 0
        for user_doc in users:
            user_data = user_doc.to_dict()
            profile = user_data.get("profile", user_data)
            total_winnings += profile.get("totalEarnings", 0)
            
            # Count active bets
            active_bets_ref = db.collection("users").document(user_doc.id).collection("activeBets")
            active_bets += len(list(active_bets_ref.stream()))
        
        # Get processed players
        processed_ref = db.collection("processedPlayers").document("players").collection("active")
        processed_players = len(list(processed_ref.stream()))
        
        return jsonify({
            "totalUsers": total_users,
            "activeBets": active_bets,
            "processedPlayers": processed_players,
            "totalWinnings": total_winnings,
            "apiRequests": 15420,  # Mock data
            "status": "success"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/users", methods=["GET"])
def admin_users():
    """Get user analytics data"""
    try:
        users_ref = db.collection("users")
        users = list(users_ref.stream())
        
        user_data = []
        for user_doc in users:
            data = user_doc.to_dict()
            profile = data.get("profile", data)
            
            user_info = {
                "username": user_doc.id,
                "displayName": profile.get("displayName", user_doc.id),
                "totalEarnings": profile.get("totalEarnings", 0),
                "totalBets": profile.get("totalBets", 0),
                "winCount": profile.get("winCount", 0),
                "winRate": profile.get("winRate", 0),
                "lastLogin": profile.get("lastLogin"),
                "createdAt": profile.get("createdAt")
            }
            user_data.append(user_info)
        
        return jsonify({
            "users": user_data,
            "totalUsers": len(users),
            "status": "success"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/bets", methods=["GET"])
def admin_bets():
    """Get bet performance analytics"""
    try:
        # This would aggregate bet data from all users
        # For now, returning mock data structure
        
        return jsonify({
            "totalBets": 156,
            "winningBets": 106,
            "losingBets": 50,
            "winRate": 68.2,
            "totalWinnings": 8450,
            "avgBetSize": 85,
            "roi": 142.3,
            "status": "success"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/players", methods=["GET"])
def admin_players():
    """Get player analytics data"""
    try:
        processed_ref = db.collection("processedPlayers").document("players").collection("active")
        players = list(processed_ref.stream())
        
        player_stats = {}
        total_analyzed = 0
        
        for player_doc in players:
            data = player_doc.to_dict()
            name = data.get("name", "Unknown")
            
            if name not in player_stats:
                player_stats[name] = {
                    "name": name,
                    "team": data.get("team", ""),
                    "timesAnalyzed": 0,
                    "avgThreshold": 0,
                    "thresholds": []
                }
            
            player_stats[name]["timesAnalyzed"] += 1
            player_stats[name]["thresholds"].append(data.get("threshold", 0))
            total_analyzed += 1
        
        # Calculate averages
        for player in player_stats.values():
            if player["thresholds"]:
                player["avgThreshold"] = sum(player["thresholds"]) / len(player["thresholds"])
        
        return jsonify({
            "players": list(player_stats.values()),
            "totalPlayers": len(player_stats),
            "totalAnalyzed": total_analyzed,
            "status": "success"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/system", methods=["GET"])
def admin_system():
    """Get system health and monitoring data"""
    try:
        # In production, this would connect to monitoring services
        return jsonify({
            "apiResponseTime": "245ms",
            "databasePerformance": 98.5,
            "cpuUsage": 34,
            "memoryUsage": 67,
            "networkLatency": "12ms",
            "errorRate": 0.2,
            "uptime": 99.8,
            "services": {
                "frontend": "operational",
                "backend": "operational", 
                "database": "operational",
                "functions": "operational"
            },
            "status": "success"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)


app.add_url_rule(
  "/check_games",
  "check_games",
  check_games_handler,
  methods=["GET", "POST"]
)