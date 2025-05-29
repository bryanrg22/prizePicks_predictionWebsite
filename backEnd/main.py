import os
import json
from flask import Flask, Response
from firebase_admin import credentials, firestore, initialize_app
from nba_api.stats.endpoints import ScoreboardV2, BoxScoreTraditionalV2
from requests.exceptions import ReadTimeout
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
try:
    # Check if running in Cloud Run (has service account)
    if os.getenv('GOOGLE_APPLICATION_CREDENTIALS') or os.getenv('K_SERVICE'):
        # Running in Cloud Run with service account
        initialize_app()
        logger.info("Firebase initialized with default credentials")
    else:
        # Local development - use service account key
        cred_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY', 'serviceAccountKey.json')
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            initialize_app(cred)
            logger.info("Firebase initialized with service account key")
        else:
            # Try to initialize with default credentials anyway
            initialize_app()
            logger.info("Firebase initialized with default credentials (fallback)")
except Exception as e:
    logger.error(f"Firebase initialization error: {e}")
    # Don't exit - let it fail gracefully on first Firestore call

def get_firestore_client():
    """Get Firestore client with error handling"""
    try:
        return firestore.client()
    except Exception as e:
        logger.error(f"Failed to get Firestore client: {e}")
        raise

def fetch_game_status(data):
    """Check if a game is finished based on game data"""
    try:
        game_date = data.get("gameDate")
        game_id = data.get("gameId")
        
        if not game_date or not game_id:
            logger.warning(f"Missing gameDate or gameId in data: {data}")
            return False
            
        # Convert Firestore timestamp to string if needed
        if hasattr(game_date, 'strftime'):
            game_date = game_date.strftime('%m/%d/%Y')
        elif isinstance(game_date, str):
            # Already a string, use as-is
            pass
        else:
            logger.warning(f"Unexpected gameDate format: {game_date}")
            return False
            
        sb = ScoreboardV2(game_date=game_date, league_id="00", timeout=30)
        df = sb.game_header.get_data_frame()
        
        if df is None or df.empty:
            logger.info(f"No game data available for date {game_date}")
            return False
            
        if game_id in df['GAME_ID'].values:
            mask = df["GAME_ID"] == game_id
            game_status = df.loc[mask, "GAME_STATUS_TEXT"].iloc[0]
            logger.info(f"Game {game_id} status: {game_status}")
            return game_status == "Final"
        else:
            logger.info(f"Game {game_id} not found in scoreboard")
            return False
            
    except ReadTimeout:
        logger.warning(f"NBA API timeout for game {data.get('gameId', 'unknown')}")
        return False
    except Exception as e:
        logger.error(f"Error fetching game status: {e}")
        return False

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
            mins = int(raw_min.split(":")[0])
        else:
            mins = int(float(str(raw_min).split(".")[0])) if raw_min else 0
        
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
            "finishedAt": firestore.SERVER_TIMESTAMP
        }

        ref.update(update_data)
        logger.info(f"Updated player {player_id}: {pts} points, result: {bet_result}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating document: {e}")
        return False

def resolve_document_reference(doc_ref):
    """Resolve a document reference to its data"""
    try:
        if not doc_ref:
            return None
            
        doc_snap = doc_ref.get()
        if doc_snap.exists:
            return doc_snap.to_dict()
        else:
            logger.warning(f"Document not found: {doc_ref.path}")
            return None
    except Exception as e:
        logger.error(f"Error resolving document reference: {e}")
        return None

def move_player_to_concluded(player_id, player_data):
    """Move a player from active to concluded collection"""
    try:
        db = get_firestore_client()
        
        # Create reference to concluded collection
        concluded_ref = (
            db.collection("processedPlayers")
              .document("players")
              .collection("concluded")
              .document(player_id)
        )
        
        # Set the data in concluded collection
        concluded_ref.set(player_data)
        logger.info(f"Created concluded document for player {player_id}")
        
        # Delete from active collection
        active_ref = (
            db.collection("processedPlayers")
              .document("players")
              .collection("active")
              .document(player_id)
        )
        active_ref.delete()
        logger.info(f"Deleted active document for player {player_id}")
        
        return concluded_ref
        
    except Exception as e:
        logger.error(f"Error moving player to concluded: {e}")
        return None

