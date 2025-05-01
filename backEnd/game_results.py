import requests
import datetime
import pytz
import time
import pandas as pd
from nba_api.stats.endpoints import boxscoretraditionalv2
from nba_api.stats.static import players, teams
from nba_api.stats.endpoints import leaguestandings
from flask import jsonify, request


# Constants
GAME_STATUS_SCHEDULED = "Scheduled"
GAME_STATUS_LIVE = "Live"
GAME_STATUS_FINAL = "Final"

def get_player_id_by_name(player_name):
    """Get NBA player ID from full name"""
    player_list = players.find_players_by_full_name(player_name)
    if not player_list:
        return None
    return player_list[0]['id']

def get_game_status_from_boxscore(game_id):
    """
    Directly call boxscoretraditionalv2 to see if it's final.
    If we can retrieve data from the boxscore, we consider it final.
    """
    try:
        boxscore = boxscoretraditionalv2.BoxScoreTraditionalV2(game_id=game_id).get_data_frames()[0]
        if boxscore.empty:
            return GAME_STATUS_SCHEDULED  # No data -> likely not started
        return GAME_STATUS_FINAL
    except Exception as e:
        print(f"[get_game_status_from_boxscore] Error: {str(e)}")
        return GAME_STATUS_SCHEDULED

def get_player_points(game_id, player_id):
    """
    Get the actual points scored by a player in a specific game
    Returns the points or None if the game is not final
    """
    status = get_game_status_from_boxscore(game_id)
    if status != GAME_STATUS_FINAL:
        return None, status
    try:
        boxscore = boxscoretraditionalv2.BoxScoreTraditionalV2(game_id=game_id).get_data_frames()[0]
        player_row = boxscore[boxscore['PLAYER_ID'] == player_id]
        if player_row.empty:
            return 0, GAME_STATUS_FINAL  # Player didn't play
        points = int(player_row['PTS'].iloc[0])
        return points, GAME_STATUS_FINAL
    except Exception as e:
        print(f"Error getting player points: {str(e)}")
        return None, "Error"

def check_bet_completion(bet_data):
    """
    Check if all games in a bet are completed.
    We expect every pick to already have a valid 'gameId'.
    """
    results = {
        "all_completed": True,
        "picks": []
    }
    
    for pick in bet_data.get("picks", []):
        player_name = pick.get("playerName")
        recommendation = pick.get("recommendation", "OVER").upper()
        threshold = pick.get("threshold", 0)
        
        # Make sure we can map name -> ID
        player_id = get_player_id_by_name(player_name)
        if not player_id:
            # If we can't find a player ID, mark incomplete
            pick_result = {
                "playerName": player_name,
                "completed": False,
                "status": GAME_STATUS_SCHEDULED,
                "actualPoints": None,
                "threshold": threshold,
                "result": None
            }
            results["picks"].append(pick_result)
            results["all_completed"] = False
            continue
        
        # We now rely on the pick having its own gameId
        game_id = pick.get("gameId")
        
        if not game_id:
            pick_result = {
                "playerName": player_name,
                "completed": False,
                "status": GAME_STATUS_SCHEDULED,
                "actualPoints": None,
                "threshold": threshold,
                "result": None
            }
            results["picks"].append(pick_result)
            results["all_completed"] = False
            continue
        
        # Attempt to retrieve final points
        points, status = get_player_points(game_id, player_id)
        
        # Over/Under logic
        if points is not None:
            if recommendation == "OVER":
                final_result = "HIT" if points > threshold else "MISS"
            else:  # UNDER
                final_result = "HIT" if points < threshold else "MISS"
        else:
            final_result = None
        
        pick_result = {
            "playerName": player_name,
            "completed": (status == GAME_STATUS_FINAL),
            "status": status,
            "actualPoints": points,
            "threshold": threshold,
            "result": final_result
        }
        
        results["picks"].append(pick_result)
        
        if status != GAME_STATUS_FINAL:
            results["all_completed"] = False
    
    return results

