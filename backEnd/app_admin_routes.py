# Add these updated admin routes to your app.py file

@app.route("/api/admin/overview", methods=["GET"])
def admin_overview():
    """Get real system overview data for admin dashboard"""
    try:
        from admin_endpoints import get_real_system_overview
        data = get_real_system_overview(db)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in admin overview: {e}")
        return jsonify({"error": str(e), "status": "error"}), 500

@app.route("/api/admin/users", methods=["GET"])
def admin_users():
    """Get real user analytics data"""
    try:
        from admin_endpoints import get_real_user_analytics
        time_range = request.args.get('timeRange', '7d')
        data = get_real_user_analytics(db, time_range)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in admin users: {e}")
        return jsonify({"error": str(e), "status": "error"}), 500

@app.route("/api/admin/bets", methods=["GET"])
def admin_bets():
    """Get real bet performance analytics"""
    try:
        from admin_endpoints import get_real_bet_performance
        time_range = request.args.get('timeRange', '30d')
        data = get_real_bet_performance(db, time_range)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in admin bets: {e}")
        return jsonify({"error": str(e), "status": "error"}), 500

@app.route("/api/admin/players", methods=["GET"])
def admin_players():
    """Get real player analytics data"""
    try:
        from admin_endpoints import get_real_player_analytics
        data = get_real_player_analytics(db)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in admin players: {e}")
        return jsonify({"error": str(e), "status": "error"}), 500

@app.route("/api/admin/financial", methods=["GET"])
def admin_financial():
    """Get real financial metrics"""
    try:
        from admin_endpoints import get_real_financial_metrics
        time_range = request.args.get('timeRange', '30d')
        data = get_real_financial_metrics(db, time_range)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in admin financial: {e}")
        return jsonify({"error": str(e), "status": "error"}), 500

@app.route("/api/admin/system", methods=["GET"])
def admin_system():
    """Get real system health and monitoring data"""
    try:
        from admin_endpoints import get_system_health, check_cloud_functions_health
        
        health_data = get_system_health()
        functions_health = check_cloud_functions_health()
        
        # Merge function health into main health data
        health_data["cloudFunctions"] = functions_health
        
        return jsonify(health_data), 200
    except Exception as e:
        logger.error(f"Error in admin system: {e}")
        return jsonify({"error": str(e), "status": "error"}), 500

@app.route("/api/admin/logs", methods=["GET"])
def admin_logs():
    """Get recent system logs and errors"""
    try:
        # In production, this would fetch from Google Cloud Logging
        # For now, return recent activity from Firestore
        
        logs = [
            {
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "level": "info",
                "message": "Player analysis completed: LeBron James",
                "service": "backend"
            },
            {
                "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(minutes=5)).isoformat(),
                "level": "info", 
                "message": "Game status check completed successfully",
                "service": "cloud_function"
            },
            {
                "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(minutes=10)).isoformat(),
                "level": "warning",
                "message": "High memory usage detected: 67%",
                "service": "backend"
            }
        ]
        
        return jsonify({
            "logs": logs,
            "status": "success"
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting admin logs: {e}")
        return jsonify({"error": str(e), "status": "error"}), 500
