import { db } from "../firebase"
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
  // 1) fetch user doc
  const userRef  = doc(db, "users", username)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return []

  const docId = pickData.id  // already "first_last_threshold"

  // 2) fetch that processedPlayer
  const ppRef  = doc(
    db,
    "processedPlayers", "players", "active",
    docId
  )
  const ppSnap = await getDoc(ppRef)
  if (!ppSnap.exists()) {
    throw new Error(`No processedPlayer at players/active/${docId}`)
  }
  const processedData = ppSnap.data()

  // 3) upsert into user.picks[]
  const picks = userSnap.data().picks || []
  const idx   = picks.findIndex(p => p.id === docId)
  const newPick = { id: docId, ...processedData }

  if (idx >= 0) picks[idx] = newPick
            else picks.push(newPick)

  await updateDoc(userRef, { picks })
  return picks
}

// remove a pick
export const removeUserPick = async (username, pickId) => {
  const userRef  = doc(db, "users", username)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return []

  const updated = (userSnap.data().picks || [])
                    .filter(p => p.id !== pickId)

  await updateDoc(userRef, { picks: updated })
  return updated
}

export const getUserPicks = async (username) => {
  const userRef  = doc(db, "users", username)
  const userSnap = await getDoc(userRef)
  return userSnap.exists() ? (userSnap.data().picks || []) : []
}

// Create a new bet
export const createBet = async (userId, betData) => {
  let gameDate = betData.gameDate || new Date().toISOString().substring(0,10)
  // normalize YYYY-MM-DD...
  const betsRef = collection(db, "users", userId, "activeBets")
  const docRef  = await addDoc(betsRef, {
    ...betData,
    gameDate,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

// ————— Active Bets —————
/**
 * Fetches all active bets for a user.
 * First tries the new sub-collection, then falls back to legacy `bets[]`.
 */
export const getActiveBets = async (userId) => {
  // 1) new sub-collection
  const snap = await getDocs(collection(db, "users", userId, "activeBets"))
  if (!snap.empty) {
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  // 2) legacy array on the user doc
  const userSnap = await getDoc(doc(db, "users", userId))
  if (!userSnap.exists()) return []
  const legacy = userSnap.data().bets || []
  return legacy.filter(b => b.status === "Active")
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
  const snap    = await getDocs(histRef)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Get all bet history (simplified for now)
export const getAllBetHistory = async (userId) => {
  const now = new Date()
  const y   = now.getFullYear().toString()
  const m   = String(now.getMonth()+1).padStart(2,"0")
  return await getBetHistory(userId, y, m)
}

// list all active players
export const getProcessedPlayers = async () => {
  const activeRef = collection(db, "processedPlayers", "players", "active")
  const snaps     = await getDocs(activeRef)
  return snaps.docs.map(docSnap => ({
    id:   docSnap.id,
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
  const userRef = doc(db, "users", userId);

  try {
    // 1) delete from subcollection
    if (betId) {
      await deleteDoc(doc(db, "users", userId, "activeBets", betId));
    } else {
      const activeBets = await getActiveBets(userId);
      await Promise.all(
        activeBets.map((b) =>
          deleteDoc(doc(db, "users", userId, "activeBets", b.id))
        )
      );
    }

    // 2) legacy fallback: remove from users/{userId}.bets[]
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const legacy = userSnap.data().bets || [];
      const filtered = legacy.filter((b) =>
        betId ? b.id !== betId : b.status !== "Active"
      );
      if (filtered.length !== legacy.length) {
        await updateDoc(userRef, { bets: filtered });
      }
    }

    return true;
  } catch (err) {
    console.error("cancelActiveBet failed:", err);
    throw err;
  }
};

// Update a single active bet
export const updateActiveBet = async (userId, betId, updatedData) => {
  const userRef = doc(db, "users", userId);

  try {
    // 1) sub‐collection update
    const betRef = doc(db, "users", userId, "activeBets", betId);
    await updateDoc(betRef, updatedData);

    // 2) legacy fallback: patch users/{userId}.bets[]
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const legacy = userSnap.data().bets || [];
      const patched = legacy.map((b) =>
        b.id === betId ? { ...b, ...updatedData } : b
      );
      await updateDoc(userRef, { bets: patched });
    }

    return true;
  } catch (err) {
    console.error("updateActiveBet failed:", err);
    throw err;
  }
};

// get one by key ("first_last_threshold")
export const getProcessedPlayer = async (playerName, threshold) => {
  const key = playerName.toLowerCase().replace(/\s+/g, "_")
  const ref = doc(
    db,
    "processedPlayers", "players", "active",
    `${key}_${threshold}`
  )
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

// Clear out the old picks[] array on the user doc
export const clearUserPicks = async (userId) => {
  const userRef = doc(db, "users", userId);
  // reset picks array to empty
  await updateDoc(userRef, { picks: [] });
};