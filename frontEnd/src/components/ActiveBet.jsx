"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, AlertCircle, Edit, Trash2 } from "lucide-react"

const ActiveBet = ({ bets, onCancel, onPlayerClick, onEdit }) => {
  const [expandedBets, setExpandedBets] = useState({})

  if (!bets || bets.length === 0) return null

  const toggleExpand = (betId) => {
    setExpandedBets((prev) => ({
      ...prev,
      [betId]: !prev[betId],
    }))
  }

  return (
    <div className="space-y-4">
      {bets.map((bet) => (
        <div key={bet.id} className="bg-blue-900 p-4 lg:p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand(bet.id)}>
            <div className="flex items-center">
              <h2 className="text-xl lg:text-2xl font-bold text-white">Active Bet</h2>
              <div className="ml-2 animate-pulse">
                <AlertCircle className="text-red-500 w-4 h-4 lg:w-5 lg:h-5" />
              </div>
            </div>
            <div className="flex items-center">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(bet)
                  }}
                  className="px-2 lg:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs lg:text-sm font-medium rounded-md mr-2 lg:mr-3 flex items-center min-h-[36px]"
                >
                  <Edit className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                  <span>Edit</span>
                </button>
              )}
              {onCancel && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCancel(bet.id)
                  }}
                  className="px-2 lg:px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs lg:text-sm font-medium rounded-md mr-2 lg:mr-3 flex items-center min-h-[36px]"
                >
                  <Trash2 className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                  <span>Cancel</span>
                </button>
              )}
              {expandedBets[bet.id] ? (
                <ChevronUp className="text-white w-5 h-5" />
              ) : (
                <ChevronDown className="text-white w-5 h-5" />
              )}
            </div>
          </div>

          {expandedBets[bet.id] && (
            <div className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-blue-800 p-3 lg:p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-300 text-sm">Date</p>
                    <p className="font-medium text-white text-sm">{bet.date}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-300 text-sm">Bet Amount</p>
                    <p className="font-medium text-white text-sm">${bet.betAmount.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-300 text-sm">Potential Winnings</p>
                    <p className="font-medium text-green-400 text-sm">${bet.potentialWinnings.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-300 text-sm">Platform</p>
                    <p className="font-medium text-white text-sm">{bet.bettingPlatform || "PrizePicks"}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-300 text-sm">Bet Type</p>
                    <p className="font-medium text-white text-sm">{bet.betType || "Power Play"}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-blue-300 text-sm">Status</p>
                    <p className="font-medium text-yellow-400 text-sm">{bet.status}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-base lg:text-lg font-semibold mb-2 text-white">Picks</h3>
                  <div className="space-y-2 lg:space-y-3">
                    {bet.picks && bet.picks.length > 0 ? (
                      bet.picks.map((pick, index) => (
                        <div
                          key={pick.id || index}
                          className="bg-blue-800 p-2 lg:p-3 rounded-lg flex items-center cursor-pointer hover:bg-blue-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            onPlayerClick && onPlayerClick(pick)
                          }}
                        >
                          {pick.photoUrl ? (
                            <img
                              src={pick.photoUrl || "/placeholder.svg"}
                              alt={pick.name || pick.playerName || pick.player || "Player"}
                              className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover mr-2 lg:mr-3"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = "/placeholder.svg?height=40&width=40"
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-600 mr-2 lg:mr-3 flex items-center justify-center">
                              <span className="text-xs text-white">
                                {(pick.name || pick.playerName || pick.player || "??").substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm lg:text-base truncate">
                              {pick.name || pick.playerName || pick.player || "Unknown Player"}
                            </p>
                            <p className="text-xs lg:text-sm text-blue-300">
                              {pick.threshold || 0} pts ({pick.recommendation || "OVER"})
                            </p>
                            <p className="text-xs text-blue-400">
                              {pick.team || "Unknown Team"} vs {pick.opponent || "Unknown Opponent"}
                            </p>
                          </div>
                          <span
                            className={`ml-auto text-xs ${
                              pick.gameStatus === "Final" || pick.status === "Final"
                                ? "text-green-400"
                                : pick.gameStatus === "Live" || pick.status === "Live"
                                  ? "text-yellow-400"
                                  : "text-gray-400"
                            }`}
                          >
                            {pick.gameStatus || pick.status || "Scheduled"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="bg-blue-800 p-3 rounded-lg text-center">
                        <p className="text-blue-300 text-sm">No picks data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ActiveBet
