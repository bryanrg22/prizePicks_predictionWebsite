import { db } from "../firebase"
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  collectionGroup,
  addDoc,
  getDocs,
  serverTimestamp,
  increment,
  deleteDoc,
} from "firebase/firestore"

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


// Add a pick to user's picks (legacy)
export const addUserPick = async (username, pickData) => {
  try {
    const userRef  = doc(db, "users", username)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) return []

    // new: pickData.id already === "<player>_<threshold>"
    const docId = pickData.id;
    
    const ppRef = doc(db, "processedPlayers", "active", "thresholds", docId)

    const ppSnap    = await getDoc(ppRef)
    if (!ppSnap.exists()) {
      throw new Error(`No processedPlayer at players/active/${docId}`);
    }
    // just grab the whole document
    const processedData = ppSnap.data()

    // Upsert into users/{username}.picks[]
    const picks = userSnap.data().picks || []
    // use the same <player>_<threshold> as the ID
    const newPick = { id: docId, ...processedData }
    const idx = picks.findIndex((p) => p.id === docId)
    if (idx >= 0) picks[idx] = newPick
    else           picks.push(newPick)

    await updateDoc(userRef, { picks })
    return picks

  } catch (error) {
    console.error("Error adding pick:", error)
    throw error
  }
}

// Remove a pick from user's picks (legacy)
export const removeUserPick = async (username, pickId) => {
  try {
    const userRef  = doc(db, "users", username)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) return []

    const picks = userSnap.data().picks || []
    const updated = picks.filter((p) => p.id !== pickId)
    await updateDoc(userRef, { picks: updated })
    return updated
  } catch (error) {
    console.error("Error removing pick:", error)
    throw error
  }
}

export const getUserPicks = async (username) => {
  try {
    const userRef  = doc(db, "users", username)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) return []

    // Directly return the picks array from the user doc
    return userSnap.data().picks || []
  } catch (error) {
    console.error("Error getting picks:", error)
    throw error
  }
}

// Clear user's picks (legacy)
export const clearUserPicks = async (username) => {
  try {
    // Clear from old structure
    const userRef = doc(db, "users", username)
    await updateDoc(userRef, { picks: [] })

    // Also clear from daily picks if the new structure exists
    const today = new Date().toISOString().split("T")[0]
    await clearDailyPicks(username, today)
  } catch (error) {
    console.error("Error clearing picks:", error)
    throw error
  }
}

// ===== ACTIVE BETS FUNCTIONS =====

// Get user's active bets
export const getActiveBets = async (userId) => {
  try {
    // Try to get from new structure first
    const betsRef = collection(db, "users", userId, "activeBets")
    const betsSnap = await getDocs(betsRef)

    if (!betsSnap.empty) {
      const bets = []
      betsSnap.forEach((doc) => {
        bets.push({
          id: doc.id,
          ...doc.data(),
        })
      })
      return bets
    }

    // Fall back to old structure
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data()
      const bets = userData.bets || []
      return bets.filter((bet) => bet.status === "Active")
    }

    return []
  } catch (error) {
    console.error("Error getting active bets:", error)
    throw error
  }
}

// Create a new bet
export const createBet = async (userId, betData) => {
  try {
    // Ensure gameDate is properly formatted as YYYY-MM-DD
    let formattedGameDate = betData.gameDate

    // If it's not already a string in YYYY-MM-DD format
    if (formattedGameDate) {
      if (typeof formattedGameDate === "string" && !formattedGameDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Try to parse and format the date
        const dateObj = new Date(formattedGameDate)
        if (!isNaN(dateObj.getTime())) {
          // Format as YYYY-MM-DD
          formattedGameDate = dateObj.toISOString().split("T")[0]
        }
      } else if (formattedGameDate instanceof Date) {
        // Convert Date object to YYYY-MM-DD string
        formattedGameDate = formattedGameDate.toISOString().split("T")[0]
      }
    } else {
      // Default to today if no date provided
      formattedGameDate = new Date().toISOString().split("T")[0]
    }

    console.log(`Creating bet with formatted game date: ${formattedGameDate}`)

    // Create new bet in the activeBets collection
    const betsRef = collection(db, "users", userId, "activeBets")
    const docRef = await addDoc(betsRef, {
      betAmount: betData.betAmount,
      potentialWinnings: betData.potentialWinnings,
      createdAt: serverTimestamp(),
      gameDate: formattedGameDate,
      bettingPlatform: betData.bettingPlatform || "PrizePicks",
      betType: betData.betType || "Power Play",
      picks: betData.picks,
    })

    console.log(`Created new active bet with ID: ${docRef.id}`)

    // IMPORTANT: Do NOT update the old structure to avoid duplicate bets
    // The old structure is only used for backward compatibility when reading

    return docRef.id
  } catch (error) {
    console.error("Error creating bet:", error)
    throw error
  }
}

