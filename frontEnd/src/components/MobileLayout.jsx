"use client"

import { useState } from "react"
import { Menu, X, Home, Users, History, Bell } from "lucide-react"

export default function MobileLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-md mr-3"></div>
          <h1 className="text-lg font-bold">PrizePicks Analyzer</h1>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-gray-800 min-h-screen p-4">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-blue-500 rounded-md mr-3"></div>
            <h1 className="text-xl font-bold">PrizePicks Analyzer</h1>
          </div>

          <nav className="space-y-2">
            <a href="#" className="block p-2 rounded hover:bg-gray-700">
              <Home className="w-5 h-5 inline mr-2" />
              Home
            </a>
            <a href="#" className="block p-2 rounded hover:bg-gray-700">
              <Users className="w-5 h-5 inline mr-2" />
              Already Processed Players
            </a>
            <a href="#" className="block p-2 rounded hover:bg-gray-700">
              <History className="w-5 h-5 inline mr-2" />
              Previous Bets
            </a>
            <a href="#" className="block p-2 rounded hover:bg-gray-700">
              <Bell className="w-5 h-5 inline mr-2" />
              Alerts
            </a>
          </nav>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-gray-800 p-4" onClick={(e) => e.stopPropagation()}>
              <nav className="space-y-2 mt-16">
                <a href="#" className="block p-2 rounded hover:bg-gray-700">
                  <Home className="w-5 h-5 inline mr-2" />
                  Home
                </a>
                <a href="#" className="block p-2 rounded hover:bg-gray-700">
                  <Users className="w-5 h-5 inline mr-2" />
                  Already Processed Players
                </a>
                <a href="#" className="block p-2 rounded hover:bg-gray-700">
                  <History className="w-5 h-5 inline mr-2" />
                  Previous Bets
                </a>
                <a href="#" className="block p-2 rounded hover:bg-gray-700">
                  <Bell className="w-5 h-5 inline mr-2" />
                  Alerts
                </a>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</div>
      </div>
    </div>
  )
}
