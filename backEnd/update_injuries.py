# cloud_functions/update_injuries.py
def refresh_injury_report(request):
    rows = scrape_full_pdf()              # reuse your pdfplumber logic
    ts   = firestore.SERVER_TIMESTAMP
    inj  = db.collection("processedPlayers") \
              .document("players") \
              .collection("injury_report")

    # 🔄 delete‑then‑batch‑write (cheap: ≤1 write per player)
    for team in inj.list_documents():
        team.reference.delete()           # nuke old snapshot

    batch = db.batch()
    for r in rows:
        team_slug = slugify(r["team"])
        doc = inj.document(team_slug) \
                 .collection("roster") \
                 .document(slugify(r["player"]))
        batch.set(doc, {**r, "lastUpdated": ts})
    batch.commit()
    return "OK", 200
