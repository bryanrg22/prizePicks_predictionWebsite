"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Target, DollarSign, Percent, Trophy } from "lucide-react"
import { getBetPerformance } from "../../services/firebaseService"

export default function BetPerformance() {
  const [performance, setPerformance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true)
        const data = await getBetPerformance(timeRange)
        setPerformance(data)
      } catch (err) {
        console.error("Error fetching bet performance:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPerformance()
  }, [timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bet Performance Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
        </select>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Bets</p>
              <p className="text-2xl font-bold mt-1">{performance?.totalBets || 156}</p>
              <p className="text-green-400 text-xs mt-2">+23 this week</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-900 bg-opacity-20">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Win Rate</p>
              <p className="text-2xl font-bold mt-1">{performance?.winRate || "68.2%"}</p>
              <p className="text-green-400 text-xs mt-2">+2.1% vs last period</p>
            </div>
            <div className="p-3 rounded-lg bg-green-900 bg-opacity-20">
              <Percent className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Winnings</p>
              <p className="text-2xl font-bold mt-1">${(performance?.totalWinnings || 8450).toLocaleString()}</p>
              <p className="text-green-400 text-xs mt-2">+$1,240 this week</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-900 bg-opacity-20">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">ROI</p>
              <p className="text-2xl font-bold mt-1">{performance?.roi || "142.3%"}</p>
              <p className="text-green-400 text-xs mt-2">+8.7% vs last period</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-900 bg-opacity-20">
              <Trophy className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Win/Loss Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Win/Loss Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span>Winning Bets</span>
              </div>
              <div className="text-right">
                <p className="font-bold">106</p>
                <p className="text-sm text-gray-400">68.2%</p>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: "68.2%" }}></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span>Losing Bets</span>
              </div>
              <div className="text-right">
                <p className="font-bold">50</p>
                <p className="text-sm text-gray-400">31.8%</p>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-red-400 h-2 rounded-full" style={{ width: "31.8%" }}></div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Most Profitable Picks</h3>
          <div className="space-y-3">
            {[
              { player: "LeBron James", threshold: "25.5 pts", winRate: "85%", profit: "$450" },
              { player: "Stephen Curry", threshold: "28.5 pts", winRate: "80%", profit: "$380" },
              { player: "Luka Dončić", threshold: "30.5 pts", winRate: "75%", profit: "$320" },
              { player: "Jayson Tatum", threshold: "26.5 pts", winRate: "78%", profit: "$290" },
              { player: "Giannis Antetokounmpo", threshold: "29.5 pts", winRate: "72%", profit: "$275" },
            ].map((pick, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0"
              >
                <div>
                  <p className="font-medium">{pick.player}</p>
                  <p className="text-sm text-gray-400">{pick.threshold}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400">{pick.profit}</p>
                  <p className="text-sm text-gray-400">{pick.winRate} win rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
        <div className="h-64 flex items-end justify-between space-x-1">
          {[
            45, 52, 48, 61, 58, 67, 72, 69, 75, 78, 82, 79, 85, 88, 84, 90, 87, 92, 89, 94, 91, 96, 93, 98, 95, 99, 97,
            100, 98, 102,
          ].map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t ${value > 70 ? "bg-green-500" : value > 50 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ height: `${(value / 120) * 200}px` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-400 mt-4">
          <span>Daily Win Rate %</span>
          <span>Last 30 Days</span>
        </div>
      </div>
    </div>
  )
}
