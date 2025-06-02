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

def safe_firestore_operation(operation, operation_name="Firestore operation", 
                             max_retries=5, initial_delay=1):
    """Execute Firestore operation with exponential backoff"""
    for attempt in range(max_retries):
        try:
            result = operation()
            if attempt > 0:
                logger.info(f"{operation_name} succeeded on retry {attempt+1}")
            return result
        except (DeadlineExceeded, ServiceUnavailable, ConnectionError) as e:
            if attempt < max_retries - 1:
                delay = initial_delay * (2 ** attempt)
                logger.warning(f"{operation_name} failed: {e}. Retry {attempt+1}/{max_retries} in {delay}s")
                time.sleep(delay)
            else:
                logger.error(f"{operation_name} failed after {max_retries} attempts")
                raise
        except Exception as e:
            logger.error(f"Unexpected error in {operation_name}: {e}")
            raise
    return None

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

def process_concluded_players(batch_size=25):
    """Process all players in concluded collection with batching"""
    logger.info("Starting player processing")
    total_processed = 0
    total_updated = 0
    last_doc = None
    
    # Get collection reference
    coll_ref = db.collection("processedPlayers").document("players").collection("concluded")
    
    while True:
        try:
            # Build query with batching
            query = coll_ref.order_by("__name__").limit(batch_size)
            if last_doc:
                query = query.start_after(last_doc)
                
            # Execute query with retry
            docs = safe_firestore_operation(
                lambda: list(query.stream()),
                "Firestore query",
                max_retries=5
            )
            
            if not docs:
                logger.info("Reached end of collection")
                break
                
            logger.info(f"Processing batch of {len(docs)} players")
            batch_updated = 0
            
            for doc in docs:
                try:
                    doc_id = doc.id
                    data = doc.to_dict()
                    logger.info(f"Processing player: {doc_id}")
                    
                    # Validate required fields
                    game_id = data.get("gameId")
                    player_id = data.get("playerId")
                    threshold = data.get("threshold", 0)
                    
                    if not game_id or not player_id:
                        logger.error(f"Skipping {doc_id}: Missing gameId or playerId")
                        continue
                    
                    # CHANGED: Only skip if we have valid non-zero stats
                    final_points = data.get("finalPoints")
                    final_minutes = data.get("finalMinutes")
                    
                    # Check if player has valid stats (non-zero minutes or non-zero points)
                    if final_points is not None and final_minutes is not None:
                        if final_minutes > 0 or final_points > 0:
                            logger.info(f"Skipping {doc_id}: Already processed with valid stats")
                            continue
                        else:
                            logger.warning(f"Re-processing {doc_id}: Had 0 points and 0 minutes (possibly invalid)")
                    
                    # Get stats with retries
                    pts, mins = fetch_player_stats(game_id, player_id)
                    if pts is None:
                        logger.warning(f"Stats unavailable for {doc_id}")
                        continue
                    
                    # Determine result
                    bet_result = "WIN" if pts > threshold else "LOSS"
                    
                    # Prepare update
                    update_data = {
                        "finalPoints": pts,
                        "finalMinutes": mins,
                        "bet_result": bet_result,
                        "gameStatus": "Concluded"  # Ensure status is set
                    }
                    
                    # Update document with retry
                    safe_firestore_operation(
                        lambda: doc.reference.update(update_data),
                        f"Update document {doc_id}",
                        max_retries=3
                    )
                    
                    logger.info(f"Updated {doc_id}: {pts} pts vs {threshold} -> {bet_result}")
                    batch_updated += 1
                    total_updated += 1
                    
                except Exception as e:
                    logger.error(f"Failed to process {doc_id}: {e}")
                
                finally:
                    total_processed += 1
                    last_doc = doc
            
            logger.info(f"Batch processed: {len(docs)} players, {batch_updated} updated")
            
            # Break if we got fewer than batch size (end of collection)
            if len(docs) < batch_size:
                logger.info("Reached final batch")
                break
                
        except Exception as e:
            logger.error(f"Batch processing failed: {e}")
            break
    
    return total_processed, total_updated

if __name__ == "__main__":
    start_time = time.time()
    logger.info("===== STARTING PLAYER STATS UPDATE =====")
    
    try:
        # Process with conservative batch size for large collections
        processed_count, updated_count = process_concluded_players(batch_size=20)
        
        elapsed = time.time() - start_time
        success_rate = (updated_count / processed_count * 100) if processed_count > 0 else 0
        
        logger.info(f"""
        ======= PROCESSING COMPLETE =======
        Total players processed: {processed_count}
        Successfully updated:     {updated_count}
        Failed:                   {processed_count - updated_count}
        Success rate:             {success_rate:.1f}%
        Elapsed time:             {elapsed:.2f} seconds
        Avg time per player:      {(elapsed/processed_count):.2f}s (total)
        ===================================
        """)
        
    except Exception as e:
        logger.exception("FATAL ERROR IN MAIN EXECUTION")
        raise