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
            injured_players[player['player']] = [player['status'], player['reason']]

        print(f"Injury report for {team_name}: {injured_players}")
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


        player_injured = False
        team_injury_data = {}
        opponent_injury_data = {}
        
        team_normalized = player_team.lower().replace(" ", "_").replace(".", "")
        team_injury_data = get_team_injury_report(team_normalized, db)
            
        opp_normalized = opponent_team.lower().replace(" ", "_").replace(".", "")
        opponent_injury_data = get_team_injury_report(opp_normalized, db)
            
           
        # Check if player is in this team's injury report
        if player_name in team_injury_data:
            player_injured = True
        

        return {
            "player_injured": player_injured,
            "teamInjuries": team_injury_data,
            "opponentInjuries": opponent_injury_data,
            "lastUpdated": team_injury_data.get("lastUpdated"),
            "lastChecked": team_injury_data.get("lastChecked"),
            "source": "NBA Injury Report"
        }
        
    except Exception as e:
        logger.error(f"Error querying injury database: {e}")
        return {}