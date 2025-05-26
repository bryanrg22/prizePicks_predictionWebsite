"use client"

import { useState, useEffect } from "react"
import { DollarSign, TrendingUp, CreditCard, Wallet } from "lucide-react"
import { getFinancialMetrics } from "../../services/firebaseService"

export default function FinancialMetrics() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const data = await getFinancialMetrics(timeRange)
        setMetrics(data)
      } catch (err) {
        console.error("Error fetching financial metrics:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
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
        <h2 className="text-2xl font-bold">Financial Metrics</h2>
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

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">${(metrics?.totalRevenue || 12450).toLocaleString()}</p>
              <p className="text-green-400 text-xs mt-2">+18.5% vs last period</p>
            </div>
            <div className="p-3 rounded-lg bg-green-900 bg-opacity-20">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">User Winnings</p>
              <p className="text-2xl font-bold mt-1">${(metrics?.userWinnings || 8450).toLocaleString()}</p>
              <p className="text-green-400 text-xs mt-2">+$1,240 this week</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-900 bg-opacity-20">
              <Wallet className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Platform ROI</p>
              <p className="text-2xl font-bold mt-1">{metrics?.platformROI || "142.3%"}</p>
              <p className="text-green-400 text-xs mt-2">+8.7% vs last period</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-900 bg-opacity-20">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Avg Bet Size</p>
              <p className="text-2xl font-bold mt-1">${metrics?.avgBetSize || 85}</p>
              <p className="text-green-400 text-xs mt-2">+$12 vs last period</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-900 bg-opacity-20">
              <CreditCard className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Subscription Fees</span>
              <span className="font-bold">$4,200 (34%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: "34%" }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span>Premium Features</span>
              <span className="font-bold">$3,150 (25%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full" style={{ width: "25%" }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span>API Usage</span>
              <span className="font-bold">$2,520 (20%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-yellow-400 h-2 rounded-full" style={{ width: "20%" }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span>Other</span>
              <span className="font-bold">$2,580 (21%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-purple-400 h-2 rounded-full" style={{ width: "21%" }}></div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Top Earning Users</h3>
          <div className="space-y-3">
            {[
              { user: "bryanram", winnings: "$3,279", bets: 14, roi: "2,900%" },
              { user: "mike_wilson", winnings: "$720", bets: 6, roi: "620%" },
              { user: "sarah_jones", winnings: "$890", bets: 15, roi: "445%" },
              { user: "john_doe", winnings: "$450", bets: 8, roi: "380%" },
              { user: "alex_smith", winnings: "$340", bets: 5, roi: "290%" },
            ].map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0"
              >
                <div>
                  <p className="font-medium">{user.user}</p>
                  <p className="text-sm text-gray-400">{user.bets} bets placed</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400">{user.winnings}</p>
                  <p className="text-sm text-gray-400">{user.roi} ROI</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Trends */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
        <div className="h-64 flex items-end justify-between space-x-1">
          {[
            320, 450, 380, 520, 480, 650, 720, 690, 780, 820, 850, 790, 920, 980, 940, 1020, 980, 1150, 1080, 1200,
            1140, 1280, 1220, 1350, 1290, 1420, 1380, 1500, 1450, 1580,
          ].map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-green-500 rounded-t" style={{ height: `${(value / 1600) * 200}px` }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-400 mt-4">
          <span>Daily Revenue ($)</span>
          <span>Last 30 Days</span>
        </div>
      </div>
    </div>
  )
}
