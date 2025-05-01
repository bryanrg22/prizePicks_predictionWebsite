"use client"

import { useState, useEffect } from "react"
import { ChevronDown, X, ChevronRight } from "lucide-react"

const StatsCard = ({ stats, opponent, threshold }) => {
  const [showModal, setShowModal] = useState(false)
  const [displayedGames, setDisplayedGames] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const gamesPerPage = 10 // Show 10 games per page as requested

  // Default to showing 5 games in the main view
  const last5 = stats?.last5Games ?? []

  // Use the last15Games data that comes from the backend
  const allGames = stats?.last15Games || stats?.last5Games || []

  // Log the number of games available for debugging
  console.log("Total games available:", allGames.length)

  // Initialize displayed games when modal opens
  useEffect(() => {
    if (showModal) {
      // Start with the first batch of games when modal opens
      setDisplayedGames(allGames.slice(0, gamesPerPage))
      setCurrentPage(1)
      console.log("Modal opened, showing first", gamesPerPage, "games")
    }
  }, [showModal, allGames])

  // Function to format numbers to 2 decimal places
  const formatNumber = (num) => {
    if (num === undefined || num === null) return "N/A"
    return typeof num === "number" ? num.toFixed(2) : num
  }

  // Function to load the next batch of games
  const loadMoreGames = () => {
    const nextPage = currentPage + 1
    const startIndex = currentPage * gamesPerPage
    const endIndex = nextPage * gamesPerPage

    console.log("Loading more games. Current page:", currentPage, "Next page:", nextPage)
    console.log("Adding games from index", startIndex, "to", endIndex)

    // Add the next batch of games to the displayed games
    const nextBatch = allGames.slice(startIndex, endIndex)
    if (nextBatch.length > 0) {
      setDisplayedGames([...displayedGames, ...nextBatch])
      setCurrentPage(nextPage)
      console.log("Added", nextBatch.length, "more games. Total displayed:", displayedGames.length + nextBatch.length)
    }
  }

  // Check if there are more games to load
  const hasMoreGames = allGames.length > displayedGames.length

  // Log this value for debugging
  console.log("Has more games:", hasMoreGames, "- displayed:", displayedGames.length, "of", allGames.length)

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Player Statistics</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Season Average</p>
          <p className="text-2xl font-bold">{formatNumber(stats.seasonAvgPoints)} pts</p>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Last 5 Games</p>
          <p className="text-2xl font-bold">{formatNumber(stats.last5GamesAvg)} pts</p>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Vs. {opponent}</p>
          <p className="text-2xl font-bold">{formatNumber(stats.seasonAvgVsOpponent)} pts</p>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Home/Away</p>
          <p className="text-2xl font-bold">{formatNumber(stats.homeAwgAvg)} pts</p>
        </div>
      </div>

      <h4 className="text-lg font-semibold mb-3">Recent Games</h4>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="pb-2">Date</th>
              <th className="pb-2">Opponent</th>
              <th className="pb-2">MIN</th>
              <th className="pb-2">PTS</th>
              <th className="pb-2 text-right">vs Threshold</th>
            </tr>
          </thead>
          <tbody>
            {last5.map((game, index) => (
              <tr key={index} className="border-b border-gray-700">
                <td className="py-3">{game.date}</td>
                <td className="py-3">
                  <div className="flex items-center">
                    {game.opponentLogo && (
                      <img
                        src={game.opponentLogo || "/placeholder.svg"}
                        alt={game.opponent}
                        className="w-5 h-5 mr-2"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = "/placeholder.svg?height=30&width=30"
                        }}
                      />
                    )}
                    <span>{game.opponentFullName || game.opponent}</span>
                  </div>
                </td>
                <td className="py-3">{game.minutes || "N/A"}</td>
                <td className="py-3 font-bold">{game.points}</td>
                <td className="py-3 text-right">
                  {threshold && (
                    <span className={game.points > Number.parseFloat(threshold) ? "text-green-500" : "text-red-500"}>
                      {game.points > Number.parseFloat(threshold) ? "OVER" : "UNDER"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="mt-4 flex items-center justify-center w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
      >
        <ChevronDown className="w-4 h-4 mr-1" />
        See More
      </button>

      {/* Modal for showing more games */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold">Game History</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 flex-grow">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-800">
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Opponent</th>
                    <th className="pb-2">MIN</th>
                    <th className="pb-2">PTS</th>
                    <th className="pb-2 text-right">vs Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedGames.map((game, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-3">{game.date}</td>
                      <td className="py-3">
                        <div className="flex items-center">
                          {game.opponentLogo && (
                            <img
                              src={game.opponentLogo || "/placeholder.svg"}
                              alt={game.opponent}
                              className="w-5 h-5 mr-2"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = "/placeholder.svg?height=30&width=30"
                              }}
                            />
                          )}
                          <span>{game.opponentFullName || game.opponent}</span>
                        </div>
                      </td>
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

              {/* Only show the See More Games button if there are more games to load */}
              {hasMoreGames && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={loadMoreGames}
                    className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors"
                  >
                    See More Games
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}

              {/* Game count info */}
              <div className="mt-4 text-xs text-gray-500 text-center">
                Showing {displayedGames.length} of {allGames.length} games
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatsCard
