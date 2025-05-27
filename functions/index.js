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

      if (before.gameStatus !== "Concluded" && after
          .gameStatus === "Concluded") {
        const conclRef = db.collection("processedPlayers").doc("players")
            .collection("concluded").doc(docId);

        await conclRef.set(after);
        await change.after.ref.delete();
        console
            .log(`Moved players/active/${docId} → players/concluded/${docId}`);

        // Update any document references pointing to this player
        // true = moved from active to concluded
        await updatePlayerReferences(docId, true);
      }
    });

// Update document ref when players move active to concluded
const updatePlayerReferences = async (playerId, movedToConcluded) => {
  try {
    console.log(`Updating references for player ${playerId}`);

    // Get all users
    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Update active bets - move refs active to concluded
      if (movedToConcluded) {
        const activeBetsSnapshot = await db.collection("users").doc(userId)
            .collection("activeBets").get();

        for (const betDoc of activeBetsSnapshot.docs) {
          const betData = betDoc.data();
          const picks = betData.picks || [];

          let needsUpdate = false;
          const updatedPicks = picks.map((pickRef) => {
            if (pickRef && pickRef.path && pickRef.path
                .includes(`/active/${playerId}`)) {
              needsUpdate = true;
              // Create new reference to concluded collection
              return db.collection("processedPlayers").doc("players")
                  .collection("concluded").doc(playerId);
            }
            return pickRef;
          });

          if (needsUpdate) {
            await betDoc.ref.update({picks: updatedPicks});
            console
                .log(`Updated active bet ${betDoc.id} for user ${userId}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error updating player references:", error);
  }
};

// 2) Archive active bets → betHistory with document reference handling
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
        const betData = wasDeleted ? before : after;

        // If bet has document ref in picks, convert to concluded ref
        let updatedPicks = betData.picks || [];
        if (updatedPicks.length > 0 && updatedPicks[0] && typeof updatedPicks[0]
            .get === "function") {
        // These are document references, convert from active to concluded
          updatedPicks = updatedPicks.map((pickRef) => {
            if (pickRef.path && pickRef.path.includes("/active/")) {
              const playerId = pickRef.path.split("/").pop();
              return db.collection("processedPlayers").doc("players")
                  .collection("concluded").doc(playerId);
            }
            return pickRef;
          });
        }

        // 1) copy into history with updated references
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, "0");

        const hist = db.collection("users").doc(userId).collection("betHistory")
            .doc(year).collection(month).doc(betId);

        await hist.set({
          ...betData,
          picks: updatedPicks,
          settledAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2) remove it from activeBets
        if (change.after.exists) {
          await change.after.ref.delete();
        }

        console
            .log(`Moved users/${userId}/active/${betId} → 
          users/${userId}/betHistory/${year}/${month}/${betId}`);
      }
    });

// 3) Clean up user picks when games conclude (with document reference handling)
exports.onUserPicksUpdate = functions.firestore
    .document("users/{userId}").onUpdate(async (change, ctx) => {
      const before = change.before.data().picks || [];
      const after = change.after.data().picks || [];

      // only run when picks actually change
      if (JSON.stringify(before) === JSON.stringify(after)) return;

      // Handle both document references and legacy full objects
      let needsUpdate = false;
      const updatedPicks = [];

      for (const pick of after) {
        if (pick && typeof pick.get === "function") {
          // This is a document ref, check if concluded
          try {
            const pickDoc = await pick.get();
            if (pickDoc.exists && pickDoc.data().gameStatus !== "Concluded") {
              updatedPicks.push(pick);
            } else {
              needsUpdate = true; // Remove concluded picks
            }
          } catch (error) {
            console.error("Error checking pick reference:", error);
            // Keep the pick if we can't verify its status
            updatedPicks.push(pick);
          }
        } else if (pick && pick.gameStatus !== "Concluded") {
          // Legacy full object that's not concluded
          updatedPicks.push(pick);
        } else {
          // Remove concluded legacy picks
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await change.after.ref.update({picks: updatedPicks});
        console.log(`Cleaned up concluded picks for user ${ctx.params.userId}`);
      }
    });

// 4) New function to migrate existing data to document references
exports.migrateToDocumentReferences = functions.https
    .onRequest(async (req, res) => {
      try {
        console.log("Starting migration to document references...");

        // Get all users
        const usersSnapshot = await db.collection("users").get();
        let migratedUsers = 0;

        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const userData = userDoc.data();

          try {
            // Migrate user picks
            const picks = userData.picks || [];
            if (picks.length > 0 && picks[0] && typeof picks[0]
                .get !== "function") {
              // These are full objects, convert to references
              const pickReferences = picks.map((pick) => {
                // Fix optional chaining -
                // replace ?. with traditional null checks
                const pickName = pick.name || "";
                const playerId = pick.id || `${pickName.toLowerCase()
                    .replace(/\s+/g, "_")}_${pick.threshold}`;
                return db.collection("processedPlayers").doc("players")
                    .collection("active").doc(playerId);
              });

              await userDoc.ref.update({picks: pickReferences});
              console.log(`Migrated picks for user ${userId}`);
            }

            // Migrate active bets
            const activeBetsSnapshot = await db.collection("users").doc(userId)
                .collection("activeBets").get();
            for (const betDoc of activeBetsSnapshot.docs) {
              const betData = betDoc.data();
              const betPicks = betData.picks || [];

              if (betPicks.length > 0 && betPicks[0] && typeof betPicks[0]
                  .get !== "function") {
                const pickReferences = betPicks.map((pick) => {
                  // Fix optional chaining - replace ?. with
                  // traditional null checks
                  const playerName = pick.playerName || "";
                  const playerId = pick.id || `${playerName.toLowerCase()
                      .replace(/\s+/g, "_")}_${pick.threshold}`;
                  return db.collection("processedPlayers").doc("players")
                      .collection("active").doc(playerId);
                });

                await betDoc.ref.update({picks: pickReferences});
                console.log(`Migrated active bet ${betDoc
                    .id} for user ${userId}`);
              }
            }

            migratedUsers++;
          } catch (userError) {
            console.error(`Error migrating user ${userId}:`, userError);
          }
        }

        res.json({
          success: true,
          message: `Successfully migrated ${migratedUsers}
      users to document references`,
        });
      } catch (error) {
        console.error("Migration error:", error);
        res.status(500).json({success: false, error: error.message});
      }
    });
