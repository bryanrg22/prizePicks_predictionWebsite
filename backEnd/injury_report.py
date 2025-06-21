import firebase_admin
from firebase_admin import firestore
from datetime import datetime
import pytz
import logging
import nba_api
from nba_api.stats.endpoints import TeamGameLog
from nba_api.stats.endpoints import playergamelog
from nba_api.stats.static import teams, players
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_current_season():
    now = datetime.datetime.now()
    if now.month >= 10:
        season_start = now.year
        season_end = now.year + 1
    else:
        season_start = now.year - 1
        season_end = now.year
    return f"{season_start}-{str(season_end)[-2:]}"

def get_ids(first_name, last_name):
    url = "https://api.balldontlie.io/v1/players"
    headers = {"Authorization": "03f64803-21d9-40e4-ab9f-5d69ca82c8dc"}
    params = {"first_name": first_name, "last_name": last_name}
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        return {"error": f"API Error from balldontlie: {response.status_code}"}
    bd_players = response.json().get("data", [])
    if not bd_players:
        return {"error": f"No players found in balldontlie for {first_name} {last_name}"}
    bdl_player = bd_players[0]

    full_name = f"{bdl_player['first_name']} {bdl_player['last_name']}"
    nba_found = players.find_players_by_full_name(full_name)
    if not nba_found:
        return {"error": f"No matching NBA Stats player found for {full_name}"}
    nba_player_id = nba_found[0]["id"]
    player_team = bdl_player["team"]["full_name"] if bdl_player.get("team") else "Unknown Team"
    player_team_standings = teams.find_teams_by_full_name(player_team)[0]
    player_team_id = player_team_standings["id"]

    return nba_player_id, player_team_id

def fetch_player_game_stats(nba_player_id, season_str):
    """
    Fetches advanced game logs for the specified NBA player (by official nba_api ID).
    Returns per-game stats including FGM, FGA, 3PA, 3PM, etc.
    """
    fga = fta = tov = minutes = 0
    gamelog_df = playergamelog.PlayerGameLog(player_id=nba_player_id, season=season_str).get_data_frames()[0]


    for idx, row in gamelog_df.iterrows():
        fga += row.get("FGA", 0)
        fta += row.get("FTA", 0)
        tov += row.get("TOV", 0)
        minutes += row.get("MIN", 0)

    fga /= len(gamelog_df)
    fta /= len(gamelog_df)
    tov /= len(gamelog_df)
    minutes /= len(gamelog_df)

    return fga, fta, tov, minutes

def fetch_team_stats_for_usage(team_id, season):
    """
    Fetches per‐game averages for every team, then adds an 'AVG_POSS' column.
    """
    gamelog_df = TeamGameLog(team_id=team_id, season=season).get_data_frames()[0]
    return (
            float(gamelog_df['FGA'].mean()),
            float(gamelog_df['FTA'].mean()),
            float(gamelog_df['TOV'].mean())
        )

def get_data_metrics(player_name):
    first_name, last_name = player_name.split(" ", 1)
    player_id, player_team_id = get_ids(first_name, last_name)
    fga, fta, tov, mins = fetch_player_game_stats(player_id, get_current_season())
    team_fga, team_fta, team_tov = fetch_team_stats_for_usage(player_team_id, get_current_season())

    alpha = 0.7
    usage_rate = (
        (fga + 0.475*fta + tov) * 240
        / (mins * (team_fga + 0.475*team_fta + team_tov))
    )

    importance_score = round(alpha * (mins / 48) + (1 - alpha) * usage_rate, 2)
    if importance_score >= 0.6:
        importance_role = "Starter"
    elif importance_score >= 0.3:
        importance_role = "Rotation"
    else:
        importance_role = "Bench"
    
    return usage_rate, importance_score, importance_role

