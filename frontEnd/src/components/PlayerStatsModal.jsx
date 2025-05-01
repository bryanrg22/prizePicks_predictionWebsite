"use client"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import ImageWithFallback from "./ImageWithFallback"
import { getProcessedPlayer } from "../services/firebaseService"

const PlayerStatsModal = ({ player, onClose }) => {
  const [playerData, setPlayerData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!player) return

      try {
        setLoading(true)

        // Determine lookup keys
        const playerName = player.player || player.playerName || player.name
        const threshold  = player.threshold

        if (playerName && threshold != null) {
          // Try to load from processedPlayers/{playerKey}/thresholds/{threshold}
          const proc = await getProcessedPlayer(playerName, threshold)
          if (proc) {
            console.log("Loaded processedPlayers entry:", proc)
            setPlayerData(proc)
          } else {
            console.log("No processedPlayers entry; falling back to prop")
            setPlayerData(player)
          }
        } else {
          console.log("Missing name or threshold; using prop")
          setPlayerData(player)
        }
      } catch (error) {
        console.error("Error fetching processed player data:", error)
        setPlayerData(player)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerData()
  }, [player])

  if (!player) return null

  // Use the loaded data (or fall back to the passed-in prop)
  const display = playerData || player

  const playerName       = display.player || display.playerName || display.name
  const playerTeam       = display.team || display.playerTeam
  const playerOpponent   = display.opponent
  const playerThreshold  = display.threshold
  const playerRec        = display.recommendation

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <ImageWithFallback
                src={displayData.photoUrl || "/placeholder.svg"}
                alt={playerName}
                className="w-16 h-16 rounded-full object-cover mr-4"
                fallbackSrc="/placeholder.svg?height=64&width=64"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{playerName}</h2>
                <p className="text-gray-400">
                  {playerTeam} vs {playerOpponent}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold mb-2 text-white">Bet Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400">Threshold</p>
                    <p className="text-xl font-bold text-white">{playerThreshold} pts</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Recommendation</p>
                    <p
                      className={`text-xl font-bold ${playerRecommendation === "OVER" ? "text-green-500" : "text-red-500"}`}
                    >
                      {playerRecommendation}
                    </p>
                  </div>
                  {displayData.gameTime && (
                    <div>
                      <p className="text-gray-400">Game Time</p>
                      <p className="text-xl font-bold text-white">{displayData.gameTime}</p>
                    </div>
                  )}
                  {displayData.gameDate && (
                    <div>
                      <p className="text-gray-400">Game Date</p>
                      <p className="text-xl font-bold text-white">{displayData.gameDate}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Only show this section if we have the detailed stats */}
              {displayData.seasonAvgPoints && (
                <div className="bg-gray-700 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-white">Player Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400">Season Average</p>
                      <p className="text-xl font-bold text-white">{displayData.seasonAvgPoints || "N/A"} pts</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Last 5 Games</p>
                      <p className="text-xl font-bold text-white">{displayData.last5GamesAvg || "N/A"} pts</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Vs. Opponent</p>
                      <p className="text-xl font-bold text-white">{displayData.seasonAvgVsOpponent || "N/A"} pts</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Home/Away</p>
                      <p className="text-xl font-bold text-white">{displayData.homeAwgAvg || "N/A"} pts</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show result if available (for completed bets) */}
              {displayData.result && (
                <div className="bg-gray-700 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-white">Result</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400">Outcome</p>
                      <p
                        className={`text-xl font-bold ${displayData.result === "HIT" ? "text-green-500" : "text-red-500"}`}
                      >
                        {displayData.result}
                      </p>
                    </div>
                    {displayData.actualPoints !== undefined && (
                      <div>
                        <p className="text-gray-400">Actual Points</p>
                        <p className="text-xl font-bold text-white">{displayData.actualPoints} pts</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Only show recent performance if we have the data */}
              {displayData.last5Games && displayData.last5Games.length > 0 && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 text-white">Recent Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-600">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Opponent</th>
                          <th className="pb-2">Points</th>
                          <th className="pb-2 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayData.last5Games.map((game, index) => (
                          <tr key={index} className="border-b border-gray-600">
                            <td className="py-2">{game.date}</td>
                            <td className="py-2">{game.opponentFullName || game.opponent}</td>
                            <td className="py-2 font-bold">{game.points}</td>
                            <td className="py-2 text-right">
                              <span
                                className={
                                  game.points > Number.parseFloat(playerThreshold) ? "text-green-500" : "text-red-500"
                                }
                              >
                                {game.result || (game.points > Number.parseFloat(playerThreshold) ? "OVER" : "UNDER")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayerStatsModal

