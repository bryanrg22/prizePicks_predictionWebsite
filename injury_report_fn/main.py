import functions_framework                 # ★ Cloud Functions (gen 2) wrapper
import firebase_admin
from firebase_admin import firestore
from full_injury_report import get_full_injury_report

import os
import sys

# Allow importing back-end helpers for injury status lookup
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backEnd"))
from injury_report import get_player_injury_status_new

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
            "players":     players,
        })
    batch.commit()

    print(f"Wrote injury report for {len(teams)} teams.")

    # After refreshing the central report, sync any active player docs
    refresh_active_player_injuries()


def refresh_active_player_injuries():
    """Update injuryReport for all active players.

    If ``team`` is provided, only players whose team or opponent matches will
    be refreshed. The player's injuryReport map gains a ``lastChecked`` field
    and is overwritten when the data differs.
    """

    coll = (
        db.collection("processedPlayers")
          .document("players")
          .collection("active")
    )

    for snap in coll.stream():
        pdata = snap.to_dict() or {}
        name     = pdata.get("name")
        p_team   = pdata.get("team")
        opp_team = pdata.get("opponent")

        new_report = get_player_injury_status_new(name, p_team, opp_team)
        existing_report = pdata.get("injuryReport") or {}

        def _strip_check(d):
            return {k: v for k, v in d.items() if k != "lastChecked"}

        if _strip_check(existing_report) != _strip_check(new_report):
            snap.reference.update({"injuryReport": new_report})
            new_report["lastUpdated"] = firestore.SERVER_TIMESTAMP
            new_report["lastChecked"] = firestore.SERVER_TIMESTAMP
        else:
            snap.reference.update({"injuryReport.lastChecked": firestore
                                   .SERVER_TIMESTAMP})
