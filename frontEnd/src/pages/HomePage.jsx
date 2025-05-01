"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Home,
  LogOut,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Trash2,
  Lock,
  History,
  Bell,
  ListChecks,
} from "lucide-react"
import PlayerCard from "../components/PlayerCard"
import StatsCard from "../components/StatsCard"
import RecommendationCard from "../components/RecommendationCard"
import BetSlip from "../components/BetSlip"
import BetConfirmation from "../components/BetConfirmation"
import PreviousBets from "../components/PreviousBets"
import ActiveBet from "../components/ActiveBet"
import DailyPicks from "../components/DailyPicks"
import PlayerStatsModal from "../components/PlayerStatsModal"
import ChatGptThinking from "../components/ChatGptThinking"
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
} from "../services/firebaseService"
// Add these imports at the top
import EditBetModal from "../components/EditBetModal"
import ProcessedPlayers from "../components/ProcessedPlayers"
import InjuryStatusCard from "../components/InjuryStatusCard"
import MonteCarloCard from "../components/MonteCarloCard"
import AdvancedMetricsCard from "../components/AdvancedMetricsCard"
import BetExplanationCard from "../components/BetExplanationCard"
import ScreenshotUploader from "../components/ScreenshotUploader"
import PlayerAnalysisDashboard from "../components/PlayerAnalysisDashboard"
import PlayerAnalysisSearch from "../components/PlayerAnalysisSearch"


