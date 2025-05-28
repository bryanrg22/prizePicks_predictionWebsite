"use client"

import { X, Check, Trophy, DollarSign } from "lucide-react"

const BetConfirmation = ({ picks, betAmount, betPayOut, bettingPlatform, betType, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-700 bg-gradient-to-r from-green-900/30 to-emerald-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Bet Confirmed!</h2>
                <p className="text-green-400 text-sm">Your bet has been placed successfully</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-colors touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            {/* Platform Info */}
            <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-xl p-4 border border-gray-600/50">
              <div className="flex items-center space-x-3">
                {bettingPlatform === "PrizePicks" ? (
                  <img
                    src="/prizePicksLogo.avif"
                    alt="PrizePicks"
                    className="h-10 w-auto object-contain"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg?height=40&width=40"
                    }}
                  />
                ) : bettingPlatform === "Underdog" ? (
                  <img
                    src="/underDogLogo.png"
                    alt="Underdog"
                    className="h-10 w-auto object-contain"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg?height=40&width=40"
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-white text-lg">{bettingPlatform}</p>
                  <p className="text-gray-400 text-sm">{betType}</p>
                </div>
              </div>
            </div>

            {/* Bet Summary */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-4 border border-blue-700/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                Bet Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Bet Amount</span>
                  <span className="font-bold text-white text-lg">${betAmount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Potential Winnings</span>
                  <span className="font-bold text-green-400 text-lg">${(Number.parseFloat(betPayOut) - Number.parseFloat(betAmount)).toFixed(2)}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Payout</span>
                  <span className="font-bold text-green-400 text-xl">
                    ${betPayOut}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Picks */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Selected Picks ({picks?.length || 0})</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {picks && picks.length > 0 ? (
                  picks.map((pick, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-xl p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={pick.photoUrl || "/placeholder.svg?height=48&width=48"}
                            alt={pick.player}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = "/placeholder.svg?height=48&width=48"
                            }}
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-base truncate">{pick.player}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-gray-300 text-sm">{pick.threshold} pts</span>
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium ${
                                pick.recommendation === "OVER"
                                  ? "bg-green-900/30 text-green-400 border border-green-700/30"
                                  : "bg-red-900/30 text-red-400 border border-red-700/30"
                              }`}
                            >
                              {pick.recommendation}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-800/50 rounded-xl border border-gray-700">
                    <p className="text-gray-400">No picks selected</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-green-900/20 hover:shadow-green-900/30 touch-manipulation"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default BetConfirmation
