from flask import Flask, jsonify
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)

# Use a service account.
cred = credentials.Certificate("serviceAccountKey.json")

try:
    firebase_admin.initialize_app(cred)
    print("Firebase app initialized successfully.")
except Exception as e:
    print(f"Error initializing Firebase app: {e}")

db = firestore.client()

# Example route
@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

# Add these admin endpoints after the existing routes

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

if __name__ == '__main__':
    app.run(debug=True)