// Add a function to move a bet from active to history when it's completed
export const completeBet = async (userId, betId, result, actualPoints) => {
  try {
    // Get the active bet
    const betRef = doc(db, "users", userId, "activeBets", betId)
    const betSnap = await getDoc(betRef)

    if (!betSnap.exists()) {
      throw new Error(`Bet with ID ${betId} not found`)
    }

    const betData = betSnap.data()

    // Calculate if the bet was won or lost
    const allPicks = betData.picks || []
    const picksWithResults = allPicks.map((pick, index) => {
      const actualPoint = actualPoints[index] || 0
      const result =
        pick.recommendation === "OVER"
          ? actualPoint > pick.threshold
            ? "HIT"
            : "MISS"
          : actualPoint < pick.threshold
            ? "HIT"
            : "MISS"

      return {
        ...pick,
        actualPoints: actualPoint,
        result,
      }
    })

    // For Power Play, all picks must hit to win
    // For FlexPlay, calculate partial winnings based on how many picks hit
    let status = "Lost"
    let winnings = 0

    if (betData.betType === "Power Play" || betData.betType === "Standard") {
      // All picks must hit
      const allHit = picksWithResults.every((pick) => pick.result === "HIT" || pick.result === "DNP")
      if (allHit) {
        status = "Won"
        winnings = betData.potentialWinnings
      }
    } else {
      // FlexPlay or Flex - partial winnings possible
      const hitCount = picksWithResults.filter((pick) => pick.result === "HIT").length
      const totalPicks = picksWithResults.length

      if (hitCount > 0) {
        status = "Won"
        // Calculate partial winnings based on the platform and number of hits
        if (betData.bettingPlatform === "PrizePicks") {
          // PrizePicks FlexPlay rules
          if (totalPicks === 3) {
            if (hitCount === 3) winnings = betData.potentialWinnings
            else if (hitCount === 2) winnings = betData.betAmount * 1.5
          } else if (totalPicks === 4) {
            if (hitCount === 4) winnings = betData.potentialWinnings
            else if (hitCount === 3) winnings = betData.betAmount * 2
            else if (hitCount === 2) winnings = betData.betAmount * 0.4
          } else if (totalPicks === 5) {
            if (hitCount === 5) winnings = betData.potentialWinnings
            else if (hitCount === 4) winnings = betData.betAmount * 2.5
            else if (hitCount === 3) winnings = betData.betAmount * 0.4
          }
        } else {
          // Default flex rules
          winnings = betData.potentialWinnings * (hitCount / totalPicks)
        }
      }
    }

    // Get current date for organizing bet history
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = (now.getMonth() + 1).toString().padStart(2, "0")

    // Add to bet history
    const historyRef = doc(db, "users", userId, "betHistory", year, month, betId)
    await setDoc(historyRef, {
      ...betData,
      id: betId,
      status,
      winnings,
      picks: picksWithResults,
      settledAt: serverTimestamp(),
    })

    // Delete from active bets
    await deleteDoc(betRef)

    // Update user stats
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data()

      if (userData.profile) {
        // New structure
        await updateDoc(userRef, {
          "profile.totalEarnings": increment(winnings),
          "profile.winCount": status === "Won" ? increment(1) : increment(0),
          "profile.lossCount": status === "Lost" ? increment(1) : increment(0),
        })
      } else {
        // Old structure
        await updateDoc(userRef, {
          totalEarnings: increment(winnings),
          winCount: status === "Won" ? increment(1) : increment(0),
        })
      }
    }

    return { status, winnings }
  } catch (error) {
    console.error("Error completing bet:", error)
    throw error
  }
}

// Remove the createUserBet function or make it call createBet
export const createUserBet = async (username, betData) => {
  // Just call createBet to avoid duplication
  return await createBet(username, betData)
}

// Get user's active bets (legacy)
export const getUserActiveBets = async (username) => {
  return await getActiveBets(username)
}

// ===== BET HISTORY FUNCTIONS =====

