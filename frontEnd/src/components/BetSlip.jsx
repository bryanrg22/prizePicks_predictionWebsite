"use client"

import { useState } from "react"
import { X, Check, ChevronRight, DollarSign } from "lucide-react"

const BetSlip = ({ picks, onRemovePick, onConfirm, onClose }) => {
  const [amount, setAmount] = useState(0)
  const [potentialWinnings, setPotentialWinnings] = useState(0)
  const [bettingPlatform, setBettingPlatform] = useState("PrizePicks")
  const [betType, setBetType] = useState("Power Play")
  const [customPlatform, setCustomPlatform] = useState("")
  const [selectedPickIds, setSelectedPickIds] = useState(picks ? picks.map((pick) => pick.id) : [])

  const togglePickSelection = (pickId) => {
    setSelectedPickIds((prev) => {
      if (prev.includes(pickId)) {
        return prev.filter((id) => id !== pickId)
      } else {
        return [...prev, pickId]
      }
    })
  }

  const handleConfirm = () => {
    if (!selectedPickIds.length) {
      return alert("Please select at least one pick")
    }
    if (amount <= 0) {
      return alert("Please enter a valid bet amount")
    }
    const finalPlatform = bettingPlatform === "Other" ? customPlatform : bettingPlatform
    if (bettingPlatform === "Other" && !customPlatform.trim()) {
      return alert("Please enter the betting platform name")
    }

    onConfirm(amount, potentialWinnings, selectedPickIds, finalPlatform, betType)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg h-[95vh] sm:h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Bet Slip
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-colors touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Bet Amount */}
            <div>
              <label htmlFor="amount" className="block text-gray-300 text-sm font-medium mb-3">
                Bet Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  id="betAmount"
                  className="w-full pl-10 pr-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all touch-manipulation"
                  placeholder="0"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number.parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Potential Winnings */}
            <div>
              <label htmlFor="winnings" className="block text-gray-300 text-sm font-medium mb-3">
                Potential Winnings
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  id="winnings"
                  className="w-full pl-10 pr-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all touch-manipulation"
                  placeholder="0"
                  value={potentialWinnings || ""}
                  onChange={(e) => setPotentialWinnings(Number.parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Betting Platform Selection */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-200">Betting Platform</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border min-h-[80px] ${
                    bettingPlatform === "PrizePicks"
                      ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                      : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                  } transition-all duration-200 touch-manipulation`}
                  onClick={() => setBettingPlatform("PrizePicks")}
                >
                  <div className="h-10 sm:h-12 flex items-center justify-center mb-2">
                    <img src="/prizePicksLogo.avif" alt="PrizePicks" className="h-8 sm:h-10 w-auto object-contain" />
                  </div>
                  <span className="text-sm font-medium">PrizePicks</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border min-h-[80px] ${
                    bettingPlatform === "Underdog"
                      ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                      : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                  } transition-all duration-200 touch-manipulation`}
                  onClick={() => setBettingPlatform("Underdog")}
                >
                  <div className="h-10 sm:h-12 flex items-center justify-center mb-2">
                    <img src="/underDogLogo.png" alt="Underdog" className="h-8 sm:h-10 w-auto object-contain" />
                  </div>
                  <span className="text-sm font-medium">Underdog</span>
                </button>
                <button
                  className={`flex items-center justify-center p-4 rounded-xl border col-span-1 sm:col-span-2 min-h-[60px] ${
                    bettingPlatform === "Other"
                      ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                      : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                  } transition-all duration-200 touch-manipulation`}
                  onClick={() => setBettingPlatform("Other")}
                >
                  <span className="text-sm font-medium">Other Platform</span>
                </button>
              </div>

              {bettingPlatform === "Other" && (
                <div className="mt-3">
                  <input
                    type="text"
                    className="w-full px-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all touch-manipulation"
                    placeholder="Enter platform name"
                    value={customPlatform}
                    onChange={(e) => setCustomPlatform(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Bet Type Selection - Only show for PrizePicks or Underdog */}
            {(bettingPlatform === "PrizePicks" || bettingPlatform === "Underdog") && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-200">
                  {bettingPlatform === "PrizePicks" ? "PrizePicks Bet Type" : "Underdog Bet Type"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bettingPlatform === "PrizePicks" ? (
                    <>
                      <button
                        className={`p-4 rounded-xl border min-h-[60px] ${
                          betType === "Power Play"
                            ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                            : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                        } transition-all duration-200 touch-manipulation`}
                        onClick={() => setBetType("Power Play")}
                      >
                        <span className="text-sm font-medium">Power Play</span>
                      </button>
                      <button
                        className={`p-4 rounded-xl border min-h-[60px] ${
                          betType === "FlexPlay"
                            ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                            : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                        } transition-all duration-200 touch-manipulation`}
                        onClick={() => setBetType("FlexPlay")}
                      >
                        <span className="text-sm font-medium">FlexPlay</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={`p-4 rounded-xl border min-h-[60px] ${
                          betType === "Standard"
                            ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                            : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                        } transition-all duration-200 touch-manipulation`}
                        onClick={() => setBetType("Standard")}
                      >
                        <span className="text-sm font-medium">Standard</span>
                      </button>
                      <button
                        className={`p-4 rounded-xl border min-h-[60px] ${
                          betType === "Flex"
                            ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                            : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                        } transition-all duration-200 touch-manipulation`}
                        onClick={() => setBetType("Flex")}
                      >
                        <span className="text-sm font-medium">Flex</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Selected Picks */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-200">
                Selected Picks ({selectedPickIds.length}/{picks?.length || 0})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {picks && picks.length > 0 ? (
                  picks.map((pick) => (
                    <div
                      key={pick.id}
                      className={`rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
                        selectedPickIds.includes(pick.id)
                          ? "bg-gradient-to-r from-blue-900/80 to-purple-900/80 border border-blue-500/50 shadow-lg"
                          : "bg-gray-800/80 border border-gray-700 hover:border-gray-500"
                      } touch-manipulation`}
                      onClick={() => togglePickSelection(pick.id)}
                    >
                      <div className="flex items-center p-4">
                        <div className="flex-shrink-0 mr-4">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              selectedPickIds.includes(pick.id) ? "bg-blue-500" : "bg-gray-700"
                            }`}
                          >
                            {selectedPickIds.includes(pick.id) && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                        <div className="flex items-center flex-1 min-w-0">
                          <img
                            src={pick.photoUrl || "/placeholder.svg?height=48&width=48"}
                            alt={pick.player || pick.name}
                            className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-gray-700 flex-shrink-0"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = "/placeholder.svg?height=48&width=48"
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate text-base">{pick.player || pick.name}</p>
                            <div className="flex items-center text-sm mt-1">
                              <span
                                className={`font-medium ${pick.recommendation === "OVER" ? "text-green-400" : "text-red-400"}`}
                              >
                                {pick.threshold} pts ({pick.recommendation})
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {pick.team} vs {pick.opponent}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
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
                    <p className="text-gray-400 font-medium">No picks available</p>
                    <p className="text-gray-500 text-sm mt-1">Add some picks to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl flex-1 transition-colors touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`px-6 py-4 font-medium rounded-xl flex-1 transition-all touch-manipulation ${
                selectedPickIds.length === 0 || amount <= 0
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-900/20"
              }`}
              disabled={selectedPickIds.length === 0 || amount <= 0}
            >
              Confirm Bet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BetSlip
