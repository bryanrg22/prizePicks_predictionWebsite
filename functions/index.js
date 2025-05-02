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
            .collection("processedPlayers").doc("players")
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
    .onWrite(async (change, context) => {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;
      const {userId, betId} = context.params;

      const wasDeleted = !change.after.exists;
      const statusChanged = before && after &&
      before.status !== after.status &&
      ["Concluded", "Completed", "Won", "Lost"].includes(after.status);

      if (wasDeleted || statusChanged) {
        const betData = wasDeleted ? before : after;
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth()+1).padStart(2, "0");

        const histRef = db
            .collection("users").doc(userId)
            .collection("betHistory").doc(year)
            .collection(month).doc(betId);

        await histRef.set({
          ...betData,
          settledAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Archived bet ${betId} for ${userId}
          under ${year}/${month}`);
      }
    });
