"use client"

import React from "react"
import { AlertCircle, Activity, Clock } from "lucide-react"

// Same status→color mapping you had
function getStatusColor(status) {
  if (!status) return "text-gray-400"
  const s = status.toLowerCase()
  if (s === "out")         return "text-red-500"
  if (s === "doubtful")    return "text-orange-500"
  if (s === "questionable")return "text-yellow-500"
  if (s === "probable")    return "text-green-500"
  if (s === "available")   return "text-green-500"
  return "text-gray-400"
}

const InjuryStatusCard = ({ injuryData, playerName }) => {
  // no data at all
  if (!injuryData) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Injury Status</h3>
        <div className="text-gray-400 py-4 text-center">No injury data available</div>
      </div>
    )
  }

  // if found on report
  if (injuryData.found) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Injury Status</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <Activity className={`w-5 h-5 mr-2 ${getStatusColor(injuryData.status)}`} />
            <span className={`text-lg font-bold ${getStatusColor(injuryData.status)}`}>
              {injuryData.status || "Unknown"}
            </span>
          </div>
          {injuryData.reason && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-300">{injuryData.reason}</p>
            </div>
          )}
          {(injuryData.gameDate || injuryData.matchup) && (
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="w-4 h-4 mr-2" />
              <span>
                {injuryData.gameDate && `${injuryData.gameDate} `}
                {injuryData.gameTime && `${injuryData.gameTime} `}
                {injuryData.matchup && `(${injuryData.matchup})`}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // not found → healthy
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Injury Status</h3>
      <div className="bg-green-900 bg-opacity-30 p-4 rounded-lg flex items-start">
        <Activity className="text-green-400 w-5 h-5 mr-2" />
        <div>
          <p className="text-green-300 font-medium">No Injury Reported</p>
          <p className="text-green-400 text-sm mt-1">
            {playerName} is not listed on the latest NBA injury report.
          </p>
        </div>
      </div>
    </div>
  )
}

export default InjuryStatusCard
