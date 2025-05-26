"use client"

import { useState } from "react"
import { Plus, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity } from "lucide-react"
import ImageWithFallback from "./ImageWithFallback"

const PlayerAnalysisDashboard = ({ playerData, threshold, onAddToPicks }) => {
  const [expandedSection, setExpandedSection] = useState("main")
  const [moreGames, setMoreGames] = useState([])
  const [showMoreGames, setShowMoreGames] = useState(false)
  const [loadingMoreGames, setLoadingMoreGames] = useState(false)
  const [moreGamesError, setMoreGamesError] = useState(null)

  if (!playerData) return null

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

  // Playoff Data
  const num_playoff_games = playerData.num_playoff_games
  const playoffAvg = playerData.playoffAvg
  const playoff_games = playerData.playoff_games
  const volatility_PlayOffs = playerData.volatilityPlayOffsForecast

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
    <div className="space-y-4 lg:space-y-6">
      {/* Hero Section with Player Info and Main Recommendation */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            {/* Player Info */}
            <div className="flex items-center mb-4 lg:mb-0 w-full lg:w-auto">
              <div className="relative">
                <ImageWithFallback
                  src={photoUrl || "/placeholder.svg"}
                  alt={name}
                  className="w-16 h-16 lg:w-24 lg:h-24 rounded-full object-cover border-2 border-blue-500"
                  fallbackSrc="/placeholder.svg?height=96&width=96"
                />
                <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-0.5 lg:p-1 border border-gray-700">
                  <ImageWithFallback
                    src={teamLogo || "/placeholder.svg"}
                    alt={team}
                    className="w-6 h-6 lg:w-8 lg:h-8"
                    fallbackSrc="/placeholder.svg?height=32&width=32"
                  />
                </div>
              </div>
              <div className="ml-3 lg:ml-4 flex-1 min-w-0">
                <h1 className="text-xl lg:text-3xl font-bold truncate">{name}</h1>
                <div className="flex flex-wrap items-center text-gray-400 text-sm lg:text-base">
                  <span>{team}</span>
                  <span className="mx-1 lg:mx-2">•</span>
                  <span>{position}</span>
                  <span className="mx-1 lg:mx-2">•</span>
                  <span>Rank: {teamRank}</span>
                </div>
                <div className="flex flex-wrap items-center mt-1 text-xs lg:text-sm">
                  <span className="text-gray-400">vs</span>
                  <ImageWithFallback
                    src={opponentLogo || "/placeholder.svg"}
                    alt={opponent}
                    className="w-3 h-3 lg:w-4 lg:h-4 mx-1"
                    fallbackSrc="/placeholder.svg?height=16&width=16"
                  />
                  <span>
                    {opponent} (Rank: {opponentRank})
                  </span>
                  <span className="mx-1 lg:mx-2">•</span>
                  <span>
                    {gameDate} {gameTime}
                  </span>
                  <span className="mx-1 lg:mx-2">•</span>
                  <span>{gametype}</span>
                </div>
              </div>
            </div>

            {/* Main Recommendation */}
            <div className="bg-gray-800 p-3 lg:p-4 rounded-lg border border-gray-700 w-full lg:w-auto mt-4 lg:mt-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm lg:text-base">Threshold</span>
                <span className="text-xl lg:text-2xl font-bold">{threshold} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm lg:text-base">Recommendation</span>
                <span className={`text-lg lg:text-2xl font-bold ${recommendationColor} flex items-center`}>
                  {recommendation.toLowerCase().includes("over") ? (
                    <TrendingUp className="mr-1 w-4 h-4 lg:w-5 lg:h-5" />
                  ) : (
                    <TrendingDown className="mr-1 w-4 h-4 lg:w-5 lg:h-5" />
                  )}
                  <span className="truncate">{recommendation}</span>
                </span>
              </div>
            </div>
          </div>

          {/* AI Betting Recommendation */}
          <div className="mt-4 lg:mt-6 bg-gray-800 bg-opacity-50 rounded-lg p-3 lg:p-4 border border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-2">
              <div className="flex items-center mb-2 lg:mb-0">
                <Activity className="text-blue-400 w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                <h2 className="text-lg lg:text-xl font-semibold">AI Betting Recommendation</h2>
              </div>
              <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm">
                <div className="mb-1 sm:mb-0">
                  <span className="text-gray-400">Poisson: </span>
                  <span className={getProbabilityColor(poissonProbability)}>{poissonProbabilityFormatted}</span>
                </div>
                <div>
                  <span className="text-gray-400">Monte Carlo: </span>
                  <span className={getProbabilityColor(monteCarloProbability)}>{monteCarloFormatted}</span>
                </div>
              </div>
            </div>
            <p className="text-gray-300 text-sm lg:text-base">{betExplanation.explanation}</p>
          </div>
        </div>
      </div>

      {/* Key Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-5">
        <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
          <p className="text-gray-400 text-xs lg:text-sm">Season Average</p>
          <p className={`text-lg lg:text-2xl font-bold ${getComparisonColor(seasonAvg, threshold)}`}>
            {formatNumber(seasonAvg)} pts
          </p>
        </div>
        <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
          <p className="text-gray-400 text-xs lg:text-sm">Average Last 5 Games</p>
          <p className={`text-lg lg:text-2xl font-bold ${getComparisonColor(last5RegAvg, threshold)}`}>
            {formatNumber(last5RegAvg)} pts
          </p>
        </div>
        <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
          <p className="text-gray-400 text-xs lg:text-sm">Average Vs. {opponent}</p>
          <p className={`text-lg lg:text-2xl font-bold ${getComparisonColor(vsOpponentAvg, threshold)}`}>
            {formatNumber(vsOpponentAvg)} pts
          </p>
        </div>
        <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
          <p className="text-gray-400 text-xs lg:text-sm">Season Average @ Home</p>
          <p
            className={`text-lg lg:text-2xl font-bold ${getComparisonColor(advancedMetrics["avg_points_home"], threshold)}`}
          >
            {formatNumber(advancedMetrics["avg_points_home"])} pts
          </p>
        </div>
        <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
          <p className="text-gray-400 text-xs lg:text-sm">Season Average @ Away</p>
          <p
            className={`text-lg lg:text-2xl font-bold ${getComparisonColor(advancedMetrics["avg_points_away"], threshold)}`}
          >
            {formatNumber(advancedMetrics["avg_points_away"])} pts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
          <p className="text-gray-400 text-xs lg:text-sm">Regular Season Volatility Forecast</p>
          <p className={`text-lg lg:text-2xl font-bold ${getComparisonColor(volatility_regular, threshold)}`}>
            {formatNumber(volatility_regular)} pts
          </p>
        </div>
        {volatility_PlayOffs != 0 && (
          <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
            <p className="text-gray-400 text-xs lg:text-sm">Playoffs Volatility Forecast</p>
            <p className={`text-lg lg:text-2xl font-bold ${getComparisonColor(volatility_PlayOffs, threshold)}`}>
              {formatNumber(volatility_PlayOffs)} pts
            </p>
          </div>
        )}
        {num_playoff_games !== 0 && (
          <div className="bg-gray-800 p-3 lg:p-4 rounded-lg">
            <p className="text-gray-400 text-xs lg:text-sm">Playoffs Average</p>
            <p className={`text-lg lg:text-2xl font-bold ${getComparisonColor(playoffAvg, threshold)}`}>
              {formatNumber(playoffAvg)} pts
            </p>
          </div>
        )}
      </div>

      {/* Expandable Sections */}
      {/* Recent Encounters Section */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div
          className="flex justify-between items-center p-3 lg:p-4 cursor-pointer hover:bg-gray-700 transition-colors"
          onClick={() => toggleSection("recentEncounters")}
        >
          <h2 className="text-lg lg:text-xl font-semibold">All Season Encounters</h2>
          {expandedSection === "recentEncounters" ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
        {expandedSection === "recentEncounters" && (
          <div className="p-3 lg:p-4 border-t border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-2 text-xs lg:text-sm">Date</th>
                    <th className="pb-2 text-xs lg:text-sm">Opponent</th>
                    <th className="pb-2 text-xs lg:text-sm">Location</th>
                    <th className="pb-2 text-xs lg:text-sm">MIN</th>
                    <th className="pb-2 text-xs lg:text-sm">PTS</th>
                    <th className="pb-2 text-right text-xs lg:text-sm">vs Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {season_games_agst_opp.map((game, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-2 lg:py-3 text-xs lg:text-sm">{game.date}</td>
                      <td className="py-2 lg:py-3">
                        <div className="flex items-center">
                          <ImageWithFallback
                            src={game.opponentLogo || "/placeholder.svg"}
                            alt={game.opponent}
                            className="w-4 h-4 lg:w-5 lg:h-5 mr-1 lg:mr-2"
                            fallbackSrc="/placeholder.svg?height=20&width=20"
                          />
                          <span className="text-xs lg:text-sm truncate">{game.opponentFullName || game.opponent}</span>
                        </div>
                      </td>
                      <td className="py-2 lg:py-3 text-xs lg:text-sm">{game.location}</td>
                      <td className="py-2 lg:py-3 text-xs lg:text-sm">{game.minutes || "N/A"}</td>
                      <td className="py-2 lg:py-3 font-bold text-xs lg:text-sm">{game.points}</td>
                      <td className="py-2 lg:py-3 text-right">
                        {threshold && (
                          <span
                            className={`text-xs lg:text-sm ${game.points > Number.parseFloat(threshold) ? "text-green-500" : "text-red-500"}`}
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

      {/* Add to Picks Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          const [first, last] = name.split(" ")
          const pick_id = `${first.toLowerCase()}_${last.toLowerCase()}_${threshold}`
          onAddToPicks({
            ...playerData,
            id: pick_id, // must be a string
            pick_id, // also store under pick_id
            threshold,
          })
        }}
        className="w-full py-3 lg:py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors min-h-[48px]"
      >
        <Plus className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
        <span>Add to Picks</span>
      </button>
    </div>
  )
}

export default PlayerAnalysisDashboard
