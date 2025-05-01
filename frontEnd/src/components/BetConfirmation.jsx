"use client"

import { X } from "lucide-react"

const BetConfirmation = ({ picks, betAmount, potentialWinnings, bettingPlatform, betType, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Bet Confirmed</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                {bettingPlatform === "PrizePicks" ? (
                  <img
                    src="/prizePicksLogo.avif"
                    alt="PrizePicks"
                    className="h-8 w-auto object-contain mr-2"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg?height=32&width=32"
                    }}
                  />
                ) : bettingPlatform === "Underdog" ? (
                  <img
                    src="/underDogLogo.tiff"
                    alt="Underdog"
                    className="h-8 w-auto object-contain mr-2"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg?height=32&width=32"
                    }}
                  />
                ) : null}
                <div>
                  <p className="font-medium text-white">{bettingPlatform}</p>
                  <p className="text-sm text-gray-400">{betType}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-400">Bet Amount</p>
                <p className="font-medium text-white">${betAmount}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-400">Potential Winnings</p>
                <p className="font-medium text-green-400">${potentialWinnings}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-3 text-white">Selected Picks:</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {picks && picks.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-400">Picks:</p>
                  {picks.map((pick, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg flex items-center my-2">
                      <img
                        src={pick.photoUrl || "/placeholder.svg?height=40&width=40"}
                        alt={pick.player}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = "/placeholder.svg?height=40&width=40"
                        }}
                      />
                      <div className="text-left">
                        <p className="font-medium text-white">{pick.player}</p>
                        <p className="text-sm text-gray-300">
                          {pick.threshold} pts ({pick.recommendation})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default BetConfirmation

