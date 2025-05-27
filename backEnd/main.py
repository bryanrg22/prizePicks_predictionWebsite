# main.py
import os

from flask import Flask
from firebase_admin import credentials, firestore, initialize_app
from nba_api.stats.endpoints import ScoreboardV2, BoxScoreTraditionalV2
from requests.exceptions import ReadTimeout
from flask import Response

# Helper functions
def fetch_game_status(data):
    """Check if a game is finished based on game data"""
    try:
        sb = ScoreboardV2(game_date=data["gameDate"], league_id="00").game_header.get_data_frame()
        if sb is None or sb.empty:
            print("No game data available.")
            return False
            
        if data['gameId'] in sb['GAME_ID'].values:
            mask = sb["GAME_ID"] == data['gameId']
            game_status = sb.loc[mask, "GAME_STATUS_TEXT"].iloc[0]
            return game_status == "Final"
        
        return False
    except Exception as e:
        print(f"Error fetching game status: {e}")
        return False

def fetch_player_stats(game_id, player_id):
    """Return (points, minutes) or (None, None)."""
    try:
        bb = BoxScoreTraditionalV2(game_id=game_id).player_stats.get_data_frame()
        if bb.empty:
            return None, None
        mask = bb["PLAYER_ID"] == player_id
        if not mask.any():
            return None, None
        row = bb.loc[mask].iloc[0]
        pts = int(row["PTS"])

        raw_min = row["MIN"] or "0"
        mins = int(raw_min.split(":")[0].split(".")[0])
        
        return pts, mins
    except Exception as e:
        print(f"Error fetching player stats: {e}")
        return None, None

def update_doc(ref, data):
    """Update a document with final game results"""
    try:
        pts, mins = fetch_player_stats(data["gameId"], data["playerId"])
        if pts is None:
            return False
            
        update = {
            "gameStatus": "Concluded",
            "finalPoints": pts,
            "finalMinutes": mins,
            "finishedAt": firestore.SERVER_TIMESTAMP
        }
        update["bet_result"] = "WIN" if pts > data['threshold'] else "LOSS"

        ref.update(update)
        return True
    except Exception as e:
        print(f"Error updating document: {e}")
        return False

def resolve_document_reference(doc_ref):
    """Resolve a document reference to its data"""
    try:
        doc_snap = doc_ref.get()
        if doc_snap.exists:
            return doc_snap.to_dict()
        else:
            print(f"Document not found: {doc_ref.path}")
            return None
    except Exception as e:
        print(f"Error resolving document reference: {e}")
        return None

def move_player_to_concluded(player_id, player_data):
    """Move a player from active to concluded collection"""
    try:
        db = firestore.client()
        
        # Create reference to concluded collection
        concluded_ref = (
            db.collection("processedPlayers")
              .document("players")
              .collection("concluded")
              .document(player_id)
        )
        
        # Set the data in concluded collection
        concluded_ref.set(player_data)
        
        # Delete from active collection
        active_ref = (
            db.collection("processedPlayers")
              .document("players")
              .collection("active")
              .document(player_id)
        )
        active_ref.delete()
        
        print(f"Moved player {player_id} from active to concluded")
        return concluded_ref
        
    except Exception as e:
        print(f"Error moving player to concluded: {e}")
        return None

# Main Functions
def check_active_players():
    """Check all active players and move concluded games to concluded collection"""
    try:
        db = firestore.client()
        coll = (
            db.collection("processedPlayers")
              .document("players")
              .collection("active")
        )
        
        for snap in coll.stream():
            player_data = snap.to_dict()
            player_id = snap.id
            
            # Check if game is finished
            if fetch_game_status(player_data):
                # Update with final stats
                if update_doc(snap.reference, player_data):
                    # Get updated data
                    updated_data = snap.reference.get().to_dict()
                    
                    # Move to concluded collection
                    move_player_to_concluded(player_id, updated_data)
                    
    except Exception as e:
        print(f"Error checking active players: {e}")

