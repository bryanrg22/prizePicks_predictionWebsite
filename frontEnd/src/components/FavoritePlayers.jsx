import { Star, Plus } from "lucide-react"

export default function FavoritePlayers() {
  // Mock favorite players (empty for now)
  const favorites = []

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Your Favorite Players</h2>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((player) => (
            <div key={player.id} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center">
                <img
                  src={player.photoUrl || "/placeholder.svg"}
                  alt={player.name}
                  className="w-12 h-12 rounded-full object-cover mr-3"
                />
                <div>
                  <p className="font-bold">{player.name}</p>
                  <p className="text-sm text-gray-400">{player.team}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
          <p className="text-gray-400 mb-6">
            Add players to your favorites for quick access to their stats and analysis.
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center mx-auto">
            <Plus className="w-4 h-4 mr-2" />
            <span>Add Players</span>
          </button>
        </div>
      )}
    </div>
  )
}

