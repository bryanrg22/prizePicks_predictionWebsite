import firebase_admin
from firebase_admin import credentials, firestore
import logging
from nba_api.stats.endpoints import BoxScoreTraditionalV2
from requests.exceptions import ReadTimeout, ConnectionError
import time
from google.api_core.exceptions import DeadlineExceeded, ServiceUnavailable

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Initialize Firebase app
try:
    if not firebase_admin._apps:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    logger.info("Firebase initialized successfully")
except Exception as e:
    logger.exception("Failed to initialize Firebase")
    raise


def fetch_player_stats(game_id, player_id, max_retries=3):
    """Fetch player stats with retry mechanism and robust parsing"""
    for attempt in range(max_retries):
        try:
            logger.debug(f"Fetching stats for {player_id} in game {game_id} (attempt {attempt+1})")
            
            # Get box score with timeout
            bb = BoxScoreTraditionalV2(game_id=game_id, timeout=20)
            df = bb.player_stats.get_data_frame()
            
            if df.empty:
                logger.warning(f"No player stats for game {game_id}")
                return None, None
                
            # Find player
            mask = df["PLAYER_ID"] == int(player_id)
            if not mask.any():
                logger.warning(f"Player {player_id} not found in game {game_id}")
                return None, None
                
            # Extract stats
            row = df.loc[mask].iloc[0]
            pts = int(row["PTS"]) if row["PTS"] is not None else 0

            # Parse minutes (handles 'MM:SS' or float formats)
            raw_min = row["MIN"] or "0"
            if isinstance(raw_min, str) and ":" in raw_min:
                mins = int(float(str(raw_min).split(".")[0]))
            
            logger.info(f"Player {player_id}: {pts} points in {mins} minutes")
            return pts, mins
            
        except (ReadTimeout, ConnectionError) as e:
            if attempt < max_retries - 1:
                wait = 2 ** attempt  # Exponential backoff
                logger.warning(f"NBA API timeout: {e}. Retry {attempt+1}/{max_retries} in {wait}s")
                time.sleep(wait)
            else:
                logger.error(f"NBA API failed after {max_retries} retries for player {player_id}")
                return None, None
        except Exception as e:
            logger.error(f"Unexpected error fetching stats for player {player_id}: {e}")
            return None, None
    return None, None


if __name__ == "__main__":
    start_time = time.time()
    logger.info("===== STARTING PLAYER STATS UPDATE =====")
    
    print(fetch_player_stats("0042400223", 1628983)) # shai_gilgeous-alexander_26.5_20250509 - 45 mins, 18 points
    print(fetch_player_stats("0042400306", 1627783)) # pascal_siakam_15.5_20250531 - 36 mins, 31 points