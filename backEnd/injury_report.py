import firebase_admin
from firebase_admin import firestore
from datetime import datetime
import pytz
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_current_est_time_string():
    """Get current EST time as formatted string"""
    eastern = pytz.timezone("America/New_York")
    now_est = datetime.now(eastern)
    return now_est.strftime("%Y-%m-%d %I:%M %p EST")

def normalize_team_name(team_name):
    """
    Convert team full name to the normalized format used in Firestore
    e.g., "Los Angeles Lakers" -> "los_angeles_lakers"
    """
    if not team_name:
        return None
    
    # Handle common team name variations
    team_mappings = {
        "Atlanta Hawks": "atlanta_hawks",
        "Boston Celtics": "boston_celtics",
        "Brooklyn Nets": "brooklyn_nets",
        "Charlotte Hornets": "charlotte_hornets",
        "Chicago Bulls": "chicago_bulls",
        "Cleveland Cavaliers": "cleveland_cavaliers",
        "Dallas Mavericks": "dallas_mavericks",
        "Denver Nuggets": "denver_nuggets",
        "Detroit Pistons": "detroit_pistons",
        "Golden State Warriors": "golden_state_warriors",
        "Houston Rockets": "houston_rockets",
        "Indiana Pacers": "indiana_pacers",
        "LA Clippers": "los_angeles_clippers",
        "LA Lakers": "los_angeles_lakers",
        "Memphis Grizzlies": "memphis_grizzlies",
        "Miami Heat": "miami_heat",
        "Milwaukee Bucks": "milwaukee_bucks",
        "Minnesota Timberwolves": "minnesota_timberwolves",
        "New Orleans Pelicans": "new_orleans_pelicans",
        "New York Knicks": "new_york_knicks",
        "Oklahoma City Thunder": "oklahoma_city_thunder",
        "Orlando Magic": "orlando_magic",
        "Philadelphia 76ers": "philadelphia_76ers",
        "Phoenix Suns": "phoenix_suns",
        "Portland Trail Blazers": "portland_trail_blazers",
        "Sacramento Kings": "sacramento_kings",
        "San Antonio Spurs": "san_antonio_spurs",
        "Toronto Raptors": "toronto_raptors",
        "Utah Jazz": "utah_jazz",
        "Washington Wizards": "washington_wizards"
    }

    
    if team_name in team_mappings:
        return team_mappings[team_name]
    
    # Default normalization: lowercase and replace spaces with underscores
    return team_name.lower().replace(" ", "_").replace(".", "")

def get_player_injury_status(player_name, player_team=None, opponent_team=None):
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
            team_normalized = normalize_team_name(player_team)
            if team_normalized:
                team_injury_data = get_team_injury_report(team_normalized, db)
            
            if opponent_team:
                opp_normalized = normalize_team_name(opponent_team)
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

# Legacy function name for backward compatibility
def get_player_injury_status_legacy(player_name):
    """
    Legacy function that maintains the old return format
    for backward compatibility with existing code
    """
    result = get_player_injury_status(player_name)
    
    if result.get("found"):
        player_data = result.get("player", {})
        return {
            "found": True,
            "gameDate": player_data.get("gameDate"),
            "gameTime": player_data.get("gameTime"),
            "team": result.get("team"),
            "player": player_data.get("name"),
            "status": player_data.get("status"),
            "reason": player_data.get("reason")
        }
    else:
        return {
            "found": False,
            "message": result.get("message", f"No injury information found for {player_name}")
        }
