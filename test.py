import firebase_admin
from firebase_admin import credentials, firestore, initialize_app
import logging
from nba_api.stats.endpoints import ScoreboardV2, BoxScoreTraditionalV2
from requests.exceptions import ReadTimeout

# Configure logging at the top
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

def fetch_player_stats(game_id, player_id):
    """Return (points, minutes) or (None, None)."""
    try:
        bb = BoxScoreTraditionalV2(game_id=game_id, timeout=30)
        df = bb.player_stats.get_data_frame()
        
        if df.empty:
            logger.warning(f"No player stats available for game {game_id}")
            return None, None
            
        mask = df["PLAYER_ID"] == int(player_id)
        if not mask.any():
            logger.warning(f"Player {player_id} not found in game {game_id}")
            return None, None
            
        row = df.loc[mask].iloc[0]
        pts = int(row["PTS"]) if row["PTS"] is not None else 0

        raw_min = row["MIN"] or "0"
        if isinstance(raw_min, str) and ":" in raw_min:
            mins = int(float(str(raw_min).split(".")[0]))
        
        logger.info(f"Player {player_id} stats: {pts} points, {mins} minutes")
        return pts, mins
        
    except ReadTimeout:
        logger.warning(f"NBA API timeout for player stats: game {game_id}, player {player_id}")
        return None, None
    except Exception as e:
        logger.error(f"Error fetching player stats: {e}")
        return None, None

def update_doc(ref, data):
    """Update a document with final game results"""
    try:
        game_id = data.get("gameId")
        player_id = data.get("playerId")
        threshold = data.get("threshold", 0)
        
        if not game_id or not player_id:
            logger.error(f"Missing gameId or playerId in data: {data}")
            return False
            
        pts, mins = fetch_player_stats(game_id, player_id)
        if pts is None:
            logger.warning(f"Could not fetch stats for player {player_id}")
            return False
            
        # Determine bet result
        bet_result = "WIN" if pts > threshold else "LOSS"
        
        update_data = {
            "gameStatus": "Concluded",
            "finalPoints": pts,
            "finalMinutes": mins,
            "bet_result": bet_result,
        }

        ref.update(update_data)
        logger.info(f"Updated player {player_id}: {pts} points, result: {bet_result}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating document: {e}")
        return False

coll = db.collection("processedPlayers").document("players").collection("concluded")
processed_count = 0
moved_count = 0

for snap in coll.stream():
    processed_count += 1
    player_data = snap.to_dict()
    player_id = snap.id
    
    # Skip if already concluded
    logger.info(f"Checking player {player_id}")
    
        
    # Update with final stats
    if update_doc(snap.reference, player_data):
        logger.info(f"Successfully updated player {player_id} data")
        

logger.info(f"Processed all active players")