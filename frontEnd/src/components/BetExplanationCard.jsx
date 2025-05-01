"use client"

import React from "react"
import { AlertTriangle, TrendingUp, TrendingDown, HelpCircle } from "lucide-react"

// Helper to pick icon & colors based on the recommendation text
function getRecommendationDisplay(rec) {
  if (!rec) return { icon: HelpCircle, color: "text-gray-400", bgColor: "bg-gray-700", borderColor: "border-gray-600" }
  const r = rec.toLowerCase()
  if (r.includes("yes") || r.includes("over")) {
    return { icon: TrendingUp,    color: "text-green-500",  bgColor: "bg-green-900 bg-opacity-30",  borderColor: "border-green-700" }
  }
  if (r.includes("no")  || r.includes("under")) {
    return { icon: TrendingDown,  color: "text-red-500",    bgColor: "bg-red-900 bg-opacity-30",    borderColor: "border-red-700" }
  }
  return { icon: AlertTriangle, color: "text-yellow-500", bgColor: "bg-yellow-900 bg-opacity-30", borderColor: "border-yellow-700" }
}

const BetExplanationCard = ({
  // props from your unified playerData
  betExplanation,
  poissonProbability,
  monteCarloProbability,
}) => {
  // No data at all?
  if (!betExplanation || !betExplanation.explanation) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <div className="flex items-center mb-2">
          <HelpCircle className="w-6 h-6 text-gray-400 mr-2" />
          <h3 className="text-xl font-bold text-white">No Recommendation Available</h3>
        </div>
        <p className="text-gray-400">
          We couldn’t generate a betting recommendation. Check your data or try again later.
        </p>
      </div>
    )
  }

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "N/A"
    return typeof num === "number" ? num.toFixed(2) : num
  }

  const poissonProbability_format = poissonProbability
    ? `${(Number.parseFloat(poissonProbability) * 100).toFixed(2)}%`
    : "N/A"

  const monteCarloProbability_format = poissonProbability
    ? `${(Number.parseFloat(monteCarloProbability) * 100).toFixed(2)}%`
    : "N/A"

  const { recommendation, explanation: explanationText } = betExplanation
  const { icon: Icon, color, bgColor, borderColor } = getRecommendationDisplay(recommendation)

  return (
    <div className={`${bgColor} border ${borderColor} p-6 rounded-lg mb-6`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div className="flex items-center mb-3 md:mb-0">
          <Icon className={`w-8 h-8 ${color} mr-3`} />
          <h3 className="text-2xl font-bold text-white">AI Betting Recommendation</h3>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-gray-400">Poisson: </span>
            <span className="font-medium">{poissonProbability_format}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Monte Carlo: </span>
            <span className="font-medium">{monteCarloProbability_format}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <span className={`text-xl font-bold ${color}`}>{recommendation}</span>
        <p className="text-gray-300 mt-2">{explanationText}</p>
      </div>

      <div className="text-xs text-gray-400 mt-4">
        This recommendation is based on statistical analysis, Monte Carlo simulations, injury reports, and historical
        performance data. Always bet responsibly.
      </div>
    </div>
  )
}

export default BetExplanationCard
