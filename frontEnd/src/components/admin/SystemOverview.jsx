"use client"

import { useState, useEffect } from "react"
import {
  Users,
  TrendingUp,
  Activity,
  DollarSign,
  Target,
  AlertTriangle,
  Clock,
  Database,
  RefreshCw,
} from "lucide-react"
import { getSystemOverview, getSystemLogs } from "../../services/firebaseService"

export default function SystemOverview() {
  const [overview, setOverview] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = async () => {
    try {
      setError(null)
      const [overviewData, logsData] = await Promise.all([getSystemOverview(), getSystemLogs()])

      setOverview(overviewData)
      setLogs(logsData.logs || [])
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error fetching system overview:", err)
      setError("Failed to load system overview: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    fetchData()
  }

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
        <span className="ml-3 text-gray-300">Loading real system data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-30 border border-red-600 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-red-300">{error}</p>
          <button onClick={handleRefresh} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm">
            Retry
          </button>
        </div>
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
      change: `+${overview?.concludedPlayers || 0} concluded`,
      changeType: "neutral",
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
      value: `${overview?.uptime || 99.8}%`,
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
      value: `${overview?.errorRate || 0.2}%`,
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-900",
      change: "-0.1%",
      changeType: "positive",
    },
    {
      title: "Avg Response Time",
      value: overview?.avgResponseTime || "245ms",
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
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Activity className="w-4 h-4 text-green-400" />
            <span>Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Loading..."}</span>
          </div>
        </div>
      </div>

      {/* Real-time Stats Grid */}
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

      {/* Real System Activity */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Recent System Activity</h3>
        <div className="space-y-3">
          {logs.length > 0 ? (
            logs.slice(0, 5).map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      log.level === "error" ? "bg-red-400" : log.level === "warning" ? "bg-yellow-400" : "bg-green-400"
                    }`}
                  />
                  <span className="text-sm">{log.message}</span>
                  <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">{log.service}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity logs available</p>
            </div>
          )}
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
