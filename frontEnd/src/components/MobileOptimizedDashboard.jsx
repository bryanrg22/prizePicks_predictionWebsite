"use client"
import { Search, Plus, Lock, TrendingUp, TrendingDown, Trash2 } from "lucide-react"
import PlayerCard from "./PlayerCard"
import StatsCard from "./StatsCard"
import RecommendationCard from "./RecommendationCard"

export default function MobileOptimizedDashboard({
  picks,
  handleRemovePick,
  handleLockIn,
  searchPerformed,
  mockPlayerData,
  pointsThreshold,
  handleAddToPicks,
  playerName,
  setPlayerName,
  setPointsThreshold,
  handleSearch,
  loading,
}) {
  // Fallback image in case the NBA API image fails to load
  const handleImageError = (e) => {
    e.target.src = "/placeholder.svg"
  }

  return (
    <div className="space-y-6">
      {/* Current Picks */}
      {picks.length > 0 && (
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-xl md:text-2xl font-bold">Your Picks ({picks.length}/6)</h2>
            <button
              onClick={handleLockIn}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md flex items-center justify-center"
              disabled={picks.length < 2}
            >
              <Lock className="w-4 h-4 mr-2" />
              <span>Lock In Picks</span>
            </button>
          </div>

          <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
            {picks.map((pick) => (
              <div key={pick.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <img
                    src={pick.photoUrl || "/placeholder.svg"}
                    alt={pick.player}
                    className="w-12 h-12 rounded-full object-cover mr-3 flex-shrink-0"
                    onError={handleImageError}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{pick.player}</p>
                    <div className="flex items-center">
                      {pick.teamLogo && (
                        <img
                          src={pick.teamLogo || "/placeholder.svg"}
                          alt={`${pick.team} logo`}
                          className="w-4 h-4 mr-1 object-contain flex-shrink-0"
                          onError={handleImageError}
                        />
                      )}
                      <p className="text-sm text-gray-400 truncate">
                        {pick.threshold} pts ({pick.recommendation})
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{pick.gameDate}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePick(pick.id)}
                  className="p-2 text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Player Analysis</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-4 md:flex md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-400 mb-1">
                Player Name
              </label>
              <input
                type="text"
                id="playerName"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. LeBron James"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
              />
            </div>
            <div className="md:w-48">
              <label htmlFor="pointsThreshold" className="block text-sm font-medium text-gray-400 mb-1">
                Points Threshold
              </label>
              <input
                type="number"
                id="pointsThreshold"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span>Analyzing...</span>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Player Stats Display */}
      {searchPerformed && (
        <div className="space-y-6">
          {/* Player Info Card */}
          <PlayerCard player={mockPlayerData} />

          {/* Stats and Recommendation Cards */}
          <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            <StatsCard stats={mockPlayerData} opponent={mockPlayerData.opponent} threshold={pointsThreshold} />
            <RecommendationCard playerData={mockPlayerData} threshold={pointsThreshold} />
          </div>

          {/* Last 5 Games Card */}
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg">
            <h3 className="text-lg md:text-xl font-bold mb-4">Last 5 Games</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-2 text-sm">Date</th>
                    <th className="pb-2 text-sm">Opponent</th>
                    <th className="pb-2 text-sm">Points</th>
                    <th className="pb-2 text-right text-sm">vs Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPlayerData.last5Games.map((game, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-3 text-sm">{game.date}</td>
                      <td className="py-3 text-sm">{game.opponent}</td>
                      <td className="py-3 font-bold text-sm">{game.points}</td>
                      <td className="py-3 text-right text-sm">
                        {pointsThreshold && (
                          <span
                            className={
                              game.points > Number.parseFloat(pointsThreshold) ? "text-green-500" : "text-red-500"
                            }
                          >
                            {game.points > Number.parseFloat(pointsThreshold) ? (
                              <TrendingUp className="inline w-4 h-4 mr-1" />
                            ) : (
                              <TrendingDown className="inline w-4 h-4 mr-1" />
                            )}
                            {game.points > Number.parseFloat(pointsThreshold) ? "OVER" : "UNDER"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add to Picks Button */}
          <button
            onClick={handleAddToPicks}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span>Add to Picks</span>
          </button>
        </div>
      )}
    </div>
  )
}
