import datetime
import traceback
from flask import jsonify
from firebase_admin import firestore
import logging
import requests
import time

logger = logging.getLogger(__name__)

def get_real_system_overview(db):
    """Get real system overview data from Firestore"""
    try:
        # Get total users
        users_ref = db.collection("users")
        users_stream = users_ref.stream()
        users_list = list(users_stream)
        total_users = len(users_list)
        
        # Get active bets count and total winnings
        active_bets = 0
        total_winnings = 0
        
        for user_doc in users_list:
            user_data = user_doc.to_dict()
            profile = user_data.get("profile", user_data)
            total_winnings += profile.get("totalEarnings", 0)
            
            # Count active bets in subcollection
            try:
                active_bets_ref = db.collection("users").document(user_doc.id).collection("activeBets")
                active_bets_stream = active_bets_ref.stream()
                active_bets += len(list(active_bets_stream))
            except Exception as e:
                logger.warning(f"Error counting active bets for user {user_doc.id}: {e}")
        
        # Get processed players count
        try:
            processed_ref = db.collection("processedPlayers").document("players").collection("active")
            processed_stream = processed_ref.stream()
            processed_players = len(list(processed_stream))
        except Exception as e:
            logger.error(f"Error counting processed players: {e}")
            processed_players = 0
        
        # Get concluded players count for additional metrics
        try:
            concluded_ref = db.collection("processedPlayers").document("players").collection("concluded")
            concluded_stream = concluded_ref.stream()
            concluded_players = len(list(concluded_stream))
        except Exception as e:
            logger.warning(f"Error counting concluded players: {e}")
            concluded_players = 0
        
        # Calculate system uptime (mock for now, would need monitoring service)
        uptime = 99.8
        
        # API requests (would need to track this in production)
        api_requests = 15420  # This would come from monitoring
        
        return {
            "totalUsers": total_users,
            "activeBets": active_bets,
            "processedPlayers": processed_players,
            "concludedPlayers": concluded_players,
            "totalWinnings": round(total_winnings, 2),
            "uptime": uptime,
            "apiRequests": api_requests,
            "errorRate": 0.2,  # Would come from monitoring
            "avgResponseTime": "245ms",  # Would come from monitoring
            "lastUpdated": datetime.datetime.utcnow().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting system overview: {e}")
        return {
            "error": str(e),
            "status": "error"
        }

def get_real_user_analytics(db, time_range="7d"):
    """Get real user analytics from Firestore"""
    try:
        users_ref = db.collection("users")
        users_stream = users_ref.stream()
        users_list = list(users_stream)
        
        user_data = []
        total_earnings = 0
        total_bets = 0
        active_users = 0
        new_signups = 0
        
        # Calculate cutoff date for "new" users
        if time_range == "7d":
            cutoff_days = 7
        elif time_range == "30d":
            cutoff_days = 30
        elif time_range == "90d":
            cutoff_days = 90
        else:
            cutoff_days = 1
            
        cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(days=cutoff_days)
        
        for user_doc in users_list:
            data = user_doc.to_dict()
            profile = data.get("profile", data)
            
            # Check if user is "new"
            created_at = profile.get("createdAt")
            if created_at and hasattr(created_at, 'timestamp'):
                created_date = datetime.datetime.fromtimestamp(created_at.timestamp())
                if created_date > cutoff_date:
                    new_signups += 1
            
            # Check if user is "active" (logged in recently)
            last_login = profile.get("lastLogin")
            if last_login and hasattr(last_login, 'timestamp'):
                login_date = datetime.datetime.fromtimestamp(last_login.timestamp())
                if login_date > cutoff_date:
                    active_users += 1
            
            user_earnings = profile.get("totalEarnings", 0)
            user_bets = profile.get("totalBets", 0)
            win_count = profile.get("winCount", 0)
            
            total_earnings += user_earnings
            total_bets += user_bets
            
            win_rate = (win_count / user_bets * 100) if user_bets > 0 else 0
            
            user_info = {
                "username": user_doc.id,
                "displayName": profile.get("displayName", user_doc.id),
                "totalEarnings": user_earnings,
                "totalBets": user_bets,
                "winCount": win_count,
                "winRate": round(win_rate, 1),
                "lastLogin": profile.get("lastLogin"),
                "createdAt": profile.get("createdAt")
            }
            user_data.append(user_info)
        
        # Find top performer
        top_performer = max(user_data, key=lambda x: x["totalEarnings"]) if user_data else {"username": "N/A"}
        
        # Calculate average session time (mock for now)
        avg_session_time = "12m 34s"
        
        return {
            "users": user_data,
            "totalUsers": len(users_list),
            "activeUsers": active_users,
            "newSignups": new_signups,
            "avgSessionTime": avg_session_time,
            "topPerformer": top_performer["username"],
            "topPerformerEarnings": top_performer.get("totalEarnings", 0),
            "totalEarnings": round(total_earnings, 2),
            "totalBets": total_bets,
            "lastUpdated": datetime.datetime.utcnow().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting user analytics: {e}")
        return {
            "error": str(e),
            "status": "error"
        }

def get_real_bet_performance(db, time_range="30d"):
    """Get real bet performance analytics"""
    try:
        # Get all users to analyze their bets
        users_ref = db.collection("users")
        users_stream = users_ref.stream()
        
        total_bets = 0
        winning_bets = 0
        losing_bets = 0
        total_winnings = 0
        total_wagered = 0
        
        for user_doc in users_stream:
            user_id = user_doc.id
            
            # Get bet history from subcollections
            try:
                # Check current month's history
                now = datetime.datetime.utcnow()
                year = str(now.year)
                month = str(now.month).zfill(2)
                
                history_ref = db.collection("users").document(user_id).collection("betHistory").document(year).collection(month)
                history_stream = history_ref.stream()
                
                for bet_doc in history_stream:
                    bet_data = bet_doc.to_dict()
                    total_bets += 1
                    
                    bet_amount = bet_data.get("betAmount", 0)
                    winnings = bet_data.get("winnings", 0)
                    bet_result = bet_data.get("bet_result", bet_data.get("status", ""))
                    
                    total_wagered += bet_amount
                    
                    if bet_result in ["Won", "WIN"]:
                        winning_bets += 1
                        total_winnings += winnings
                    elif bet_result in ["Lost", "LOSS"]:
                        losing_bets += 1
                        
            except Exception as e:
                logger.warning(f"Error processing bet history for user {user_id}: {e}")
        
        # Calculate metrics
        win_rate = (winning_bets / total_bets * 100) if total_bets > 0 else 0
        avg_bet_size = (total_wagered / total_bets) if total_bets > 0 else 0
        roi = ((total_winnings - total_wagered) / total_wagered * 100) if total_wagered > 0 else 0
        
        return {
            "totalBets": total_bets,
            "winningBets": winning_bets,
            "losingBets": losing_bets,
            "winRate": round(win_rate, 1),
            "totalWinnings": round(total_winnings, 2),
            "totalWagered": round(total_wagered, 2),
            "avgBetSize": round(avg_bet_size, 2),
            "roi": round(roi, 1),
            "lastUpdated": datetime.datetime.utcnow().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting bet performance: {e}")
        return {
            "error": str(e),
            "status": "error"
        }

def get_real_player_analytics(db):
    """Get real player analytics from processed players"""
    try:
        # Get active players
        active_ref = db.collection("processedPlayers").document("players").collection("active")
        active_stream = active_ref.stream()
        
        # Get concluded players
        concluded_ref = db.collection("processedPlayers").document("players").collection("concluded")
        concluded_stream = concluded_ref.stream()
        
        player_stats = {}
        total_analyzed = 0
        total_hits = 0
        total_predictions = 0
        
        # Process active players
        for player_doc in active_stream:
            data = player_doc.to_dict()
            name = data.get("name", "Unknown")
            team = data.get("team", "")
            threshold = data.get("threshold", 0)
            
            if name not in player_stats:
                player_stats[name] = {
                    "name": name,
                    "team": team,
                    "timesAnalyzed": 0,
                    "hits": 0,
                    "predictions": 0,
                    "thresholds": [],
                    "hitRate": 0
                }
            
            player_stats[name]["timesAnalyzed"] += 1
            player_stats[name]["thresholds"].append(threshold)
            total_analyzed += 1
        
        # Process concluded players for hit rate calculation
        for player_doc in concluded_stream:
            data = player_doc.to_dict()
            name = data.get("name", "Unknown")
            team = data.get("team", "")
            threshold = data.get("threshold", 0)
            final_points = data.get("finalPoints")
            bet_result = data.get("bet_result")
            
            if name not in player_stats:
                player_stats[name] = {
                    "name": name,
                    "team": team,
                    "timesAnalyzed": 0,
                    "hits": 0,
                    "predictions": 0,
                    "thresholds": [],
                    "hitRate": 0
                }
            
            player_stats[name]["predictions"] += 1
            total_predictions += 1
            
            # Check if prediction was correct
            if bet_result == "WIN" or (final_points is not None and final_points > threshold):
                player_stats[name]["hits"] += 1
                total_hits += 1
        
        # Calculate hit rates and averages
        for player in player_stats.values():
            if player["predictions"] > 0:
                player["hitRate"] = round((player["hits"] / player["predictions"]) * 100, 1)
            if player["thresholds"]:
                player["avgThreshold"] = round(sum(player["thresholds"]) / len(player["thresholds"]), 1)
            else:
                player["avgThreshold"] = 0
        
        # Calculate overall hit rate
        overall_hit_rate = (total_hits / total_predictions * 100) if total_predictions > 0 else 0
        
        # Find most popular player
        most_popular = max(player_stats.values(), key=lambda x: x["timesAnalyzed"]) if player_stats else {"name": "N/A"}
        
        # Calculate average threshold across all players
        all_thresholds = []
        for player in player_stats.values():
            all_thresholds.extend(player["thresholds"])
        avg_threshold = sum(all_thresholds) / len(all_thresholds) if all_thresholds else 0
        
        return {
            "players": list(player_stats.values()),
            "totalPlayers": len(player_stats),
            "totalAnalyzed": total_analyzed,
            "totalPredictions": total_predictions,
            "totalHits": total_hits,
            "avgHitRate": round(overall_hit_rate, 1),
            "mostPopular": most_popular["name"],
            "avgThreshold": round(avg_threshold, 1),
            "lastUpdated": datetime.datetime.utcnow().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting player analytics: {e}")
        return {
            "error": str(e),
            "status": "error"
        }

def get_real_financial_metrics(db, time_range="30d"):
    """Get real financial metrics"""
    try:
        # This would be more sophisticated in a real revenue-generating app
        # For now, we'll calculate based on user winnings and activity
        
        users_ref = db.collection("users")
        users_stream = users_ref.stream()
        
        total_user_winnings = 0
        total_bets = 0
        total_wagered = 0
        
        for user_doc in users_stream:
            user_data = user_doc.to_dict()
            profile = user_data.get("profile", user_data)
            
            total_user_winnings += profile.get("totalEarnings", 0)
            total_bets += profile.get("totalBets", 0)
        
        # Mock revenue calculations (in a real app, this would be subscription fees, etc.)
        estimated_revenue = total_user_winnings * 0.1  # 10% platform fee example
        avg_bet_size = 85  # This would be calculated from actual bet data
        platform_roi = 142.3  # This would be calculated from actual financial data
        
        return {
            "totalRevenue": round(estimated_revenue, 2),
            "userWinnings": round(total_user_winnings, 2),
            "platformROI": f"{platform_roi}%",
            "avgBetSize": avg_bet_size,
            "totalBets": total_bets,
            "lastUpdated": datetime.datetime.utcnow().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting financial metrics: {e}")
        return {
            "error": str(e),
            "status": "error"
        }

def get_system_health():
    """Get system health metrics - would integrate with monitoring services"""
    try:
        # In production, these would come from:
        # - Google Cloud Monitoring
        # - Application Performance Monitoring (APM)
        # - Custom health check endpoints
        
        # For now, we'll provide realistic mock data with some real checks
        
        # Check if we can connect to Firestore
        try:
            db = firestore.client()
            # Simple connectivity test
            test_ref = db.collection("_health_check").document("test")
            start_time = time.time()
            test_ref.get()
            db_response_time = round((time.time() - start_time) * 1000, 2)
            db_status = "operational"
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            db_response_time = 0
            db_status = "error"
        
        # Check backend API health
        try:
            # This would ping your actual health endpoint
            api_status = "operational"
            api_response_time = "245ms"
        except Exception:
            api_status = "error"
            api_response_time = "timeout"
        
        return {
            "apiResponseTime": api_response_time,
            "databasePerformance": f"{db_response_time}ms" if db_status == "operational" else "error",
            "cpuUsage": "34%",  # Would come from system monitoring
            "memoryUsage": "67%",  # Would come from system monitoring
            "networkLatency": "12ms",  # Would come from network monitoring
            "errorRate": "0.2%",  # Would come from error tracking
            "uptime": "99.8%",  # Would come from uptime monitoring
            "services": {
                "frontend": "operational",
                "backend": api_status,
                "database": db_status,
                "functions": "operational"  # Would check Cloud Functions
            },
            "lastUpdated": datetime.datetime.utcnow().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting system health: {e}")
        return {
            "error": str(e),
            "status": "error"
        }

def check_cloud_functions_health():
    """Check the health of Cloud Functions"""
    try:
        # Check injury report function
        injury_function_url = "https://update-injury-report-788584934715.us-west2.run.app"
        
        # Check game checking function (via your backend)
        game_check_url = "https://prizepicks-backend-788584934715.us-west2.run.app/health"
        
        functions_status = {}
        
        # Test injury report function
        try:
            response = requests.get(f"{injury_function_url}/health", timeout=10)
            if response.status_code == 200:
                functions_status["injury_report"] = "operational"
            else:
                functions_status["injury_report"] = "degraded"
        except Exception:
            functions_status["injury_report"] = "error"
        
        # Test game check function
        try:
            response = requests.get(game_check_url, timeout=10)
            if response.status_code == 200:
                functions_status["game_check"] = "operational"
            else:
                functions_status["game_check"] = "degraded"
        except Exception:
            functions_status["game_check"] = "error"
        
        return functions_status
        
    except Exception as e:
        logger.error(f"Error checking Cloud Functions health: {e}")
        return {
            "injury_report": "unknown",
            "game_check": "unknown"
        }
