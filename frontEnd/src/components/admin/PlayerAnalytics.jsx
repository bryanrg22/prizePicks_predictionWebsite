"use client"

import { useState, useEffect } from "react"
import { Target, Users, BarChart3, Star } from "lucide-react"
import { getPlayerAnalytics } from "../../services/firebaseService"

export default function PlayerAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("hitRate")

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const data = await getPlayerAnalytics()
        setAnalytics(data)
      } catch (err) {
        console.error("Error fetching player analytics:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  const playerData = [
    {
      name: "LeBron James",
      team: "LAL",
      analyzed: 45,
      hitRate: 84.4,
      avgThreshold: 25.8,
      totalProfit: 1250,
      popularity: 92,
    },
    {
      name: "Stephen Curry",
      team: "GSW",
      analyzed: 38,
      hitRate: 81.6,
      avgThreshold: 28.2,
      totalProfit: 980,
      popularity: 89,
    },
    {
      name: "Luka Dončić",
      team: "DAL",
      analyzed: 42,
      hitRate: 78.6,
      avgThreshold: 30.1,
      totalProfit: 890,
      popularity: 85,
    },
    {
      name: "Jayson Tatum",
      team: "BOS",
      analyzed: 35,
      hitRate: 77.1,
      avgThreshold: 26.9,
      totalProfit: 720,
      popularity: 78,
    },
    {
      name: "Giannis Antetokounmpo",
      team: "MIL",
      analyzed: 40,
      hitRate: 75.0,
      avgThreshold: 29.8,
      totalProfit: 650,
      popularity: 82,
    },
    {
      name: "Kevin Durant",
      team: "PHX",
      analyzed: 33,
      hitRate: 72.7,
      avgThreshold: 27.5,
      totalProfit: 580,
      popularity: 75,
    },
    {
      name: "Nikola Jokić",
      team: "DEN",
      analyzed: 37,
      hitRate: 70.3,
      avgThreshold: 24.2,
      totalProfit: 520,
      popularity: 71,
    },
    {
      name: "Joel Embiid",
      team: "PHI",
      analyzed: 29,
      hitRate: 69.0,
      avgThreshold: 28.7,
      totalProfit: 480,
      popularity: 68,
    },
  ]

  const sortedPlayers = [...playerData].sort((a, b) => {
    switch (sortBy) {
      case "hitRate":
        return b.hitRate - a.hitRate
      case "analyzed":
        return b.analyzed - a.analyzed
      case "profit":
        return b.totalProfit - a.totalProfit
      case "popularity":
        return b.popularity - a.popularity
      default:
        return 0
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Player Analytics</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="hitRate">Sort by Hit Rate</option>
          <option value="analyzed">Sort by Times Analyzed</option>
          <option value="profit">Sort by Total Profit</option>
          <option value="popularity">Sort by Popularity</option>
        </select>
      </div>

      {/* Player Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Players Analyzed</p>
              <p className="text-2xl font-bold mt-1">{analytics?.totalPlayers || 247}</p>
              <p className="text-green-400 text-xs mt-2">+18 this week</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-900 bg-opacity-20">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Avg Hit Rate</p>
              <p className="text-2xl font-bold mt-1">{analytics?.avgHitRate || "76.3%"}</p>
              <p className="text-green-400 text-xs mt-2">+1.2% vs last month</p>
            </div>
            <div className="p-3 rounded-lg bg-green-900 bg-opacity-20">
              <Target className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Most Popular</p>
              <p className="text-2xl font-bold mt-1">LeBron</p>
              <p className="text-yellow-400 text-xs mt-2">45 times analyzed</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-900 bg-opacity-20">
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Avg Threshold</p>
              <p className="text-2xl font-bold mt-1">27.2 pts</p>
              <p className="text-gray-400 text-xs mt-2">Across all players</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-900 bg-opacity-20">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Player Performance Table */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Player Performance Rankings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-3">Rank</th>
                <th className="pb-3">Player</th>
                <th className="pb-3">Team</th>
                <th className="pb-3">Times Analyzed</th>
                <th className="pb-3">Hit Rate</th>
                <th className="pb-3">Avg Threshold</th>
                <th className="pb-3">Total Profit</th>
                <th className="pb-3">Popularity</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="py-3">
                    <div className="flex items-center">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-black"
                            : index === 1
                              ? "bg-gray-400 text-black"
                              : index === 2
                                ? "bg-orange-600 text-white"
                                : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 font-medium">{player.name}</td>
                  <td className="py-3 text-gray-400">{player.team}</td>
                  <td className="py-3">{player.analyzed}</td>
                  <td className="py-3">
                    <span
                      className={`${player.hitRate > 80 ? "text-green-400" : player.hitRate > 70 ? "text-yellow-400" : "text-red-400"}`}
                    >
                      {player.hitRate}%
                    </span>
                  </td>
                  <td className="py-3">{player.avgThreshold} pts</td>
                  <td className="py-3 font-medium text-green-400">${player.totalProfit}</td>
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${player.popularity}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-400">{player.popularity}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Threshold Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Threshold Distribution</h3>
          <div className="space-y-3">
            {[
              { range: "20-25 pts", count: 89, percentage: 36 },
              { range: "25-30 pts", count: 102, percentage: 41 },
              { range: "30-35 pts", count: 45, percentage: 18 },
              { range: "35+ pts", count: 11, percentage: 5 },
            ].map((range, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{range.range}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: `${range.percentage}%` }}></div>
                  </div>
                  <span className="text-sm text-gray-400 w-12">{range.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Team Analysis Frequency</h3>
          <div className="space-y-3">
            {[
              { team: "LAL", count: 45, percentage: 18 },
              { team: "GSW", count: 38, percentage: 15 },
              { team: "DAL", count: 42, percentage: 17 },
              { team: "BOS", count: 35, percentage: 14 },
              { team: "MIL", count: 40, percentage: 16 },
              { team: "Others", count: 47, percentage: 20 },
            ].map((team, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{team.team}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${team.percentage}%` }}></div>
                  </div>
                  <span className="text-sm text-gray-400 w-12">{team.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
