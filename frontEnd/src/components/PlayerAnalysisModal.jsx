"use client"

import { useState } from "react"
import { X, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity, Plus } from "lucide-react"
import ImageWithFallback from "./ImageWithFallback"

const PlayerAnalysisModal = ({ playerData, onClose, onAddToPicks }) => {
  const [expandedSection, setExpandedSection] = useState("main")
  const [moreGames, setMoreGames] = useState([])
  const [showMoreGames, setShowMoreGames] = useState(false)
  const [loadingMoreGames, setLoadingMoreGames] = useState(false)
  const [moreGamesError, setMoreGamesError] = useState(null)

  if (!playerData) return null

  // Format numbers to 2 decimal places
  const formatNumber = (num) => {
    if (num === undefined || num === null) return "N/A"
    return typeof num === "number" ? num.toFixed(2) : num
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

  // Extract data
  const name = playerData.name
  const playerId = playerData.playerId
  const team = playerData.team
  const position = playerData.position
  const opponent = playerData.opponent
  const photoUrl = playerData.photoUrl
  const teamLogo = playerData.teamLogo
  const opponentLogo = playerData.opponentLogo
  const gameDate = playerData.gameDate
  const gameTime = playerData.gameTime
  const gametype = playerData.gameType
  const teamRank = playerData.teamPlayoffRank
  const opponentRank = playerData.opponentPlayoffRank
  const seasonAvg = playerData.seasonAvgPoints
  const last5RegAvg = playerData.last5RegularGamesAvg
  const vsOpponentAvg = playerData.seasonAvgVsOpponent
  const homeAwayAvg = playerData.homeAwgAvg
  const last5RegularGames = playerData.last5RegularGames || []
  const advancedMetrics = playerData.advancedPerformance || {}
  const careerStats = playerData.careerSeasonStats || []
  const injuryReport = playerData.injuryReport || {}
  const betExplanation = playerData.betExplanation || {}
  const poissonProbability = playerData.poissonProbability
  const monteCarloProbability = playerData.monteCarloProbability
  const volatility_regular = playerData.volatilityForecast
  const season_games_agst_opp = playerData.season_games_agst_opp
  const threshold = playerData.threshold

  // Playoff Data
  const num_playoff_games = playerData.num_playoff_games
  const playoffAvg = playerData.playoffAvg
  const playoff_games = playerData.playoff_games
  const volatility_PlayOffs = playerData.volatilityPlayOffsForecast

  // Format probabilities for display
  const poissonProbabilityFormatted = poissonProbability ? `${(poissonProbability * 100).toFixed(2)}%` : "N/A"
  const monteCarloFormatted = monteCarloProbability ? `${(monteCarloProbability * 100).toFixed(2)}%` : "N/A"

  // Determine recommendation
  const recommendation = betExplanation.recommendation || "N/A"
  const recommendationColor = getRecommendationColor(recommendation)

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? "main" : section)
  }

  // Toggle between fetching & hiding
  const handleToggleMoreGames = async () => {
    if (showMoreGames) {
      return setShowMoreGames(false)
    }
    setLoadingMoreGames(true)
    setMoreGamesError(null)
    try {
      const res = await fetch(`/api/player/${playerData.playerId}/more_games`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMoreGames(data)
      setShowMoreGames(true)
    } catch (err) {
      console.error(err)
      setMoreGamesError("Failed to load more games.")
    } finally {
      setLoadingMoreGames(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      {/* Mobile: Full screen, Desktop: Centered modal */}
      <div className="bg-gray-900 w-full h-full lg:rounded-xl lg:max-w-4xl lg:w-full lg:max-h-[90vh] lg:h-auto overflow-y-auto relative">
        {/* Close button - Mobile optimized */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-3 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors z-10 min-h-[48px] min-w-[48px] flex items-center justify-center"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Hero Section - Mobile optimized */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 lg:p-6">
              <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                {/* Player Info - Mobile optimized */}
                <div className="flex items-center space-x-4">
                  <div className="relative flex-shrink-0">
                    <ImageWithFallback
                      src={photoUrl || "/placeholder.svg"}
                      alt={name}
                      className="w-20 h-20 lg:w-24 lg:h-24 rounded-full object-cover border-2 border-blue-500"
                      fallbackSrc="/placeholder.svg?height=96&width=96"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1 border border-gray-700">
                      <ImageWithFallback
                        src={teamLogo || "/placeholder.svg"}
                        alt={team}
                        className="w-6 h-6 lg:w-8 lg:h-8"
                        fallbackSrc="/placeholder.svg?height=32&width=32"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl lg:text-3xl font-bold text-white truncate">{name}</h1>
                    <div className="flex items-center text-gray-400 text-sm lg:text-base">
                      <span className="truncate">{team}</span>
                      <span className="mx-2">•</span>
                      <span>{position}</span>
                    </div>
                    <div className="flex items-center mt-1 text-xs lg:text-sm text-gray-400">
                      <span>vs</span>
                      <ImageWithFallback
                        src={opponentLogo || "/placeholder.svg"}
                        alt={opponent}
                        className="w-4 h-4 mx-1"
                        fallbackSrc="/placeholder.svg?height=16&width=16"
                      />
                      <span className="truncate">{opponent}</span>
                      <span className="mx-2">•</span>
                      <span className="truncate">{gameDate}</span>
                    </div>
                  </div>
                </div>

                {/* Main Recommendation - Mobile optimized */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 w-full lg:w-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Threshold</span>
                    <span className="text-xl lg:text-2xl font-bold text-white">{threshold} pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Recommendation</span>
                    <span className={`text-lg lg:text-2xl font-bold ${recommendationColor} flex items-center`}>
                      {recommendation.toLowerCase().includes("over") ? (
                        <TrendingUp className="mr-1 w-5 h-5" />
                      ) : (
                        <TrendingDown className="mr-1 w-5 h-5" />
                      )}
                      <span className="truncate">{recommendation}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Betting Recommendation - Mobile optimized */}
              <div className="mt-4 lg:mt-6 bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 space-y-2 lg:space-y-0">
                  <div className="flex items-center">
                    <Activity className="text-blue-400 w-5 h-5 mr-2" />
                    <h2 className="text-lg lg:text-xl font-semibold">AI Betting Recommendation</h2>
                  </div>
                  <div className="flex flex-col lg:flex-row lg:space-x-4 text-sm space-y-1 lg:space-y-0">
                    <div>
                      <span className="text-gray-400">Poisson: </span>
                      <span className={getProbabilityColor(poissonProbability)}>{poissonProbabilityFormatted}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Monte Carlo: </span>
                      <span className={getProbabilityColor(monteCarloProbability)}>{monteCarloFormatted}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm lg:text-base leading-relaxed">{betExplanation.explanation}</p>
              </div>
            </div>
          </div>

          {/* Key Stats Section - Mobile optimized */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-5">
            <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
              <p className="text-gray-400 text-xs lg:text-sm mb-1">Season Average</p>
              <p className={`text-lg lg:text-2xl font-bold ${getComparisonColor(seasonAvg, threshold)}`}>
                {formatNumber(seasonAvg)} pts
              </p>
            </div>
            <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
              <p className="text-gray-400 text-xs lg:text-sm mb-1">Last 5 Games</p>
              <p className={`text-lg lg:text-2xl font-bold ${getComparisonColor(last5RegAvg, threshold)}`}>
                {formatNumber(last5RegAvg)} pts
              </p>
            </div>
            <div className="bg-gray-800 p-3 lg:p-4 rounded-lg col-span-2 lg:col-span-1">
              <p className="text-gray-400 text-xs lg:text-sm mb-1">Vs. {opponent}</p>
              <p className={`text-lg lg:text-2xl font-bold ${getComparisonColor(vsOpponentAvg, threshold)}`}>
                {formatNumber(vsOpponentAvg)} pts
              </p>
            </div>
            <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
              <p className="text-gray-400 text-xs lg:text-sm mb-1">@ Home</p>
              <p
                className={`text-lg lg:text-2xl font-bold ${getComparisonColor(advancedMetrics["avg_points_home"], threshold)}`}
              >
                {formatNumber(advancedMetrics["avg_points_home"])} pts
              </p>
            </div>
            <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
              <p className="text-gray-400 text-xs lg:text-sm mb-1">@ Away</p>
              <p
                className={`text-lg lg:text-2xl font-bold ${getComparisonColor(advancedMetrics["avg_points_away"], threshold)}`}
              >
                {formatNumber(advancedMetrics["avg_points_away"])} pts
              </p>
            </div>
          </div>

          {/* Volatility Stats - Mobile optimized */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
              <p className="text-gray-400 text-xs lg:text-sm mb-1">Regular Season Volatility</p>
              <p className={`text-lg lg:text-2xl font-bold ${getComparisonColor(volatility_regular, threshold)}`}>
                {formatNumber(volatility_regular)} pts
              </p>
            </div>
            {volatility_PlayOffs != 0 && (
              <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
                <p className="text-gray-400 text-xs lg:text-sm mb-1">Playoffs Volatility</p>
                <p className={`text-lg lg:text-2xl font-bold ${getComparisonColor(volatility_PlayOffs, threshold)}`}>
                  {formatNumber(volatility_PlayOffs)} pts
                </p>
              </div>
            )}
            {num_playoff_games !== 0 && (
              <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
                <p className="text-gray-400 text-xs lg:text-sm mb-1">Playoffs Average</p>
                <p className={`text-lg lg:text-2xl font-bold ${getComparisonColor(playoffAvg, threshold)}`}>
                  {formatNumber(playoffAvg)} pts
                </p>
              </div>
            )}
          </div>

          {/* Expandable sections remain the same but with mobile-optimized touch targets */}
          {/* Recent Encounters Section */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div
              className="flex justify-between items-center p-4 cursor-pointer min-h-[56px]"
              onClick={() => toggleSection("recentEncounters")}
            >
              <h2 className="text-lg lg:text-xl font-semibold">All Season Encounters</h2>
              {expandedSection === "recentEncounters" ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </div>
            {expandedSection === "recentEncounters" && (
              <div className="p-4 border-t border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-700">
                        <th className="pb-2 text-sm">Date</th>
                        <th className="pb-2 text-sm">Opponent</th>
                        <th className="pb-2 text-sm">Location</th>
                        <th className="pb-2 text-sm">MIN</th>
                        <th className="pb-2 text-sm">PTS</th>
                        <th className="pb-2 text-right text-sm">vs Threshold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {season_games_agst_opp.map((game, index) => (
                        <tr key={index} className="border-b border-gray-700">
                          <td className="py-3 text-sm">{game.date}</td>
                          <td className="py-3">
                            <div className="flex items-center">
                              <ImageWithFallback
                                src={game.opponentLogo || "/placeholder.svg"}
                                alt={game.opponent}
                                className="w-5 h-5 mr-2"
                                fallbackSrc="/placeholder.svg?height=20&width=20"
                              />
                              <span className="text-sm truncate">{game.opponentFullName || game.opponent}</span>
                            </div>
                          </td>
                          <td className="py-3 text-sm">{game.location}</td>
                          <td className="py-3 text-sm">{game.minutes || "N/A"}</td>
                          <td className="py-3 font-bold text-sm">{game.points}</td>
                          <td className="py-3 text-right">
                            {threshold && (
                              <span
                                className={`text-sm font-medium ${
                                  game.points > Number.parseFloat(threshold) ? "text-green-500" : "text-red-500"
                                }`}
                              >
                                {game.points > Number.parseFloat(threshold) ? "OVER" : "UNDER"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Add to Picks Button - Mobile optimized */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              const [first, last] = name.split(" ")
              const dateStr = (playerData.gameDate || "").toString().slice(0,10).replace(/[-/]/g,"")
              const pickId = `${first.toLowerCase()}_${last.toLowerCase()}_${threshold}_${dateStr}`
              onAddToPicks({
                ...playerData,
                id: pickId,
                threshold,
              })
              onClose()
            }}
            className="w-full py-4 lg:py-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium rounded-lg flex items-center justify-center transition-all duration-200 min-h-[56px] text-base lg:text-lg shadow-lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            <span>Add to Picks</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlayerAnalysisModal
