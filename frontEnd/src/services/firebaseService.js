import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
  increment,
  deleteDoc,
  writeBatch,
} from "firebase/firestore"
import { db } from "../firebase"

// ===== HELPER FUNCTIONS FOR DOCUMENT REFERENCES =====
// Convert any flavour of gameDate into YYYYMMDD for IDs
const getDateSuffix = (pd) => {
  const raw = pd?.gameDate
  let d
  if (!raw) return null
  if (typeof raw?.toDate === "function")       d = raw.toDate()        // Firestore Timestamp
  else if (raw instanceof Date)                d = raw
  else                                          d = new Date(raw)       // 'YYYY‑MM‑DD' | 'MM/DD/YYYY'
  return isNaN(d) ? null : d.toISOString().slice(0, 10).replace(/-/g, "")
}

/**
 * Resolve a single document reference to full data
 */
const resolveDocumentReference = async (docRef) => {
  try {
    let actualRef = docRef

    if (typeof docRef === "string") {
      // Remove leading slash if present and convert to DocumentReference
      const cleanPath = docRef.startsWith("/") ? docRef.substring(1) : docRef
      actualRef = doc(db, cleanPath)
    } else if (!docRef || (!docRef.firestore && typeof docRef.get !== "function")) {
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
        } else if (ref && (ref.firestore || typeof ref.get === "function")) {
          // Check for Firestore DocumentReference objects
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
    if (typeof firstPick === "string" || (firstPick && (firstPick.firestore || typeof firstPick.get === "function"))) {
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

  // Better ID generation with multiple fallbacks
  let playerId = playerData.id || playerData.playerId

  if (!playerId) {
    // Generate ID from player name and threshold
    const playerName = playerData.playerName || playerData.name || playerData.player
    const threshold = playerData.threshold

    if (playerName && threshold !== undefined) {
      const datePart = getDateSuffix(playerData)
      playerId =
        `${playerName.toLowerCase().replace(/\s+/g, "_")}_${threshold}` +
        (datePart ? `_${datePart}` : "")
    } else {
      console.error("Cannot create document reference - missing player name or threshold:", playerData)
      throw new Error(`Invalid player data for document reference: missing name or threshold`)
    }
  }

  console.log("Creating document reference with ID:", playerId, "for collection:", collection)
  return doc(db, "processedPlayers", "players", collection, playerId)
}

/**
 * Get document reference path for migration
 */
const getDocumentReferencePath = (playerData, isActive = true) => {
  const collection = isActive ? "active" : "concluded"
  const playerName = playerData.playerName || playerData.name || playerData.player
  const threshold = playerData.threshold
  const datePart = getDateSuffix(playerData)
  const playerId = `${playerName.toLowerCase().replace(/\s+/g, "_")}_${threshold}${datePart ? "_" + datePart : ""}`

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

    // Enhanced: If pickData doesn't have gameDate, try to find the document with today's date
    let playerDocRef
    
    if (!pickData.gameDate) {
      console.log("No gameDate provided, trying to find document with current date...")
      
      // Try with today's date first
      const today = new Date()
      const enhancedPickData = {
        ...pickData,
        gameDate: today
      }
      
      playerDocRef = createPlayerDocumentReference(enhancedPickData, true)
      
      // Check if document exists with today's date
      let playerDocSnap = await getDoc(playerDocRef)
      
      if (!playerDocSnap.exists()) {
        console.log("Document not found with today's date, trying without date suffix...")
        
        // Fallback: try without date suffix (legacy support)
        const playerName = pickData.playerName || pickData.name || pickData.player
        const threshold = pickData.threshold
        const legacyId = `${playerName.toLowerCase().replace(/\s+/g, "_")}_${threshold}`
        
        playerDocRef = doc(db, "processedPlayers", "players", "active", legacyId)
        playerDocSnap = await getDoc(playerDocRef)
        
        if (!playerDocSnap.exists()) {
          // Try to find any document that matches the player and threshold pattern
          console.log("Searching for any matching document...")
          const activeRef = collection(db, "processedPlayers", "players", "active")
          const snapshot = await getDocs(activeRef)
          
          let foundDoc = null
          snapshot.forEach((doc) => {
            const docId = doc.id
            if (docId.startsWith(`${playerName.toLowerCase().replace(/\s+/g, "_")}_${threshold}`)) {
              foundDoc = doc
              playerDocRef = doc.ref
              console.log("Found matching document:", docId)
            }
          })
          
          if (!foundDoc) {
            throw new Error(`Player document not found for: ${playerName} ${threshold}. Available documents may use different naming convention.`)
          }
        }
      }
    } else {
      // Normal flow when gameDate is provided
      playerDocRef = createPlayerDocumentReference(pickData, true)
      
      // Verify the referenced document exists
      const playerDocSnap = await getDoc(playerDocRef)
      if (!playerDocSnap.exists()) {
        throw new Error(`Player document not found: ${playerDocRef.path}`)
      }
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
      if (!pickRef || (!pickRef.firestore && typeof pickRef.get !== "function")) return false

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
    console.log("Creating bet with data:", betData)
    const gameDate = betData.gameDate || new Date().toISOString().substring(0, 10)

    // Validate and prepare picks data
    const validatedPicks = betData.picks.map((pick, index) => {
      console.log(`Validating pick ${index}:`, pick)

      // Ensure we have required fields
      const playerName = pick.playerName || pick.name || pick.player
      const threshold = pick.threshold

      if (!playerName) {
        throw new Error(`Pick ${index} is missing player name`)
      }

      if (threshold === undefined || threshold === null) {
        throw new Error(`Pick ${index} is missing threshold`)
      }

      const datePart = getDateSuffix(pick)
      // (optional) only keep this if you need playerId later in this scope
      // const playerId =
      //   `${playerName.toLowerCase().replace(/\s+/g, "_")}_${threshold}` +
      //   (datePart ? `_${datePart}` : "")

      // Create a standardized pick object
      return {
        ...pick,
        playerName: playerName,
        name:       playerName,
        player:     playerName,
        threshold:  Number.parseFloat(threshold),
        id:
          pick.id ||
          pick.playerId ||
          `${playerName.toLowerCase().replace(/\s+/g, "_")}_${threshold}` +
            (datePart ? `_${datePart}` : ""),
      }
    })

    console.log("Validated picks:", validatedPicks)

    // Generate timestamp-based document ID in YYYYMMDDTHHMMSSZ format
    const now = new Date()
    const betId = now
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")

    console.log("Generated bet ID:", betId)

    // Convert picks to document references instead of storing full objects
    const pickReferences = validatedPicks.map((pick) => {
      console.log("Creating reference for pick:", pick)
      return createPlayerDocumentReference(pick, true)
    })

    console.log(
      "Created pick references:",
      pickReferences.map((ref) => ref.path),
    )

    // Create bet document with specific ID and document references
    const betRef = doc(db, "users", userId, "activeBets", betId)
    await setDoc(betRef, {
      betAmount: Number.parseFloat(betData.betAmount),
      betPayOut: Number.parseFloat(betData.betPayOut),
      bettingPlatform: betData.bettingPlatform || "PrizePicks",
      betType: betData.betType || "Power Play",
      picks: pickReferences, // Store document references instead of full objects
      createdAt: serverTimestamp(),
    })

    console.log("Successfully created bet with ID:", betId)
    return betId
  } catch (error) {
    console.error("Error creating bet:", error)
    throw error
  }
}

// Get active bets and resolve document references
export const getActiveBets = async (userId) => {
  try {
    console.log("Getting active bets for user:", userId)
    // Get from new sub-collection
    const snap = await getDocs(collection(db, "users", userId, "activeBets"))

    if (!snap.empty) {
      console.log("Found", snap.docs.length, "active bets")
      const bets = await Promise.all(
        snap.docs.map(async (betDoc) => {
          const betData = betDoc.data()
          console.log("Processing bet:", betDoc.id, "with picks:", betData.picks?.length || 0)

          // Resolve pick references to full data if they are references
          let resolvedPicks = []
          if (betData.picks && Array.isArray(betData.picks)) {
            // Check if picks are document references
            if (
              betData.picks.length > 0 &&
              (betData.picks[0].firestore || typeof betData.picks[0].get === "function")
            ) {
              console.log("Resolving document references for bet", betDoc.id)
              const rawResolvedPicks = await resolveDocumentReferences(betData.picks)

              // Transform the resolved picks to ensure proper field mapping
              resolvedPicks = rawResolvedPicks.map((pick) => ({
                id: pick.id,
                name: pick.name || pick.playerName || "Unknown Player",
                playerName: pick.name || pick.playerName || "Unknown Player",
                player: pick.name || pick.playerName || "Unknown Player",
                team: pick.team || pick.playerTeam || "Unknown Team",
                opponent: pick.opponent || "Unknown Opponent",
                threshold: pick.threshold || 0,
                recommendation: pick.betExplanation?.recommendation || pick.recommendation || "OVER",
                photoUrl: pick.photoUrl || "/placeholder.svg?height=40&width=40",
                gameStatus: pick.gameStatus || "Scheduled",
                status: pick.gameStatus || pick.status || "Scheduled",
                // Include all original data
                ...pick,
              }))
            } else if (
              betData.picks.length > 0 &&
              typeof betData.picks[0] === "object" &&
              betData.picks[0].playerName
            ) {
              // These are full objects (legacy or current format)
              console.log("Using full objects for bet", betDoc.id)
              resolvedPicks = betData.picks.map((pick) => ({
                id: pick.id,
                name: pick.name || pick.playerName || pick.player || "Unknown Player",
                playerName: pick.name || pick.playerName || pick.player || "Unknown Player",
                player: pick.name || pick.playerName || pick.player || "Unknown Player",
                team: pick.team || pick.playerTeam || "Unknown Team",
                opponent: pick.opponent || "Unknown Opponent",
                threshold: pick.threshold || 0,
                recommendation: pick.betExplanation?.recommendation || pick.recommendation || "OVER",
                photoUrl: pick.photoUrl || "/placeholder.svg?height=40&width=40",
                gameStatus: pick.gameStatus || "Scheduled",
                status: pick.gameStatus || pick.status || "Scheduled",
                // Include all original data
                ...pick,
              }))
            }
          }

          console.log("Resolved", resolvedPicks.length, "picks for bet", betDoc.id)
          console.log("Sample resolved pick:", resolvedPicks[0])

          return {
            id: betDoc.id,
            ...betData,
            picks: resolvedPicks,
          }
        }),
      )

      console.log("Returning", bets.length, "formatted active bets")
      return bets
    }

    console.log("No active bets found in sub-collection, checking legacy structure")
    // Fallback to old array structure
    const userSnap = await getDoc(doc(db, "users", userId))
    if (!userSnap.exists()) {
      console.log("User document not found")
      return []
    }

    const legacyBets = (userSnap.data().bets || []).filter((b) => b.status === "Active")
    console.log("Found", legacyBets.length, "legacy active bets")
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
          if (betData.picks.length > 0 && (betData.picks[0].firestore || typeof betData.picks[0].get === "function")) {
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

// Cancel one or all active bets - ONLY DELETE, DO NOT CREATE HISTORY
export const cancelActiveBet = async (userId, betId) => {
  try {
    console.log(`🚫 CANCELING BET: ${betId} for user: ${userId}`)
    console.log("⚠️  This should ONLY delete from activeBets, NO betHistory creation")

    // 1) Delete from subcollection - this is the ONLY action for cancellation
    if (betId) {
      const betRef = doc(db, "users", userId, "activeBets", betId)
      console.log(`Deleting bet document: ${betRef.path}`)
      await deleteDoc(betRef)
      console.log(`✅ Successfully deleted bet ${betId} from activeBets`)
    } else {
      // Cancel all active bets
      const activeBets = await getActiveBets(userId)
      console.log(`Deleting ${activeBets.length} active bets`)
      await Promise.all(
        activeBets.map((b) => {
          const betRef = doc(db, "users", userId, "activeBets", b.id)
          console.log(`Deleting bet document: ${betRef.path}`)
          return deleteDoc(betRef)
        }),
      )
      console.log(`✅ Successfully deleted all ${activeBets.length} active bets`)
    }

    // 2) Legacy fallback: remove from users/{userId}.bets[] array if it exists
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      const legacy = userSnap.data().bets || []
      const filtered = legacy.filter((b) => (betId ? b.id !== betId : b.status !== "Active"))
      if (filtered.length !== legacy.length) {
        await updateDoc(userRef, { bets: filtered })
        console.log("✅ Updated legacy bets array")
      }
    }

    console.log("🎉 Bet cancellation completed - NO betHistory should be created")
    return true
  } catch (err) {
    console.error("❌ cancelActiveBet failed:", err)
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
export const getProcessedPlayer = async (playerName, threshold, gameDate = null) => {
  try {
    const key = playerName.toLowerCase().replace(/\s+/g, "_")
    
    // If gameDate is provided, use it; otherwise try to get current date
    let datePart = null
    if (gameDate) {
      datePart = getDateSuffix({ gameDate })
    } else {
      // Try without date first (legacy support)
      const legacyRef = doc(db, "processedPlayers", "players", "active", `${key}_${threshold}`)
      const legacySnap = await getDoc(legacyRef)
      if (legacySnap.exists()) {
        return legacySnap.data()
      }
      
      // If legacy doesn't exist, try with today's date
      const today = new Date()
      datePart = getDateSuffix({ gameDate: today })
    }
    
    const playerId = `${key}_${threshold}${datePart ? "_" + datePart : ""}`
    const ref = doc(db, "processedPlayers", "players", "active", playerId)
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
    if (picks.length > 0 && (picks[0].firestore || typeof picks[0].get === "function")) {
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
      if (picks[0].firestore || typeof picks[0].get === "function") {
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
      if (picks[0].firestore || typeof picks[0].get === "function") {
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