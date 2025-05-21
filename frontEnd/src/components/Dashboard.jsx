"use client"
import { Search, Plus, Lock, TrendingUp, TrendingDown, Trash2 } from "lucide-react"
import PlayerCard from "./PlayerCard"
import StatsCard from "./StatsCard"
import RecommendationCard from "./RecommendationCard"

export default function Dashboard({
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
      )}

      {/* Search Form */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-bold mb-4">Player Analysis</h2>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-400 mb-1">
              Player Name
            </label>
            <input
              type="text"
              id="playerName"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. LeBron James"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
          </div>
          <div className="w-full md:w-48">
            <label htmlFor="pointsThreshold" className="block text-sm font-medium text-gray-400 mb-1">
              Points Threshold
            </label>
            <input
              type="number"
              id="pointsThreshold"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 19.5"
              value={pointsThreshold}
              onChange={(e) => setPointsThreshold(e.target.value)}
              step="0.5"
              min="0"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Player Info Card */}
          <div className="lg:col-span-3">
            <PlayerCard player={mockPlayerData} />
          </div>

          {/* Stats Card */}
          <div>
            <StatsCard stats={mockPlayerData} opponent={mockPlayerData.opponent} threshold={pointsThreshold} />
          </div>

          {/* Recommendation Card */}
          <div>
            <RecommendationCard playerData={mockPlayerData} threshold={pointsThreshold} />
          </div>

          {/* Last 5 Games Card */}
          <div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Last 5 Games</h3>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Opponent</th>
                      <th className="pb-2">Points</th>
                      <th className="pb-2 text-right">vs Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPlayerData.last5Games.map((game, index) => (
                      <tr key={index} className="border-b border-gray-700">
                        <td className="py-3">{game.date}</td>
                        <td className="py-3">{game.opponent}</td>
                        <td className="py-3 font-bold">{game.points}</td>
                        <td className="py-3 text-right">
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
          </div>

          {/* Add to Picks Button */}
          <div className="lg:col-span-3">
            <button
              onClick={handleAddToPicks}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span>Add to Picks</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
