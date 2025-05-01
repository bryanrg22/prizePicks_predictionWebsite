import { Bell, Settings } from "lucide-react"

export default function Notifications() {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Alerts & Notifications</h2>

      <div className="text-center py-12">
        <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Notifications Coming Soon</h3>
        <p className="text-gray-400 mb-6">
          Soon you'll be able to set up alerts for your favorite players, games, and betting opportunities.
        </p>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center mx-auto">
          <Settings className="w-4 h-4 mr-2" />
          <span>Notification Preferences</span>
        </button>
      </div>

      <div className="mt-8 border-t border-gray-700 pt-6">
        <h3 className="text-lg font-semibold mb-4">Notification Types</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium">Game Start Alerts</p>
              <p className="text-sm text-gray-400">Get notified when games with your picks are starting</p>
            </div>
            <div className="relative">
              <input type="checkbox" id="game-alerts" className="sr-only" disabled />
              <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
              <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium">Player Performance Updates</p>
              <p className="text-sm text-gray-400">Get updates on how your picked players are performing</p>
            </div>
            <div className="relative">
              <input type="checkbox" id="performance-alerts" className="sr-only" disabled />
              <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
              <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium">Bet Result Notifications</p>
              <p className="text-sm text-gray-400">Get notified when your bets are settled</p>
            </div>
            <div className="relative">
              <input type="checkbox" id="result-alerts" className="sr-only" disabled />
              <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
              <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

