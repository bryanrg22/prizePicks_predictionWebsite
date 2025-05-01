"use client"

import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react"

const RecommendationCard = ({ playerData, threshold }) => {
  // Function to format numbers to 2 decimal places
  const formatNumber = (num) => {
    if (num === undefined || num === null) return "N/A"
    return typeof num === "number" ? num.toFixed(2) : num
  }

  // Get recommendation based on player data and threshold
  const getRecommendation = () => {
    const thresholdNum = Number.parseFloat(threshold)

    // Simple algorithm to determine recommendation
    const factors = [
      playerData.seasonAvgPoints > thresholdNum,
      playerData.careerAvgVsOpponent > thresholdNum,
      playerData.last5GamesAvg > thresholdNum,
      playerData.seasonAvgVsOpponent > thresholdNum,
    ]

    const positiveFactors = factors.filter(Boolean).length

    if (positiveFactors >= 3) {
      return { recommendation: "OVER", confidence: "High", color: "text-green-500" }
    } else if (positiveFactors === 2) {
      return { recommendation: "OVER", confidence: "Medium", color: "text-yellow-500" }
    } else {
      return { recommendation: "UNDER", confidence: "High", color: "text-red-500" }
    }
  }

  const rec = getRecommendation()

  // Get Poisson probability if available
  const poissonProbability = playerData.poissonProbability
    ? `${(Number.parseFloat(playerData.poissonProbability) * 100).toFixed(2)}%`
    : "N/A"

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Recommendation</h3>

      <div className="bg-gray-700 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400">Points Threshold</p>
          <p className="text-2xl font-bold">{threshold}</p>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-gray-400">Recommendation</p>
          <p className={`text-2xl font-bold ${rec.color}`}>
            {rec.recommendation === "OVER" ? (
              <TrendingUp className="inline-block mr-2" />
            ) : (
              <TrendingDown className="inline-block mr-2" />
            )}
            {rec.recommendation}
          </p>
        </div>
      </div>

      <div className="bg-gray-700 p-4 rounded-lg mb-6">
        <h4 className="text-lg font-semibold mb-3">Statistical Analysis</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <p className="text-gray-400">Season Average</p>
            <p className={playerData.seasonAvgPoints > threshold ? "text-green-500" : "text-red-500"}>
              {formatNumber(playerData.seasonAvgPoints)} pts
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-400">Last 5 Games Avg</p>
            <p className={playerData.last5GamesAvg > threshold ? "text-green-500" : "text-red-500"}>
              {formatNumber(playerData.last5GamesAvg)} pts
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-400">Vs. {playerData.opponent}</p>
            <p className={playerData.seasonAvgVsOpponent > threshold ? "text-green-500" : "text-red-500"}>
              {formatNumber(playerData.seasonAvgVsOpponent)} pts
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-400">Home/Away</p>
            <p className={playerData.homeAwgAvg > threshold ? "text-green-500" : "text-red-500"}>
              {formatNumber(playerData.homeAwgAvg)} pts
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-3">Advanced Analysis</h4>

        <div className="space-y-3">
          <div className="flex justify-between">
            <p className="text-gray-400">Poisson Probability</p>
            <p className="font-medium">{poissonProbability}</p>
          </div>

          <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 rounded-lg flex items-start">
            <AlertCircle className="text-blue-400 w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300">
              The Poisson probability represents the statistical likelihood of the player scoring over the threshold
              based on their average performance. ChatGPT's verdict provides an AI-powered assessment considering
              multiple factors.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecommendationCard

