"use client"

const MobilePlayerCard = ({ player }) => {
  return (
    <div className="bg-gray-800 p-4 md:p-6 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <img
            src={player.photoUrl || "/placeholder.svg?height=100&width=100"}
            alt={player.name}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "/placeholder.svg?height=100&width=100"
            }}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-2xl font-bold truncate">{player.name}</h2>
            <p className="text-gray-400 truncate">{player.team}</p>
            <p className="text-gray-400 truncate">Position: {player.position}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center">
            <img
              src={player.teamLogo || "/placeholder.svg?height=20&width=20"}
              alt={player.team}
              className="w-5 h-5 mr-2 flex-shrink-0"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = "/placeholder.svg?height=20&width=20"
              }}
            />
            <span className="text-gray-500">Team Rank: {player.teamPlayoffRank}</span>
          </div>
          <div className="flex items-center">
            <img
              src={player.opponentLogo || "/placeholder.svg?height=20&width=20"}
              alt={player.opponent}
              className="w-5 h-5 mr-2 flex-shrink-0"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = "/placeholder.svg?height=20&width=20"
              }}
            />
            <span className="text-gray-500">Opponent Rank: {player.opponentPlayoffRank}</span>
          </div>
        </div>

        {player.gameDate && (
          <div className="text-sm text-gray-500 sm:ml-4">
            Next Game: {player.gameDate} ({player.gameTime}) vs. {player.opponent}
          </div>
        )}
      </div>
    </div>
  )
}

export default MobilePlayerCard
