"use client"

import { useState, useEffect } from "react"
import { Activity, AlertTriangle, Clock, Database, Cpu, HardDrive, Wifi } from "lucide-react"
import { getSystemHealth } from "../../services/firebaseService"

export default function SystemMonitoring() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true)
        const data = await getSystemHealth()
        setHealth(data)
      } catch (err) {
        console.error("Error fetching system health:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
    // Refresh every 10 seconds
    const interval = setInterval(fetchHealth, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  const systemMetrics = [
    {
      name: "API Response Time",
      value: "245ms",
      status: "good",
      icon: Clock,
      trend: "-12ms",
    },
    {
      name: "Database Performance",
      value: "98.5%",
      status: "good",
      icon: Database,
      trend: "+0.2%",
    },
    {
      name: "CPU Usage",
      value: "34%",
      status: "good",
      icon: Cpu,
      trend: "+2%",
    },
    {
      name: "Memory Usage",
      value: "67%",
      status: "warning",
      icon: HardDrive,
      trend: "+5%",
    },
    {
      name: "Network Latency",
      value: "12ms",
      status: "good",
      icon: Wifi,
      trend: "-1ms",
    },
    {
      name: "Error Rate",
      value: "0.2%",
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

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">API Response Time (24h)</h3>
          <div className="h-48 flex items-end justify-between space-x-1">
            {[
              245, 238, 252, 241, 235, 248, 243, 239, 251, 244, 237, 249, 242, 236, 250, 245, 240, 247, 243, 238, 252,
              246, 241, 248,
            ].map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t ${value > 250 ? "bg-red-500" : value > 245 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ height: `${((value - 230) / 25) * 150}px` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-4">
            <span>Response Time (ms)</span>
            <span>Last 24 Hours</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Error Rate (24h)</h3>
          <div className="h-48 flex items-end justify-between space-x-1">
            {[
              0.1, 0.2, 0.1, 0.3, 0.2, 0.1, 0.4, 0.2, 0.1, 0.2, 0.3, 0.1, 0.2, 0.1, 0.3, 0.2, 0.1, 0.2, 0.3, 0.1, 0.2,
              0.1, 0.2, 0.1,
            ].map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t ${value > 0.3 ? "bg-red-500" : value > 0.2 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ height: `${(value / 0.5) * 150}px` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-4">
            <span>Error Rate (%)</span>
            <span>Last 24 Hours</span>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Service Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: "Frontend (React)", status: "operational", uptime: "99.9%" },
            { name: "Backend API (Flask)", status: "operational", uptime: "99.8%" },
            { name: "Database (Firestore)", status: "operational", uptime: "100%" },
            { name: "Cloud Functions", status: "operational", uptime: "99.7%" },
            { name: "Authentication", status: "operational", uptime: "100%" },
            { name: "File Storage", status: "operational", uptime: "99.9%" },
            { name: "Analytics", status: "degraded", uptime: "98.2%" },
            { name: "Monitoring", status: "operational", uptime: "99.8%" },
          ].map((service, index) => (
            <div key={index} className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{service.name}</span>
                <div
                  className={`w-3 h-3 rounded-full ${
                    service.status === "operational"
                      ? "bg-green-400"
                      : service.status === "degraded"
                        ? "bg-yellow-400"
                        : "bg-red-400"
                  }`}
                />
              </div>
              <p className="text-xs text-gray-400 capitalize">{service.status}</p>
              <p className="text-xs text-gray-500">{service.uptime} uptime</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