// Get user's bet history for a specific year and month
export const getBetHistory = async (userId, year, month) => {
  try {
    const historyRef = collection(db, "users", userId, "betHistory", year, month)
    const historySnap = await getDocs(historyRef)

    if (!historySnap.empty) {
      const bets = []
      historySnap.forEach((doc) => {
        bets.push({
          id: doc.id,
          ...doc.data(),
        })
      })
      return bets
    }

    return []
  } catch (error) {
    console.error("Error getting bet history:", error)
    throw error
  }
}

// Get all bet history (simplified for now)
export const getAllBetHistory = async (userId) => {
  try {
    // Try new structure first
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = (now.getMonth() + 1).toString().padStart(2, "0")

    let historyBets = []
    try {
      historyBets = await getBetHistory(userId, year, month)
    } catch (error) {
      console.error("Error getting bet history from new structure:", error)
    }

    if (historyBets && historyBets.length > 0) {
      return historyBets
    }

    // Fall back to old structure
    try {
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        const bets = userData.bets || []
        return bets.filter((bet) => bet.status !== "Active")
      }
    } catch (error) {
      console.error("Error getting bet history from old structure:", error)
    }

    return []
  } catch (error) {
    console.error("Error getting all bet history:", error)
    return []
  }
}

// Get user's bet history (legacy)
export const getUserBetHistory = async (username) => {
  return await getAllBetHistory(username)
}






// Get all processed players from the top‐level processedPlayers collection
export const getProcessedPlayers = async () => {
    // now stored under processedPlayers → players → active
    const activeRef = collection(db, "processedPlayers", "active", "thresholds")
    const snaps     = await getDocs(activeRef)
    return snaps.docs.map(docSnap => ({
      id:   docSnap.id,
      ...docSnap.data(),
    }))
  }

// ===== INITIALIZATION FUNCTIONS =====

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
        picks: [],
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
    }
  } catch (error) {
    console.error("Error initializing user:", error)
    throw error
  }
}

// Update the cancelActiveBet function to handle all entries at once
export const cancelActiveBet = async (userId, betId) => {
  try {
    if (betId) {
      console.log(`Attempting to cancel active bet: ${betId} for user: ${userId}`)

      // Delete the specific bet from the activeBets collection
      const betRef = doc(db, "users", userId, "activeBets", betId)
      await deleteDoc(betRef)
      console.log(`Deleted active bet: ${betId}`)

      // Also update old structure for backward compatibility
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        const bets = userData.bets || []

        // Filter out the specific bet
        const updatedBets = bets.filter((bet) => bet.id !== betId)

        // Update user document
        await updateDoc(userRef, { bets: updatedBets })
        console.log("Updated bets in old structure")
      }
    } else {
      console.log(`Attempting to cancel all active bets for user: ${userId}`)

      // Get all active bets
      const activeBets = await getActiveBets(userId)
      console.log(`Found ${activeBets.length} active bets`)

      // Delete all active bets from the activeBets collection
      for (const bet of activeBets) {
        try {
          const betRef = doc(db, "users", userId, "activeBets", bet.id)
          await deleteDoc(betRef)
          console.log(`Deleted active bet: ${bet.id}`)
        } catch (error) {
          console.error(`Error deleting bet ${bet.id}:`, error)
        }
      }

      // Also update old structure for backward compatibility
      const userRef = doc(db, "users", userId)
      const userSnapshot = await getDoc(userRef)

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data()
        const bets = userData.bets || []
        console.log(`Found ${bets.length} bets in old structure`)

        // Filter out all active bets
        const updatedBets = bets.filter((bet) => bet.status !== "Active")
        console.log(`After filtering, ${updatedBets.length} bets remain`)

        // Update user document
        await updateDoc(userRef, { bets: updatedBets })
        console.log("Updated bets in old structure")
      }
    }

    console.log("Active bet(s) successfully canceled")
    return true
  } catch (error) {
    console.error("Error canceling bets:", error)
    throw error
  }
}

// Update an existing active bet
export const updateActiveBet = async (userId, betId, updatedData) => {
  try {
    console.log(`Updating active bet: ${betId} for user: ${userId}`)

    // Update the bet in the activeBets collection
    const betRef = doc(db, "users", userId, "activeBets", betId)
    await updateDoc(betRef, updatedData)

    // Also update in old structure for backward compatibility
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data()
      const bets = userData.bets || []

      // Find and update the specific bet
      const updatedBets = bets.map((bet) => {
        if (bet.id === betId) {
          return { ...bet, ...updatedData }
        }
        return bet
      })

      // Update user document
      await updateDoc(userRef, { bets: updatedBets })
    }

    console.log(`Active bet ${betId} successfully updated`)
    return true
  } catch (error) {
    console.error("Error updating bet:", error)
    throw error
  }
}