def check_active_players():
    """Check all active players and move concluded games to concluded collection"""
    try:
        db = get_firestore_client()
        coll = (
            db.collection("processedPlayers")
              .document("players")
              .collection("active")
        )
        
        processed_count = 0
        moved_count = 0
        
        for snap in coll.stream():
            processed_count += 1
            player_data = snap.to_dict()
            player_id = snap.id
            
            # Skip if already concluded
            if player_data.get("gameStatus") == "Concluded":
                logger.info(f"Player {player_id} already concluded, skipping")
                continue
            
            logger.info(f"Checking player {player_id}")
            
            # Check if game is finished
            if fetch_game_status(player_data):
                logger.info(f"Game finished for player {player_id}, updating...")
                
                # Update with final stats
                if update_doc(snap.reference, player_data):
                    # Get updated data
                    updated_data = snap.reference.get().to_dict()
                    
                    # Move to concluded collection
                    if move_player_to_concluded(player_id, updated_data):
                        moved_count += 1
                        logger.info(f"Successfully moved player {player_id} to concluded")
                    else:
                        logger.error(f"Failed to move player {player_id} to concluded")
                else:
                    logger.error(f"Failed to update player {player_id} with final stats")
            else:
                logger.info(f"Game not finished for player {player_id}")
                
        logger.info(f"Processed {processed_count} active players, moved {moved_count} to concluded")
        
    except Exception as e:
        logger.error(f"Error checking active players: {e}")

def update_bet_pick_references():
    """Update active bet pick references when players move from active to concluded"""
    try:
        db = get_firestore_client()
        
        updated_bets = 0
        
        # Get all users
        for user_doc in db.collection("users").stream():
            user_id = user_doc.id
            
            # Check active bets
            active_bets_ref = db.collection("users").document(user_id).collection("activeBets")
            
            for bet_doc in active_bets_ref.stream():
                bet_data = bet_doc.to_dict()
                picks = bet_data.get("picks", [])
                
                if not picks:
                    continue
                
                updated_picks = []
                needs_update = False
                
                for pick_ref in picks:
                    if hasattr(pick_ref, 'path') and "/active/" in pick_ref.path:
                        # Extract player ID from path
                        player_id = pick_ref.path.split("/")[-1]
                        
                        # Check if concluded version exists
                        concluded_ref = (
                            db.collection("processedPlayers")
                              .document("players")
                              .collection("concluded")
                              .document(player_id)
                        )
                        
                        if concluded_ref.get().exists:
                            updated_picks.append(concluded_ref)
                            needs_update = True
                            logger.info(f"Updated reference for player {player_id} from active to concluded")
                        else:
                            updated_picks.append(pick_ref)  # Keep original if not moved yet
                    else:
                        updated_picks.append(pick_ref)  # Already pointing to concluded or legacy object
                
                # Update bet if references changed
                if needs_update:
                    bet_doc.reference.update({"picks": updated_picks})
                    updated_bets += 1
                    logger.info(f"Updated pick references for bet {bet_doc.id} of user {user_id}")
                    
        logger.info(f"Updated {updated_bets} bets with new pick references")
        
    except Exception as e:
        logger.error(f"Error updating bet pick references: {e}")

def check_user_picks():
    """Check user picks and clean up concluded games"""
    try:
        db = get_firestore_client()
        
        updated_users = 0
        
        for user_doc in db.collection("users").stream():
            user_data = user_doc.to_dict()
            picks = user_data.get("picks", [])
            
            if not picks:
                continue
                
            updated_picks = []
            needs_update = False
            
            for pick in picks:
                # Check if this is a document reference
                if hasattr(pick, 'get'):
                    pick_data = resolve_document_reference(pick)
                    if pick_data and pick_data.get("gameStatus") != "Concluded":
                        updated_picks.append(pick)
                    else:
                        needs_update = True  # Remove concluded picks
                        logger.info(f"Removing concluded pick from user {user_doc.id}")
                else:
                    # This is a legacy full object
                    if pick.get("gameStatus") != "Concluded":
                        updated_picks.append(pick)
                    else:
                        needs_update = True  # Remove concluded picks
                        logger.info(f"Removing concluded legacy pick from user {user_doc.id}")
            
            # Update user document if picks changed
            if needs_update:
                user_doc.reference.update({"picks": updated_picks})
                updated_users += 1
                logger.info(f"Updated picks for user {user_doc.id}")
                
        logger.info(f"Updated picks for {updated_users} users")
        
    except Exception as e:
        logger.error(f"Error checking user picks: {e}")

