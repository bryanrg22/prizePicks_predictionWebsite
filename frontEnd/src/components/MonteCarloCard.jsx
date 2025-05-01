"use client"

import React from "react"
import { BarChart2 } from "lucide-react"

// map probability → color
function getProbabilityColor(prob) {
  if (prob >= 0.7) return "text-green-500"
  if (prob >= 0.5) return "text-yellow-500"
  return "text-red-500"
}

const MonteCarloCard = ({
  monteCarloProbability,
  threshold,
  distribution = "normal",
}) => {
  // no data
  if (!monteCarloProbability) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Monte Carlo Simulation</h3>
        <div className="text-gray-400 py-4 text-center">No Monte Carlo data available</div>
      </div>
    )
  }

  // parse if it’s a string like "75.4%"
  const probValue =
    typeof monteCarloProbability === "string"
      ? parseFloat(monteCarloProbability.replace("%",""))/100
      : monteCarloProbability


  const monteCarloProbability_format = monteCarloProbability
      ? `${(Number.parseFloat(monteCarloProbability) * 100).toFixed(2)}%`
      : "N/A"

  const color = getProbabilityColor(probValue)

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Monte Carlo Simulation</h3>
      <div className="space-y-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-400">Probability Over {threshold} Points</p>
            <p className={`text-2xl font-bold ${color}`}>{monteCarloProbability_format}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-gray-400">Distribution Type</p>
            <p className="text-gray-300">{distribution}</p>
          </div>
        </div>

        <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg flex items-start">
          <BarChart2 className="text-blue-400 w-5 h-5 mr-2" />
          <div>
            <p className="text-blue-300 font-medium">What is Monte Carlo Simulation?</p>
            <p className="text-blue-400 text-sm mt-1">
              Monte Carlo simulation runs thousands of random scenarios based on historical data to predict the
              probability of a player exceeding their points threshold.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonteCarloCard
