import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"

export default function DailyPicks({ picks }) {
  if (!picks || picks.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Picks for Today</h3>
          <p className="text-gray-400 mb-6">
            You haven't locked in any picks for today. Go to the Home tab to analyze players and make your picks.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-6">Today's Picks</h2>

        <div className="space-y-4">
          {picks.map((pick, index) => (
            <div key={pick.id || index} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={pick.photoUrl || "/placeholder.svg"}
                    alt={pick.name || pick.player}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h3 className="text-xl font-bold">{pick.name || pick.player}</h3>
                    <p className="text-gray-400">
                      {pick.team} vs {pick.opponent}
                    </p>
                    <div className="flex items-center mt-1 text-sm text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span className="mr-3">{pick.gameDate || "Today"}</span>
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{pick.gameTime || "8:30 PM ET"}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className={`px-3 py-1 rounded-md text-sm font-medium mb-2 ${
                      (pick.recommendation || pick.betExplanation?.recommendation)?.includes("OVER")
                        ? "bg-green-900 text-green-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {pick.threshold} pts {pick.recommendation || pick.betExplanation?.recommendation || "OVER"}
                  </div>
                  <div className="flex items-center justify-center text-xs text-gray-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    <span>Locked In</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Game Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Game Time</p>
              <p className="font-medium">{picks[0]?.gameTime || "8:30 PM Eastern Time"}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Location</p>
              <p className="font-medium">NBA Arena</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              Results will be available after the game concludes. Good luck with your picks!
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-6">Performance Tracker</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Today's Picks</p>
            <p className="text-3xl font-bold">{picks.length}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Potential Winnings</p>
            <p className="text-3xl font-bold text-green-500">$600</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Bet Amount</p>
            <p className="text-3xl font-bold">$200</p>
          </div>
        </div>
      </div>
    </div>
  )
}