export default function HomePage() {
  const [activeTab, setActiveTab] = useState("Dashboard")
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
  const navigate = useNavigate()

  // Add these new state variables
  const [userProfile, setUserProfile] = useState(null)
  const [activeBets, setActiveBets] = useState([])
  const [betHistory, setBetHistory] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  // Add this state for the player stats modal
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  // Add these state variables in the HomePage component
  const [editingBet, setEditingBet] = useState(null)

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
          // Load legacy picks only
          const legacyPicks = await getUserPicks(userId)
          if (legacyPicks?.length) setPicks(legacyPicks)
        } catch (picksError) {
          console.error("Error loading picks:", picksError)
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

  // Total earnings from user profile
  const totalEarnings = userProfile?.totalEarnings || 0

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

  // Also fix the formatBetHistory function which has the same issue
  const formatBetHistory = (bets) => {
    // Add a null check to prevent the error
    if (!bets || !Array.isArray(bets)) {
      return []
    }

    return bets.map((bet) => ({
      id: bet.id,
      date: new Date(bet.createdAt?.seconds * 1000 || Date.parse(bet.createdAt) || Date.now())
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase(),
      betAmount: bet.betAmount,
      winnings: bet.winnings || 0,
      status: bet.status || "Lost",
      bettingPlatform: bet.bettingPlatform || "PrizePicks",
      betType: bet.betType || "Power Play",
      picks: Array.isArray(bet.picks)
        ? bet.picks.map((pick) => ({
            player: pick.playerName,
            team: pick.playerTeam || "Team",
            opponent: pick.opponent || "Opponent",
            threshold: pick.threshold,
            recommendation: pick.recommendation,
            actual: pick.actualPoints || 0,
            result: pick.result || "MISS",
            photoUrl: pick.photoUrl || "/placeholder.svg?height=40&width=40",
          }))
        : [],
    }))
  }

  // Previous bets from Firebase
  const previousBets = formatBetHistory(betHistory)
  const formattedActiveBets = formatActiveBets(activeBets)

  const getRecommendation = (playerData, threshold) => {
    const thresholdNum = Number.parseFloat(threshold)

    // Simple algorithm to determine recommendation
    const factors = [
      playerData.seasonAvgPoints > thresholdNum,
      playerData.careerAvgVsOpponent > thresholdNum,
      playerData.last5GamesAvg > thresholdNum,
      playerData.seasonAvgVsOpponent > thresholdNum,
    ]

    const positiveFactors = factors.filter(Boolean).length

    if (positiveFactors >= 3) {
      return { recommendation: "OVER", confidence: "High", color: "text-green-500" }
    } else if (positiveFactors === 2) {
      return { recommendation: "OVER", confidence: "Medium", color: "text-yellow-500" }
    } else {
      return { recommendation: "UNDER", confidence: "High", color: "text-red-500" }
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const handleSignOut = () => {
    // Clear user from sessionStorage
    sessionStorage.removeItem("currentUser")
    navigate("/") // Navigate to the SignIn page
  }

  // Add this state for error handling
  const [error, setError] = useState(null)
  const [mockPlayerData, setMockPlayerData] = useState(null)


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
  const handleAddToPicks = async () => {
    if (!mockPlayerData) {
      alert("No player data available")
      return
    }

    if (picks.length >= 6) {
      alert("You can only add up to 6 picks")
      return
    }

    if (!pointsThreshold || pointsThreshold <= 0) {
      alert("Please enter a valid points threshold")
      return
    }

    const rec = getRecommendation(mockPlayerData, pointsThreshold)

    // build the same slug your Firestore uses:
    const playerKey = mockPlayerData.name
      .toLowerCase()
      .replace(/\s+/g, "_")            // "LeBron James" → "lebron_james"

    const newPick = {
      id: playerKey,
      player: mockPlayerData.name,
      team: mockPlayerData.team,
      teamLogo: mockPlayerData.teamLogo,
      opponent: mockPlayerData.opponent,
      opponentLogo: mockPlayerData.opponentLogo,
      gameDate: mockPlayerData.gameDate,
      gameTime: mockPlayerData.gameTime,
      threshold: pointsThreshold,
      recommendation: rec.recommendation,
      confidence: rec.confidence,
      photoUrl: mockPlayerData.photoUrl,
      gameId: mockPlayerData.gameId,
    }

    // Add to local state
    setPicks([...picks, newPick])

    // Add to Firebase - try both new and old structure
    try {
      // Format the data for new structure
      const pickData = {
        playerId: newPick.id,
        playerName: mockPlayerData.name,
        playerTeam: mockPlayerData.team,
        playerTeamLogo: mockPlayerData.teamLogo,
        opponent: mockPlayerData.opponent,
        opponentLogo: mockPlayerData.opponentLogo,
        gameDate: mockPlayerData.gameDate,
        gameTime: mockPlayerData.gameTime,
        threshold: Number.parseFloat(pointsThreshold),
        recommendation: rec.recommendation,
        confidence: rec.confidence,
        photoUrl: mockPlayerData.photoUrl,
      }

      // Also add to old structure for backward compatibility
      await addUserPick(currentUser, newPick)
    } catch (error) {
      console.error("Error adding pick to Firebase:", error)
      alert("Failed to save pick. Please try again.")
      // Remove from local state if Firebase save fails
      setPicks(picks.filter((pick) => pick.id !== newPick.id))
      return
    }

    setSearchPerformed(false)
    setPlayerName("")
    setPointsThreshold("")
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

  // Add this function after the handleRemovePick function
  const handleAddProcessedPlayer = async (pick) => {
    // Check if we already have 6 picks
    if (picks.length >= 6) {
      alert("You can only add up to 6 picks")
      return
    }

    // Check if player is already in picks
    const existingPickIndex = picks.findIndex((p) => p.id === pick.id)
    if (existingPickIndex >= 0) {
      alert(`${pick.player} is already in your picks`)
      return
    }

    // Add to local state
    setPicks([...picks, pick])

    // Add to Firebase - try both new and old structure
    try {
      // Format the data for new structure
      const pickData = {
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
      }

      // Also add to old structure for backward compatibility
      await addUserPick(currentUser, pick)

      // If we're not on the Dashboard tab, show a notification
      if (activeTab !== "Dashboard") {
        alert(`Added ${pick.player} to your picks with a threshold of ${pick.threshold} points`)
      }
    } catch (error) {
      console.error("Error adding pick to Firebase:", error)
      alert("Failed to save pick. Please try again.")
      // Remove from local state if Firebase save fails
      setPicks(picks.filter((p) => p.id !== pick.id))
      return
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
    const selectedPicksData = picks.filter(p => selectedPickIds.includes(p.id));
    setSelectedPicks(selectedPicksData)

    // Store the betting platform and bet type
    const platform = bettingPlatform || "PrizePicks"
    const type = betType || "Power Play"

    // Create bet in Firebase - only use one method to create the bet
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
          playerName: pick.player,
          playerTeam: pick.team,
          opponent: pick.opponent,
          threshold: Number.parseFloat(pick.threshold),
          recommendation: pick.recommendation,
          photoUrl: pick.photoUrl,
          gameTime: pick.gameTime,
          gameId: pick.gameId,
        })),
      }

      // Create in new structure only
      const betId = await createBet(currentUser, betData)
      console.log("Created bet with ID:", betId)

      // 2) only now clear the old picks
      await clearUserPicks(currentUser)

      // 3) refresh active bets
      const bets = await getActiveBets(currentUser)
      setActiveBets(bets)
    } catch (error) {
      console.error("Error creating bet in Firebase:", error)
    }

    setShowBetSlip(false)
    setShowConfirmation(true)
  }

  const handleCloseBetSlip = () => {
    setShowBetSlip(false)
  }

  const handleCloseConfirmation = async () => {
    setShowConfirmation(false)
    // Reset picks after confirmation
    setPicks([])
  }

  // Add this function in the HomePage component
  const handlePlayerClick = (player) => {
    setSelectedPlayer(player)
  }

  const NavItem = ({ tab, icon: Icon, label }) => (
    <button
      className={`flex items-center px-4 py-2 ${
        activeTab === tab ? "text-white" : "text-gray-400 hover:text-white"
      } text-sm font-medium`}
      onClick={() => handleTabChange(tab)}
    >
      <Icon className="w-5 h-5 mr-2" />
      <span>{label}</span>
    </button>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="/logo.png"
              alt="PrizePicks Logo"
              className="w-8 h-8"
              style={{
                aspectRatio: "1/1",
                objectFit: "contain",
              }}
            />
            <span className="text-xl font-semibold">PrizePicks Analyzer</span>
          </div>
          <nav className="flex space-x-4">
            <NavItem tab="Dashboard" icon={Home} label="Home" />
            <NavItem tab="ProcessedPlayers" icon={ListChecks} label="Already Processed Players" />
            <NavItem tab="PreviousBets" icon={History} label="Previous Bets" />
            <NavItem tab="Notifications" icon={Bell} label="Alerts" />
          </nav>
          <div className="flex items-center space-x-4">
            <img
              alt="User avatar"
              className="w-8 h-8 rounded-full"
              src={userProfile?.pfp || currentUser}
              style={{
                aspectRatio: "1/1",
                objectFit: "cover",
              }}
            />
            <div className="text-sm">
              <p className="font-medium">{userProfile?.displayName || currentUser}</p>
              <p className="text-gray-400">@{currentUser}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md flex items-center"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <div className="container mx-auto">
          {/* Warning Banner */}
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold mb-2 text-yellow-400">WARNING - PLAY AT YOUR OWN RISK</h2>
            <p className="text-gray-300">
              This website is currently in beta and testflight mode. Additionally, our model currently only does
              statistics on player points in the NBA, with its focus specifically on 'Over' points.
            </p>
          </div>

          {/* Earnings Banner */}
          <div className="bg-gradient-to-r from-green-900 to-green-700 p-6 rounded-lg mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Total Earnings</h2>
                <p className="text-gray-200">Keep up the good work! Your picks are paying off.</p>
              </div>
              <div className="text-4xl font-bold">${totalEarnings.toFixed(2)}</div>
            </div>
          </div>

          {/* Active Bet Section - Only show on Dashboard and DailyPicks tabs */}
          {activeTab !== "PreviousBets" && formattedActiveBets.length > 0 && (
            <div className="mb-8">
              <ActiveBet
                bets={formattedActiveBets}
                onCancel={handleCancelBet}
                onPlayerClick={handlePlayerClick}
                onEdit={handleEditBet}
              />
            </div>
          )}

          {/* Tab Content */}
          {activeTab === "Dashboard" && (
            <>
              {/* Current Picks */}
              {picks.length > 0 && (
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
                          />
                          <div>
                            <p className="font-bold">{pick.player}</p>
                            <p className="text-sm text-gray-400">
                              {pick.threshold} pts ({pick.recommendation})
                            </p>
                            <p className="text-xs text-gray-500">{pick.gameDate}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemovePick(pick.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* Screenshot Uploader - Add this new component */}
              <ScreenshotUploader
                onUploadComplete={(parsedPlayers) => {
                  console.log("Parsed players:", parsedPlayers)
                  // Optionally show a notification or update UI
                  handleTabChange("ProcessedPlayers")
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

            
            </>
          )}

          {activeTab === "DailyPicks" && (
            <DailyPicks picks={formattedActiveBets.length > 0 ? formattedActiveBets[0].picks : []} />
          )}

          {activeTab === "PreviousBets" && <PreviousBets bets={previousBets} activeBets={formattedActiveBets} />}

          {activeTab === "Notifications" && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-6">Alerts & Notifications</h2>
              <p className="text-gray-400">
                Set up alerts for your favorite players and games. This feature is coming soon!
              </p>
            </div>
          )}

          {activeTab === "ProcessedPlayers" && <ProcessedPlayers onAddToPicks={handleAddProcessedPlayer} />}
        </div>
      </main>

      {/* Bet Slip Modal */}
      {showBetSlip && (
        <BetSlip
          picks={selectedPicks}
          onConfirm={handleConfirmBet}
          onClose={() => setShowBetSlip(false)}
        />
      )}

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
    </div>
  )
}

