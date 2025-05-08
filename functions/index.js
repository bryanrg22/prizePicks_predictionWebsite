// functions/index.js
// explicitly pull in the 1st-gen API surface
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// 1) Move processedPlayers from players/active → players/concluded
exports.onPlayerStatusChange = functions.firestore
    .document("processedPlayers/players/active/{docId}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();
      const docId = context.params.docId;

      if (before.gameStatus !== "Concluded" &&
      after.gameStatus === "Concluded") {
        const conclRef = db
            .collection("processedPlayers")
            .doc("players")
            .collection("concluded")
            .doc(docId);

        await conclRef.set(after);
        await change.after.ref.delete();
        console.log(`Moved players/active/${docId}
          → players/concluded/${docId}`);
      }
    });

// 2) Archive active bets → betHistory (no change here)
exports.onActiveBetWrite = functions.firestore
    .document("users/{userId}/activeBets/{betId}")
    .onWrite(async (change, ctx) => {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;
      const {userId, betId} = ctx.params;

      const wasDeleted = !change.after.exists;
      const statusChanged =
      before &&
      after &&
      before.status !== after.status &&
      ["Concluded", "Completed", "Won", "Lost"].includes(after.status);

      if (wasDeleted || statusChanged) {
      // 1) copy into history
        const now = new Date();
        const year = now.getFullYear().toString();
        const mon = String(now.getMonth() + 1).padStart(2, "0");
        const hist = db
            .collection("users")
            .doc(userId)
            .collection("betHistory")
            .doc(year)
            .collection(mon)
            .doc(betId);

        await hist.set({
          ...(wasDeleted ? before : after),
          settledAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2) remove it from activeBets
        if (change.after.exists) {
          await change.after.ref.delete();
        }
      }
    });

exports.onUserPicksUpdate = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, ctx) => {
      const before = change.before.data().picks || [];
      const after = change.after.data().picks || [];
      // only run when picks actually change
      if (JSON.stringify(before) === JSON.stringify(after)) return;

      const kept = after.filter((p) => p.gameStatus !== "Concluded");
      if (kept.length !== after.length) {
        await change.after.ref.update({picks: kept});
      }
    });
