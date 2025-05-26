"use client"

import { useState, useEffect } from "react"
import { Users, Clock, TrendingUp, Award } from "lucide-react"
import { getUserAnalytics } from "../../services/firebaseService"

export default function UserAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const data = await getUserAnalytics(timeRange)
        setAnalytics(data)
      } catch (err) {
        console.error("Error fetching user analytics:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
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
        <h2 className="text-2xl font-bold">User Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* User Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Active Users</p>
              <p className="text-2xl font-bold mt-1">{analytics?.activeUsers || 0}</p>
              <p className="text-green-400 text-xs mt-2">+15% vs last period</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-900 bg-opacity-20">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Avg Session Time</p>
              <p className="text-2xl font-bold mt-1">{analytics?.avgSessionTime || "12m"}</p>
              <p className="text-green-400 text-xs mt-2">+2m vs last period</p>
            </div>
            <div className="p-3 rounded-lg bg-green-900 bg-opacity-20">
              <Clock className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Top Performer</p>
              <p className="text-2xl font-bold mt-1">bryanram</p>
              <p className="text-yellow-400 text-xs mt-2">$3,279 total winnings</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-900 bg-opacity-20">
              <Award className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">New Signups</p>
              <p className="text-2xl font-bold mt-1">{analytics?.newSignups || 0}</p>
              <p className="text-green-400 text-xs mt-2">+8 this week</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-900 bg-opacity-20">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* User Activity Table */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Recent User Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-3">User</th>
                <th className="pb-3">Last Login</th>
                <th className="pb-3">Total Bets</th>
                <th className="pb-3">Win Rate</th>
                <th className="pb-3">Total Winnings</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  user: "bryanram",
                  lastLogin: "2 hours ago",
                  totalBets: 14,
                  winRate: "78.6%",
                  winnings: "$3,279",
                  status: "active",
                },
                {
                  user: "john_doe",
                  lastLogin: "1 day ago",
                  totalBets: 8,
                  winRate: "62.5%",
                  winnings: "$450",
                  status: "active",
                },
                {
                  user: "jane_smith",
                  lastLogin: "3 days ago",
                  totalBets: 12,
                  winRate: "58.3%",
                  winnings: "$280",
                  status: "inactive",
                },
                {
                  user: "mike_wilson",
                  lastLogin: "5 days ago",
                  totalBets: 6,
                  winRate: "83.3%",
                  winnings: "$720",
                  status: "active",
                },
                {
                  user: "sarah_jones",
                  lastLogin: "1 week ago",
                  totalBets: 15,
                  winRate: "66.7%",
                  winnings: "$890",
                  status: "inactive",
                },
              ].map((user, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="py-3 font-medium">{user.user}</td>
                  <td className="py-3 text-gray-400">{user.lastLogin}</td>
                  <td className="py-3">{user.totalBets}</td>
                  <td className="py-3">
                    <span className={`${Number.parseFloat(user.winRate) > 60 ? "text-green-400" : "text-red-400"}`}>
                      {user.winRate}
                    </span>
                  </td>
                  <td className="py-3 font-medium">{user.winnings}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.status === "active" ? "bg-green-900 text-green-400" : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Engagement Chart */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">User Engagement Over Time</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {[65, 78, 82, 71, 89, 95, 88, 92, 85, 90, 94, 87, 91, 96].map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-red-600 rounded-t" style={{ height: `${(value / 100) * 200}px` }} />
              <span className="text-xs text-gray-400 mt-2">{index + 1}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-400 mt-4">
          <span>Daily Active Users</span>
          <span>Last 14 Days</span>
        </div>
      </div>
    </div>
  )
}
