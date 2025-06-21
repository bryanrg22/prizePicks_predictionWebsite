import functions_framework                 # ★ Cloud Functions (gen 2) wrapper
import firebase_admin
from firebase_admin import firestore
from full_injury_report import get_full_injury_report

import os
import sys

# Allow importing back-end helpers for injury status lookup
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backEnd"))
from injury_report import get_player_injury_status_new
from chatgpt_bet_explainer import get_bet_explanation_from_chatgpt

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


def refresh_active_player_injuries(request=None):  # Cloud Functions entry-point
    """
    For every active player doc:
      • refresh injuryReport
      • refresh betExplanation *only if* the report actually changed
    """
    coll = (
        db.collection("processedPlayers")
          .document("players")
          .collection("active")
    )

    for snap in coll.stream():
        pdata = snap.to_dict() or {}
        name, p_team, opp_team = pdata.get("name"), pdata.get("team"), pdata.get("opponent")

        # ── 1. Build latest injury map ───────────────────────────
        new_report = get_player_injury_status_new(name, p_team, opp_team)
        if not isinstance(new_report, dict):
            continue                                              # skip bad parse

        def _strip_ts(d: dict) -> dict:
            return {k: v for k, v in d.items() if k not in ("lastChecked", "lastUpdated")}

        existing_report = pdata.get("injuryReport") or {}

        # ── 2. Decide whether anything meaningful changed ───────
        if _strip_ts(existing_report) != _strip_ts(new_report):
            # add timestamps *before* we push to Firestore
            new_report.update({
                "lastChecked": firestore.SERVER_TIMESTAMP,
                "lastUpdated": firestore.SERVER_TIMESTAMP,
            })

            doc_ref = snap.reference
            doc_ref.update({"injuryReport": new_report})

            # update local copy so ChatGPT sees the new injuries
            pdata["injuryReport"] = new_report

            # ── 3. Regenerate bet explanation (costly, so gated) ─
            bet_expl = get_bet_explanation_from_chatgpt(pdata)
            doc_ref.update({"betExplanation": bet_expl})

        else:
            # Only bump the heartbeat timestamp
            snap.reference.update(
                {"injuryReport.lastChecked": firestore.SERVER_TIMESTAMP}
            )