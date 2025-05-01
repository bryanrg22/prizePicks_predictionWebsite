// Script to periodically update bet results
// This can be run as a separate process or as a scheduled task

const updateAllBets = async () => {
  try {
    // In a real implementation, you would get a list of all users
    // For now, we'll use a hardcoded list
    const users = ["demo", "user1", "user2"]

    for (const userId of users) {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/update_all_bets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        })

        if (!response.ok) {
          console.error(`Error updating bets for user ${userId}: ${response.statusText}`)
          continue
        }

        const result = await response.json()
        console.log(`Updated ${result.updated} bets and completed ${result.completed} bets for user ${userId}`)
      } catch (error) {
        console.error(`Error updating bets for user ${userId}:`, error)
      }
    }
  } catch (error) {
    console.error("Error updating bets:", error)
  }
}

// Run the update function every 15 minutes
const runUpdateSchedule = () => {
  console.log("Starting bet update schedule...")

  // Run immediately on startup
  updateAllBets()

  // Then run every 15 minutes
  setInterval(updateAllBets, 15 * 60 * 1000)
}

// Export for use in other files
export { updateAllBets, runUpdateSchedule }

