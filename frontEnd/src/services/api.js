// API service for interacting with the Python backend

// Analyze player
export const analyzePlayer = async (playerName, threshold) => {
  try {
    // Convert threshold to a number if it's a string and not empty
    const numericThreshold = threshold ? Number.parseFloat(threshold) : null

    console.log("Sending to API:", { playerName, threshold: numericThreshold })

    const response = await fetch(`/api/player`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerName,
        threshold: numericThreshold, // Send as a number, not a string
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API Error: ${response.status}`)
    }

    const playerData = await response.json()

    // Handle the new data structure
    if (playerData.nba_player_id && !playerData.playerId) {
      playerData.playerId = playerData.nba_player_id
    }

    if (playerData.playerName && !playerData.name) {
      playerData.name = playerData.playerName
    }

    // Ensure we have a team and opponent for UI components that expect it
    if (!playerData.team) {
      playerData.team = "Unknown Team"
    }

    if (!playerData.opponent) {
      playerData.opponent = "Unknown Opponent"
    }

    // Add fallback for images in case they're not available
    if (!playerData.photoUrl) {
      playerData.photoUrl = "/placeholder.svg?height=200&width=200"
    }

    if (!playerData.teamLogo) {
      playerData.teamLogo = "/placeholder.svg?height=40&width=40"
    }

    if (!playerData.opponentLogo) {
      playerData.opponentLogo = "/placeholder.svg?height=40&width=40"
    }

    // Add playerId if not present
    if (!playerData.playerId) {
      playerData.playerId = playerName.toLowerCase().replace(/\s+/g, "_")
    }

    // Format last 5 games to include opponent logos if not present
    if (playerData.last5Games) {
      playerData.last5Games = playerData.last5Games.map((game) => ({
        ...game,
        opponentLogo: game.opponentLogo || "/placeholder.svg?height=20&width=20",
        opponentFullName: game.opponentFullName || game.opponent, // Ensure full team name is available
      }))
    }

    // Add home/away average if not present
    if (!playerData.homeAwgAvg) {
      playerData.homeAwgAvg = playerData.seasonAvgPoints || 0
    }

    // Ensure game date is in YYYY-MM-DD format
    if (
      playerData.gameDate &&
      typeof playerData.gameDate === "string" &&
      !playerData.gameDate.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      const dateObj = new Date(playerData.gameDate)
      if (!isNaN(dateObj.getTime())) {
        playerData.gameDate = dateObj.toISOString().split("T")[0]
      }
    }
    

    console.log("Player data received:", playerData)
    return playerData
  } catch (error) {
    console.error("Error analyzing player:", error)
    throw error
  }
}
