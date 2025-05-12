import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Path to your Firebase Admin SDK JSON
SERVICE_ACCOUNT_PATH = "backEnd/prizepicksproject-15337-firebase-adminsdk-fbsvc-c967e4c17d.json"

# The intermediate document under processedPlayers
PARENT_DOC_ID = "players"

# Initialize the Admin SDK
cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

def main():
    concluded_col = (
        db
        .collection("processedPlayers")
        .document(PARENT_DOC_ID)
        .collection("concluded")
    )

    for doc_snapshot in concluded_col.stream():
        old_id = doc_snapshot.id
        data = doc_snapshot.to_dict()

        # ——————————————————————————————————————————————————————————————————
        # 1) Normalize the “base” ID by discarding anything after the
        #    3rd underscore (i.e. remove extra dates if they exist).
        parts = old_id.split("_")
        if len(parts) < 3:
            print(f" • SKIP {old_id}: unexpected ID format")
            continue

        first, last, threshold = parts[0], parts[1], parts[2]
        # ——————————————————————————————————————————————————————————————————

        # 2) Parse the gameDate field (string "MM/DD/YYYY" or Firestore Timestamp)
        gd = data.get("gameDate")
        if isinstance(gd, str):
            try:
                game_dt = datetime.strptime(gd, "%m/%d/%Y")
            except ValueError:
                print(f" • SKIP {old_id}: bad date-string {gd!r}")
                continue
        else:
            game_dt = gd.to_datetime()

        ts_str = game_dt.strftime("%Y%m%d")

        # 3) Build the new, correctly formatted ID
        new_id = f"{first.lower()}_{last.lower()}_{threshold}_{ts_str}"

        # 4) If it’s already correct, skip it
        if new_id == old_id:
            print(f" • OK   {old_id}: already up-to-date")
            continue

        # 5) Otherwise, copy the data over to the new ID and delete the old doc
        concluded_col.document(new_id).set(data)
        concluded_col.document(old_id).delete()
        print(f" ✓ RENAMED {old_id} → {new_id}")

if __name__ == "__main__":
    main()
