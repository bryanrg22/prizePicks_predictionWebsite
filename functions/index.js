// functions/index.js
const functions = require('firebase-functions')
const admin     = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

// 1) processedPlayers: active → concluded
exports.movePlayerToConcluded = functions
  .firestore
  .document('processedPlayers/active/{playerId}/thresholds/{threshold}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after  = change.after.data()

    // only when gameStatus flips to "Concluded"
    if (before.gameStatus !== 'Concluded' && after.gameStatus === 'Concluded') {
      const { playerId, threshold } = context.params
      const src  = change.after.ref
      const dest = db.doc(`processedPlayers/concluded/${playerId}/thresholds/${threshold}`)

      // copy & delete
      await dest.set(after)
      return src.delete()
    }
    return null
  })

// 2) activeBets → betHistory
exports.moveBetToHistory = functions
  .firestore
  .document('users/{userId}/activeBets/{betId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after  = change.after.data()

    // you’ll need to write a `status` field ("Active"→"Won"/"Lost"/"Completed") in your update logic
    const hasChanged = before.status !== after.status
    const isDone     = ['Won','Lost','Completed'].includes(after.status)

    if (hasChanged && isDone) {
      const { userId, betId } = context.params
      const src  = change.after.ref
      const dest = db.doc(`users/${userId}/betHistory/${betId}`)

      await dest.set(after)
      return src.delete()
    }
    return null
  })