// Function to move completed bets from active to history
export const moveCompletedBets = async (userId) => {
  try {
    const currentDate = new Date()
    // Set time to beginning of day for proper comparison
    currentDate.setHours(0, 0, 0, 0)

    console.log(`Current date for comparison: ${currentDate.toISOString()}`)

    // Get all active bets
    const activeBetsRef = collection(db, "users", userId, "activeBets")
    const activeBetsSnap = await getDocs(activeBetsRef)

    if (activeBetsSnap.empty) {
      return { moved: 0 }
    }

    let movedCount = 0

    // Process each active bet
    for (const betDoc of activeBetsSnap.docs) {
      const betData = betDoc.data()

      // Check if the game date has passed
      let gameDate = null

      if (betData.gameDate) {
        // Parse the game date string into a Date object
        if (typeof betData.gameDate === "string") {
          // Fix: Ensure proper date parsing with timezone handling
          const [year, month, day] = betData.gameDate.split("-").map(Number)
          if (year && month && day) {
            // Create date with local timezone (month is 0-indexed in JS Date)
            gameDate = new Date(year, month - 1, day)
            // Set time to end of day for proper comparison
            gameDate.setHours(23, 59, 59, 999)
          } else {
            console.log(`Invalid date format for bet ${betDoc.id}: ${betData.gameDate}`)
            continue
          }
        } else if (betData.gameDate.seconds) {
          // Handle Firestore Timestamp
          gameDate = new Date(betData.gameDate.seconds * 1000)
        }
      }

      console.log(`Bet ID: ${betDoc.id}, Game date: ${gameDate ? gameDate.toISOString() : "undefined"}`)

      // Only move bets where the game date is in the past
      if (gameDate && gameDate < currentDate) {
        console.log(`Moving bet ${betDoc.id} to history - game date has passed`)

        // Game has been played, move to history

        // For this example, we'll set a random outcome
        // In a real app, you would fetch actual results
        const allPicks = betData.picks || []
        const picksWithResults = allPicks.map((pick) => {
          const actualPoint = Math.floor(Math.random() * 30) + 5 // Random points between 5-35
          const result =
            pick.recommendation === "OVER"
              ? actualPoint > pick.threshold
                ? "HIT"
                : "MISS"
              : actualPoint < pick.threshold
                ? "HIT"
                : "MISS"

          return {
            ...pick,
            actualPoints: actualPoint,
            result,
          }
        })

        // Determine if bet was won or lost
        const allHit = picksWithResults.every((pick) => pick.result === "HIT" || pick.result === "DNP")
        const status = allHit ? "Won" : "Lost"
        const winnings = allHit ? betData.potentialWinnings : 0

        // Get current date for organizing bet history
        const now = new Date()
        const year = now.getFullYear().toString()
        const month = (now.getMonth() + 1).toString().padStart(2, "0")

        // Add to bet history
        const historyRef = doc(db, "users", userId, "betHistory", year, month, betDoc.id)
        await setDoc(historyRef, {
          ...betData,
          id: betDoc.id,
          status,
          winnings,
          picks: picksWithResults,
          settledAt: serverTimestamp(),
        })

        // Delete from active bets
        await deleteDoc(betDoc.ref)

        // Update user stats
        const userRef = doc(db, "users", userId)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const userData = userSnap.data()

          if (userData.profile) {
            // New structure
            await updateDoc(userRef, {
              "profile.totalEarnings": increment(winnings),
              "profile.winCount": status === "Won" ? increment(1) : increment(0),
              "profile.lossCount": status === "Lost" ? increment(1) : increment(0),
            })
          } else {
            // Old structure
            await updateDoc(userRef, {
              totalEarnings: increment(winnings),
              winCount: status === "Won" ? increment(1) : increment(0),
            })
          }
        }

        movedCount++
      } else {
        console.log(`Keeping bet ${betDoc.id} active - game date is in the future or undefined`)
      }
    }

    return { moved: movedCount }
  } catch (error) {
    console.error("Error moving completed bets:", error)
    return { moved: 0, error: error.message }
  }
}

export async function getProcessedPlayer(playerName, threshold) {
  try {
    const playerKey = playerName
      .toLowerCase()
      .replace(/\s+/g, "_");

    const ref = doc(db, "processedPlayers", "active", "thresholds", `${playerKey}_${threshold}`)
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("getProcessedPlayer failed:", err);
    throw err;
  }
}