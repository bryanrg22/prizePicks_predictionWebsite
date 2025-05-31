"use client"

import { useState } from "react"
import { Eye, EyeOff, Shield, Lock, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { getAdminCredentials, verifyAdminPassword } from "../services/firebaseService"

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Check admin credentials
      const adminData = await getAdminCredentials()

      if (!adminData) {
        setError("Admin access not configured.")
        setLoading(false)
        return
      }

      // Verify admin credentials
      if (!verifyAdminPassword(adminData, username, password)) {
        setError("Invalid admin credentials.")
        setLoading(false)
        return
      }

      // Store admin session
      sessionStorage.setItem("adminUser", username)
      sessionStorage.setItem("isAdmin", "true")

      // Navigate to admin dashboard
      navigate("/admin/dashboard")
    } catch (error) {
      console.error("Error during admin authentication:", error)
      setError(`Authentication error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Pattern - More Subtle for Admin */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/5 via-transparent to-red-900/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(239,68,68,0.1),transparent_50%)]"></div>

      <main className="relative flex-grow flex flex-col items-center justify-center px-4 py-12">
        {/* Admin Branding */}
        <div className="text-center text-white mb-12">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-2xl">
              <Shield className="w-16 h-16 text-white drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 via-orange-500 to-red-600 bg-clip-text text-transparent mb-3">
            Admin Portal
          </h1>
          <p className="text-xl text-gray-300 font-medium">System Administration</p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-red-900/20 border border-red-700/30 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-red-300 text-sm font-medium">Secure Access Required</span>
          </div>
        </div>

        {/* Admin Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-red-700/30 overflow-hidden">
            {/* Card Header */}
            <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-red-900/20 to-orange-900/20 border-b border-red-700/20">
              <h2 className="text-2xl font-bold text-white text-center mb-2">Admin Access</h2>
              <p className="text-gray-400 text-center text-sm">Authorized personnel only</p>
            </div>

            {/* Form */}
            <div className="px-8 pb-8">
              {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <label htmlFor="username" className="sr-only">
                    Admin Username
                  </label>
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-600/50 rounded-xl leading-5 bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 backdrop-blur-sm"
                    placeholder="Admin Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <label htmlFor="password" className="sr-only">
                    Admin Password
                  </label>
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-12 pr-12 py-4 border border-gray-600/50 rounded-xl leading-5 bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 backdrop-blur-sm"
                    placeholder="Admin Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Authenticating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Access Admin Panel
                      </div>
                    )}
                  </button>
                </div>
              </form>

              {/* Back to User Login */}
              <div className="mt-8 pt-6 border-t border-gray-700/50">
                <button
                  onClick={() => navigate("/")}
                  className="w-full flex items-center justify-center py-3 px-4 text-sm text-gray-400 hover:text-white transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:text-orange-400 transition-colors" />
                  <span>Back to User Login</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative py-6 text-center text-gray-400">
        <p className="text-sm">&copy; 2025 Lambda Rim - Admin Portal</p>
      </footer>
    </div>
  )
}
