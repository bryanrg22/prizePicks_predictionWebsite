"use client"

import { useState } from "react"
import { Eye, EyeOff, Shield, Lock } from "lucide-react"
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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-red-900">
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center text-white mb-12">
          <div className="w-28 h-28 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
            <Shield className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Admin Portal</h1>
          <p className="text-xl text-gray-300 mt-2">System Administration</p>
        </div>

        <div className="w-full max-w-sm bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-red-600">
          <div className="px-8 py-10">
            <h2 className="text-2xl font-extrabold text-white mb-6 text-center">Admin Access</h2>
            {error && (
              <div className="bg-red-900 bg-opacity-50 border border-red-600 p-3 rounded-lg mb-4">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <label htmlFor="username" className="sr-only">
                  Admin Username
                </label>
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Admin Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Admin Password
                </label>
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Admin Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
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
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                  disabled={loading}
                >
                  {loading ? "Authenticating..." : "Access Admin Panel"}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/")}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                ← Back to User Login
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-gray-400">
        <p>&copy; 2025 Lambda Rim - Admin Portal</p>
      </footer>
    </div>
  )
}