def get_team_injury_report(team_name, db):
    """
    Get all injured players for a specific team
    
    Args:
        team_name_normalized (str): Normalized team name (e.g., "los_angeles_lakers")
        db: Firestore client (optional)
    
    Returns:
        dict: Team injury report with all injured players
    """
    try:
        if db is None:
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            db = firestore.client()
        
        # Query the specific team's injury document
        team_doc_ref = (
            db.collection("processedPlayers")
            .document("players")
            .collection("injury_report")
            .document(team_name)
        )
        
        doc_snap = team_doc_ref.get()
        if doc_snap.exists:
            data = doc_snap.to_dict()
        else:
            print(f"No injury report for {team_name}")
            return {}
        
        injured_players = {}
        for player in data['players']:
            injured_players[player['player']] = {player['status'], player['reason']}

        return injured_players
        
    except Exception as e:
        #logger.error(f"Error getting team injury report for {team_name_normalized}: {e}")
        return {}

def get_player_injury_status(player_name, player_team, opponent_team):
    """Look up a player's injury status in Firestore.

    Besides checking the given player's team, this returns the full injury list
    for both ``player_team`` and ``opponent_team`` when provided.

    Args:
        player_name (str): Player to check.
        player_team (str, optional): Team the player belongs to.
        opponent_team (str, optional): Opponent team to also query.
    Returns:
        dict: Injury information including any team and opponent injuries.
    """

    if not player_name:
        return {"error": "No player name provided"}
    
    try:
        # Initialize Firestore client
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        db = firestore.client()

        team_injury_data = {}
        opponent_injury_data = {}

        # If team is provided, check that team's injury report first
        if player_team:
            team_normalized = player_team.lower().replace(" ", "_").replace(".", "")
            if team_normalized:
                team_injury_data = get_team_injury_report(team_normalized, db)
            
            if opponent_team:
                opp_normalized = opponent_team.lower().replace(" ", "_").replace(".", "")
            if opp_normalized:
                opponent_injury_data = get_team_injury_report(opp_normalized, db)
            
                # Check if player is in this team's injury report
                if team_injury_data.get("found") and team_injury_data.get("players"):
                    for injured_player in team_injury_data["players"]:
                        player_in_report = injured_player.get("name", "")
                        if player_name.lower() in player_in_report.lower() or player_in_report.lower() in player_name.lower():
                            return {
                                "found": True,
                                "player": {
                                    "name": player_in_report,
                                    "status": injured_player.get("status"),
                                    "reason": injured_player.get("reason"),
                                    "gameDate": injured_player.get("gameDate"),
                                    "gameTime": injured_player.get("gameTime")
                                },
                                "team": team_injury_data.get("team"),
                                "teamInjuries": team_injury_data.get("players", []),
                                "opponentInjuries": opponent_injury_data.get("players", []),
                                "lastUpdated": team_injury_data.get("lastUpdated"),
                                "lastChecked": team_injury_data.get("lastChecked"),
                                "source": "database"
                            }
                
                # Player not found in team's injury report, but team exists
                return {
                    "found": False,
                    "message": f"No injury information found for {player_name}",
                    "player": None,
                    "team": player_team,
                    "teamInjuries": team_injury_data.get("players", []),
                    "opponentInjuries": opponent_injury_data.get("players", []),
                    "lastUpdated": team_injury_data.get("lastUpdated"),
                    "lastChecked": team_injury_data.get("lastChecked"),
                    "source": "database"
                }
        
        # If no team provided or team lookup failed, search all teams
        injury_collection = db.collection("processedPlayers").document("injury_report")
        
        # Get all team injury reports
        team_docs = injury_collection.collections()
        
        for team_collection in team_docs:
            for team_doc in team_collection.stream():
                team_data = team_doc.to_dict()
                players = team_data.get("players", [])
                
                # Check if our player is in this team's injury report
                for injured_player in players:
                    player_in_report = injured_player.get("name", "")
                    if player_name.lower() in player_in_report.lower() or player_in_report.lower() in player_name.lower():
                        return {
                            "found": True,
                            "player": {
                                "name": player_in_report,
                                "status": injured_player.get("status"),
                                "reason": injured_player.get("reason"),
                                "gameDate": injured_player.get("gameDate"),
                                "gameTime": injured_player.get("gameTime")
                            },
                            "team": team_data.get("team"),
                            "teamInjuries": players,
                            "opponentInjuries": opponent_injury_data.get("players", []),
                            "lastUpdated": firestore.SERVER_TIMESTAMP,
                            "lastChecked": firestore.SERVER_TIMESTAMP,
                            "source": "database"
                        }
        
        # Player not found in any injury report
        return {
            "found": False,
            "message": f"No injury information found for {player_name}",
            "player": None,
            "team": player_team,
            "teamInjuries": [],
            "opponentInjuries": opponent_injury_data.get("players", []),
            "lastUpdated": firestore.SERVER_TIMESTAMP,
            "lastChecked": firestore.SERVER_TIMESTAMP,
            "source": "database"
        }
        
    except Exception as e:
        logger.error(f"Error querying injury database: {e}")
        return {
            "error": f"Error querying injury database: {str(e)}",
            "found": False,
            "player": None,
            "teamInjuries": [],
            "opponentInjuries": opponent_injury_data.get("players", []),
            "lastUpdated": firestore.SERVER_TIMESTAMP,
            "lastChecked": firestore.SERVER_TIMESTAMP,
            "source": "database"
        }

