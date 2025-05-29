// functions/index.js
const functions = require("firebase-functions/v1")
const admin = require("firebase-admin")

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

// Helper function to check if a status is terminal
const hasTerminalStatus = (betData) => {
  return betData && betData.status && ["Concluded", "Completed", "Won", "Lost"].includes(betData.status)
}

// Helper function to update player references across all user bets
const updatePlayerReferences = async (playerId, movedToConcluded) => {
  try {
    console.log(`Updating references for player ${playerId}, moved to concluded: ${movedToConcluded}`)

    const usersSnapshot = await db.collection("users").get()
    let updatedBets = 0

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id

      if (movedToConcluded) {
        // Update active bets - change refs from active to concluded
        const activeBetsSnapshot = await db.collection("users").doc(userId).collection("activeBets").get()

        for (const betDoc of activeBetsSnapshot.docs) {
          const betData = betDoc.data()
          const picks = betData.picks || []

          let needsUpdate = false
          const updatedPicks = picks.map((pickRef) => {
            if (pickRef && pickRef.path && pickRef.path.includes(`/active/${playerId}`)) {
              needsUpdate = true
              return db.collection("processedPlayers").doc("players").collection("concluded").doc(playerId)
            }
            return pickRef
          })

          if (needsUpdate) {
            await betDoc.ref.update({ picks: updatedPicks })
            updatedBets++
            console.log(`Updated active bet ${betDoc.id} for user ${userId}`)
          }
        }
      }
    }

    console.log(`Updated ${updatedBets} bets with new player references`)
  } catch (error) {
    console.error("Error updating player references:", error)
  }
}

// 1) Move processedPlayers from players/active → players/concluded
exports.onPlayerStatusChange = functions.firestore
  .document("processedPlayers/players/active/{docId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()
    const docId = context.params.docId

    // Only proceed if gameStatus changed to "Concluded"
    if (before.gameStatus !== "Concluded" && after.gameStatus === "Concluded") {
      try {
        console.log(`Player ${docId} game concluded, moving to concluded collection`)

        // Create document in concluded collection
        const conclRef = db.collection("processedPlayers").doc("players").collection("concluded").doc(docId)

        await conclRef.set(after)
        console.log(`Created concluded document for player ${docId}`)

        // Delete from active collection
        await change.after.ref.delete()
        console.log(`Deleted active document for player ${docId}`)

        // Update any document references pointing to this player
        await updatePlayerReferences(docId, true)
      } catch (error) {
        console.error(`Error moving player ${docId} to concluded:`, error)
      }
    }
  })

