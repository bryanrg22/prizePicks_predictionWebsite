// Migration script to convert existing data to document references
import { migrateUserToReferences, getUserByUsername } from "../services/firebaseService.js"

/**
 * Migration script to convert all user data to document references
 * Run this once to migrate existing data
 */
const migrateAllUsersToReferences = async () => {
  try {
    console.log("Starting migration to document references...")

    // List of known users - in production, you'd get this from Firestore
    const usernames = ["bryanram", "admin"] // Add your actual usernames here

    const results = []

    for (const username of usernames) {
      console.log(`\nMigrating user: ${username}`)

      try {
        // Check if user exists
        const user = await getUserByUsername(username)
        if (!user) {
          console.log(`User ${username} not found, skipping...`)
          continue
        }

        // Migrate user data
        const result = await migrateUserToReferences(username)
        results.push({ username, ...result })

        if (result.success) {
          console.log(`✅ Successfully migrated ${username}`)
          console.log(`   - Picks: ${result.results.picks.message}`)
          console.log(`   - Active Bets: ${result.results.activeBets.message}`)
          console.log(`   - Bet History: ${result.results.betHistory.message}`)
        } else {
          console.log(`❌ Failed to migrate ${username}: ${result.message}`)
        }
      } catch (error) {
        console.error(`Error migrating ${username}:`, error)
        results.push({
          username,
          success: false,
          message: error.message,
        })
      }
    }

    // Summary
    console.log("\n=== Migration Summary ===")
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`✅ Successful migrations: ${successful}`)
    console.log(`❌ Failed migrations: ${failed}`)
    console.log(`📊 Total users processed: ${results.length}`)

    if (failed > 0) {
      console.log("\nFailed migrations:")
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  - ${r.username}: ${r.message}`)
        })
    }

    return results
  } catch (error) {
    console.error("Migration script error:", error)
    throw error
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllUsersToReferences()
    .then((results) => {
      console.log("\nMigration completed!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Migration failed:", error)
      process.exit(1)
    })
}

export { migrateAllUsersToReferences }
