import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  increment,
  deleteDoc,
  writeBatch,
} from "firebase/firestore"
import { db } from "../firebase"

// ===== HELPER FUNCTIONS FOR DOCUMENT REFERENCES =====

/**
 * Resolve a single document reference to full data
 */
const resolveDocumentReference = async (docRef) => {
  try {
    let actualRef = docRef

    if (typeof docRef === "string") {
      // Remove leading slash if present and convert to DocumentReference
      const cleanPath = docRef.startsWith('/') ? docRef.substring(1) : docRef
      actualRef = doc(db, cleanPath)
    } else if (!docRef || typeof docRef.get !== "function") {
      console.warn("Invalid document reference:", docRef)
      return null
    }

    console.log("Resolving document reference:", actualRef.path)
    const docSnap = await getDoc(actualRef)

    if (docSnap.exists()) {
      const data = {
        id: docSnap.id,
        ...docSnap.data(),
      }
      console.log("Successfully resolved document:", actualRef.path, data)
      return data
    } else {
      console.warn("Document not found:", actualRef.path)
      return null
    }
  } catch (error) {
    console.error("Error resolving document reference:", error)
    return null
  }
}

/**
 * Resolve multiple document references in batch for efficiency
 */
const resolveDocumentReferences = async (docRefs) => {
  if (!docRefs || !Array.isArray(docRefs) || docRefs.length === 0) {
    console.log("No document references to resolve")
    return []
  }

  try {
    console.log("Resolving", docRefs.length, "document references")

    // Convert all references to DocumentReference objects
    const validRefs = docRefs
      .map((ref) => {
        if (typeof ref === "string") {
          return doc(db, ref)
        } else if (ref && ref.firestore && ref.type === "document") {
          // This is a Firestore DocumentReference object
          return ref
        } else {
          console.warn("Invalid reference:", ref)
          return null
        }
      })
      .filter(Boolean)

    if (validRefs.length === 0) {
      console.warn("No valid document references found")
      return []
    }

    // Batch fetch all documents
    const promises = validRefs.map((ref) => getDoc(ref))
    const snapshots = await Promise.all(promises)

    // Convert snapshots to data objects
    const resolvedData = snapshots
      .map((snap, index) => {
        if (snap.exists()) {
          const data = {
            id: snap.id,
            ...snap.data(),
          }
          console.log("Resolved document:", validRefs[index].path)
          return data
        } else {
          console.warn("Document not found:", validRefs[index].path)
          return null
        }
      })
      .filter(Boolean) // Remove null entries

    console.log("Successfully resolved", resolvedData.length, "out of", docRefs.length, "documents")
    return resolvedData
  } catch (error) {
    console.error("Error resolving document references:", error)
    return []
  }
}

export const getUserPicks = async (username) => {
  try {
    console.log("Getting picks for user:", username)
    const userRef = doc(db, "users", username)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      console.log("User document not found:", username)
      return []
    }

    const userData = userSnap.data()
    const picks = userData.picks || []

    console.log("Raw picks from database:", picks)

    if (picks.length === 0) {
      console.log("No picks found for user")
      return []
    }

    // Check if picks are document references or full objects
    const firstPick = picks[0]
    
    // If it's a DocumentReference object or a path string
    if (typeof firstPick === "string" || (firstPick && typeof firstPick.get === "function")) {
      console.log("Document references detected, resolving...")
      const resolvedPicks = await resolveDocumentReferences(picks)
      
      if (resolvedPicks.length === 0) {
        console.warn("No picks could be resolved from references")
        return []
      }
      
      return transformPicksData(resolvedPicks)
    }
    
    // If picks are already full objects (legacy)
    if (firstPick && typeof firstPick === "object" && firstPick.name) {
      console.log("Legacy picks detected, returning as-is")
      return transformPicksData(picks)
    }

    console.warn("Unknown picks format:", picks)
    return []
  } catch (error) {
    console.error("Error getting user picks:", error)
    return []
  }
}

