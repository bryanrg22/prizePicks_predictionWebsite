import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Path to your service account JSON
SERVICE_ACCOUNT_PATH = "backEnd/prizepicksproject-15337-firebase-adminsdk-fbsvc-c967e4c17d.json"

# The intermediate doc under processedPlayers
PARENT_DOC_ID = "players"

# Initialize the Admin SDK
cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

def main():
    # Reference your concluded picks
    concluded_col = (
        db
        .collection("processedPlayers")
        .document(PARENT_DOC_ID)
        .collection("concluded")
    )

    # Stream all existing pick docs
    for doc_snapshot in concluded_col.stream():
        old_id = doc_snapshot.id
        data = doc_snapshot.to_dict()

        # split into first, last, and threshold
        parts = old_id.split("_")
        if len(parts) < 3:
            print(f" • SKIP {old_id}: unexpected ID format")
            continue
        first, last, threshold = parts[0], parts[1], "_".join(parts[2:])

        # pull and normalize the gameDate
        gd = data.get("gameDate")
        if isinstance(gd, str):
            try:
                # fix: use datetime.strptime, not gd.strptime
                game_dt = datetime.strptime(gd, "%m/%d/%Y")
            except ValueError:
                print(f" • SKIP {old_id}: bad date-string {gd!r}")
                continue
        else:
            # assume Firestore Timestamp
            game_dt = gd.to_datetime()

        # build the YYYYMMDD suffix
        ts_str = game_dt.strftime("%Y%m%d")

        new_id = f"{first.lower()}_{last.lower()}_{threshold}_{ts_str}"
        if new_id == old_id:
            print(f" • OK {old_id}: already up-to-date")
            continue

        # Write to new document, then delete the old one
        new_ref = concluded_col.document(new_id)
        new_ref.set(data)
        concluded_col.document(old_id).delete()
        print(f" ✓ RENAMED {old_id} → {new_id}")

if __name__ == "__main__":
    main()