def get_team_injury_report(team_name_normalized, db=None):
    """
    Get all injured players for a specific team
    
    Args:
        team_name_normalized (str): Normalized team name (e.g., "los_angeles_lakers")
        db: Firestore client (optional)
    
    Returns:
        dict: Team injury report with all injured players
    """
    try:
        if db is None:
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            db = firestore.client()
        
        # Query the specific team's injury document
        team_doc_ref = (
            db.collection("processedPlayers")
            .document("injury_report")
            .collection(team_name_normalized)
            .limit(1)  # Should only be one document per team
        )
        
        team_docs = list(team_doc_ref.stream())
        
        if not team_docs:
            # No injury document exists for this team = no injuries
            return {
                "found": False,
                "team": team_name_normalized,
                "players": [],
                "lastUpdated": firestore.SERVER_TIMESTAMP,
                "lastChecked": firestore.SERVER_TIMESTAMP,
                "message": "No injury report found for team (team is healthy)"
            }
        
        # Get the team's injury data
        team_data = team_docs[0].to_dict()
        
        return {
            "found": True,
            "team": team_data.get("team", team_name_normalized),
            "players": team_data.get("players", []),
            "lastUpdated": firestore.SERVER_TIMESTAMP,
            "lastChecked": firestore.SERVER_TIMESTAMP,
            "message": f"Found {len(team_data.get('players', []))} injured players"
        }
        
    except Exception as e:
        logger.error(f"Error getting team injury report for {team_name_normalized}: {e}")
        return {
            "found": False,
            "team": team_name_normalized,
            "players": [],
            "lastUpdated": firestore.SERVER_TIMESTAMP,
            "lastChecked": firestore.SERVER_TIMESTAMP,
            "error": str(e)
        }

def get_all_team_injuries():
    """
    Get injury reports for all teams
    
    Returns:
        dict: All team injury reports
    """
    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        db = firestore.client()
        
        injury_collection = db.collection("processedPlayers").document("injury_report")
        all_injuries = {}
        
        # Get all team collections under injury_report
        team_collections = injury_collection.collections()
        
        for team_collection in team_collections:
            team_name = team_collection.id
            team_docs = list(team_collection.stream())
            
            if team_docs:
                team_data = team_docs[0].to_dict()
                all_injuries[team_name] = {
                    "team": team_data.get("team", team_name),
                    "players": team_data.get("players", []),
                    "lastUpdated": firestore.SERVER_TIMESTAMP,
                    "lastChecked": firestore.SERVER_TIMESTAMP,
                    "injuredCount": len(team_data.get("players", []))
                }
            else:
                all_injuries[team_name] = {
                    "team": team_name,
                    "players": [],
                    "lastUpdated": firestore.SERVER_TIMESTAMP,
                    "lastChecked": firestore.SERVER_TIMESTAMP,
                    "injuredCount": 0
                }
        
        return {
            "success": True,
            "teams": all_injuries,
            "totalTeams": len(all_injuries),
            "totalInjuredPlayers": sum(team["injuredCount"] for team in all_injuries.values())
        }
        
    except Exception as e:
        logger.error(f"Error getting all team injuries: {e}")
        return {
            "success": False,
            "error": str(e),
            "teams": {}
        }


