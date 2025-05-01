"use client"

const PlayerCard = ({ player }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg flex items-center">
      <img
        src={player.photoUrl || "/placeholder.svg?height=100&width=100"}
        alt={player.name}
        className="w-24 h-24 rounded-full mr-4 object-cover"
        onError={(e) => {
          e.target.onerror = null
          e.target.src = "/placeholder.svg?height=100&width=100"
        }}
      />
      <div>
        <h2 className="text-2xl font-bold">{player.name}</h2>
        <p className="text-gray-400">{player.team}</p>
        <p className="text-gray-400">Position: {player.position}</p>
        <div className="flex items-center mt-2">
          <img
            src={player.teamLogo || "/placeholder.svg?height=20&width=20"}
            alt={player.team}
            className="w-5 h-5 mr-2"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "/placeholder.svg?height=20&width=20"
            }}
          />
          <p className="text-sm text-gray-500">Team Rank: {player.teamPlayoffRank}</p>
          <img
            src={player.opponentLogo || "/placeholder.svg?height=20&width=20"}
            alt={player.opponent}
            className="w-5 h-5 ml-4 mr-2"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "/placeholder.svg?height=20&width=20"
            }}
          />
          <p className="text-sm text-gray-500">Opponent Rank: {player.opponentPlayoffRank}</p>
        </div>
        {player.gameDate && (
          <p className="text-sm text-gray-500">
            Next Game: {player.gameDate} ({player.gameTime}) vs. {player.opponent}
          </p>
        )}
      </div>
    </div>
  )
}

export default PlayerCard

