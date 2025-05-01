import requests
import time
import schedule
import os

API_BASE_URL = "http://127.0.0.1:5000/api"

def update_all_bets():
    """
    Update all active bets for all users
    This function should be called periodically
    """
    try:
        # You might want to dynamically fetch user IDs from Firestore,
        # but here's a static list as an example
        users = ["bryanram", "adrienvaz"]  # <-- HIGHLIGHT: modify as needed
        
        for user_id in users:
            response = requests.post(
                f"{API_BASE_URL}/update_bet_results",
                json={"userId": user_id}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(
                    f"[User {user_id}] Updated {result.get('updated')} bets "
                    f"and completed {result.get('completed')} bets"
                )
            else:
                print(f"Error updating bets for user {user_id}: {response.text}")
    
    except Exception as e:
        print(f"Error updating bets: {str(e)}")

def main():
    """
    Main function to run the update script
    """
    print("Starting bet update script...")
    
    # Update bets immediately on startup
    update_all_bets()
    
    # Schedule updates every 15 minutes
    schedule.every(15).minutes.do(update_all_bets)
    
    # Run the scheduler
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    main()