####################
### NEW METHODS! ###
####################
def get_team_injury_report_new(team_name, db):
    """
    Get all injured players for a specific team
    
    Args:
        team_name_normalized (str): Normalized team name (e.g., "los_angeles_lakers")
        db: Firestore client (optional)
    
    Returns:
        dict: Team injury report with all injured players
    """
    try:
        if db is None:
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            db = firestore.client()
        
        # Query the specific team's injury document
        team_doc_ref = (
            db.collection("processedPlayers")
            .document("players")
            .collection("injury_report")
            .document(team_name)
        )
        
        doc_snap = team_doc_ref.get()
        if doc_snap.exists:
            data = doc_snap.to_dict()
        else:
            print(f"No injury report for {team_name}")
            return {}
        
        injured_players = {}
        for player in data['players']:
            if player['reason'] == "NOT YET SUBMITTED":
                return {'status': "NOT YET SUBMITTED", 'reason': "Injury report not yet submitted by team"}
            else:
                usage_rate, importance_score, importance_role = get_data_metrics(player['player'])  # Call to get_data_metrics to ensure player data is fetched
                injured_players[player['player']] = {
                    'status': player['status'],
                    'reason': player['reason'],
                    'usage_rate': usage_rate,
                    'importance_score': importance_score,
                    'importance_role': importance_role
                }

        return injured_players
        
    except Exception as e:
        logger.error(f"Error getting team injury report for {team_name}: {e}")
        return {}
    
    
def get_player_injury_status_new(player_name, player_team, opponent_team):
    """
    Look up a player's injury status plus both teams' full injury lists.
    """
    if not player_name:
        return {"error": "No player name provided"}

    # ── 1. Firestore client ────────────────────────────────────────────────
    if not firebase_admin._apps:
        firebase_admin.initialize_app()
    db = firestore.client()

    # ── 2. Pull both reports ───────────────────────────────────────────────
    team_key  = player_team.lower().replace(" ", "_").replace(".", "")
    opp_key   = opponent_team.lower().replace(" ", "_").replace(".", "") if opponent_team else None

    team_injuries     = get_team_injury_report_new(team_key, db)              # may be {}, {'status': 'NOT YET SUBMITTED'}, or {player: {...}}
    opponent_injuries = get_team_injury_report_new(opp_key,  db) if opp_key else {}

    # ── 3. Decide the player flag ──────────────────────────────────────────
    #
    # Case A – report not filed yet
    if team_injuries.get("status") == "NOT YET SUBMITTED":
        player_injured = {'status': "NOT YET SUBMITTED", 'reason': "Injury report not yet submitted by team"}

    # Case B – report exists and player is listed
    elif player_name in team_injuries:               # keys are player names
        player_injured = {'status': team_injuries[player_name]['status'], 'reason': team_injuries[player_name]['reason']}

    # Case C – report exists and player is NOT listed
    else:
        player_injured = {'status': 'NOT INJURED', 'reason': 'Player not listed in NBA injury report'}

    # ── 4. Uniform response ────────────────────────────────────────────────
    return {
        "player_injured":   player_injured,
        "teamInjuries":     team_injuries,
        "opponentInjuries": opponent_injuries,
        "lastUpdated":      firestore.SERVER_TIMESTAMP,
        "lastChecked":      firestore.SERVER_TIMESTAMP,
        "source":           "NBA Injury Report",
    }