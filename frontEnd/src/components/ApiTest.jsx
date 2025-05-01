"use client"

import { useEffect, useState } from "react"
import { testAPI } from "../services/api"
import ChatGptThinking from "./ChatGptThinking"

export default function ApiTest() {
  const [status, setStatus] = useState("Loading...")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true)
        const result = await testAPI()
        setStatus(`API Connected: ${JSON.stringify(result)}`)
        setError(null)
      } catch (err) {
        setStatus("Failed to connect")
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">API Connection Test</h3>

      {loading ? (
        <div className="py-2">
          <ChatGptThinking text="Testing API Connection" />
        </div>
      ) : (
        <>
          <p className={error ? "text-red-400" : "text-green-400"}>{status}</p>
          {error && <p className="text-red-400 mt-2">Error: {error}</p>}
          <button className="mt-2 px-4 py-2 bg-blue-600 rounded-md" onClick={() => window.location.reload()}>
            Retry
          </button>
        </>
      )}
    </div>
  )
}

