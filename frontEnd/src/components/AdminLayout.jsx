"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Shield, LogOut, Menu, X, Activity } from "lucide-react"

export default function AdminLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const user = sessionStorage.getItem("adminUser")
    setAdminUser(user)
  }, [])

  const handleSignOut = () => {
    sessionStorage.removeItem("adminUser")
    sessionStorage.removeItem("isAdmin")
    navigate("/admin")
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Mobile Header */}
      <header className="bg-gray-800 lg:hidden border-b border-red-600">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold">Admin Portal</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium hidden sm:block">@{adminUser}</span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="bg-gray-800 py-4 hidden lg:block border-b border-red-600">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">PrizePicks Admin Portal</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">System Online</span>
            </div>
            <div className="text-sm">
              <p className="font-medium">Administrator</p>
              <p className="text-gray-400">@{adminUser}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md flex items-center transition-colors"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gray-800 shadow-xl border-l border-red-600">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Administrator</p>
                    <p className="text-gray-400 text-sm">@{adminUser}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">System Online</span>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors"
              >
                <LogOut className="w-5 h-5 mr-2" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-4 lg:py-8">
          {/* Admin Warning Banner */}
          <div className="bg-red-900 bg-opacity-30 border border-red-600 p-4 lg:p-6 rounded-lg mb-4 lg:mb-8">
            <h2 className="text-lg lg:text-xl font-bold mb-2 text-red-400">ADMIN ACCESS - RESTRICTED AREA</h2>
            <p className="text-red-300 text-sm lg:text-base">
              You have administrative access to the Lambda Rim system. Handle all data with care and maintain
              user privacy.
            </p>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}
