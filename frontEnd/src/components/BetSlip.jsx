"use client"

import { useState } from "react"
import { X, Check, ChevronRight } from "lucide-react"

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
  
    // ✨ Bubble in gameId (and any other fields)
    const formattedPicks = picks
      .filter((p) => selectedPickIds.includes(p.id))
      .map((p) => ({
        ...p,
        gameId: p.gameId,
      }))
  
    onConfirm(
      amount,
      potentialWinnings,
      formattedPicks,
      finalPlatform,
      betType
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Bet Slip
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bet Amount */}
          <div className="mb-6">
            <label htmlFor="amount" className="block text-gray-300 text-sm font-medium mb-2">
              Bet Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                id="betAmount"
                className="w-full pl-8 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(Number.parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Potential Winnings */}
          <div className="mb-6">
            <label htmlFor="winnings" className="block text-gray-300 text-sm font-medium mb-2">
              Potential Winnings
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                id="winnings"
                className="w-full pl-8 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter amount"
                value={potentialWinnings}
                onChange={(e) => setPotentialWinnings(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Betting Platform Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-gray-200">Betting Platform</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  bettingPlatform === "PrizePicks"
                    ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                    : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                } transition-all duration-200`}
                onClick={() => setBettingPlatform("PrizePicks")}
              >
                <div className="h-12 flex items-center justify-center mb-2">
                  <img
                    src="/prizePicksLogo.avif"
                    alt="PrizePicks"
                    className="h-10 w-auto object-contain"
                    
                  />
                </div>
                <span className="text-sm font-medium">PrizePicks</span>
              </button>
              <button
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  bettingPlatform === "Underdog"
                    ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                    : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                } transition-all duration-200`}
                onClick={() => setBettingPlatform("Underdog")}
              >
                <div className="h-12 flex items-center justify-center mb-2">
                  <img
                    src="/underDogLogo.png"
                    alt="Underdog"
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <span className="text-sm font-medium">Underdog</span>
              </button>
              <button
                className={`flex items-center justify-center p-4 rounded-lg border col-span-2 ${
                  bettingPlatform === "Other"
                    ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                    : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                } transition-all duration-200`}
                onClick={() => setBettingPlatform("Other")}
              >
                <span className="text-sm font-medium">Other Platform</span>
              </button>
            </div>

            {bettingPlatform === "Other" && (
              <div className="mt-3">
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter platform name"
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Bet Type Selection - Only show for PrizePicks or Underdog */}
          {(bettingPlatform === "PrizePicks" || bettingPlatform === "Underdog") && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-200">
                {bettingPlatform === "PrizePicks" ? "PrizePicks Bet Type" : "Underdog Bet Type"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {bettingPlatform === "PrizePicks" ? (
                  <>
                    <button
                      className={`p-4 rounded-lg border ${
                        betType === "Power Play"
                          ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                          : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                      } transition-all duration-200`}
                      onClick={() => setBetType("Power Play")}
                    >
                      <span className="text-sm font-medium">Power Play</span>
                    </button>
                    <button
                      className={`p-4 rounded-lg border ${
                        betType === "FlexPlay"
                          ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                          : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                      } transition-all duration-200`}
                      onClick={() => setBetType("FlexPlay")}
                    >
                      <span className="text-sm font-medium">FlexPlay</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`p-4 rounded-lg border ${
                        betType === "Standard"
                          ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                          : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                      } transition-all duration-200`}
                      onClick={() => setBetType("Standard")}
                    >
                      <span className="text-sm font-medium">Standard</span>
                    </button>
                    <button
                      className={`p-4 rounded-lg border ${
                        betType === "Flex"
                          ? "border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-900/20"
                          : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                      } transition-all duration-200`}
                      onClick={() => setBetType("Flex")}
                    >
                      <span className="text-sm font-medium">Flex</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <h3 className="text-lg font-medium mb-3 text-gray-200">Selected Picks</h3>
          <div className="max-h-60 overflow-y-auto mb-6 pr-1 space-y-3">
            {picks && picks.length > 0 ? (
              picks.map((pick) => (
                <div
                  key={pick.id}
                  className={`rounded-lg cursor-pointer transition-all duration-200 overflow-hidden ${
                    selectedPickIds.includes(pick.id)
                      ? "bg-gradient-to-r from-blue-900/80 to-purple-900/80 border border-blue-500/50"
                      : "bg-gray-800/80 border border-gray-700 hover:border-gray-500"
                  }`}
                  onClick={() => togglePickSelection(pick.id)}
                >
                  <div className="flex items-center p-3">
                    <div className="flex-shrink-0 mr-3">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center ${
                          selectedPickIds.includes(pick.id) ? "bg-blue-500" : "bg-gray-700"
                        }`}
                      >
                        {selectedPickIds.includes(pick.id) && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <div className="flex items-center flex-1 min-w-0">
                      <img
                        src={pick.photoUrl || "/placeholder.svg?height=40&width=40"}
                        alt={pick.player}
                        className="w-12 h-12 rounded-full object-cover mr-3 border-2 border-gray-700"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = "/placeholder.svg?height=40&width=40"
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{pick.player}</p>
                        <div className="flex items-center text-sm">
                          <span className={`${pick.recommendation === "OVER" ? "text-green-400" : "text-red-400"}`}>
                            {pick.threshold} pts ({pick.recommendation})
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No picks selected</p>
              </div>
            )}
          </div>

          <div className="flex justify-between space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg flex-1 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`px-5 py-3 font-medium rounded-lg flex-1 transition-all ${
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
