"use client"

import { useState, useEffect } from "react"
import { Search, TrendingUp, TrendingDown, Plus, Check, Activity, BarChart2 } from 'lucide-react'
import { getProcessedPlayers } from "../services/firebaseService"
import PlayerAnalysisModal from "./PlayerAnalysisModal"
import ImageWithFallback from "./ImageWithFallback"

const ProcessedPlayers = ({ onAddToPicks }) => {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPlayers, setFilteredPlayers] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [addedPlayers, setAddedPlayers] = useState({})

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true)
        const processedPlayers = await getProcessedPlayers()
        setPlayers(processedPlayers)
        setFilteredPlayers(processedPlayers)
      } catch (error) {
        console.error("Error fetching processed players:", error)
        setError("Failed to load processed players. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPlayers(players)
      return
    }

    const filtered = players.filter(
      (player) =>
        player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredPlayers(filtered)
  }, [searchTerm, players])

  const handleAddToPicks = (player) => {
    if (onAddToPicks) {
      onAddToPicks(player)

      // Show confirmation
      setAddedPlayers({
        ...addedPlayers,
        [player.playerId || player.id || player.name]: true,
      })

      // Reset confirmation after 3 seconds
      setTimeout(() => {
        setAddedPlayers({
          ...addedPlayers,
          [player.playerId || player.id || player.name]: false,
        })
      }, 3000)
    }
  }

  const handleOpenModal = (player) => {
    setSelectedPlayer(player)
  }

  const handleCloseModal = () => {
    setSelectedPlayer(null)
  }

  // Format percentages
  const formatPercent = (num) => {
    if (num === undefined || num === null) return "N/A"
    return typeof num === "number" ? `${(num * 100).toFixed(1)}%` : num
  }

  // Get recommendation color
  const getRecommendationColor = (recommendation) => {
    if (!recommendation) return "text-gray-400"
    const rec = recommendation.toLowerCase()
    if (rec.includes("over") || rec.includes("yes")) return "text-green-500"
    if (rec.includes("under") || rec.includes("no")) return "text-red-500"
    return "text-yellow-500"
  }

  // Get probability color
  const getProbabilityColor = (probability) => {
    if (probability === undefined || probability === null) return "text-gray-400"
    const prob = typeof probability === "string" ? Number.parseFloat(probability) : probability
    if (prob >= 0.7) return "text-green-500"
    if (prob >= 0.5) return "text-yellow-500"
    return "text-red-500"
  }

  // Get threshold comparison color
  const getComparisonColor = (value, threshold) => {
    if (value === undefined || value === null) return "text-gray-400"
    return value > threshold ? "text-green-500" : "text-red-500"
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
        <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Already Processed Players</h2>

        {/* Search bar */}
        <div className="mb-4 lg:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search players by name or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
            />
          </div>
        </div>

        {/* Filter options */}
        <div className="mb-4 lg:mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-400 mb-2">Filter by Team</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white py-3 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                onChange={(e) => {
                  const teamFilter = e.target.value
                  if (teamFilter === "all") {
                    const searchFiltered =
                      searchTerm.trim() === ""
                        ? players
                        : players.filter(
                            (player) =>
                              player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              player.team?.toLowerCase().includes(searchTerm.toLowerCase()),
                          )
                    setFilteredPlayers(searchFiltered)
                  } else {
                    const teamFiltered = (searchTerm.trim() === "" ? players : filteredPlayers).filter(
                      (player) => player.team === teamFilter,
                    )
                    teamFiltered.sort((a, b) => a.name.localeCompare(b.name))
                    setFilteredPlayers(teamFiltered)
                  }
                }}
              >
                <option value="all">All Teams</option>
                {Array.from(new Set(players.map((player) => player.team)))
                  .filter(Boolean)
                  .sort()
                  .map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-400 mb-2">Filter by AI Recommendation</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white py-3 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                onChange={(e) => {
                  const recFilter = e.target.value
                  if (recFilter === "all") {
                    const searchFiltered =
                      searchTerm.trim() === ""
                        ? players
                        : players.filter(
                            (player) =>
                              player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              player.team?.toLowerCase().includes(searchTerm.toLowerCase()),
                          )
                    setFilteredPlayers(searchFiltered)
                  } else {
                    const recFiltered = (searchTerm.trim() === "" ? players : filteredPlayers).filter((player) => {
                      const rec = player.betExplanation?.recommendation || ""

                      if (recFilter === "100_yes" && rec.includes("100% YES")) {
                        return true
                      } else if (recFilter === "90_100_yes" && rec.includes("90–100% YES")) {
                        return true
                      } else if (recFilter === "80_90_possible" && rec.includes("80–90% possible")) {
                        return true
                      }
                      return false
                    })

                    setFilteredPlayers(recFiltered)
                  }
                }}
              >
                <option value="all">All Recommendations</option>
                <option value="100_yes">100% YES</option>
                <option value="90_100_yes">90–100% YES</option>
                <option value="80_90_possible">80–90% possible</option>
              </select>
            </div>
          </div>

          {/* Filter stats */}
          <div className="text-sm text-gray-400">
            Showing {filteredPlayers.length} of {players.length} players
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-900 bg-opacity-30 border border-red-700 p-4 rounded-lg mb-4 flex items-start">
            <Activity className="text-red-400 w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm lg:text-base">{error}</p>
          </div>
        )}

        {/* No results */}
        {!loading && !error && filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No processed players found.</p>
            <p className="text-gray-500 text-sm mt-2">Upload screenshots or search for players to analyze them.</p>
          </div>
        )}

        {/* Player grid */}
        {!loading && !error && filteredPlayers.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {filteredPlayers.map((player) => {
              const playerId = player.playerId || player.id || player.name
              const uniquePlayerKey = `${playerId}_${player.threshold}`
              const isAdded = addedPlayers[playerId]
              const poissonProbability = player.poissonProbability
              const monteCarloProbability = player.monteCarloProbability
              const recommendation = player.betExplanation?.recommendation || "N/A"
              const threshold = player.threshold || 0

              return (
                <div
                  key={uniquePlayerKey}
                  className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl overflow-hidden shadow-lg border border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
                  onClick={() => handleOpenModal(player)}
                >
                  {/* Player header */}
                  <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        <ImageWithFallback
                          src={player.photoUrl || "/placeholder.svg"}
                          alt={player.name}
                          className="w-16 h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 border-gray-700"
                          fallbackSrc="/placeholder.svg?height=80&width=80"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1 border border-gray-700">
                          <ImageWithFallback
                            src={player.teamLogo || "/placeholder.svg"}
                            alt={player.team}
                            className="w-6 h-6"
                            fallbackSrc="/placeholder.svg?height=24&width=24"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg lg:text-xl text-white truncate">{player.name}</h3>
                        <p className="text-sm lg:text-base text-gray-400 truncate">{player.team}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats section */}
                  <div className="p-4 space-y-4">
                    {/* Season stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Season Avg</p>
                        <p
                          className={`font-bold text-base lg:text-lg ${getComparisonColor(player.seasonAvgPoints, threshold)}`}
                        >
                          {player.seasonAvgPoints?.toFixed(1) || "N/A"} pts
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Last 5 Games</p>
                        <p
                          className={`font-bold text-base lg:text-lg ${getComparisonColor(player.last5GamesAvg, threshold)}`}
                        >
                          {player.last5GamesAvg?.toFixed(1) || "N/A"} pts
                        </p>
                      </div>
                    </div>

                    {/* Game info */}
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <ImageWithFallback
                            src={player.teamLogo || "/placeholder.svg"}
                            alt={player.team}
                            className="w-5 h-5 flex-shrink-0"
                            fallbackSrc="/placeholder.svg?height=20&width=20"
                          />
                          <span className="text-sm text-gray-300">vs</span>
                          <ImageWithFallback
                            src={player.opponentLogo || "/placeholder.svg"}
                            alt={player.opponent}
                            className="w-5 h-5 flex-shrink-0"
                            fallbackSrc="/placeholder.svg?height=20&width=20"
                          />
                          <span className="text-sm text-white truncate">{player.opponent}</span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{player.gameDate}</span>
                      </div>
                    </div>

                    {/* Threshold and probability */}
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs text-gray-400">Threshold</p>
                          <p className="font-bold text-lg text-white">{threshold} pts</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Probability</p>
                          <p className={`font-bold text-lg ${getProbabilityColor(poissonProbability)}`}>
                            {formatPercent(poissonProbability)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    {recommendation !== "N/A" && (
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-400">AI Pick</p>
                          <div className={`flex items-center space-x-1 ${getRecommendationColor(recommendation)}`}>
                            {recommendation.toLowerCase().includes("over") ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="font-bold text-sm truncate max-w-[120px]">{recommendation}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Monte Carlo */}
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <BarChart2 className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-400">Monte Carlo</p>
                        </div>
                        <p className={`font-bold text-sm ${getProbabilityColor(monteCarloProbability)}`}>
                          {formatPercent(monteCarloProbability)}
                        </p>
                      </div>
                    </div>

                    {/* Add to picks button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToPicks({
                          ...player,
                          id: player.id, // Use the original document ID
                          threshold,
                          playerName: player.name,
                          name: player.name,
                          gameDate: player.gameDate, // Pass the gameDate for proper document reference
                        })
                      }}
                      className={`w-full py-4 rounded-lg flex items-center justify-center transition-all duration-200 min-h-[52px] font-medium text-base ${
                        isAdded
                          ? "bg-green-600 text-white shadow-lg"
                          : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg hover:shadow-xl"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          <span>Added to Picks</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5 mr-2" />
                          <span>Add to Picks</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Player Analysis Modal */}
      {selectedPlayer && (
        <PlayerAnalysisModal playerData={selectedPlayer} onClose={handleCloseModal} onAddToPicks={handleAddToPicks} />
      )}
    </div>
  )
}

export default ProcessedPlayers