import firebase_admin
from firebase_admin import firestore
from datetime import datetime
import pytz
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
            injured_players[player['player']] = {
                'status': player['status'],
                'reason': player['reason']
            }

        return injured_players
        
    except Exception as e:
        logger.error(f"Error getting team injury report for {team_name}: {e}")
        return {}
    
def get_player_injury_status_new(player_name, player_team, opponent_team):
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


        player_injured = False
        team_injury_data = {}
        opponent_injury_data = {}
        
        team_normalized = player_team.lower().replace(" ", "_").replace(".", "")
        team_injury_data = get_team_injury_report_new(team_normalized, db)
            
        opp_normalized = opponent_team.lower().replace(" ", "_").replace(".", "")
        opponent_injury_data = get_team_injury_report_new(opp_normalized, db)
            
           
        # Check if player is in this team's injury report
        if player_name in team_injury_data:
            player_injured = True
        

        return {
            "player_injured": player_injured,
            "teamInjuries": team_injury_data,
            "opponentInjuries": opponent_injury_data,
            "lastUpdated": firestore.SERVER_TIMESTAMP,
            "lastChecked": firestore.SERVER_TIMESTAMP,
            "source": "NBA Injury Report"
        }
        
    except Exception as e:
        logger.error(f"Error querying injury database: {e}")
        return {}