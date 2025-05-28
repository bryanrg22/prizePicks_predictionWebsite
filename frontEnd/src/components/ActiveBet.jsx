"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, AlertCircle, Edit, Trash2, Clock, DollarSign, Trophy } from 'lucide-react'

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
        <div key={bet.id} className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Header */}
          <div 
            className="p-4 sm:p-6 cursor-pointer hover:bg-gray-700/20 transition-all duration-200"
            onClick={() => toggleExpand(bet.id)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-pulse border-2 border-gray-800">
                    <AlertCircle className="w-full h-full text-gray-800" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Active Bet
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {bet.picks?.length || 0} picks • ${bet.betAmount?.toFixed(2) || '0.00'} wagered
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(bet)
                    }}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg shadow-blue-900/20 touch-manipulation"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                )}
                {onCancel && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCancel(bet.id)
                    }}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg shadow-red-900/20 touch-manipulation"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                )}
                <div className="ml-2">
                  {expandedBets[bet.id] ? (
                    <ChevronUp className="text-gray-400 w-5 h-5" />
                  ) : (
                    <ChevronDown className="text-gray-400 w-5 h-5" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Content */}
          {expandedBets[bet.id] && (
            <div className="border-t border-gray-700 bg-gray-800/50">
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bet Details */}
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-4 sm:p-5 border border-gray-600/50">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                      Bet Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Date</span>
                        <span className="font-medium text-white text-sm">{bet.date}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Bet Amount</span>
                        <span className="font-bold text-white">${bet.betAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Potential Winnings</span>
                        <span className="font-bold text-green-400">${bet.potentialWinnings?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Total Payout</span>
                        <span className="font-bold text-green-400 text-lg">
                          ${((bet.betAmount || 0) + (bet.potentialWinnings || 0)).toFixed(2)}
                        </span>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Platform</span>
                        <div className="flex items-center space-x-2">
                          {bet.bettingPlatform === "PrizePicks" && (
                            <img 
                              src="/prizePicksLogo.avif" 
                              alt="PrizePicks" 
                              className="h-5 w-auto object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          )}
                          <span className="font-medium text-white text-sm">{bet.bettingPlatform || "PrizePicks"}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Bet Type</span>
                        <span className="font-medium text-white text-sm">{bet.betType || "Power Play"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Status</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          <span className="font-medium text-yellow-400 text-sm">{bet.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Picks */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-400" />
                      Your Picks ({bet.picks?.length || 0})
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {bet.picks && bet.picks.length > 0 ? (
                        bet.picks.map((pick, index) => (
                          <div
                            key={pick.id || index}
                            className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200 cursor-pointer group"
                            onClick={(e) => {
                              e.stopPropagation()
                              onPlayerClick && onPlayerClick(pick)
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative flex-shrink-0">
                                {pick.photoUrl ? (
                                  <img
                                    src={pick.photoUrl || "/placeholder.svg"}
                                    alt={pick.name || pick.playerName || pick.player || "Player"}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-600 group-hover:border-blue-500/50 transition-colors"
                                    onError={(e) => {
                                      e.target.onerror = null
                                      e.target.src = "/placeholder.svg?height=48&width=48"
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 border-2 border-gray-600 group-hover:border-blue-500/50 transition-colors flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">
                                      {(pick.name || pick.playerName || pick.player || "??").substring(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
                                  pick.gameStatus === "Final" || pick.status === "Final"
                                    ? "bg-green-500"
                                    : pick.gameStatus === "Live" || pick.status === "Live"
                                      ? "bg-yellow-500 animate-pulse"
                                      : "bg-gray-500"
                                }`}></div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-sm sm:text-base truncate">
                                  {pick.name || pick.playerName || pick.player || "Unknown Player"}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-gray-300 text-sm">{pick.threshold || 0} pts</span>
                                  <span
                                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                                      (pick.recommendation || pick.betExplanation?.recommendation || "OVER") === "OVER"
                                        ? "bg-green-900/30 text-green-400 border border-green-700/30"
                                        : "bg-red-900/30 text-red-400 border border-red-700/30"
                                    }`}
                                  >
                                    {pick.recommendation || pick.betExplanation?.recommendation || "OVER"}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {pick.team || pick.playerTeam || "Unknown Team"} vs {pick.opponent || "Unknown Opponent"}
                                </p>
                              </div>
                              
                              <div className="text-right flex-shrink-0">
                                <span
                                  className={`text-xs font-medium px-2 py-1 rounded-md ${
                                    pick.gameStatus === "Final" || pick.status === "Final"
                                      ? "bg-green-900/30 text-green-400"
                                      : pick.gameStatus === "Live" || pick.status === "Live"
                                        ? "bg-yellow-900/30 text-yellow-400"
                                        : "bg-gray-700/50 text-gray-400"
                                  }`}
                                >
                                  {pick.gameStatus || pick.status || "Scheduled"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl p-6 text-center border border-gray-600/30">
                          <div className="text-gray-400 mb-2">
                            <svg
                              className="w-12 h-12 mx-auto mb-4 opacity-50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                          </div>
                          <p className="text-gray-400 font-medium">No picks data available</p>
                          <p className="text-gray-500 text-sm mt-1">Picks may still be loading...</p>
                        </div>
                      )}
                    </div>
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
