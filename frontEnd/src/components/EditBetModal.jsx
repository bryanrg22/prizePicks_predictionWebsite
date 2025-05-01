"use client"

import { useState } from "react"
import { X } from "lucide-react"

const EditBetModal = ({ bet, onSave, onClose }) => {
  const [betAmount, setBetAmount] = useState(bet.betAmount)
  const [selectedPicks, setSelectedPicks] = useState(bet.picks.map((_, index) => index))
  const [bettingPlatform, setBettingPlatform] = useState(bet.bettingPlatform || "PrizePicks")
  const [betType, setBetType] = useState(bet.betType || "Power Play")
  const [customPlatform, setCustomPlatform] = useState(
    bet.bettingPlatform !== "PrizePicks" && bet.bettingPlatform !== "Underdog" ? bet.bettingPlatform : "",
  )

  const calculatePotentialWinnings = () => {
    // Simple calculation: $3 for every $1 bet
    return betAmount * 3
  }

  const handlePlatformChange = (platform) => {
    setBettingPlatform(platform)
    // Reset bet type when platform changes
    if (platform === "PrizePicks") {
      setBetType("Power Play")
    } else if (platform === "Underdog") {
      setBetType("Standard")
    } else {
      setBetType("")
    }
  }

  const handleSave = () => {
    if (selectedPicks.length === 0) {
      alert("You must select at least one player for your bet.")
      return
    }

    // Get the final platform name (use custom if "Other" is selected)
    const finalPlatform = bettingPlatform === "Other" ? customPlatform : bettingPlatform

    if (bettingPlatform === "Other" && !customPlatform.trim()) {
      alert("Please enter the betting platform name")
      return
    }

    const updatedBet = {
      betAmount: Number.parseFloat(betAmount),
      potentialWinnings: calculatePotentialWinnings(),
      bettingPlatform: finalPlatform,
      betType: betType,
      picks: bet.picks.filter((_, index) => selectedPicks.includes(index)),
    }

    onSave(bet.id, updatedBet)
  }

  const togglePick = (index) => {
    setSelectedPicks((prev) => {
      if (prev.includes(index)) {
        // Remove if already selected
        return prev.filter((i) => i !== index)
      } else {
        // Add if not selected
        return [...prev, index]
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">Edit Bet</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="betAmount" className="block text-sm font-medium text-gray-300 mb-2">
                Bet Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">$</span>
                <input
                  type="number"
                  id="betAmount"
                  className="block w-full pl-8 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  min="1"
                  step="1"
                />
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Potential winnings: ${calculatePotentialWinnings().toFixed(2)}
              </p>
            </div>

            {/* Betting Platform Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-white">Betting Platform</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="prizepicks"
                    name="platform"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500"
                    checked={bettingPlatform === "PrizePicks"}
                    onChange={() => handlePlatformChange("PrizePicks")}
                  />
                  <label htmlFor="prizepicks" className="ml-2 text-white">
                    PrizePicks
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="underdog"
                    name="platform"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500"
                    checked={bettingPlatform === "Underdog"}
                    onChange={() => handlePlatformChange("Underdog")}
                  />
                  <label htmlFor="underdog" className="ml-2 text-white">
                    Underdog
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="other"
                    name="platform"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500"
                    checked={bettingPlatform === "Other"}
                    onChange={() => handlePlatformChange("Other")}
                  />
                  <label htmlFor="other" className="ml-2 text-white">
                    Other
                  </label>
                </div>

                {bettingPlatform === "Other" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter platform name"
                      value={customPlatform}
                      onChange={(e) => setCustomPlatform(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bet Type Selection - Only show for PrizePicks or Underdog */}
            {(bettingPlatform === "PrizePicks" || bettingPlatform === "Underdog") && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-white">
                  {bettingPlatform === "PrizePicks" ? "PrizePicks Bet Type" : "Underdog Bet Type"}
                </h3>
                <div className="space-y-3">
                  {bettingPlatform === "PrizePicks" ? (
                    <>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="powerplay"
                          name="bettype"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500"
                          checked={betType === "Power Play"}
                          onChange={() => setBetType("Power Play")}
                        />
                        <label htmlFor="powerplay" className="ml-2 text-white">
                          Power Play
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="flexplay"
                          name="bettype"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500"
                          checked={betType === "FlexPlay"}
                          onChange={() => setBetType("FlexPlay")}
                        />
                        <label htmlFor="flexplay" className="ml-2 text-white">
                          FlexPlay
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="standard"
                          name="bettype"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500"
                          checked={betType === "Standard"}
                          onChange={() => setBetType("Standard")}
                        />
                        <label htmlFor="standard" className="ml-2 text-white">
                          Standard
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="flex"
                          name="bettype"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500"
                          checked={betType === "Flex"}
                          onChange={() => setBetType("Flex")}
                        />
                        <label htmlFor="flex" className="ml-2 text-white">
                          Flex
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">Select Players</h3>
              <div className="space-y-3">
                {bet.picks.map((pick, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg flex items-center cursor-pointer transition-colors ${
                      selectedPicks.includes(index) ? "bg-blue-700" : "bg-gray-700"
                    }`}
                    onClick={() => togglePick(index)}
                  >
                    <div className="flex-shrink-0 mr-3">
                      <input
                        type="checkbox"
                        checked={selectedPicks.includes(index)}
                        onChange={() => togglePick(index)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-500 rounded"
                      />
                    </div>
                    <img
                      src={pick.photoUrl || "/placeholder.svg"}
                      alt={pick.player}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                    <div>
                      <p className="font-medium text-white">{pick.player}</p>
                      <p className="text-sm text-gray-300">
                        {pick.threshold} pts ({pick.recommendation})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedPicks.length === 0 && (
                <p className="mt-2 text-sm text-red-400">You must select at least one player.</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
                disabled={selectedPicks.length === 0 || betAmount <= 0}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditBetModal

