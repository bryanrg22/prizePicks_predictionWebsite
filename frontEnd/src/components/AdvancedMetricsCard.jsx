"use client"

import { Activity } from "lucide-react"

const AdvancedMetricsCard = ({ playerData }) => {
  // Extract advanced metrics from playerData
  const advancedMetrics = playerData?.advancedPerformance || {}
  const careerStats = playerData?.careerSeasonStats || []

  // Format numbers to 2 decimal places
  const formatNumber = (num) => {
    if (num === undefined || num === null) return "N/A"
    return typeof num === "number" ? num.toFixed(2) : num
  }

  // Format percentages
  const formatPercent = (num) => {
    if (num === undefined || num === null) return "N/A"
    return typeof num === "number" ? `${(num * 100).toFixed(1)}%` : num
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Advanced Metrics</h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-gray-400 text-sm">Effective FG%</p>
            <p className="text-2xl font-bold">{formatPercent(advancedMetrics.efg)}</p>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-gray-400 text-sm">3PT Shot Distribution</p>
            <p className="text-2xl font-bold">{formatPercent(advancedMetrics.shot_dist_3pt)}</p>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-gray-400 text-sm">FT Rate</p>
            <p className="text-2xl font-bold">{formatPercent(advancedMetrics.ft_rate)}</p>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3">Home vs Away Splits</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Home Average</p>
              <p className="text-xl font-bold">{formatNumber(advancedMetrics.avg_points_home)} pts</p>
            </div>
            <div>
              <p className="text-gray-400">Away Average</p>
              <p className="text-xl font-bold">{formatNumber(advancedMetrics.avg_points_away)} pts</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg mt-4">
          <h4 className="text-lg font-semibold mb-3">Career Season Stats</h4>
          {careerStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-2">Season</th>
                    <th className="pb-2">Team</th>
                    <th className="pb-2">GP</th>
                    <th className="pb-2">PPG</th>
                    <th className="pb-2">FG%</th>
                    <th className="pb-2">3P%</th>
                  </tr>
                </thead>
                <tbody>
                  {careerStats.map((season, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-2">{season.SEASON_ID}</td>
                      <td className="py-2">{season.TEAM_ABBREVIATION}</td>
                      <td className="py-2">{season.GP}</td>
                      <td className="py-2">{(season.PTS / season.GP).toFixed(1)}</td>
                      <td className="py-2">{(season.FG_PCT * 100).toFixed(1)}%</td>
                      <td className="py-2">{(season.FG3_PCT * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No career stats available</p>
          )}
        </div>

        <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg flex items-start">
          <Activity className="text-blue-400 w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-300 font-medium">What are these metrics?</p>
            <p className="text-blue-400 text-sm mt-1">
              <strong>Effective FG%:</strong> Field goal percentage adjusted for 3-pointers being worth more.
              <br />
              <strong>3PT Shot Distribution:</strong> Percentage of shots taken from 3-point range.
              <br />
              <strong>FT Rate:</strong> Free throw attempts per field goal attempt.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedMetricsCard
