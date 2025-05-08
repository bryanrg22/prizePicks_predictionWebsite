"use client"

import { useState } from "react"
import { Plus, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity, BarChart2 } from "lucide-react"
import ImageWithFallback from "./ImageWithFallback"


  const PlayerAnalysisDashboard = ({ playerData, threshold, onAddToPicks }) => {
  const [expandedSection, setExpandedSection] = useState("main")

  const [moreGames, setMoreGames] = useState([]);
  const [showMoreGames, setShowMoreGames] = useState(false);
  const [loadingMoreGames, setLoadingMoreGames] = useState(false);
  const [moreGamesError, setMoreGamesError] = useState(null);

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
      // simply hide if already showing
      return setShowMoreGames(false);
    }
    setLoadingMoreGames(true);
    setMoreGamesError(null);
    try {
      const res = await fetch(
        `/api/player/${playerData.playerId}/more_games`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMoreGames(data);
      setShowMoreGames(true);
    } catch (err) {
      console.error(err);
      setMoreGamesError("Failed to load more games.");
    } finally {
      setLoadingMoreGames(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section with Player Info and Main Recommendation */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            {/* Player Info */}
            <div className="flex items-center mb-4 md:mb-0">
              <div className="relative">
                <ImageWithFallback
                  src={photoUrl || "/placeholder.svg"}
                  alt={name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
                  fallbackSrc="/placeholder.svg?height=96&width=96"
                />
                <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1 border border-gray-700">
                  <ImageWithFallback
                    src={teamLogo || "/placeholder.svg"}
                    alt={team}
                    className="w-8 h-8"
                    fallbackSrc="/placeholder.svg?height=32&width=32"
                  />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold">{name}</h1>
                <div className="flex items-center text-gray-400">
                  <span>{team}</span>
                  <span className="mx-2">•</span>
                  <span>{position}</span>
                  <span className="mx-2">•</span>
                  <span>Rank: {teamRank}</span>
                </div>
                <div className="flex items-center mt-1 text-sm">
                  <span className="text-gray-400">vs</span>
                  <ImageWithFallback
                    src={opponentLogo || "/placeholder.svg"}
                    alt={opponent}
                    className="w-4 h-4 mx-1"
                    fallbackSrc="/placeholder.svg?height=16&width=16"
                  />
                  <span>
                    {opponent} (Rank: {opponentRank})
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {gameDate} {gameTime}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{gametype}</span>
                </div>
              </div>
            </div>

            {/* Main Recommendation */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 w-full md:w-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Threshold</span>
                <span className="text-2xl font-bold">{threshold} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Recommendation</span>
                <span className={`text-2xl font-bold ${recommendationColor} flex items-center`}>
                  {recommendation.toLowerCase().includes("over") ? (
                    <TrendingUp className="mr-1" />
                  ) : (
                    <TrendingDown className="mr-1" />
                  )}
                  {recommendation}
                </span>
              </div>
            </div>
          </div>

          {/* AI Betting Recommendation */}
          <div className="mt-6 bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Activity className="text-blue-400 w-5 h-5 mr-2" />
                <h2 className="text-xl font-semibold">AI Betting Recommendation</h2>
              </div>
              <div className="flex space-x-4 text-sm">
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
            <p className="text-gray-300">{betExplanation.explanation}</p>
          </div>
        </div>
      </div>

      {/* Key Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Season Average</p>
          <p className={`text-2xl font-bold ${getComparisonColor(seasonAvg, threshold)}`}>
            {formatNumber(seasonAvg)} pts
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Average Last 5 Games</p>
          <p className={`text-2xl font-bold ${getComparisonColor(last5RegAvg, threshold)}`}>
            {formatNumber(last5RegAvg)} pts
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Average Vs. {opponent}</p>
          <p className={`text-2xl font-bold ${getComparisonColor(vsOpponentAvg, threshold)}`}>
            {formatNumber(vsOpponentAvg)} pts
          </p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Season Average @ Home</p>
          <p className={`text-2xl font-bold ${getComparisonColor(advancedMetrics['avg_points_home'], threshold)}`}>
            {formatNumber(advancedMetrics['avg_points_home'])} pts
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Season Average @ Away</p>
          <p className={`text-2xl font-bold ${getComparisonColor(advancedMetrics['avg_points_away'], threshold)}`}>
            {formatNumber(advancedMetrics['avg_points_away'])} pts
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Regular Season Volatility Forecast</p>
          <p
            className={`text-2xl font-bold ${
              getComparisonColor(volatility_regular, threshold)
            }`}
          >
            {formatNumber(volatility_regular)} pts
          </p>
        </div>
        {/* only render this block if there are playoffs games */}
        {volatility_PlayOffs != 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Playoffs Volatility Forecast</p>
            <p
              className={`text-2xl font-bold ${
                getComparisonColor(volatility_PlayOffs, threshold)
              }`}
            >
              {formatNumber(volatility_PlayOffs)} pts
            </p>
          </div>
        )}
        {/* only render this block if there are playoffs games */}
        {num_playoff_games !== 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Playoffs Average</p>
            <p
              className={`text-2xl font-bold ${
                getComparisonColor(playoffAvg, threshold)
              }`}
            >
              {formatNumber(playoffAvg)} pts
            </p>
          </div>
        )}
      </div>
      
      {/* Recent Encounters Section */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div
          className="flex justify-between items-center p-4 cursor-pointer"
          onClick={() => toggleSection("recentEncounters")}
        >
          <h2 className="text-xl font-semibold">All Season Encounters</h2>
          {expandedSection === "recentEncounters" ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
        {expandedSection === "recentEncounters" && (
          <div className="p-4 border-t border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Opponent</th>
                    <th className="pb-2">Location</th>
                    <th className="pb-2">MIN</th>
                    <th className="pb-2">PTS</th>
                    <th className="pb-2 text-right">vs Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {season_games_agst_opp.map((game, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-3">{game.date}</td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <ImageWithFallback
                            src={game.opponentLogo || "/placeholder.svg"}
                            alt={game.opponent}
                            className="w-5 h-5 mr-2"
                            fallbackSrc="/placeholder.svg?height=20&width=20"
                          />
                          <span>{game.opponentFullName || game.opponent}</span>
                        </div>
                      </td>
                      <td className="py-3">{game.location}</td>
                      <td className="py-3">{game.minutes || "N/A"}</td>
                      <td className="py-3 font-bold">{game.points}</td>
                      <td className="py-3 text-right">
                        {threshold && (
                          <span
                            className={game.points > Number.parseFloat(threshold) ? "text-green-500" : "text-red-500"}
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

      {/* Playoffs Game Log */}
      {num_playoff_games !== 0 && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div
            className="flex justify-between items-center p-4 cursor-pointer"
            onClick={() => toggleSection("playoffsLog")}
          >
            <h2 className="text-xl font-semibold">Playoffs Game Log</h2>
            {expandedSection === "playoffsLog" ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
          {expandedSection === "playoffsLog" && (
            <div className="p-4 border-t border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Opponent</th>
                      <th className="pb-2">Location</th>
                      <th className="pb-2">MIN</th>
                      <th className="pb-2">PTS</th>
                      <th className="pb-2 text-right">vs Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playoff_games.map((game, index) => (
                      <tr key={index} className="border-b border-gray-700">
                        <td className="py-3">{game.date}</td>
                        <td className="py-3">
                          <div className="flex items-center">
                            <ImageWithFallback
                              src={game.opponentLogo || "/placeholder.svg"}
                              alt={game.opponent}
                              className="w-5 h-5 mr-2"
                              fallbackSrc="/placeholder.svg?height=20&width=20"
                            />
                            <span>{game.opponentFullName || game.opponent}</span>
                          </div>
                        </td>
                        <td className="py-3">{game.location}</td>
                        <td className="py-3">{game.minutes || "N/A"}</td>
                        <td className="py-3 font-bold">{game.points}</td>
                        <td className="py-3 text-right">
                          {threshold && (
                            <span
                              className={game.points > Number.parseFloat(threshold) ? "text-green-500" : "text-red-500"}
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
      )}

      {/* Recent Games Section */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div
          className="flex justify-between items-center p-4 cursor-pointer"
          onClick={() => toggleSection("recentGames")}
        >
          <h2 className="text-xl font-semibold">Recent Regular Season Games</h2>
          {expandedSection === "recentGames" ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {expandedSection === "recentGames" && (
          <div className="p-4 border-t border-gray-700 flex flex-col">
            {/* first 5 games */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Opponent</th>
                    <th className="pb-2">Location</th>
                    <th className="pb-2">MIN</th>
                    <th className="pb-2">PTS</th>
                    <th className="pb-2 text-right">vs Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {last5RegularGames.map((game, idx) => (
                    <tr key={idx} className="border-b border-gray-700">
                      <td className="py-3">{game.date}</td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <ImageWithFallback
                            src={game.opponentLogo || "/placeholder.svg"}
                            alt={game.opponentFullName || game.opponent}
                            className="w-5 h-5 mr-2"
                            fallbackSrc="/placeholder.svg?height=20&width=20"
                          />
                          <span>{game.opponentFullName || game.opponent}</span>
                        </div>
                      </td>
                      <td className="py-3">{game.location}</td>
                      <td className="py-3">{game.minutes || "N/A"}</td>
                      <td className="py-3 font-bold">{game.points}</td>
                      <td className="py-3 text-right">
                        {threshold && (
                          <span
                            className={
                              game.points > parseFloat(threshold)
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {game.points > parseFloat(threshold) ? "OVER" : "UNDER"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* extra games (conditionally) */}
            {showMoreGames && moreGames.length > 0 && (
              <div className="overflow-x-auto mt-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Opponent</th>
                      <th className="pb-2">Location</th>
                      <th className="pb-2">MIN</th>
                      <th className="pb-2">PTS</th>
                      <th className="pb-2 text-right">vs Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moreGames.map((game, idx) => (
                      <tr key={idx} className="border-b border-gray-700">
                        <td className="py-3">{game.date}</td>
                        <td className="py-3">
                          <div className="flex items-center">
                            <ImageWithFallback
                              src={game.opponentLogo || "/placeholder.svg"}
                              alt={game.opponentFullName || game.opponent}
                              className="w-5 h-5 mr-2"
                              fallbackSrc="/placeholder.svg?height=20&width=20"
                            />
                            <span>{game.opponentFullName || game.opponent}</span>
                          </div>
                        </td>
                        <td className="py-3">{game.location}</td>
                        <td className="py-3">{game.minutes ?? "N/A"}</td>
                        <td className="py-3 font-bold">{game.points}</td>
                        <td className="py-3 text-right">
                          {threshold && (
                            <span
                              className={
                                game.points > parseFloat(threshold)
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              {game.points > parseFloat(threshold)
                                ? "OVER"
                                : "UNDER"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* error message */}
            {moreGamesError && (
              <p className="text-red-400 text-center mt-4">{moreGamesError}</p>
            )}

            {/* See More / See Less button always at bottom */}
            <div className="mt-auto flex justify-center">
              <button
                onClick={handleToggleMoreGames}
                disabled={loadingMoreGames}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingMoreGames
                  ? "Loading…"
                  : showMoreGames
                  ? "See Less Games"
                  : "See More Games"}
              </button>
            </div>
          </div>
        )}
      </div>


      
      {/* Injury Status Section */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div
          className="flex justify-between items-center p-4 cursor-pointer"
          onClick={() => toggleSection("injuryStatus")}
        >
          <h2 className="text-xl font-semibold">Injury Status</h2>
          {expandedSection === "injuryStatus" ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
        {expandedSection === "injuryStatus" && (
          <div className="p-4 border-t border-gray-700">
            {injuryReport.found ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Activity
                    className={`w-5 h-5 mr-2 ${
                      injuryReport.status?.toLowerCase() === "out"
                        ? "text-red-500"
                        : injuryReport.status?.toLowerCase() === "doubtful"
                          ? "text-orange-500"
                          : injuryReport.status?.toLowerCase() === "questionable"
                            ? "text-yellow-500"
                            : "text-green-500"
                    }`}
                  />
                  <span
                    className={`text-lg font-bold ${
                      injuryReport.status?.toLowerCase() === "out"
                        ? "text-red-500"
                        : injuryReport.status?.toLowerCase() === "doubtful"
                          ? "text-orange-500"
                          : injuryReport.status?.toLowerCase() === "questionable"
                            ? "text-yellow-500"
                            : "text-green-500"
                    }`}
                  >
                    {injuryReport.status || "Unknown"}
                  </span>
                </div>
                {injuryReport.reason && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-300">{injuryReport.reason}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-900 bg-opacity-30 p-4 rounded-lg flex items-start">
                <Activity className="text-green-400 w-5 h-5 mr-2" />
                <div>
                  <p className="text-green-300 font-medium">No Injury Reported</p>
                  <p className="text-green-400 text-sm mt-1">{name} is not listed on the latest NBA injury report.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Monte Carlo Section */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div
          className="flex justify-between items-center p-4 cursor-pointer"
          onClick={() => toggleSection("monteCarlo")}
        >
          <h2 className="text-xl font-semibold">Monte Carlo Simulation</h2>
          {expandedSection === "monteCarlo" ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
        {expandedSection === "monteCarlo" && (
          <div className="p-4 border-t border-gray-700">
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-400">Probability Over {threshold} Points</p>
                  <p className={`text-2xl font-bold ${getProbabilityColor(monteCarloProbability)}`}>
                    {monteCarloFormatted}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Distribution Type</p>
                  <p className="text-gray-300">normal</p>
                </div>
              </div>

              <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg flex items-start">
                <BarChart2 className="text-blue-400 w-5 h-5 mr-2" />
                <div>
                  <p className="text-blue-300 font-medium">What is Monte Carlo Simulation?</p>
                  <p className="text-blue-400 text-sm mt-1">
                    Monte Carlo simulation runs thousands of random scenarios based on historical data to predict the
                    probability of a player exceeding their points threshold. It accounts for variability in performance
                    and provides a more robust prediction than simple averages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Metrics Section */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div
          className="flex justify-between items-center p-4 cursor-pointer"
          onClick={() => toggleSection("advancedMetrics")}
        >
          <h2 className="text-xl font-semibold">Advanced Metrics</h2>
          {expandedSection === "advancedMetrics" ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
        {expandedSection === "advancedMetrics" && (
          <div className="p-4 border-t border-gray-700">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Effective FG%</p>
                  <p className="text-2xl font-bold">{formatPercent(advancedMetrics.efg)}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">3PT Shot Distribution</p>
                  <p className="text-2xl font-bold">{formatPercent(advancedMetrics.shot_dist_3pt)}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">FT Rate</p>
                  <p className="text-2xl font-bold">{formatPercent(advancedMetrics.ft_rate)}</p>
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3">Home vs Away Splits</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400">Home Average</p>
                    <p className="text-xl font-bold">{formatNumber(advancedMetrics.avg_points_home)} pts</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Away Average</p>
                    <p className="text-xl font-bold">{formatNumber(advancedMetrics.avg_points_away)} pts</p>
                  </div>
                </div>
              </div>

              {careerStats.length > 0 && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-3">Career Season Stats</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-700">
                          <th className="pb-2">Season</th>
                          <th className="pb-2">Team</th>
                          <th className="pb-2">GP</th>
                          <th className="pb-2">PPG</th>
                          <th className="pb-2">FG%</th>
                          <th className="pb-2">3P%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {careerStats.map((season, index) => (
                          <tr key={index} className="border-b border-gray-700">
                            <td className="py-2">{season.SEASON_ID}</td>
                            <td className="py-2">{season.TEAM_ABBREVIATION}</td>
                            <td className="py-2">{season.GP}</td>
                            <td className="py-2">{(season.PTS / season.GP).toFixed(1)}</td>
                            <td className="py-2">{(season.FG_PCT * 100).toFixed(1)}%</td>
                            <td className="py-2">{(season.FG3_PCT * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add to Picks Button */}
      <button
        onClick={onAddToPicks}
        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" />
        <span>Add to Picks</span>
      </button>
    </div>
  )
}

export default PlayerAnalysisDashboard