def check_active_bets():
    """Check active bets and settle completed ones"""
    try:
        db = get_firestore_client()
        
        settled_bets = 0
        
        for user_doc in db.collection("users").stream():
            user_id = user_doc.id
            
            # Check active bets subcollection
            active_bets_ref = db.collection("users").document(user_id).collection("activeBets")
            
            for bet_doc in active_bets_ref.stream():
                bet_data = bet_doc.to_dict()
                picks = bet_data.get("picks", [])
                
                if not picks:
                    continue
                
                # Resolve all pick references and check their status
                resolved_picks = []
                all_concluded = True
                
                for pick_ref in picks:
                    if hasattr(pick_ref, 'get'):
                        # This is a document reference
                        pick_data = resolve_document_reference(pick_ref)
                        if pick_data:
                            resolved_picks.append(pick_data)
                            if pick_data.get("gameStatus") != "Concluded":
                                all_concluded = False
                        else:
                            all_concluded = False
                    else:
                        # This is a legacy full object
                        resolved_picks.append(pick_ref)
                        if pick_ref.get("gameStatus") != "Concluded":
                            all_concluded = False
                
                # If all picks are concluded, settle the bet
                if all_concluded and resolved_picks:
                    # Determine overall bet result
                    all_wins = all(
                        pick.get("bet_result") == "WIN" or 
                        (pick.get("finalPoints", 0) > pick.get("threshold", 0))
                        for pick in resolved_picks
                    )
                    
                    overall_result = "Won" if all_wins else "Lost"
                    
                    # Calculate winnings
                    bet_amount = bet_data.get("betAmount", 0)
                    potential_winnings = bet_data.get("potentialWinnings", 0)
                    winnings = potential_winnings if all_wins else 0
                    
                    # Update bet status
                    bet_doc.reference.update({
                        "status": overall_result,
                        "bet_result": overall_result,
                        "winnings": winnings,
                        "settledAt": firestore.SERVER_TIMESTAMP,
                    })
                    
                    settled_bets += 1
                    logger.info(f"Settled bet {bet_doc.id} for user {user_id}: {overall_result}, winnings: ${winnings}")
                    
        logger.info(f"Settled {settled_bets} bets")
        
    except Exception as e:
        logger.error(f"Error checking active bets: {e}")

def check_games_handler(request):
    """Main handler for checking and updating game statuses"""
    try:
        logger.info("Starting game status check...")
        
        # Test Firestore connection
        db = get_firestore_client()
        logger.info("Firestore connection successful")
        
        # 1. Check active players and move concluded ones
        logger.info("Step 1: Checking active players...")
        check_active_players()
        
        # 2. Update bet pick references (in case players moved to concluded)
        logger.info("Step 2: Updating bet pick references...")
        update_bet_pick_references()
        
        # 3. Check and clean up user picks
        logger.info("Step 3: Checking user picks...")
        check_user_picks()
        
        # 4. Check and settle active bets
        logger.info("Step 4: Checking active bets...")
        check_active_bets()
        
        logger.info("Game status check completed successfully")
        return Response("Game check completed successfully", status=200)
        
    except Exception as e:
        logger.error(f"ERROR in check_games: {e}")
        return Response(f"Error: {str(e)}", status=500)

# Flask app setup (if running as standalone)
if __name__ == "__main__":
    app = Flask(__name__)
    
    @app.route("/check-games", methods=["POST", "GET"])
    def check_games_route():
        return check_games_handler(None)
    
    @app.route("/health", methods=["GET"])
    def health_check():
        return Response("OK", status=200)
    
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
