"use client"

import { useState, useEffect } from "react"
import { Search, Sparkles, TrendingUp, History, Info, X } from "lucide-react"
import ChatGptThinking from "./ChatGptThinking"

const PlayerAnalysisSearch = ({ onSearch, loading, error }) => {
  const [playerName, setPlayerName] = useState("")
  const [pointsThreshold, setPointsThreshold] = useState("")
  const [recentSearches, setRecentSearches] = useState([])
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  const [showTips, setShowTips] = useState(false)

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem("recentPlayerSearches")
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches).slice(0, 5))
      }
    } catch (error) {
      console.error("Error loading recent searches:", error)
    }
  }, [])

  // Save a search to recent searches
  const saveSearch = (name, threshold) => {
    try {
      const search = { name, threshold, timestamp: Date.now() }
      const updatedSearches = [search, ...recentSearches.filter((s) => s.name !== name)].slice(0, 5)
      setRecentSearches(updatedSearches)
      localStorage.setItem("recentPlayerSearches", JSON.stringify(updatedSearches))
    } catch (error) {
      console.error("Error saving recent search:", error)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (playerName.trim() && pointsThreshold) {
      saveSearch(playerName, pointsThreshold)
      onSearch(playerName, pointsThreshold)
    }
  }

  const handleRecentSearchClick = (search) => {
    setPlayerName(search.name)
    setPointsThreshold(search.threshold)
    setShowRecentSearches(false)
    onSearch(search.name, search.threshold)
  }

  const tips = [
    "Enter a player's full name for best results (e.g., 'LeBron James' instead of just 'LeBron')",
    "The points threshold should match what you see on PrizePicks",
    "Our AI analyzes recent games, matchup history, and advanced metrics",
    "Results are most accurate for NBA players with sufficient game history",
  ]

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 lg:p-6 rounded-lg shadow-lg mb-6 lg:mb-8 border border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6">
        <div className="flex items-center mb-2 sm:mb-0">
          <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400 mr-2 lg:mr-3" />
          <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Player Analysis
          </h2>
        </div>
        <button
          onClick={() => setShowTips(!showTips)}
          className="text-gray-400 hover:text-blue-400 transition-colors p-2 rounded-md hover:bg-gray-700 self-start sm:self-auto"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {showTips && (
        <div className="mb-4 lg:mb-6 bg-gray-800/50 p-3 lg:p-4 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-blue-400">Search Tips</h3>
            <button onClick={() => setShowTips(false)} className="text-gray-500 hover:text-gray-300 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mb-4 lg:mb-6 bg-red-900/20 border border-red-800/50 text-red-300 p-3 lg:p-4 rounded-lg">
          <p className="text-sm lg:text-base">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 mb-4">
          <div className="lg:col-span-8 relative">
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-1">
              Player Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="playerName"
                className="w-full px-4 py-3 lg:py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-10 text-base"
                placeholder="e.g. LeBron James"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onFocus={() => setShowRecentSearches(true)}
                onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                required
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

              {showRecentSearches && recentSearches.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
                  <div className="p-2 border-b border-gray-700 flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-medium">Recent Searches</span>
                    <History className="w-3 h-3 text-gray-500" />
                  </div>
                  <ul>
                    {recentSearches.map((search, index) => (
                      <li
                        key={index}
                        className="px-3 py-3 hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                        onClick={() => handleRecentSearchClick(search)}
                      >
                        <div>
                          <span className="text-white">{search.name}</span>
                          <span className="text-gray-400 text-xs ml-2">({search.threshold} pts)</span>
                        </div>
                        <TrendingUp className="w-3 h-3 text-blue-400" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <label htmlFor="pointsThreshold" className="block text-sm font-medium text-gray-300 mb-1">
              Points Threshold
            </label>
            <input
              type="number"
              id="pointsThreshold"
              className="w-full px-4 py-3 lg:py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
              placeholder="e.g. 19.5"
              value={pointsThreshold}
              onChange={(e) => setPointsThreshold(e.target.value)}
              step="0.5"
              min="0"
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className={`px-4 lg:px-6 py-3 rounded-lg font-medium flex items-center justify-center min-w-[140px] min-h-[48px] transition-all ${
              loading
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/20"
            }`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <span className="mr-2">Analyzing</span>
                <span className="flex space-x-1">
                  <span
                    className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"
                    style={{ animationDelay: "200ms" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"
                    style={{ animationDelay: "400ms" }}
                  ></span>
                </span>
              </span>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                <span>Analyze</span>
              </>
            )}
          </button>
        </div>
      </form>

      {loading && (
        <div className="mt-6 lg:mt-8 border-t border-gray-700 pt-6 lg:pt-8">
          <ChatGptThinking text="Analyzing player statistics and calculating probabilities..." />
        </div>
      )}
    </div>
  )
}

export default PlayerAnalysisSearch
