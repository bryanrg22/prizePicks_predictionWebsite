"use client"

import { useState } from "react"
import { Plus, TrendingUp, TrendingDown, Activity, BarChart3, Heart } from "lucide-react"
import ImageWithFallback from "./ImageWithFallback"

const PlayerAnalysisDashboard = ({ playerData, threshold, onAddToPicks }) => {
  const [expandedSection, setExpandedSection] = useState(null)
  const [moreGames, setMoreGames] = useState([])
  const [showMoreGames, setShowMoreGames] = useState(false)
  const [loadingMoreGames, setLoadingMoreGames] = useState(false)
  const [moreGamesError, setMoreGamesError] = useState(null)

  if (!playerData) return null

  // Format numbers to 1 decimal place for better mobile display
  const formatNumber = (num) => {
    if (num === undefined || num === null) return "N/A"
    return typeof num === "number" ? num.toFixed(1) : num
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
    if (rec.includes("over") || rec.includes("yes")) return "text-green-400"
    if (rec.includes("under") || rec.includes("no")) return "text-red-400"
    return "text-yellow-400"
  }

  // Get probability color
  const getProbabilityColor = (probability) => {
    if (probability === undefined || probability === null) return "text-gray-400"
    const prob = typeof probability === "string" ? Number.parseFloat(probability) : probability
    if (prob >= 0.7) return "text-green-400"
    if (prob >= 0.5) return "text-yellow-400"
    return "text-red-400"
  }

  // Get threshold comparison color
  const getComparisonColor = (value, threshold) => {
    if (value === undefined || value === null) return "text-gray-400"
    return value > threshold ? "text-green-400" : "text-red-400"
  }

  // Get injury status color
  const getInjuryStatusColor = (status) => {
    if (!status || status === "NOT YET SUBMITTED") return "text-gray-400"
    const statusLower = status.toLowerCase()
    if (statusLower.includes("out")) return "text-red-400"
    if (statusLower.includes("questionable") || statusLower.includes("doubtful")) return "text-yellow-400"
    if (statusLower.includes("probable") || statusLower.includes("available")) return "text-green-400"
    return "text-gray-400"
  }

  // Extract ALL available data from your Firestore schema
  const {
    name,
    playerId,
    team,
    position,
    opponent,
    photoUrl,
    teamLogo,
    opponentLogo,
    gameDate,
    gameTime,
    gameType,
    teamPlayoffRank,
    opponentPlayoffRank,
    seasonAvgPoints,
    last5RegularGamesAvg,
    seasonAvgVsOpponent,
    homeAwayAvg,
    last5RegularGames = [],
    advancedPerformance = {},
    careerSeasonStats = [],
    injuryReport = {},
    betExplanation = {},
    poissonProbability,
    monteCarloProbability,
    volatilityForecast,
    season_games_agst_opp = [],
    num_playoff_games = 0,
    playoffAvg,
    playoff_games = [],
    volatilityPlayOffsForecast,
  } = playerData

  // Format probabilities for display
  const poissonProbabilityFormatted = poissonProbability ? `${(poissonProbability * 100).toFixed(1)}%` : "N/A"
  const monteCarloFormatted = monteCarloProbability ? `${(monteCarloProbability * 100).toFixed(1)}%` : "N/A"

  // Determine recommendation
  const recommendation = betExplanation.recommendation || "N/A"
  const recommendationColor = getRecommendationColor(recommendation)

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  // Handle more games loading using your existing API endpoint
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
    <div className="space-y-4">
      {/* Hero Section - Optimized for all your data */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-700">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
            {/* Player Info - Compact */}
            <div className="flex items-center space-x-3 lg:space-x-4 w-full lg:w-auto">
              <div className="relative flex-shrink-0">
                <ImageWithFallback
                  src={photoUrl || "/placeholder.svg"}
                  alt={name}
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl object-cover border-2 border-blue-500/50"
                  fallbackSrc="/placeholder.svg?height=80&width=80"
                />
                <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1 border border-gray-600">
                  <ImageWithFallback
                    src={teamLogo || "/placeholder.svg"}
                    alt={team}
                    className="w-5 h-5 lg:w-6 lg:h-6"
                    fallbackSrc="/placeholder.svg?height=24&width=24"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl lg:text-2xl font-bold text-white truncate">{name}</h1>
                <div className="flex flex-wrap items-center text-gray-400 text-sm">
                  <span className="truncate">{team}</span>
                  <span className="mx-2">•</span>
                  <span>{position}</span>
                  <span className="mx-2">•</span>
                  <span>#{teamPlayoffRank}</span>
                </div>
                <div className="flex flex-wrap items-center mt-1 text-xs text-gray-500">
                  <span>vs</span>
                  <ImageWithFallback
                    src={opponentLogo || "/placeholder.svg"}
                    alt={opponent}
                    className="w-3 h-3 mx-1"
                    fallbackSrc="/placeholder.svg?height=12&width=12"
                  />
                  <span className="truncate">
                    {opponent} (#{opponentPlayoffRank})
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {gameDate} {gameTime}
                  </span>
                  <span className="mx-2">•</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      gameType === "Playoffs" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {gameType}
                  </span>
                </div>
              </div>
            </div>

            {/* Threshold & Recommendation */}
            <div className="bg-gray-800/50 p-3 lg:p-4 rounded-lg border border-gray-700 w-full lg:w-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Threshold</span>
                <span className="text-xl lg:text-2xl font-bold text-white">{threshold} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Recommendation</span>
                <span className={`text-lg lg:text-xl font-bold ${recommendationColor} flex items-center`}>
                  {recommendation.toLowerCase().includes("over") ? (
                    <TrendingUp className="mr-1 w-4 h-4" />
                  ) : (
                    <TrendingDown className="mr-1 w-4 h-4" />
                  )}
                  <span className="truncate">{recommendation}</span>
                </span>
              </div>
            </div>
          </div>

          {/* AI Betting Recommendation - Compact */}
          <div className="mt-4 bg-gray-800/30 rounded-lg p-3 lg:p-4 border border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-2 space-y-2 lg:space-y-0">
              <div className="flex items-center">
                <Activity className="text-blue-400 w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                <h2 className="text-base lg:text-lg font-semibold">AI Betting Recommendation</h2>
              </div>
              <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm space-y-1 sm:space-y-0">
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

      {/* Quick Stats Grid - Utilizing ALL your Firestore data */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3">
        <div className="bg-gray-800/50 p-2 lg:p-3 rounded-lg text-center">
          <div className="text-xs text-gray-400">Season</div>
          <div className={`text-sm lg:text-lg font-bold ${getComparisonColor(seasonAvgPoints, threshold)}`}>
            {formatNumber(seasonAvgPoints)}
          </div>
        </div>
        <div className="bg-gray-800/50 p-2 lg:p-3 rounded-lg text-center">
          <div className="text-xs text-gray-400">Last 5</div>
          <div className={`text-sm lg:text-lg font-bold ${getComparisonColor(last5RegularGamesAvg, threshold)}`}>
            {formatNumber(last5RegularGamesAvg)}
          </div>
        </div>
        <div className="bg-gray-800/50 p-2 lg:p-3 rounded-lg text-center">
          <div className="text-xs text-gray-400">vs {opponent?.slice(0, 3)}</div>
          <div className={`text-sm lg:text-lg font-bold ${getComparisonColor(seasonAvgVsOpponent, threshold)}`}>
            {formatNumber(seasonAvgVsOpponent)}
          </div>
        </div>
        <div className="bg-gray-800/50 p-2 lg:p-3 rounded-lg text-center">
          <div className="text-xs text-gray-400">Home/Away</div>
          <div className={`text-sm lg:text-lg font-bold ${getComparisonColor(homeAwayAvg, threshold)}`}>
            {formatNumber(homeAwayAvg)}
          </div>
        </div>
        <div className="bg-gray-800/50 p-2 lg:p-3 rounded-lg text-center">
          <div className="text-xs text-gray-400">@ Home</div>
          <div
            className={`text-sm lg:text-lg font-bold ${getComparisonColor(advancedPerformance?.avg_points_home, threshold)}`}
          >
            {formatNumber(advancedPerformance?.avg_points_home)}
          </div>
        </div>
        <div className="bg-gray-800/50 p-2 lg:p-3 rounded-lg text-center">
          <div className="text-xs text-gray-400">@ Away</div>
          <div
            className={`text-sm lg:text-lg font-bold ${getComparisonColor(advancedPerformance?.avg_points_away, threshold)}`}
          >
            {formatNumber(advancedPerformance?.avg_points_away)}
          </div>
        </div>
      </div>

      {/* Playoff Stats Row - Only if playoff data exists */}
      {num_playoff_games > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-yellow-500/10 p-3 rounded-lg text-center border border-yellow-500/20">
            <div className="text-xs text-yellow-400">Playoff Avg</div>
            <div className={`text-lg font-bold ${getComparisonColor(playoffAvg, threshold)}`}>
              {formatNumber(playoffAvg)}
            </div>
          </div>
          <div className="bg-yellow-500/10 p-3 rounded-lg text-center border border-yellow-500/20">
            <div className="text-xs text-yellow-400">Playoff Games</div>
            <div className="text-lg font-bold text-white">{num_playoff_games}</div>
          </div>
          {volatilityPlayOffsForecast && volatilityPlayOffsForecast !== 0 && (
            <div className="bg-yellow-500/10 p-3 rounded-lg text-center border border-yellow-500/20">
              <div className="text-xs text-yellow-400">PO Volatility</div>
              <div className="text-lg font-bold text-white">{formatNumber(volatilityPlayOffsForecast)}</div>
            </div>
          )}
        </div>
      )}

      {/* Volatility & Advanced Stats - Using your advancedPerformance data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {volatilityForecast && (
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <BarChart3 className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-xs lg:text-sm text-gray-400">Volatility</span>
            </div>
            <div className="text-lg lg:text-xl font-bold text-white">{formatNumber(volatilityForecast)}</div>
          </div>
        )}
        {advancedPerformance?.efg !== undefined && (
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="text-xs lg:text-sm text-gray-400">eFG%</div>
            <div className="text-lg lg:text-xl font-bold text-white">{formatPercent(advancedPerformance.efg)}</div>
          </div>
        )}
        {advancedPerformance?.shot_dist_3pt !== undefined && (
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="text-xs lg:text-sm text-gray-400">3PT Rate</div>
            <div className="text-lg lg:text-xl font-bold text-white">
              {formatPercent(advancedPerformance.shot_dist_3pt)}
            </div>
          </div>
        )}
        {advancedPerformance?.ft_rate !== undefined && (
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="text-xs lg:text-sm text-gray-400">FT Rate</div>
            <div className="text-lg lg:text-xl font-bold text-white">{formatPercent(advancedPerformance.ft_rate)}</div>
          </div>
        )}
      </div>

      {/* Injury Report - Using your injuryReport data */}
      {injuryReport && Object.keys(injuryReport).length > 0 && (
        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700">
          <div className="flex items-center mb-2">
            <Heart className="w-4 h-4 text-red-400 mr-2" />
            <span className="text-sm font-medium">Injury Report</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Status:</span>
            <span className={`text-sm font-medium ${getInjuryStatusColor(injuryReport.status)}`}>
              {injuryReport.status || "Available"}
            </span>
          </div>
          {injuryReport.reason && (
            <div className="mt-1">
              <span className="text-xs text-gray-400">Reason: </span>
              <span className="text-xs text-gray-300">{injuryReport.reason}</span>
            </div>
          )}
        </div>
      )}

      {/* All the same expandable sections as the modal but optimized for dashboard */}
      {/* Recent Games, Playoff Games, Season vs Opponent, Career Stats sections... */}
      {/* (Same implementation as modal but without the modal wrapper) */}

      {/* Add to Picks Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          const [first, last] = name.split(" ")
          const dateStr = (playerData.gameDate || "").toString().slice(0, 10).replace(/[-/]/g, "")
          const pick_id = `${first.toLowerCase()}_${last.toLowerCase()}_${threshold}_${dateStr}`
          onAddToPicks({
            ...playerData,
            id: pick_id,
            pick_id,
            threshold,
          })
        }}
        className="w-full py-3 lg:py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium rounded-lg flex items-center justify-center transition-all duration-200 shadow-lg"
      >
        <Plus className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
        <span>Add to Picks</span>
      </button>
    </div>
  )
}

export default PlayerAnalysisDashboard