// Helper function to transform picks data
const transformPicksData = (picks) => {
  return picks
    .map((pick) => {
      if (!pick) return null

      // Extract threshold from the document ID if not present
      let threshold = pick.threshold
      if (!threshold && pick.id) {
        const parts = pick.id.split("_")
        const thresholdPart = parts.find((part) => !isNaN(Number.parseFloat(part)))
        if (thresholdPart) {
          threshold = Number.parseFloat(thresholdPart)
        }
      }

      return {
        id: pick.id,
        player: pick.name || pick.playerName || "Unknown Player",
        name: pick.name || pick.playerName || "Unknown Player",
        playerId: pick.playerId,
        team: pick.team || "Unknown Team",
        opponent: pick.opponent || "Unknown Opponent",
        threshold: threshold || 0,
        photoUrl: pick.photoUrl || "/placeholder.svg?height=100&width=100",
        teamLogo: pick.teamLogo || "/placeholder.svg?height=40&width=40",
        opponentLogo: pick.opponentLogo || "/placeholder.svg?height=40&width=40",
        gameDate: pick.gameDate
          ? pick.gameDate.toDate
            ? pick.gameDate.toDate().toLocaleDateString()
            : pick.gameDate
          : "TBD",
        gameTime: pick.gameTime || "TBD",
        recommendation: pick.betExplanation?.recommendation || "OVER",
        position: pick.position,
        // Include all original data for other components that might need it
        ...pick,
      }
    })
    .filter(Boolean)
}

/**
 * Create document reference from player data
 */
const createPlayerDocumentReference = (playerData, isActive = true) => {
  const collection = isActive ? "active" : "concluded"
  const playerId = playerData.id || `${playerData.name?.toLowerCase().replace(/\s+/g, "_")}_${playerData.threshold}`

  return doc(db, "processedPlayers", "players", collection, playerId)
}

/**
 * Get document reference path for migration
 */
const getDocumentReferencePath = (playerData, isActive = true) => {
  const collection = isActive ? "active" : "concluded"
  const playerId = playerData.id || `${playerData.name?.toLowerCase().replace(/\s+/g, "_")}_${playerData.threshold}`

  return `processedPlayers/players/${collection}/${playerId}`
}

// ===== USER PROFILE FUNCTIONS =====

// Get user profile by username (for sign in)
export const getUserByUsername = async (username) => {
  try {
    const userRef = doc(db, "users", username)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data(),
      }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting user:", error)
    throw error
  }
}

// Verify user password
export const verifyUserPassword = (userData, password) => {
  // Check if the password is in the profile object or at the root level
  return (userData.profile && userData.profile.password === password) || userData.password === password
}

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      // Return the profile object if it exists, otherwise return the data
      return userSnap.data().profile || userSnap.data()
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting user profile:", error)
    throw error
  }
}

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data()

      if (userData.profile) {
        // New structure - update profile object
        await updateDoc(userRef, {
          profile: { ...profileData, lastLogin: serverTimestamp() },
        })
      } else {
        // Old structure - update fields directly
        await updateDoc(userRef, {
          ...profileData,
          lastLogin: serverTimestamp(),
        })
      }
    }
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

// Update user stats
export const updateUserStats = async (userId, stats) => {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data()

      if (userData.profile) {
        // New structure
        await updateDoc(userRef, {
          "profile.totalEarnings": increment(stats.earnings || 0),
          "profile.totalBets": increment(stats.bets || 0),
          "profile.winCount": increment(stats.wins || 0),
          "profile.lossCount": increment(stats.losses || 0),
          "profile.winRate": stats.newWinRate || increment(0),
        })
      } else {
        // Old structure
        await updateDoc(userRef, {
          totalEarnings: increment(stats.earnings || 0),
          totalBets: increment(stats.bets || 0),
          winCount: increment(stats.wins || 0),
        })
      }
    }
  } catch (error) {
    console.error("Error updating user stats:", error)
    throw error
  }
}

// ===== PICKS FUNCTIONS WITH DOCUMENT REFERENCES =====

