"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import ProcessedPlayers from "../components/ProcessedPlayers"
import { getUserPicks, addUserPick } from "../services/firebaseService"

export default function ProcessedPlayersPage() {
  const [picks, setPicks] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const navigate = useNavigate()

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
          // Load legacy picks only
          const legacyPicks = await getUserPicks(userId)
          if (legacyPicks?.length) setPicks(legacyPicks)
        } catch (picksError) {
          console.error("Error loading picks:", picksError)
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    }

    loadUserData()
  }, [navigate])

  // Add this function after the handleRemovePick function
  const handleAddProcessedPlayer = async (pick) => {
    const id = typeof pick.id === "string" ? pick.id : `${pick.playerId}_${pick.threshold}`

    const sanitized = { ...pick, id }

    // de-dupe & enforce max
    if (picks.find((p) => p.id === id)) {
      alert(`${pick.player || pick.name} is already in your picks`)
      return
    }

    if (picks.length >= 6) {
      alert("You can only add up to 6 picks")
      return
    }

    setPicks([...picks, sanitized])

    try {
      await addUserPick(currentUser, sanitized)
    } catch (err) {
      console.error("Error adding pick:", err)
      alert("Failed to save pick. Rolling back.")
      setPicks(picks.filter((p) => p.id !== id))
    }
  }

  return (
    <AppLayout>
      <ProcessedPlayers onAddToPicks={handleAddProcessedPlayer} />
    </AppLayout>
  )
}
