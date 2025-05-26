import { doc, getDoc, setDoc, serverTimestamp, getDocs, collection } from "firebase/firestore"
import { db } from "../firebase"

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