// Add or update a pick using document references
export const addUserPick = async (username, pickData) => {
  if (typeof pickData?.id !== "string") {
    throw new Error("Invalid pickData.id — must be a string")
  }

  try {
    const userRef = doc(db, "users", username)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) return []

    // Create document reference to the player in processedPlayers/active
    const playerDocRef = createPlayerDocumentReference(pickData, true)

    // Verify the referenced document exists
    const playerDocSnap = await getDoc(playerDocRef)
    if (!playerDocSnap.exists()) {
      throw new Error(`Player document not found: ${playerDocRef.path}`)
    }

    // Get existing picks (array of document references)
    const existingPicks = Array.isArray(userSnap.data().picks) ? userSnap.data().picks : []

    // Check if this pick already exists (compare document paths)
    const existingIndex = existingPicks.findIndex((pickRef) => pickRef && pickRef.path === playerDocRef.path)

    let updatedPicks
    if (existingIndex >= 0) {
      // Update existing pick
      updatedPicks = [...existingPicks]
      updatedPicks[existingIndex] = playerDocRef
    } else {
      // Add new pick
      updatedPicks = [...existingPicks, playerDocRef]
    }

    await updateDoc(userRef, { picks: updatedPicks })

    // Return resolved picks for immediate use
    return await resolveDocumentReferences(updatedPicks)
  } catch (error) {
    console.error("Error adding user pick:", error)
    throw error
  }
}

// Remove a pick by document reference path
export const removeUserPick = async (username, pickId) => {
  try {
    const userRef = doc(db, "users", username)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) return []

    const existingPicks = userSnap.data().picks || []

    // Filter out the pick by comparing document paths or IDs
    const updatedPicks = existingPicks.filter((pickRef) => {
      if (!pickRef || typeof pickRef.get !== "function") return false

      // Extract ID from document path for comparison
      const pathParts = pickRef.path.split("/")
      const docId = pathParts[pathParts.length - 1]

      return docId !== pickId
    })

    await updateDoc(userRef, { picks: updatedPicks })

    // Return resolved picks
    return await resolveDocumentReferences(updatedPicks)
  } catch (error) {
    console.error("Error removing user pick:", error)
    throw error
  }
}

// ===== BET FUNCTIONS WITH DOCUMENT REFERENCES =====

// Create a new bet with document references
export const createBet = async (userId, betData) => {
  try {
    const gameDate = betData.gameDate || new Date().toISOString().substring(0, 10)

    // Convert picks to document references
    const pickReferences = betData.picks.map((pick) => {
      // Create reference to active player document
      return createPlayerDocumentReference(pick, true)
    })

    // Verify all referenced documents exist
    const verificationPromises = pickReferences.map((ref) => getDoc(ref))
    const verificationResults = await Promise.all(verificationPromises)

    const missingDocs = verificationResults
      .map((snap, index) => ({ snap, ref: pickReferences[index] }))
      .filter(({ snap }) => !snap.exists())
      .map(({ ref }) => ref.path)

    if (missingDocs.length > 0) {
      throw new Error(`Referenced player documents not found: ${missingDocs.join(", ")}`)
    }

    const betsRef = collection(db, "users", userId, "activeBets")
    const docRef = await addDoc(betsRef, {
      ...betData,
      gameDate,
      picks: pickReferences, // Store document references instead of full objects
      createdAt: serverTimestamp(),
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating bet:", error)
    throw error
  }
}

// Get active bets and resolve document references
export const getActiveBets = async (userId) => {
  try {
    // Get from new sub-collection
    const snap = await getDocs(collection(db, "users", userId, "activeBets"))

    if (!snap.empty) {
      const bets = await Promise.all(
        snap.docs.map(async (betDoc) => {
          const betData = betDoc.data()

          // Resolve pick references to full data
          const resolvedPicks = await resolveDocumentReferences(betData.picks || [])

          return {
            id: betDoc.id,
            ...betData,
            picks: resolvedPicks,
          }
        }),
      )

      return bets
    }

    // Fallback to old array structure
    const userSnap = await getDoc(doc(db, "users", userId))
    if (!userSnap.exists()) return []

    const legacyBets = (userSnap.data().bets || []).filter((b) => b.status === "Active")
    return legacyBets
  } catch (error) {
    console.error("Error getting active bets:", error)
    return []
  }
}

// Get bet history and resolve document references
export const getBetHistory = async (userId, year, month) => {
  try {
    const histRef = collection(db, "users", userId, "betHistory", year, month)
    const snap = await getDocs(histRef)

    const bets = await Promise.all(
      snap.docs.map(async (betDoc) => {
        const betData = betDoc.data()

        // Resolve pick references to full data (from concluded collection)
        let resolvedPicks = []
        if (betData.picks && Array.isArray(betData.picks)) {
          // Check if picks are references or full objects
          if (betData.picks.length > 0 && typeof betData.picks[0].get === "function") {
            // These are document references, resolve them
            resolvedPicks = await resolveDocumentReferences(betData.picks)
          } else {
            // These are already full objects (legacy)
            resolvedPicks = betData.picks
          }
        }

        return {
          id: betDoc.id,
          ...betData,
          picks: resolvedPicks,
        }
      }),
    )

    return bets
  } catch (error) {
    console.error("Error getting bet history:", error)
    return []
  }
}

// Get all bet history (simplified for now)
export const getAllBetHistory = async (userId) => {
  try {
    const now = new Date()
    const y = now.getFullYear().toString()
    const m = String(now.getMonth() + 1).padStart(2, "0")
    return await getBetHistory(userId, y, m)
  } catch (error) {
    console.error("Error getting all bet history:", error)
    return []
  }
}

/**
 * Stub for moving completed bets client-side.
 * Your Cloud Function does the real archiving,
 * so here we just return zero moved.
 */
export const moveCompletedBets = async (userId) => {
  return { moved: 0 }
}

// Get user's active bets (legacy)
export const getUserActiveBets = async (username) => {
  return await getActiveBets(username)
}

// Cancel one or all active bets
export const cancelActiveBet = async (userId, betId) => {
  const userRef = doc(db, "users", userId)

  try {
    // 1) delete from subcollection
    if (betId) {
      await deleteDoc(doc(db, "users", userId, "activeBets", betId))
    } else {
      const activeBets = await getActiveBets(userId)
      await Promise.all(activeBets.map((b) => deleteDoc(doc(db, "users", userId, "activeBets", b.id))))
    }

    // 2) legacy fallback: remove from users/{userId}.bets[]
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      const legacy = userSnap.data().bets || []
      const filtered = legacy.filter((b) => (betId ? b.id !== betId : b.status !== "Active"))
      if (filtered.length !== legacy.length) {
        await updateDoc(userRef, { bets: filtered })
      }
    }

    return true
  } catch (err) {
    console.error("cancelActiveBet failed:", err)
    throw err
  }
}

// Update a single active bet
export const updateActiveBet = async (userId, betId, updatedData) => {
  const userRef = doc(db, "users", userId)

  try {
    // If updating picks, convert to document references
    if (updatedData.picks) {
      updatedData.picks = updatedData.picks.map((pick) => createPlayerDocumentReference(pick, true))
    }

    // 1) sub‐collection update
    const betRef = doc(db, "users", userId, "activeBets", betId)
    await updateDoc(betRef, updatedData)

    // 2) legacy fallback: patch users/{userId}.bets[]
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      const legacy = userSnap.data().bets || []
      const patched = legacy.map((b) => (b.id === betId ? { ...b, ...updatedData } : b))
      await updateDoc(userRef, { bets: patched })
    }

    return true
  } catch (err) {
    console.error("updateActiveBet failed:", err)
    throw err
  }
}

// ===== PROCESSED PLAYERS FUNCTIONS =====

// list all active players
export const getProcessedPlayers = async () => {
  try {
    const activeRef = collection(db, "processedPlayers", "players", "active")
    const snaps = await getDocs(activeRef)
    return snaps.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
  } catch (error) {
    console.error("Error getting processed players:", error)
    return []
  }
}

