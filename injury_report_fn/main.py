import functions_framework                   # ★ Cloud Functions (gen 2) wrapper
import firebase_admin
from firebase_admin import firestore
from full_injury_report import get_full_injury_report

# ------------- one‑time SDK bootstrap -------------
firebase_admin.initialize_app()
db = firestore.client()

def _team_key(name: str) -> str:
    return name.lower().replace(" ", "_")

# ------------- the function -------------
@functions_framework.cloud_event          # Pub/Sub trigger
def update_injury_report(event):
    """
    1. Pull the NBA PDF → structured list via get_full_injury_report().
    2. Group rows by team.
    3. Wipe & rewrite processedPlayers/players/injury_report.
    """
    report = get_full_injury_report()
    if isinstance(report, dict) and report.get("error"):
        # Log & bail if scraper failed
        print(report["error"])
        return

    # ---------- reshape ----------
    teams = {}
    for row in report:
        team = row.get("team")
        if not team:
            continue
        teams.setdefault(team, []).append(
            {k: v for k, v in row.items() if k != "team"}
        )

    coll = (
        db.collection("processedPlayers")
          .document("players")
          .collection("injury_report")
    )

    # ---------- hard‑refresh: delete old, then batch‑write new ----------
    for doc in coll.stream():
        doc.reference.delete()

    batch = db.batch()
    for team, players in teams.items():
        doc_ref = coll.document(_team_key(team))
        batch.set(doc_ref, {
            "team":        team,
            "lastUpdated": firestore.SERVER_TIMESTAMP,
            "players":     players
        })
    batch.commit()

    print(f"Wrote injury report for {len(teams)} teams.")
