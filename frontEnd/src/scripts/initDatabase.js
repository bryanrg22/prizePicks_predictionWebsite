import { db } from "../firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

const initializeDatabase = async () => {
  try {
    // Check if user already exists
    const userId = "bryanram"
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // Initialize user profile
      await setDoc(userRef, {
        profile: {
          username: "bryanram",
          password: "ramirez22", // In production, use Firebase Auth
          email: "bryan@example.com",
          displayName: "Bryan Ramirez",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          totalEarnings: 2916.25,
          totalBets: 42,
          winCount: 28,
          lossCount: 14,
          winRate: 66.7,
        },
      })

      // Initialize admin stats
      await setDoc(doc(db, "admin", "stats"), {
        totalUsers: 1,
        totalBets: 42,
        totalBetAmount: 4200,
        platformRevenue: 840,
        activeBets: 1,
      })

      // Initialize admin userList
      await setDoc(doc(db, "admin", "userList", "users", userId), {
        username: "bryanram",
        totalBets: 42,
        activeBets: 1,
        totalEarnings: 2916.25,
        lastActive: serverTimestamp(),
      })

      console.log("Database initialized successfully")
    } else {
      console.log("User already exists, skipping initialization")
    }
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}

// Run the initialization
initializeDatabase()

