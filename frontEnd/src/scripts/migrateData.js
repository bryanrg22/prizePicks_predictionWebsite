import { db } from "../firebase"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from "firebase/firestore"

const migrateUserData = async () => {
  try {
    // Get the current user data
    const userId = "bryanram"
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data()

      // Skip if already migrated
      if (userData.profile) {
        console.log("User already migrated")
        return
      }

      // Create profile object from existing fields
      const profile = {
        username: userId,
        password: userData.password || "ramirez22",
        email: `${userId}@example.com`,
        displayName: userData.displayName || "Bryan Ramirez-Gonzalez",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        totalEarnings: userData.totalEarnings || 2916.25,
        totalBets: userData.totalBets || 9,
        winCount: userData.winCount || 9,
        lossCount: userData.totalBets ? userData.totalBets - userData.winCount : 0,
        winRate: userData.totalBets ? (userData.winCount / userData.totalBets) * 100 : 100,
      }

      // Update user document with profile object
      await updateDoc(userRef, { profile })

      // Migrate picks to dailyPicks subcollection if they exist
      if (userData.picks && userData.picks.length > 0) {
        const today = new Date().toISOString().split("T")[0]
        const picksRef = doc(db, "users", userId, "dailyPicks", today)

        // Convert picks to new format
        const newPicks = userData.picks.map((pick) => ({
          playerId: pick.id,
          playerName: pick.player,
          playerTeam: pick.team,
          playerTeamLogo: pick.teamLogo,
          opponent: pick.opponent,
          opponentLogo: pick.opponentLogo,
          gameDate: pick.gameDate,
          gameTime: pick.gameTime,
          threshold: pick.threshold,
          recommendation: pick.recommendation,
          confidence: pick.confidence,
          photoUrl: pick.photoUrl,
          addedAt: serverTimestamp(),
        }))

        await setDoc(picksRef, { picks: newPicks })
      }

      // Migrate active bets to activeBets subcollection if they exist
      if (userData.bets && userData.bets.length > 0) {
        const activeBets = userData.bets.filter((bet) => bet.status === "Active")

        for (const bet of activeBets) {
          const betRef = doc(collection(db, "users", userId, "activeBets"))

          // Convert bet to new format
          await setDoc(betRef, {
            betAmount: bet.betAmount,
            potentialWinnings: bet.potentialWinnings,
            createdAt: serverTimestamp(),
            gameDate: bet.gameDate || new Date().toISOString().split("T")[0],
            picks: bet.picks.map((pick) => ({
              playerId: pick.id || pick.player.toLowerCase().replace(/\s+/g, "_"),
              playerName: pick.player,
              playerTeam: pick.team,
              opponent: pick.opponent,
              threshold: pick.threshold,
              recommendation: pick.recommendation,
              photoUrl: pick.photoUrl,
              gameTime: pick.gameTime || "TBD",
            })),
          })
        }
      }

      // Migrate bet history to betHistory subcollection if they exist
      if (userData.bets && userData.bets.length > 0) {
        const historyBets = userData.bets.filter((bet) => bet.status !== "Active")

        if (historyBets.length > 0) {
          const now = new Date()
          const year = now.getFullYear().toString()
          const month = (now.getMonth() + 1).toString().padStart(2, "0")

          for (const bet of historyBets) {
            const betRef = doc(collection(db, "users", userId, "betHistory", year, month))

            // Convert bet to new format
            await setDoc(betRef, {
              betAmount: bet.betAmount,
              potentialWinnings: bet.potentialWinnings,
              createdAt: serverTimestamp(),
              gameDate: bet.gameDate || new Date().toISOString().split("T")[0],
              status: bet.status,
              winnings: bet.winnings || 0,
              settledAt: serverTimestamp(),
              picks: bet.picks.map((pick) => ({
                playerId: pick.id || pick.player.toLowerCase().replace(/\s+/g, "_"),
                playerName: pick.player,
                playerTeam: pick.team,
                opponent: pick.opponent,
                threshold: pick.threshold,
                recommendation: pick.recommendation,
                photoUrl: pick.photoUrl,
                actualPoints: pick.actual || 0,
                result: pick.result || "MISS",
              })),
            })
          }
        }
      }

      console.log("User data migrated successfully")
    } else {
      console.log("User does not exist")
    }
  } catch (error) {
    console.error("Error migrating user data:", error)
  }
}

// Run the migration
migrateUserData()

