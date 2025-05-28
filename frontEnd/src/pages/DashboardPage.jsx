"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Lock, Trash2 } from "lucide-react"
import AppLayout from "../components/AppLayout"
import BetSlip from "../components/BetSlip"
import BetConfirmation from "../components/BetConfirmation"
import ActiveBet from "../components/ActiveBet"
import PlayerStatsModal from "../components/PlayerStatsModal"
import EditBetModal from "../components/EditBetModal"
import ScreenshotUploader from "../components/ScreenshotUploader"
import PlayerAnalysisDashboard from "../components/PlayerAnalysisDashboard"
import PlayerAnalysisSearch from "../components/PlayerAnalysisSearch"
import moment from "moment"
import {
  getUserProfile,
  getActiveBets,
  createBet,
  getAllBetHistory,
  getUserPicks,
  addUserPick,
  removeUserPick,
  clearUserPicks,
  cancelActiveBet,
  updateActiveBet,
  moveCompletedBets,
  getUserBets,
  lockInPicks,
} from "../services/firebaseService"

export default function DashboardPage() {
  const [playerName, setPlayerName] = useState("")
  const [pointsThreshold, setPointsThreshold] = useState("")
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [picks, setPicks] = useState([])
  const [showBetSlip, setShowBetSlip] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [betAmount, setBetAmount] = useState("")
  const [potentialWinnings, setPotentialWinnings] = useState("")
  const [selectedPicks, setSelectedPicks] = useState([])
  const [picksLoading, setPicksLoading] = useState(true)
  const navigate = useNavigate()

  const [userProfile, setUserProfile] = useState(null)
  const [activeBets, setActiveBets] = useState([])
  const [betHistory, setBetHistory] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [editingBet, setEditingBet] = useState(null)
  const [error, setError] = useState(null)
  const [mockPlayerData, setMockPlayerData] = useState(null)

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0]

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current user from sessionStorage
        const userId = sessionStorage.getItem("currentUser")
        if (!userId) {
          console.error("No user logged in")
          navigate("/")
          return
        }

        setCurrentUser(userId)

        try {
          // Get user profile
          const profile = await getUserProfile(userId)
          if (!profile) {
            console.error("User profile not found")
            navigate("/")
            return
          }
          setUserProfile(profile)
        } catch (profileError) {
          console.error("Error loading user profile:", profileError)
        }

        try {
          setPicksLoading(true)
          const legacyPicks = await getUserPicks(userId)
          console.log("Loaded picks:", legacyPicks) // Add this log
          setPicks(legacyPicks || [])
        } catch (picksError) {
          console.error("Error loading picks:", picksError)
          setError("Failed to load your picks. Please try refreshing the page.")
        } finally {
          setPicksLoading(false)
        }

        try {
          // Get active bets
          const bets = await getActiveBets(userId)
          setActiveBets(bets || [])
        } catch (betsError) {
          console.error("Error loading active bets:", betsError)
          setActiveBets([])
        }

        try {
          // Move completed bets from active to history
          const moveResult = await moveCompletedBets(userId)
          if (moveResult.moved > 0) {
            console.log(`Moved ${moveResult.moved} completed bets to history`)

            // Refresh active bets and bet history after moving
            const updatedActiveBets = await getActiveBets(userId)
            setActiveBets(updatedActiveBets || [])

            const updatedHistory = await getAllBetHistory(userId)
            setBetHistory(updatedHistory || [])
          }
        } catch (moveError) {
          console.error("Error moving completed bets:", moveError)
        }

        try {
          // Get bet history
          const history = await getAllBetHistory(userId)
          setBetHistory(history || [])
        } catch (historyError) {
          console.error("Error loading bet history:", historyError)
          setBetHistory([])
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    }

    loadUserData()
  }, [navigate, today])

  // Add this function to handle editing a bet
  const handleEditBet = (bet) => {
    setEditingBet(bet)
  }

  // Add this function to save edited bet
  const handleSaveBet = async (betId, updatedData) => {
    try {
      await updateActiveBet(currentUser, betId, updatedData)

      // Refresh active bets
      const bets = await getActiveBets(currentUser)
      setActiveBets(bets || [])

      // Close the edit modal
      setEditingBet(null)
    } catch (error) {
      console.error("Error updating bet:", error)
      alert(`Failed to update bet: ${error.message}`)
    }
  }

  // Update the handleCancelBet function to handle a specific bet
  const handleCancelBet = async (betId) => {
    if (!window.confirm("Are you sure you want to cancel this bet?")) {
      return
    }

    try {
      console.log(`Canceling bet: ${betId}`)
      await cancelActiveBet(currentUser, betId)
      console.log("Bet canceled successfully")

      // Refresh active bets
      const bets = await getActiveBets(currentUser)
      setActiveBets(bets || [])
    } catch (error) {
      console.error("Error canceling bet:", error)
      alert(`Failed to cancel bet: ${error.message}`)
    }
  }

  // Update the formatActiveBets function to handle multiple bets
  const formatActiveBets = (bets) => {
    if (!bets || !Array.isArray(bets) || bets.length === 0) return []

    return bets.map((bet) => ({
      id: bet.id,
      date: new Date(bet.createdAt?.seconds * 1000 || Date.now())
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase(),
      betAmount: bet.betAmount,
      potentialWinnings: bet.potentialWinnings,
      status: "Active",
      gameTime: bet.picks[0]?.gameTime || "TBD",
      bettingPlatform: bet.bettingPlatform || "PrizePicks",
      betType: bet.betType || "Power Play",
      picks: bet.picks.map((pick) => ({
        player: pick.playerName,
        team: pick.playerTeam || "Team",
        opponent: pick.opponent || "Opponent",
        threshold: pick.threshold,
        recommendation: pick.recommendation,
        photoUrl: pick.photoUrl || "/placeholder.svg?height=40&width=40",
      })),
    }))
  }

  const formattedActiveBets = formatActiveBets(activeBets)

  // Then update the handleSearch function in the HomePage component:
  const handleAnalyze = async (name, threshold) => {
    setLoading(true)
    setError(null)
    setMockPlayerData(null)
    setSearchPerformed(false)

    try {
      console.log("Searching for player:", name, threshold)
      const resp = await fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name, threshold }),
      })
      if (!resp.ok) throw new Error(`API error: ${resp.statusText}`)
      const playerData = await resp.json()
      console.log("Player data received:", playerData)

      if (playerData.error) {
        setError(playerData.error)
        return
      }

      setMockPlayerData(playerData)
      setSearchPerformed(true)
    } catch (error) {
      console.error("Search error:", error)
      setError(error.message || "Failed to analyze player. Please check the console for more details.")
    } finally {
      setLoading(false)
    }
  }

  // Inside the HomePage component, add this function to handle adding a player from ProcessedPlayers
  const handleAddToPicks = async (pick) => {
    // ensure we have a string id (fallback to playerId if needed)
    const idStr = typeof pick.id === "string" ? pick.id : `${pick.playerId}_${pick.threshold}`

    const sanitized = { ...pick, id: idStr }

    // de-dupe & enforce max
    if (picks.find((p) => p.id === sanitized.id)) {
      alert(`${sanitized.player || sanitized.name} is already in your picks`)
      return
    }
    if (picks.length >= 6) {
      alert("You can only add up to 6 picks")
      return
    }

    // local state
    setPicks([...picks, sanitized])

    // persist
    try {
      await addUserPick(currentUser, sanitized)
    } catch (err) {
      console.error("Error adding pick:", err)
      alert("Failed to save pick. Rolling back.")
      setPicks(picks.filter((p) => p.id !== sanitized.id))
    }

    // if you came from search, reset inputs
    if (searchPerformed) {
      setSearchPerformed(false)
      setPlayerName("")
      setPointsThreshold("")
    }
  }

  const handleRemovePick = async (id) => {
    // Remove from local state
    setPicks(picks.filter((pick) => pick.id !== id))

    // Remove from Firebase - try both new and old structure
    try {
      // Also remove from old structure for backward compatibility
      await removeUserPick(currentUser, id)
    } catch (error) {
      console.error("Error removing pick from Firebase:", error)
    }
  }

  const handleLockIn = () => {
    if (picks.length < 2) {
      alert("You need at least 2 picks to place a bet")
      return
    }

    setShowBetSlip(true)
  }

  // Update the handleConfirmBet function to correctly handle the selected picks
  const handleConfirmBet = async (amount, winnings, selectedPickIds, bettingPlatform, betType) => {
    setBetAmount(amount)
    setPotentialWinnings(winnings)
    const selectedPicksData = picks.filter((p) => selectedPickIds.includes(p.id))
    setSelectedPicks(selectedPicksData)

    // Store the betting platform and bet type
    const platform = bettingPlatform || "PrizePicks"
    const type = betType || "Power Play"

    try {
      // Format the data for new structure
      const betData = {
        betAmount: Number.parseFloat(amount),
        potentialWinnings: Number.parseFloat(winnings),
        gameDate: today,
        bettingPlatform: platform,
        betType: type,
        picks: selectedPicksData.map((pick) => ({
          playerId: pick.id.toString(),
          playerName: pick.player || pick.name,
          playerTeam: pick.team,
          opponent: pick.opponent,
          threshold: Number.parseFloat(pick.threshold),
          recommendation: pick.recommendation,
          photoUrl: pick.photoUrl,
          gameTime: pick.gameTime,
          gameId: pick.gameId,
        })),
      }

      // Create bet in Firebase
      const betId = await createBet(currentUser, betData)
      console.log("Created bet with ID:", betId)

      // Clear picks from Firebase and local state immediately
      await clearUserPicks(currentUser)
      setPicks([]) // Clear local state immediately

      // Refresh active bets to show the new bet
      const bets = await getActiveBets(currentUser)
      setActiveBets(bets || [])

      // Close bet slip and show confirmation
      setShowBetSlip(false)
      setShowConfirmation(true)
    } catch (error) {
      console.error("Error creating bet in Firebase:", error)
      alert("Failed to create bet. Please try again.")
    }
  }

  const handleCloseBetSlip = () => {
    setShowBetSlip(false)
  }

  const handleCloseConfirmation = async () => {
    setShowConfirmation(false)
    // Picks should already be cleared, but ensure UI is in sync
    if (picks.length > 0) {
      setPicks([])
    }
  }

  // Add this function in the HomePage component
  const handlePlayerClick = (player) => {
    setSelectedPlayer(player)
  }

  // Fallback image in case the NBA API image fails to load
  const handleImageError = (e) => {
    e.target.src = "/placeholder.svg"
  }

  return (
    <AppLayout>
      {/* Active Bet Section */}
      {formattedActiveBets.length > 0 && (
        <div className="mb-8">
          <ActiveBet
            bets={formattedActiveBets}
            onCancel={handleCancelBet}
            onPlayerClick={handlePlayerClick}
            onEdit={handleEditBet}
          />
        </div>
      )}

      {/* Current Picks */}
      {picksLoading ? (
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3">Loading your picks...</span>
          </div>
        </div>
      ) : (
        picks.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Your Picks ({picks.length}/6)</h2>
              <button
                onClick={handleLockIn}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md flex items-center"
                disabled={picks.length < 2}
              >
                <Lock className="w-4 h-4 mr-2" />
                <span>Lock In Picks</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {picks.map((pick) => (
                <div key={pick.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={pick.photoUrl || "/placeholder.svg"}
                      alt={pick.player}
                      className="w-12 h-12 rounded-full object-cover mr-3"
                      onError={handleImageError}
                    />
                    <div>
                      <p className="font-bold">{pick.player}</p>
                      <div className="flex items-center">
                        {pick.teamLogo && (
                          <img
                            src={pick.teamLogo || "/placeholder.svg"}
                            alt={`${pick.team} logo`}
                            className="w-4 h-4 mr-1 object-contain"
                            onError={handleImageError}
                          />
                        )}
                        <p className="text-sm text-gray-400">
                          {pick.threshold} pts ({pick.recommendation})
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">{pick.gameDate}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemovePick(pick.id)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Screenshot Uploader */}
      <ScreenshotUploader
        onUploadComplete={(parsedPlayers) => {
          console.log("Parsed players:", parsedPlayers)
          // Navigate to processed players page
          navigate("/processed-players")
        }}
      />

      {/* Search Form */}
      <PlayerAnalysisSearch
        onSearch={(playerName, pointsThreshold) => {
          setPlayerName(playerName)
          setPointsThreshold(pointsThreshold)
          handleAnalyze(playerName, pointsThreshold)
        }}
        loading={loading}
        error={error}
      />

      {/* Show player data when available */}
      {searchPerformed && mockPlayerData && !loading && (
        <PlayerAnalysisDashboard
          playerData={mockPlayerData}
          threshold={pointsThreshold}
          onAddToPicks={handleAddToPicks}
        />
      )}

      {/* Bet Slip Modal */}
      {showBetSlip && <BetSlip picks={picks} onConfirm={handleConfirmBet} onClose={() => setShowBetSlip(false)} />}

      {/* Bet Confirmation Modal */}
      {showConfirmation && (
        <BetConfirmation
          picks={selectedPicks}
          betAmount={betAmount}
          potentialWinnings={potentialWinnings}
          bettingPlatform={activeBets.length > 0 ? activeBets[activeBets.length - 1].bettingPlatform : "PrizePicks"}
          betType={activeBets.length > 0 ? activeBets[activeBets.length - 1].betType : "Power Play"}
          onClose={handleCloseConfirmation}
        />
      )}

      {/* Player Stats Modal */}
      {selectedPlayer && <PlayerStatsModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}

      {/* Edit Bet Modal */}
      {editingBet && <EditBetModal bet={editingBet} onSave={handleSaveBet} onClose={() => setEditingBet(null)} />}
    </AppLayout>
  )
}
