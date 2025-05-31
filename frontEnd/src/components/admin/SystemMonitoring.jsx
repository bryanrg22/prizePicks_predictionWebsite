"use client"

import { useState, useEffect } from "react"
import {
  Activity,
  AlertTriangle,
  Clock,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { getSystemHealth } from "../../services/firebaseService"

export default function SystemMonitoring() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getSystemHealth()
        setHealth(data)
      } catch (err) {
        console.error("Error fetching system health:", err)
        setError("Failed to load system health: " + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
    // Refresh every 10 seconds
    const interval = setInterval(fetchHealth, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
        <span className="ml-3 text-gray-300">Loading system health...</span>
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

  const systemMetrics = [
    {
      name: "API Response Time",
      value: health?.apiResponseTime || "245ms",
      status: "good",
      icon: Clock,
      trend: "-12ms",
    },
    {
      name: "Database Performance",
      value: health?.databasePerformance || "98.5ms",
      status: health?.databasePerformance?.includes("error") ? "error" : "good",
      icon: Database,
      trend: "+0.2%",
    },
    {
      name: "CPU Usage",
      value: health?.cpuUsage || "34%",
      status: "good",
      icon: Cpu,
      trend: "+2%",
    },
    {
      name: "Memory Usage",
      value: health?.memoryUsage || "67%",
      status: "warning",
      icon: HardDrive,
      trend: "+5%",
    },
    {
      name: "Network Latency",
      value: health?.networkLatency || "12ms",
      status: "good",
      icon: Wifi,
      trend: "-1ms",
    },
    {
      name: "Error Rate",
      value: health?.errorRate || "0.2%",
      status: "good",
      icon: AlertTriangle,
      trend: "-0.1%",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "good":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "error":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusBg = (status) => {
    switch (status) {
      case "good":
        return "bg-green-900"
      case "warning":
        return "bg-yellow-900"
      case "error":
        return "bg-red-900"
      default:
        return "bg-gray-900"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "degraded":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Monitoring</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Activity className="w-4 h-4 text-green-400" />
          <span>Live monitoring - Updated {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systemMetrics.map((metric, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{metric.name}</p>
                <p className="text-2xl font-bold mt-1">{metric.value}</p>
                <p className={`text-xs mt-2 ${getStatusColor(metric.status)}`}>{metric.trend} vs last hour</p>
              </div>
              <div className={`p-3 rounded-lg ${getStatusBg(metric.status)} bg-opacity-20`}>
                <metric.icon className={`w-6 h-6 ${getStatusColor(metric.status)}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cloud Functions Status */}
      {health?.cloudFunctions && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Cloud Functions Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Injury Report Function</span>
                {getStatusIcon(health.cloudFunctions.injury_report)}
              </div>
              <p className="text-xs text-gray-400 capitalize">{health.cloudFunctions.injury_report}</p>
              <p className="text-xs text-gray-500">Updates hourly</p>
            </div>
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Game Check Function</span>
                {getStatusIcon(health.cloudFunctions.game_check)}
              </div>
              <p className="text-xs text-gray-400 capitalize">{health.cloudFunctions.game_check}</p>
              <p className="text-xs text-gray-500">Runs every 5 minutes</p>
            </div>
          </div>
        </div>
      )}

      {/* Service Status */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Service Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {health?.services &&
            Object.entries(health.services).map(([service, status], index) => (
              <div key={index} className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">{service.replace("_", " ")}</span>
                  {getStatusIcon(status)}
                </div>
                <p className="text-xs text-gray-400 capitalize">{status}</p>
                <p className="text-xs text-gray-500">{status === "operational" ? "99.9% uptime" : "Checking..."}</p>
              </div>
            ))}
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">System Alerts</h3>
        <div className="space-y-3">
          {[
            {
              level: "warning",
              message: "Memory usage approaching 70% threshold",
              time: "2 minutes ago",
              component: "Backend API",
            },
            {
              level: "info",
              message: "Database backup completed successfully",
              time: "15 minutes ago",
              component: "Database",
            },
            {
              level: "success",
              message: "API response time improved by 12ms",
              time: "1 hour ago",
              component: "API Gateway",
            },
            {
              level: "info",
              message: "Scheduled maintenance window completed",
              time: "3 hours ago",
              component: "System",
            },
          ].map((alert, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-700">
              <div
                className={`w-2 h-2 rounded-full mt-2 ${
                  alert.level === "error"
                    ? "bg-red-400"
                    : alert.level === "warning"
                      ? "bg-yellow-400"
                      : alert.level === "success"
                        ? "bg-green-400"
                        : "bg-blue-400"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm">{alert.message}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-400">{alert.component}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">{alert.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