// 2) Archive active bets → betHistory when they reach terminal status
exports.onActiveBetWrite = functions.firestore
  .document("users/{userId}/activeBets/{betId}")
  .onWrite(async (change, ctx) => {
    const before = change.before.exists ? change.before.data() : null
    const after = change.after.exists ? change.after.data() : null
    const { userId, betId } = ctx.params

    const wasDeleted = !change.after.exists

    // Determine if we should create bet history
    const statusChangedToTerminal = before && after && before.status !== after.status && hasTerminalStatus(after)

    const deletedWithTerminalStatus = wasDeleted && hasTerminalStatus(before)

    // Only create betHistory for concluded/completed bets
    if (statusChangedToTerminal || deletedWithTerminalStatus) {
      try {
        const betData = wasDeleted ? before : after

        console.log(`Creating betHistory for bet ${betId} - Status: ${betData.status || "CONCLUDED"}`)

        // Convert any active references to concluded references
        let updatedPicks = betData.picks || []
        if (updatedPicks.length > 0 && updatedPicks[0] && typeof updatedPicks[0].get === "function") {
          // These are document references
          updatedPicks = updatedPicks.map((pickRef) => {
            if (pickRef.path && pickRef.path.includes("/active/")) {
              const playerId = pickRef.path.split("/").pop()
              return db.collection("processedPlayers").doc("players").collection("concluded").doc(playerId)
            }
            return pickRef
          })
        }

        // Create bet history document
        const historyRef = db.collection("users").doc(userId).collection("betHistory").doc(betId)

        await historyRef.set({
          ...betData,
          picks: updatedPicks,
          settledAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        console.log(`Created betHistory for ${betId}`)

        // Delete from activeBets if it still exists
        if (change.after.exists) {
          await change.after.ref.delete()
          console.log(`Deleted activeBet ${betId}`)
        }

        console.log(`✅ Moved bet ${betId} to betHistory for user ${userId}`)
      } catch (error) {
        console.error(`Error archiving bet ${betId}:`, error)
      }
    } else if (wasDeleted && !hasTerminalStatus(before)) {
      // Manual cancellation - log but don't create history
      console.log(`🚫 Manual cancellation detected for bet ${betId} - NO betHistory created`)
    }
  })

// 3) Clean up user picks when games conclude
exports.onUserPicksUpdate = functions.firestore.document("users/{userId}").onUpdate(async (change, ctx) => {
  const before = change.before.data().picks || []
  const after = change.after.data().picks || []

  // Only run when picks actually change
  if (JSON.stringify(before) === JSON.stringify(after)) return

  try {
    let needsUpdate = false
    const updatedPicks = []

    for (const pick of after) {
      if (pick && typeof pick.get === "function") {
        // This is a document reference
        try {
          const pickDoc = await pick.get()
          if (pickDoc.exists && pickDoc.data().gameStatus !== "Concluded") {
            updatedPicks.push(pick)
          } else {
            needsUpdate = true // Remove concluded picks
            console.log(`Removing concluded pick reference for user ${ctx.params.userId}`)
          }
        } catch (error) {
          console.error("Error checking pick reference:", error)
          // Keep the pick if we can't verify its status
          updatedPicks.push(pick)
        }
      } else if (pick && pick.gameStatus !== "Concluded") {
        // Legacy full object that's not concluded
        updatedPicks.push(pick)
      } else {
        // Remove concluded legacy picks
        needsUpdate = true
        console.log(`Removing concluded legacy pick for user ${ctx.params.userId}`)
      }
    }

    if (needsUpdate) {
      await change.after.ref.update({ picks: updatedPicks })
      console.log(`Cleaned up concluded picks for user ${ctx.params.userId}`)
    }
  } catch (error) {
    console.error(`Error cleaning up picks for user ${ctx.params.userId}:`, error)
  }
})

// 4) Migration function to convert existing data to document references
exports.migrateToDocumentReferences = functions.https.onRequest(async (req, res) => {
  try {
    console.log("Starting migration to document references...")

    const usersSnapshot = await db.collection("users").get()
    let migratedUsers = 0
    const errors = []

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      const userData = userDoc.data()

      try {
        // Migrate user picks
        const picks = userData.picks || []
        if (picks.length > 0 && picks[0] && typeof picks[0].get !== "function") {
          // These are full objects, convert to references
          const pickReferences = picks.map((pick) => {
            const pickName = pick.name || pick.playerName || ""
            const threshold = pick.threshold || 0
            const playerId = pick.id || `${pickName.toLowerCase().replace(/\s+/g, "_")}_${threshold}`

            return db.collection("processedPlayers").doc("players").collection("active").doc(playerId)
          })

          await userDoc.ref.update({ picks: pickReferences })
          console.log(`Migrated picks for user ${userId}`)
        }

        // Migrate active bets
        const activeBetsSnapshot = await db.collection("users").doc(userId).collection("activeBets").get()

        for (const betDoc of activeBetsSnapshot.docs) {
          const betData = betDoc.data()
          const betPicks = betData.picks || []

          if (betPicks.length > 0 && betPicks[0] && typeof betPicks[0].get !== "function") {
            const pickReferences = betPicks.map((pick) => {
              const playerName = pick.playerName || pick.name || ""
              const threshold = pick.threshold || 0
              const playerId = pick.id || `${playerName.toLowerCase().replace(/\s+/g, "_")}_${threshold}`

              return db.collection("processedPlayers").doc("players").collection("active").doc(playerId)
            })

            await betDoc.ref.update({ picks: pickReferences })
            console.log(`Migrated active bet ${betDoc.id} for user ${userId}`)
          }
        }

        migratedUsers++
      } catch (userError) {
        console.error(`Error migrating user ${userId}:`, userError)
        errors.push(`User ${userId}: ${userError.message}`)
      }
    }

    res.json({
      success: true,
      message: `Successfully migrated ${migratedUsers} users to document references`,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Migration error:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})
