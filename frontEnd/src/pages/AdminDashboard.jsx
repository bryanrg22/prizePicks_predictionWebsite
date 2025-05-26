"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../components/AdminLayout"
import SystemOverview from "../components/admin/SystemOverview"
import UserAnalytics from "../components/admin/UserAnalytics"
import BetPerformance from "../components/admin/BetPerformance"
import PlayerAnalytics from "../components/admin/PlayerAnalytics"
import FinancialMetrics from "../components/admin/FinancialMetrics"
import SystemMonitoring from "../components/admin/SystemMonitoring"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Check admin authentication
  useEffect(() => {
    const isAdmin = sessionStorage.getItem("isAdmin")
    const adminUser = sessionStorage.getItem("adminUser")

    if (!isAdmin || !adminUser) {
      navigate("/admin")
      return
    }

    setLoading(false)
  }, [navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  const tabs = [
    { id: "overview", label: "System Overview", component: SystemOverview },
    { id: "users", label: "User Analytics", component: UserAnalytics },
    { id: "bets", label: "Bet Performance", component: BetPerformance },
    { id: "players", label: "Player Analytics", component: PlayerAnalytics },
    { id: "financial", label: "Financial Metrics", component: FinancialMetrics },
    { id: "monitoring", label: "System Monitoring", component: SystemMonitoring },
  ]

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || SystemOverview

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-gray-800 rounded-lg p-1">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id ? "bg-red-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Tab Content */}
        <div className="min-h-[600px]">
          <ActiveComponent />
        </div>
      </div>
    </AdminLayout>
  )
}