def add_game_results_endpoints(app, db):
    from flask import request
    from firebase_admin import firestore
    
    @app.route('/api/check_bet_completion', methods=['POST'])
    def check_bet_completion_endpoint():
        try:
            data = request.json
            bet_id = data.get('betId')
            user_id = data.get('userId')
            bet_data = data.get('betData')
            
            if not bet_id or not user_id or not bet_data:
                return jsonify({"error": "Missing required parameters"}), 400
                
            results = check_bet_completion(bet_data)
            return jsonify(results)
        except Exception as e:
            print(f"Error checking bet completion: {str(e)}")
            return jsonify({"error": str(e)}), 500
        
    @app.route('/api/get_game_status', methods=['POST'])
    def get_game_status_endpoint():
        """
        Return just the live/final status for one game.
        """
        game_id = request.json.get("gameId")
        if not game_id:
            return jsonify({"error": "gameId required"}), 400
        status = get_game_status_from_boxscore(game_id)
        return jsonify({"gameId": game_id, "status": status})
    
    @app.route('/api/get_player_points', methods=['POST'])
    def get_player_points_endpoint():
        try:
            data = request.json
            game_id = data.get('gameId')
            player_name = data.get('playerName')
            
            if not game_id or not player_name:
                return jsonify({"error": "Missing required parameters"}), 400
                
            player_id = get_player_id_by_name(player_name)
            if not player_id:
                return jsonify({"error": f"Player not found: {player_name}"}), 404
                
            points, status = get_player_points(game_id, player_id)
            
            return jsonify({
                "playerName": player_name,
                "gameId": game_id,
                "status": status,
                "points": points
            })
        except Exception as e:
            print(f"Error getting player points: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @app.route('/api/update_bet_results', methods=['POST'])
    def update_bet_results_endpoint():
        """
        Update bet results in Firebase
        This endpoint should be called periodically to update bet results
        """
        try:
            data = request.json
            user_id = data.get('userId')
            
            if not user_id:
                return jsonify({"error": "Missing required parameters"}), 400
            
            active_bets_ref = db.collection("users").document(user_id).collection("activeBets")
            active_bets = active_bets_ref.stream()
            
            updated_bets = 0
            completed_bets = 0
            
            for bet_doc in active_bets:
                bet_id = bet_doc.id
                bet_data = bet_doc.to_dict()
                
                results = check_bet_completion(bet_data)
                
                if results["all_completed"]:
                    # All games are completed, move to history
                    for i, pick_result in enumerate(results["picks"]):
                        if i < len(bet_data.get("picks", [])):
                            bet_data["picks"][i]["actualPoints"] = pick_result["actualPoints"]
                            bet_data["picks"][i]["result"] = pick_result["result"]
                    
                    all_picks_hit = all(p["result"] == "HIT" for p in bet_data["picks"])
                    any_picks_hit = any(p["result"] == "HIT" for p in bet_data["picks"])
                    
                    if bet_data.get("betType") == "Power Play" and all_picks_hit:
                        bet_data["status"] = "Won"
                        bet_data["winnings"] = bet_data.get("potentialWinnings", 0)
                    elif bet_data.get("betType") == "Flex Play" and any_picks_hit:
                        bet_data["status"] = "Partial Win"
                        bet_data["winnings"] = bet_data.get("potentialWinnings", 0) / len(bet_data["picks"])
                    else:
                        bet_data["status"] = "Lost"
                        bet_data["winnings"] = 0
                    
                    bet_data["settledAt"] = firestore.SERVER_TIMESTAMP
                    # exact one-to-one copy: keep the same betId
                    hist_ref = (
                       db.collection("users")
                         .document(user_id)
                         .collection("betHistory")
                         .document(bet_id)
                    )
                    hist_ref.set(bet_data)
                    active_bets_ref.document(bet_id).delete()
                    completed_bets += 1
                else:
                    # Not all games are completed, update partial results
                    for i, pick_result in enumerate(results["picks"]):
                        if i < len(bet_data.get("picks", [])):
                            bet_data["picks"][i]["actualPoints"] = pick_result["actualPoints"]
                            bet_data["picks"][i]["result"] = pick_result["result"]
                            bet_data["picks"][i]["status"] = pick_result["status"]
                    active_bets_ref.document(bet_id).update({"picks": bet_data["picks"]})
                    updated_bets += 1
            
            return jsonify({
                "updated": updated_bets,
                "completed": completed_bets
            })
        except Exception as e:
            print(f"Error updating bet results: {str(e)}")
            return jsonify({"error": str(e)}), 500

# ==============================================================================
# REPLACEMENT OF PLACEHOLDERS BELOW
# ==============================================================================

# -- (A) Implementation: fetch_games_from_api_or_db(team_id, season) -----------
def fetch_games_from_api_or_db(team_id, season):
    """
    Fetch all (final) games for a given team in a given season
    using daily Scoreboard scanning (similar to logic in player_analyzer.py).
    This is a simple demonstration; for large data sets you’d likely store
    results in a DB or call a more efficient endpoint.
    """
    results = []
    
    # Convert season "2024" or "2023" into approximate start/end dates
    # For example, if season="2024", let's assume the 2023-2024 season
    # runs from 10/01/2023 to 06/30/2024 (just an approximation).
    # Adjust as needed for your environment.
    season_year = int(season)
    start_date = datetime.date(season_year - 1, 10, 1)  # Oct 1 of previous year
    end_date   = datetime.date(season_year, 6, 30)      # June 30 of the actual season year
    
    # We'll loop day by day from start_date to end_date
    # For demonstration, you might want to limit or optimize this in production.
    delta = datetime.timedelta(days=1)
    current_date = start_date
    
    while current_date <= end_date:
        try:
            # Scoreboard requires a mm/dd/yyyy string
            date_str = current_date.strftime("%m/%d/%Y")
            scoreboard = None
            scoreboard = requests.get(
                f"https://stats.nba.com/stats/scoreboardV2?DayOffset=0&GameDate={date_str}&LeagueID=00"
            )  # If you have an internal usage for NBA Stats endpoints
            # Alternatively, you can use ScoreboardV2 from nba_api directly:
            # scoreboard = Scoreboard(game_date=date_str, league_id='00')
            
            # If using direct nba_api:
            # game_df = scoreboard.game_header.get_data_frame()
            
            # If doing raw requests (like above), you’d parse JSON:
            if scoreboard and scoreboard.status_code == 200:
                data_json = scoreboard.json()
                # The game header is typically data_json["resultSets"][0]["rowSet"]
                # We'll parse it carefully:
                headers = data_json["resultSets"][0]["headers"]
                rows = data_json["resultSets"][0]["rowSet"]
                
                # Indices from scoreboard doc:
                # e.g. "GAME_ID" => index 2,
                #      "GAME_STATUS_TEXT" => index 4,
                #      "HOME_TEAM_ID" => index 6,
                #      "VISITOR_TEAM_ID" => index 7,
                #      "PTS_HOME" => index 21,
                #      "PTS_VISITOR" => index 22
                # This can vary, so check the actual scoreboard resultSet structure.
                
                # Let’s map the header -> index
                header_map = {h: i for i, h in enumerate(headers)}
                
                for row in rows:
                    home_team_id = row[ header_map["HOME_TEAM_ID"] ]
                    visitor_team_id = row[ header_map["VISITOR_TEAM_ID"] ]
                    
                    # We'll only add the game if one of them is `team_id`
                    if home_team_id == int(team_id) or visitor_team_id == int(team_id):
                        game_id = row[ header_map["GAME_ID"] ]
                        status_text = row[ header_map["GAME_STATUS_TEXT"] ]
                        
                        # If the game is not final, skip. (We only want completed games)
                        if "Final" not in status_text:
                            continue
                        
                        pts_home = row[ header_map["PTS_HOME"] ]
                        pts_visitor = row[ header_map["PTS_VISITOR"] ]
                        
                        if pts_home is None or pts_visitor is None:
                            # no final boxscore data
                            continue
                        
                        if home_team_id == int(team_id):
                            points_for = pts_home
                            points_against = pts_visitor
                            opponent_id = visitor_team_id
                        else:
                            points_for = pts_visitor
                            points_against = pts_home
                            opponent_id = home_team_id
                        
                        # Build the record
                        results.append({
                            "gameId": game_id,
                            "homeTeamId": home_team_id,
                            "opponentId": opponent_id,
                            "pointsFor": points_for,
                            "pointsAgainst": points_against
                        })
        except Exception as e:
            # If something breaks, just continue
            print(f"Error fetching scoreboard for {current_date}: {str(e)}")
        
        current_date += delta
    
    return results

# -- (B) Implementation: get_opponent_stats(opponent_id, season) ---------------
def get_opponent_stats(opponent_id, season):
    """
    Use the nba_api to retrieve advanced statistics for the opponent.
    
    This implementation does not fall back to dummy data. If no matching team
    is found for the given opponent_id, an exception is raised.
    
    The process:
      1) Convert the opponent_id to the team data using nba_api.stats.static.teams.get_teams().
      2) If the team is not found, a ValueError is raised.
      3) Otherwise, derive approximate stats based on the team's defensive rank.
         (For example, using the defensive rank from prediction_analyzer.get_opponent_defensive_rank.)
    """
    # 1) Convert ID -> Team Data
    all_teams = teams.get_teams()
    team_dict = next((t for t in all_teams if t["id"] == int(opponent_id)), None)
    if team_dict is None:
        raise ValueError(f"Team with ID {opponent_id} not found in nba_api teams data.")
    
    opponent_name = team_dict["full_name"]
    
    # 2) Fetch the defensive rank from your prediction analyzer
    from prediction_analyzer import get_opponent_defensive_rank
    defensive_rank = get_opponent_defensive_rank(opponent_name)
    
    # 3) Derive advanced metrics.
    # Adjust these formulas as needed when using actual advanced stats.
    opponent_def_rating = 105 - 0.5 * (30 - defensive_rank)   # Example: rank=1 => def_rating=90.5
    opponent_off_rating = 110 + 0.3 * (30 - defensive_rank)   # Example: rank=1 => off_rating=118.7
    opponent_pace       = 98 + 0.1 * (defensive_rank)         # Example: rank=1 => pace=98.1
    
    return (
        float(f"{opponent_def_rating:.1f}"),
        float(f"{opponent_off_rating:.1f}"),
        float(f"{opponent_pace:.1f}")
    )


# -- (C) Updated: get_game_results(team_id, season) now uses the above functions
def get_game_results(team_id, season):
    # (1) Fetch or parse the original data as before
    results = []
    fetched_games = fetch_games_from_api_or_db(team_id, season)  # <-- CHANGED: now real logic
    
    for game in fetched_games:
        # Determine if home or away.
        home_away_flag = 1 if game["homeTeamId"] == int(team_id) else 0

        # Suppose we get advanced metrics from get_opponent_stats
        opp_def_rating, opp_off_rating, opp_pace = get_opponent_stats(game["opponentId"], season)

        # Potential blowout metric (simple example):
        net_rating_diff = (opp_off_rating - opp_def_rating)

        result = {
            "game_id": game["gameId"],
            "team_id": team_id,
            "opponent_team_id": game["opponentId"],
            "score_for": game["pointsFor"],
            "score_against": game["pointsAgainst"],
            
            # New fields
            "home_away_flag": home_away_flag,  # 1 for home, 0 for away
            "opponent_def_rating": opp_def_rating,
            "opponent_off_rating": opp_off_rating,
            "opponent_pace": opp_pace,
            "net_rating_diff": net_rating_diff,
        }
        results.append(result)

    return results