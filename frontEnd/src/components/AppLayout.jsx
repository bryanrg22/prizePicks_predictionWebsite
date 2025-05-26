"use client"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Home, LogOut, History, Bell, ListChecks } from "lucide-react"
import { getUserProfile } from "../services/firebaseService"

export default function AppLayout({ children }) {
  const [userProfile, setUserProfile] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current user from sessionStorage
        const userId = sessionStorage.getItem("currentUser")
        if (!userId) {
          console.error("No user logged in")
          navigate("/")
          return
        }

        setCurrentUser(userId)

        try {
          // Get user profile
          const profile = await getUserProfile(userId)
          if (!profile) {
            console.error("User profile not found")
            navigate("/")
            return
          }
          setUserProfile(profile)
        } catch (profileError) {
          console.error("Error loading user profile:", profileError)
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    }

    loadUserData()
  }, [navigate])

  // Total earnings from user profile
  const totalEarnings = userProfile?.totalEarnings || 0

  const handleSignOut = () => {
    // Clear user from sessionStorage
    sessionStorage.removeItem("currentUser")
    navigate("/") // Navigate to the SignIn page
  }

  const NavItem = ({ path, icon: Icon, label }) => {
    const isActive = location.pathname === path

    return (
      <button
        className={`flex items-center px-4 py-2 ${
          isActive ? "text-white bg-gray-700 rounded-md" : "text-gray-400 hover:text-white"
        } text-sm font-medium transition-colors`}
        onClick={() => navigate(path)}
      >
        <Icon className="w-5 h-5 mr-2" />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="/logo.png"
              alt="PrizePicks Logo"
              className="w-8 h-8"
              style={{
                aspectRatio: "1/1",
                objectFit: "contain",
              }}
            />
            <span className="text-xl font-semibold">PrizePicks Analyzer</span>
          </div>
          <nav className="flex space-x-4">
            <NavItem path="/dashboard" icon={Home} label="Home" />
            <NavItem path="/processed-players" icon={ListChecks} label="Already Processed Players" />
            <NavItem path="/previous-bets" icon={History} label="Previous Bets" />
            <NavItem path="/alerts" icon={Bell} label="Alerts" />
          </nav>
          <div className="flex items-center space-x-4">
            <img
              alt="User avatar"
              className="w-8 h-8 rounded-full"
              src={userProfile?.pfp || currentUser}
              style={{
                aspectRatio: "1/1",
                objectFit: "cover",
              }}
            />
            <div className="text-sm">
              <p className="font-medium">{userProfile?.displayName || currentUser}</p>
              <p className="text-gray-400">@{currentUser}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md flex items-center"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <div className="container mx-auto">
          {/* Warning Banner */}
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold mb-2 text-yellow-400">WARNING - PLAY AT YOUR OWN RISK</h2>
            <p className="text-gray-300">
              This website is currently in beta and testflight mode. Additionally, our model currently only does
              statistics on player points in the NBA, with its focus specifically on 'Over' points.
            </p>
          </div>

          {/* Earnings Banner */}
          <div className="bg-gradient-to-r from-green-900 to-green-700 p-6 rounded-lg mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Total Earnings</h2>
                <p className="text-gray-200">Keep up the good work! Your picks are paying off.</p>
              </div>
              <div className="text-4xl font-bold">${totalEarnings.toFixed(2)}</div>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}
