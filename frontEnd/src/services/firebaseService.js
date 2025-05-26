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
} from "firebase/firestore"
import { db } from "../firebase"

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

// add or update a pick in users/{username}.picks[]
export const addUserPick = async (username, pickData) => {
  if (typeof pickData?.id !== "string") {
    throw new Error("Invalid pickData.id — must be a string")
  }

  const userRef = doc(db, "users", username)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return []

  // sanitize — drop anything that isn't JSON‐serializable
  const sanitizedPick = JSON.parse(JSON.stringify(pickData))

  // pull the existing array (or start fresh)
  const existingPicks = Array.isArray(userSnap.data().picks) ? userSnap.data().picks : []

  // upsert
  const idx = existingPicks.findIndex((p) => p.id === sanitizedPick.id)
  if (idx >= 0) existingPicks[idx] = sanitizedPick
  else existingPicks.push(sanitizedPick)

  await updateDoc(userRef, { picks: existingPicks })
  return existingPicks
}

// remove a pick
export const removeUserPick = async (username, pickId) => {
  const userRef = doc(db, "users", username)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return []

  const updated = (userSnap.data().picks || []).filter((p) => p.id !== pickId)

  await updateDoc(userRef, { picks: updated })
  return updated
}

export const getUserPicks = async (username) => {
  const userRef = doc(db, "users", username)
  const userSnap = await getDoc(userRef)
  return userSnap.exists() ? userSnap.data().picks || [] : []
}

// Create a new bet
export const createBet = async (userId, betData) => {
  const gameDate = betData.gameDate || new Date().toISOString().substring(0, 10)
  // normalize YYYY-MM-DD...
  const betsRef = collection(db, "users", userId, "activeBets")
  const docRef = await addDoc(betsRef, {
    ...betData,
    gameDate,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

/**
 * Active Bets helper — make sure this is exported
 */
export const getActiveBets = async (userId) => {
  // first try the new sub-collection…
  const snap = await getDocs(collection(db, "users", userId, "activeBets"))
  if (!snap.empty) {
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }
  // …fallback to the old array
  const userSnap = await getDoc(doc(db, "users", userId))
  if (!userSnap.exists()) return []
  return (userSnap.data().bets || []).filter((b) => b.status === "Active")
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

// Get user's bet history for a specific year and month
export const getBetHistory = async (userId, year, month) => {
  const histRef = collection(db, "users", userId, "betHistory", year, month)
  const snap = await getDocs(histRef)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Get all bet history (simplified for now)
export const getAllBetHistory = async (userId) => {
  const now = new Date()
  const y = now.getFullYear().toString()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  return await getBetHistory(userId, y, m)
}

// list all active players
export const getProcessedPlayers = async () => {
  const activeRef = collection(db, "processedPlayers", "players", "active")
  const snaps = await getDocs(activeRef)
  return snaps.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
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

// get one by key ("first_last_threshold")
export const getProcessedPlayer = async (playerName, threshold) => {
  const key = playerName.toLowerCase().replace(/\s+/g, "_")
  const ref = doc(db, "processedPlayers", "players", "active", `${key}_${threshold}`)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

// Clear out the old picks[] array on the user doc
export const clearUserPicks = async (userId) => {
  const userRef = doc(db, "users", userId)
  // remove any legacy picks[]
  await updateDoc(userRef, { picks: [] })
  return true
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