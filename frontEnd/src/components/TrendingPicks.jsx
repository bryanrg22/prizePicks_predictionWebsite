import { BarChart2, TrendingUp } from "lucide-react"

export default function TrendingPicks() {
  // Mock trending data
  const trendingPicks = [
    {
      id: 1,
      player: "LeBron James",
      team: "Los Angeles Lakers",
      threshold: "24.5",
      recommendation: "OVER",
      popularity: 87,
      photoUrl: "/lebronJames.png",
    },
    {
      id: 2,
      player: "Stephen Curry",
      team: "Golden State Warriors",
      threshold: "26.5",
      recommendation: "OVER",
      popularity: 82,
      photoUrl: "/placeholder.svg",
    },
    {
      id: 3,
      player: "Giannis Antetokounmpo",
      team: "Milwaukee Bucks",
      threshold: "28.5",
      recommendation: "OVER",
      popularity: 75,
      photoUrl: "/placeholder.svg",
    },
  ]

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Trending Picks</h2>

      <div className="space-y-4">
        {trendingPicks.map((pick) => (
          <div key={pick.id} className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src={pick.photoUrl || "/placeholder.svg"}
                  alt={pick.player}
                  className="w-12 h-12 rounded-full object-cover mr-3"
                />
                <div>
                  <p className="font-bold">{pick.player}</p>
                  <p className="text-sm text-gray-400">{pick.team}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="mr-4">
                  <p className="text-sm text-gray-400">Threshold</p>
                  <p className="font-medium">{pick.threshold} pts</p>
                </div>
                <div className="mr-4">
                  <p className="text-sm text-gray-400">Recommendation</p>
                  <p className="font-medium text-green-500 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {pick.recommendation}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Popularity</p>
                  <div className="flex items-center">
                    <BarChart2 className="w-4 h-4 mr-1 text-blue-500" />
                    <p className="font-medium">{pick.popularity}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-gray-400 mt-6 text-center">
        These are the most popular picks among users in the last 24 hours.
      </p>
    </div>
  )
}

