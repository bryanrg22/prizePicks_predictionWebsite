"use client"

import { useState, useEffect } from "react"
import { Users, TrendingUp, Activity, DollarSign, Target, AlertTriangle, Clock, Database } from "lucide-react"
import { getSystemOverview } from "../../services/firebaseService"

export default function SystemOverview() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true)
        const data = await getSystemOverview()
        setOverview(data)
      } catch (err) {
        console.error("Error fetching system overview:", err)
        setError("Failed to load system overview")
      } finally {
        setLoading(false)
      }
    }

    fetchOverview()
    // Refresh every 30 seconds
    const interval = setInterval(fetchOverview, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-30 border border-red-600 p-4 rounded-lg">
        <p className="text-red-300">{error}</p>
      </div>
    )
  }

  const stats = [
    {
      title: "Total Users",
      value: overview?.totalUsers || 0,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-900",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Active Bets",
      value: overview?.activeBets || 0,
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-900",
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "Processed Players",
      value: overview?.processedPlayers || 0,
      icon: Target,
      color: "text-purple-400",
      bgColor: "bg-purple-900",
      change: "+156",
      changeType: "positive",
    },
    {
      title: "Total Winnings",
      value: `$${(overview?.totalWinnings || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-yellow-400",
      bgColor: "bg-yellow-900",
      change: "+24%",
      changeType: "positive",
    },
    {
      title: "System Uptime",
      value: "99.8%",
      icon: Activity,
      color: "text-green-400",
      bgColor: "bg-green-900",
      change: "24h",
      changeType: "neutral",
    },
    {
      title: "API Requests",
      value: overview?.apiRequests || 0,
      icon: Database,
      color: "text-cyan-400",
      bgColor: "bg-cyan-900",
      change: "+45%",
      changeType: "positive",
    },
    {
      title: "Error Rate",
      value: "0.2%",
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-900",
      change: "-0.1%",
      changeType: "positive",
    },
    {
      title: "Avg Response Time",
      value: "245ms",
      icon: Clock,
      color: "text-orange-400",
      bgColor: "bg-orange-900",
      change: "-12ms",
      changeType: "positive",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Overview</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Activity className="w-4 h-4 text-green-400" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span
                    className={`text-xs ${
                      stat.changeType === "positive"
                        ? "text-green-400"
                        : stat.changeType === "negative"
                          ? "text-red-400"
                          : "text-gray-400"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-gray-500 text-xs ml-1">vs last period</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor} bg-opacity-20`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Recent System Activity</h3>
        <div className="space-y-3">
          {[
            { time: "2 minutes ago", event: "New user registered: john_doe", type: "user" },
            { time: "5 minutes ago", event: "Bet settled: $150 win for bryanram", type: "bet" },
            { time: "8 minutes ago", event: "Player analyzed: LeBron James (23.5 pts)", type: "analysis" },
            { time: "12 minutes ago", event: "System backup completed", type: "system" },
            { time: "15 minutes ago", event: "API rate limit adjusted", type: "system" },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === "user"
                      ? "bg-blue-400"
                      : activity.type === "bet"
                        ? "bg-green-400"
                        : activity.type === "analysis"
                          ? "bg-purple-400"
                          : "bg-gray-400"
                  }`}
                />
                <span className="text-sm">{activity.event}</span>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg hover:bg-opacity-50 transition-colors">
            <Users className="w-6 h-6 text-blue-400 mb-2" />
            <p className="font-medium">Manage Users</p>
            <p className="text-sm text-gray-400">View and edit user accounts</p>
          </button>
          <button className="p-4 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg hover:bg-opacity-50 transition-colors">
            <Database className="w-6 h-6 text-green-400 mb-2" />
            <p className="font-medium">Database Backup</p>
            <p className="text-sm text-gray-400">Create system backup</p>
          </button>
          <button className="p-4 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg hover:bg-opacity-50 transition-colors">
            <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
            <p className="font-medium">System Alerts</p>
            <p className="text-sm text-gray-400">View critical alerts</p>
          </button>
        </div>
      </div>
    </div>
  )
}