// get one by key ("first_last_threshold")
export const getProcessedPlayer = async (playerName, threshold) => {
  try {
    const key = playerName.toLowerCase().replace(/\s+/g, "_")
    const ref = doc(db, "processedPlayers", "players", "active", `${key}_${threshold}`)
    const snap = await getDoc(ref)
    return snap.exists() ? snap.data() : null
  } catch (error) {
    console.error("Error getting processed player:", error)
    return null
  }
}

// Clear out the old picks[] array on the user doc
export const clearUserPicks = async (userId) => {
  try {
    const userRef = doc(db, "users", userId)
    // remove any legacy picks[]
    await updateDoc(userRef, { picks: [] })
    return true
  } catch (error) {
    console.error("Error clearing user picks:", error)
    throw error
  }
}

// ===== MIGRATION FUNCTIONS =====

/**
 * Migrate user picks from full objects to document references
 */
export const migrateUserPicksToReferences = async (userId) => {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      console.log(`User ${userId} not found`)
      return { success: false, message: "User not found" }
    }

    const userData = userSnap.data()
    const picks = userData.picks || []

    if (picks.length === 0) {
      console.log(`No picks to migrate for user ${userId}`)
      return { success: true, message: "No picks to migrate" }
    }

    // Check if picks are already references
    if (picks.length > 0 && typeof picks[0].get === "function") {
      console.log(`Picks already migrated for user ${userId}`)
      return { success: true, message: "Picks already migrated" }
    }

    // Convert full objects to document references
    const pickReferences = picks.map((pick) => {
      return createPlayerDocumentReference(pick, true)
    })

    // Update user document with references
    await updateDoc(userRef, { picks: pickReferences })

    console.log(`Successfully migrated ${picks.length} picks for user ${userId}`)
    return {
      success: true,
      message: `Migrated ${picks.length} picks to document references`,
    }
  } catch (error) {
    console.error(`Error migrating picks for user ${userId}:`, error)
    return { success: false, message: error.message }
  }
}

/**
 * Migrate active bets from full objects to document references
 */
export const migrateActiveBetsToReferences = async (userId) => {
  try {
    const activeBetsRef = collection(db, "users", userId, "activeBets")
    const snap = await getDocs(activeBetsRef)

    if (snap.empty) {
      console.log(`No active bets to migrate for user ${userId}`)
      return { success: true, message: "No active bets to migrate" }
    }

    const batch = writeBatch(db)
    let migratedCount = 0

    for (const betDoc of snap.docs) {
      const betData = betDoc.data()
      const picks = betData.picks || []

      if (picks.length === 0) continue

      // Check if picks are already references
      if (typeof picks[0].get === "function") {
        console.log(`Bet ${betDoc.id} already migrated`)
        continue
      }

      // Convert picks to document references
      const pickReferences = picks.map((pick) => {
        return createPlayerDocumentReference(pick, true)
      })

      // Update bet document
      batch.update(betDoc.ref, { picks: pickReferences })
      migratedCount++
    }

    if (migratedCount > 0) {
      await batch.commit()
    }

    console.log(`Successfully migrated ${migratedCount} active bets for user ${userId}`)
    return {
      success: true,
      message: `Migrated ${migratedCount} active bets to document references`,
    }
  } catch (error) {
    console.error(`Error migrating active bets for user ${userId}:`, error)
    return { success: false, message: error.message }
  }
}

/**
 * Migrate bet history from full objects to document references
 */