def check_user_picks():
    """Check user picks and clean up concluded games"""
    try:
        db = firestore.client()
        
        for user_doc in db.collection("users").stream():
            user_data = user_doc.to_dict()
            picks = user_data.get("picks", [])
            
            if not picks:
                continue
                
            updated_picks = []
            needs_update = False
            
            for pick in picks:
                # Check if this is a document reference or legacy full object
                if hasattr(pick, 'get'):
                    # This is a document reference
                    pick_data = resolve_document_reference(pick)
                    if pick_data and pick_data.get("gameStatus") != "Concluded":
                        updated_picks.append(pick)
                    else:
                        needs_update = True  # Remove concluded picks
                else:
                    # This is a legacy full object
                    if pick.get("gameStatus") != "Concluded":
                        updated_picks.append(pick)
                    else:
                        needs_update = True  # Remove concluded picks
            
            # Update user document if picks changed
            if needs_update:
                user_doc.reference.update({"picks": updated_picks})
                print(f"Updated picks for user {user_doc.id}")
                
    except Exception as e:
        print(f"Error checking user picks: {e}")

def check_active_bets():
    """Check active bets and settle completed ones"""
    try:
        db = firestore.client()
        
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
                    winnings = bet_data.get("potentialWinnings", 0) if all_wins else 0
                    
                    # Update bet status
                    bet_doc.reference.update({
                        "status": overall_result,
                        "bet_result": overall_result,
                        "winnings": winnings,
                        "settledAt": firestore.SERVER_TIMESTAMP,
                    })
                    
                    print(f"Settled bet {bet_doc.id} for user {user_id}: {overall_result}")
                    
    except Exception as e:
        print(f"Error checking active bets: {e}")

def update_bet_pick_references():
    """Update active bet pick references when players move from active to concluded"""
    try:
        db = firestore.client()
        
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
                    if hasattr(pick_ref, 'get') and hasattr(pick_ref, 'path'):
                        # This is a document reference
                        if "/active/" in pick_ref.path:
                            # Check if this player has been moved to concluded
                            player_id = pick_ref.path.split("/")[-1]
                            concluded_ref = (
                                db.collection("processedPlayers")
                                  .document("players")
                                  .collection("concluded")
                                  .document(player_id)
                            )
                            
                            # Check if concluded version exists
                            if concluded_ref.get().exists:
                                updated_picks.append(concluded_ref)
                                needs_update = True
                            else:
                                updated_picks.append(pick_ref)  # Keep original if not moved yet
                        else:
                            updated_picks.append(pick_ref)  # Already pointing to concluded
                    else:
                        updated_picks.append(pick_ref)  # Legacy full object
                
                # Update bet if references changed
                if needs_update:
                    bet_doc.reference.update({"picks": updated_picks})
                    print(f"Updated pick references for bet {bet_doc.id} of user {user_id}")
                    
    except Exception as e:
        print(f"Error updating bet pick references: {e}")

def check_games_handler(request):
    """Main handler for checking and updating game statuses"""
    try:
        print("Starting game status check...")
        
        # 1. Check active players and move concluded ones
        print("Checking active players...")
        check_active_players()
        
        # 2. Update bet pick references (in case players moved to concluded)
        print("Updating bet pick references...")
        update_bet_pick_references()
        
        # 3. Check and clean up user picks
        print("Checking user picks...")
        check_user_picks()
        
        # 4. Check and settle active bets
        print("Checking active bets...")
        check_active_bets()
        
        print("Game status check completed successfully")
        return Response("OK", status=200)
        
    except Exception as e:
        print(f"ERROR in check_games: {e}")
        return Response(str(e), status=500)

# Flask app setup (if running as standalone)
if __name__ == "__main__":
    app = Flask(__name__)
    
    @app.route("/check-games", methods=["POST", "GET"])
    def check_games_route():
        return check_games_handler(None)
    
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
