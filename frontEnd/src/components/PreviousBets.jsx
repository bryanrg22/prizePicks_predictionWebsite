"use client"

import { useState } from "react"

const PreviousBets = ({ bets, activeBets }) => {
  const [expandedBets, setExpandedBets] = useState({})

  const toggleExpand = (betId) => {
    setExpandedBets((prev) => ({
      ...prev,
      [betId]: !prev[betId],
    }))
  }

  if ((!bets || bets.length === 0) && (!activeBets || activeBets.length === 0)) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Previous Bets</h2>
        <p className="text-gray-400">You don't have any previous bets yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-6">Previous Bets</h2>

        {/* Active Bets Section */}
        {activeBets && activeBets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">Active Bets</h3>
            <div className="space-y-4">
              {activeBets.map((bet) => (
                <div key={bet.id} className="bg-blue-900 p-4 rounded-lg">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleExpand(`active-${bet.id}`)}
                  >
                    <div>
                      <p className="font-medium text-white">Bet placed on {bet.date}</p>
                      <p className="text-sm text-blue-300">
                        ${bet.betAmount.toFixed(2)} • Potential: ${bet.potentialWinnings.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-sm font-medium px-3 py-1 bg-yellow-600 rounded-full text-white">Active</div>
                  </div>

                  {expandedBets[`active-${bet.id}`] && (
                    <div className="mt-4 border-t border-blue-800 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-blue-300">Platform</p>
                        <p className="font-medium text-white">{bet.bettingPlatform || "PrizePicks"}</p>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-blue-300">Bet Type</p>
                        <p className="font-medium text-white">{bet.betType || "Power Play"}</p>
                      </div>
                      <div className="space-y-3">
                        {bet.picks.map((pick, index) => (
                          <div key={index} className="bg-blue-800 p-3 rounded-lg flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 mr-3">
                                <img
                                  src={pick.photoUrl || "/placeholder.svg?height=40&width=40"}
                                  alt={pick.player}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "/placeholder.svg?height=40&width=40"
                                  }}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-white">{pick.player}</p>
                                <p className="text-sm text-blue-300">
                                  {pick.team} vs {pick.opponent}
                                </p>
                                <p className="text-sm text-blue-300">
                                  {pick.threshold} pts ({pick.recommendation})
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous Bets */}
        {bets && bets.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4 text-white">Completed Bets</h3>
            {bets.map((bet) => (
              <div
                key={bet.id}
                className={`p-4 rounded-lg ${
                  bet.status === "Won" ? "bg-green-900" : bet.status === "Lost" ? "bg-red-900" : "bg-gray-700"
                }`}
              >
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand(bet.id)}>
                  <div>
                    <p className="font-medium text-white">Bet placed on {bet.date}</p>
                    <p className="text-sm text-gray-300">
                      ${bet.betAmount.toFixed(2)} • {bet.status === "Won" ? `Won $${bet.winnings.toFixed(2)}` : "Lost"}
                    </p>
                  </div>
                  <div
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      bet.status === "Won"
                        ? "bg-green-600 text-white"
                        : bet.status === "Lost"
                          ? "bg-red-600 text-white"
                          : "bg-gray-600 text-white"
                    }`}
                  >
                    {bet.status}
                  </div>
                </div>

                {expandedBets[bet.id] && (
                  <div className="mt-4 border-t border-gray-600 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-gray-400">Platform</p>
                      <p className="font-medium text-white">{bet.bettingPlatform || "PrizePicks"}</p>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-gray-400">Bet Type</p>
                      <p className="font-medium text-white">{bet.betType || "Power Play"}</p>
                    </div>
                    <div className="space-y-3">
                      {bet.picks.map((pick, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg flex items-center justify-between ${
                            pick.result === "HIT" ? "bg-green-800" : "bg-red-800"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 mr-3">
                              <img
                                src={pick.photoUrl || "/placeholder.svg?height=40&width=40"}
                                alt={pick.player}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = "/placeholder.svg?height=40&width=40"
                                }}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-white">{pick.player}</p>
                              <p className="text-sm text-gray-300">
                                {pick.team} vs {pick.opponent}
                              </p>
                              <p className="text-sm text-gray-300">
                                {pick.threshold} pts ({pick.recommendation})
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white">{pick.actual} pts</p>
                            <p className={`text-sm ${pick.result === "HIT" ? "text-green-400" : "text-red-400"}`}>
                              {pick.result}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PreviousBets