export const migrateBetHistoryToReferences = async (userId) => {
  try {
    // For now, just migrate current month's history
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = String(now.getMonth() + 1).padStart(2, "0")

    const historyRef = collection(db, "users", userId, "betHistory", year, month)
    const snap = await getDocs(historyRef)

    if (snap.empty) {
      console.log(`No bet history to migrate for user ${userId}`)
      return { success: true, message: "No bet history to migrate" }
    }

    const batch = writeBatch(db)
    let migratedCount = 0

    for (const betDoc of snap.docs) {
      const betData = betDoc.data()
      const picks = betData.picks || []

      if (picks.length === 0) continue

      // Check if picks are already references
      if (typeof picks[0].get === "function") {
        console.log(`History bet ${betDoc.id} already migrated`)
        continue
      }

      // Convert picks to document references (concluded collection)
      const pickReferences = picks.map((pick) => {
        return createPlayerDocumentReference(pick, false) // false = concluded
      })

      // Update bet document
      batch.update(betDoc.ref, { picks: pickReferences })
      migratedCount++
    }

    if (migratedCount > 0) {
      await batch.commit()
    }

    console.log(`Successfully migrated ${migratedCount} history bets for user ${userId}`)
    return {
      success: true,
      message: `Migrated ${migratedCount} history bets to document references`,
    }
  } catch (error) {
    console.error(`Error migrating bet history for user ${userId}:`, error)
    return { success: false, message: error.message }
  }
}

/**
 * Migrate all user data to document references
 */
export const migrateUserToReferences = async (userId) => {
  try {
    console.log(`Starting migration for user ${userId}`)

    const results = {
      picks: await migrateUserPicksToReferences(userId),
      activeBets: await migrateActiveBetsToReferences(userId),
      betHistory: await migrateBetHistoryToReferences(userId),
    }

    const allSuccessful = Object.values(results).every((result) => result.success)

    return {
      success: allSuccessful,
      results,
    }
  } catch (error) {
    console.error(`Error migrating user ${userId}:`, error)
    return { success: false, message: error.message }
  }
}

// Initialize database with basic structure (run once)
export const initializeDatabase = async (userId) => {
  try {
    // Check if user already exists
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // Initialize user profile
      await setDoc(userRef, {
        profile: {
          username: userId,
          email: `${userId}@example.com`,
          displayName: userId,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          totalEarnings: 0,
          totalBets: 0,
          winCount: 0,
          lossCount: 0,
          winRate: 0,
        },
        picks: [], // Initialize as empty array for document references
      })

      // Initialize daily picks
      const today = new Date().toISOString().split("T")[0]
      await setDoc(doc(db, "users", userId, "dailyPicks", today), {
        picks: [],
      })

      console.log("User initialized successfully")
    } else {
      // Check if user has profile object
      const userData = userSnap.data()
      if (!userData.profile) {
        // Migrate user to new structure
        const profile = {
          username: userId,
          password: userData.password || "ramirez22",
          email: `${userId}@example.com`,
          displayName: userData.displayName || userId,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          totalEarnings: userData.totalEarnings || 0,
          totalBets: userData.totalBets || 0,
          winCount: userData.winCount || 0,
          lossCount: userData.totalBets ? userData.totalBets - userData.winCount : 0,
          winRate: userData.totalBets && userData.winCount ? (userData.winCount / userData.totalBets) * 100 : 0,
        }

        await updateDoc(userRef, { profile })
        console.log("User migrated to new structure")
      }

      // Migrate to document references if needed
      await migrateUserToReferences(userId)
    }
  } catch (error) {
    console.error("Error initializing user:", error)
  }
}

// Initialize user if needed
export const initializeUser = async (username, password) => {
  try {
    const userRef = doc(db, "users", username)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // Create new user with new structure
      await setDoc(userRef, {
        profile: {
          username: username,
          password: password,
          email: `${username}@example.com`,
          displayName: username,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          totalEarnings: 0,
          totalBets: 0,
          winCount: 0,
          lossCount: 0,
          winRate: 0,
        },
        picks: [], // Initialize as empty array for document references
        bets: [],
      })

      // Initialize daily picks
      const today = new Date().toISOString().split("T")[0]
      await setDoc(doc(db, "users", username, "dailyPicks", today), {
        picks: [],
      })
    } else {
      // Check if user has profile object
      const userData = userSnap.data()
      if (!userData.profile) {
        // Migrate user to new structure
        const profile = {
          username: username,
          password: password,
          email: `${username}@example.com`,
          displayName: userData.displayName || username,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          totalEarnings: userData.totalEarnings || 0,
          totalBets: userData.totalBets || 0,
          winCount: userData.winCount || 0,
          lossCount: userData.totalBets ? userData.totalBets - userData.winCount : 0,
          winRate: userData.totalBets && userData.winCount ? (userData.winCount / userData.totalBets) * 100 : 0,
        }

        await updateDoc(userRef, { profile })
      }

      // Migrate to document references if needed
      await migrateUserToReferences(username)
    }
  } catch (error) {
    console.error("Error initializing user:", error)
    throw error
  }
}

// ===== ADMIN FUNCTIONS =====

// Get admin credentials
export const getAdminCredentials = async () => {
  try {
    const adminRef = doc(db, "admin", "profile")
    const adminSnap = await getDoc(adminRef)

    if (adminSnap.exists()) {
      return adminSnap.data()
    } else {
      // Initialize admin profile if it doesn't exist
      const defaultAdmin = {
        username: "admin",
        password: "ramirez22",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }
      await setDoc(adminRef, defaultAdmin)
      return defaultAdmin
    }
  } catch (error) {
    console.error("Error getting admin credentials:", error)
    throw error
  }
}

// Verify admin password
export const verifyAdminPassword = (adminData, username, password) => {
  return adminData.username === username && adminData.password === password
}

// Get system overview data
export const getSystemOverview = async () => {
  try {
    // Get total users
    const usersSnap = await getDocs(collection(db, "users"))
    const totalUsers = usersSnap.size

    // Get active bets count
    let activeBets = 0
    for (const userDoc of usersSnap.docs) {
      const activeBetsSnap = await getDocs(collection(db, "users", userDoc.id, "activeBets"))
      activeBets += activeBetsSnap.size
    }

    // Get processed players count
    const processedPlayersSnap = await getDocs(collection(db, "processedPlayers", "players", "active"))
    const processedPlayers = processedPlayersSnap.size

    // Calculate total winnings (mock data for now)
    let totalWinnings = 0
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data()
      const profile = userData.profile || userData
      totalWinnings += profile.totalEarnings || 0
    }

    return {
      totalUsers,
      activeBets,
      processedPlayers,
      totalWinnings,
      apiRequests: 15420, // Mock data
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting system overview:", error)
    throw error
  }
}

// Get user analytics
export const getUserAnalytics = async (timeRange = "7d") => {
  try {
    const usersSnap = await getDocs(collection(db, "users"))

    // Mock data - in production, you'd calculate based on actual user activity
    return {
      activeUsers: usersSnap.size,
      avgSessionTime: "12m 34s",
      newSignups: 8,
      topPerformer: "bryanram",
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting user analytics:", error)
    throw error
  }
}

// Get bet performance data
export const getBetPerformance = async (timeRange = "30d") => {
  try {
    // Mock data - in production, you'd aggregate from actual bet history
    return {
      totalBets: 156,
      winRate: "68.2%",
      totalWinnings: 8450,
      roi: "142.3%",
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting bet performance:", error)
    throw error
  }
}

// Get player analytics
export const getPlayerAnalytics = async () => {
  try {
    const processedPlayersSnap = await getDocs(collection(db, "processedPlayers", "players", "active"))

    return {
      totalPlayers: processedPlayersSnap.size,
      avgHitRate: "76.3%",
      mostPopular: "LeBron James",
      avgThreshold: 27.2,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting player analytics:", error)
    throw error
  }
}

// Get financial metrics
export const getFinancialMetrics = async (timeRange = "30d") => {
  try {
    // Mock data - in production, you'd calculate from actual financial data
    return {
      totalRevenue: 12450,
      userWinnings: 8450,
      platformROI: "142.3%",
      avgBetSize: 85,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting financial metrics:", error)
    throw error
  }
}

// Get system health data
export const getSystemHealth = async () => {
  try {
    // Mock data - in production, you'd get from monitoring services
    return {
      apiResponseTime: "245ms",
      databasePerformance: "98.5%",
      cpuUsage: "34%",
      memoryUsage: "67%",
      networkLatency: "12ms",
      errorRate: "0.2%",
      uptime: "99.8%",
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting system health:", error)
    throw error
  }
}
