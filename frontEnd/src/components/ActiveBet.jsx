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
        <div key={bet.id} className="bg-blue-900 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand(bet.id)}>
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-white">Active Bet</h2>
              <div className="ml-2 animate-pulse">
                <AlertCircle className="text-red-500 w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(bet)
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md mr-3 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  <span>Edit</span>
                </button>
              )}
              {onCancel && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCancel(bet.id)
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md mr-3 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-300">Date</p>
                    <p className="font-medium text-white">{bet.date}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-300">Bet Amount</p>
                    <p className="font-medium text-white">${bet.betAmount.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-300">Potential Winnings</p>
                    <p className="font-medium text-green-400">${bet.potentialWinnings.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-300">Platform</p>
                    <p className="font-medium text-white">{bet.bettingPlatform || "PrizePicks"}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-300">Bet Type</p>
                    <p className="font-medium text-white">{bet.betType || "Power Play"}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-blue-300">Status</p>
                    <p className="font-medium text-yellow-400">{bet.status}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Picks</h3>
                  <div className="space-y-3">
                    {bet.picks.map((pick, index) => (
                      <div
                        key={index}
                        className="bg-blue-800 p-3 rounded-lg flex items-center cursor-pointer hover:bg-blue-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          onPlayerClick && onPlayerClick(pick)
                        }}
                      >
                        {pick.photoUrl ? (
                          <img
                            src={pick.photoUrl || "/placeholder.svg"}
                            alt={pick.player}
                            className="w-10 h-10 rounded-full object-cover mr-3"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = "/placeholder.svg?height=40&width=40"
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-600 mr-3 flex items-center justify-center">
                            <span className="text-xs text-white">{pick.player.substring(0, 2)}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">{pick.player}</p>
                          <p className="text-sm text-blue-300">
                            {pick.threshold} pts ({pick.recommendation})
                          </p>
                        </div>
                        <span className={`ml-auto text-xs ${
                            pick.status === "Final" ? "text-green-400" :
                            pick.status === "Live"  ? "text-yellow-400" : "text-gray-400"
                        }`}>
                          {pick.status}
                        </span>
                      </div>
                    ))}
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

