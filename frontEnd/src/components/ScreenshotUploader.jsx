"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, Check, AlertCircle, Loader2, Camera, FileText, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ImageWithFallback from "./ImageWithFallback"


const ScreenshotUploader = ({ onUploadComplete }) => {
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)
  const [parsedPlayers, setParsedPlayers] = useState([])
  const [playerStatuses, setPlayerStatuses] = useState({})
  

  // Simulate progress during upload
  const simulateProgress = useCallback(() => {
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 15
        if (newProgress >= 95) {
          clearInterval(interval)
          return 95
        }
        return newProgress
      })
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)

    // Filter for image files only
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      setError("Please select image files only")
      return
    }

    setFiles((prev) => [...prev, ...imageFiles])

    // Create previews for the images
    const newPreviews = imageFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: formatFileSize(file.size),
      type: file.type.split("/")[1].toUpperCase(),
    }))

    setPreviews((prev) => [...prev, ...newPreviews])
    setError(null)
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const removeFile = (index) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index].url)

    setFiles(files.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const removeAllFiles = () => {
    // Revoke all object URLs
    previews.forEach((preview) => URL.revokeObjectURL(preview.url))
    setFiles([])
    setPreviews([])
  }

  const handleDrop = (e) => {
    e.preventDefault()

    const droppedFiles = Array.from(e.dataTransfer.files)
    const imageFiles = droppedFiles.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      setError("Please drop image files only")
      return
    }

    setFiles((prev) => [...prev, ...imageFiles])

    const newPreviews = imageFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: formatFileSize(file.size),
      type: file.type.split("/")[1].toUpperCase(),
    }))

    setPreviews((prev) => [...prev, ...newPreviews])
    setError(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("border-blue-500")
      dropZoneRef.current.classList.add("bg-blue-900")
      dropZoneRef.current.classList.add("bg-opacity-10")
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-blue-500")
      dropZoneRef.current.classList.remove("bg-blue-900")
      dropZoneRef.current.classList.remove("bg-opacity-10")
    }
  }

  const processPlayers = async (players) => {
    // initialize all to "pending"
    const initial = players.reduce((acc, _, i) => ({ ...acc, [i]: 'pending' }), {});
    setPlayerStatuses(initial);
  
    for (let i = 0; i < players.length; i++) {
      const { playerName, threshold } = players[i];
      setPlayerStatuses(ps => ({ ...ps, [i]: 'processing' }));
      try {
        const res = await fetch('/api/player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName, threshold })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await res.json()
        setPlayerStatuses((ps) => ({ ...ps, [i]: "success" }))
        } catch (e) {
          console.error(`Error processing ${playerName}:`, e)     // NEW: detailed log
          setPlayerStatuses((ps) => ({ ...ps, [i]: "error" }))
      }
    }
  
    // once all done, clear previews & files
    previews.forEach(p => URL.revokeObjectURL(p.url));
    setFiles([]);
    setPreviews([]);
    setSuccess(`Processed all ${players.length} players.`);
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one screenshot to upload")
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    // Start progress simulation
    const stopProgress = simulateProgress()

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append("images", file)
      })

      const response = await fetch("/api/parse_screenshot", {
        method: "POST",
        body: formData,
    })


      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API Error: ${response.status}`)
      }

      const result = await response.json()

      // Set progress to 100% when complete
      setUploadProgress(100)
      // keep the parsed list in state
      setParsedPlayers(result.parsedPlayers)
      // kick off the player-by-player processing
      processPlayers(result.parsedPlayers)
    } catch (error) {
      console.error("Error uploading screenshots:", error)
      setError(error.message || "Failed to process screenshots. Please try again.")
    } finally {
      stopProgress()
      setUploading(false)
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl mb-8 shadow-lg border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
          Upload PrizePicks Screenshots
        </h2>
        {previews.length > 0 && (
          <button
            onClick={removeAllFiles}
            className="flex items-center px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear All
          </button>
        )}
      </div>

      <div
        ref={dropZoneRef}
        className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center mb-6 cursor-pointer hover:border-blue-500 transition-all duration-300 relative overflow-hidden group"
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />

        <div className="relative z-10">
          <div className="bg-blue-600 bg-opacity-10 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Upload className="h-10 w-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Drag and drop screenshots here</h3>
          <p className="text-gray-300 mb-2">or click to browse your files</p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Upload screenshots of PrizePicks player cards to automatically extract player data and analyze betting
            opportunities
          </p>
        </div>

        {/* Animated gradient background */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            backgroundSize: "200% 100%",
            animation: "shimmer 2s infinite linear",
          }}
        ></div>
      </div>

      {/* Preview of uploaded files */}
      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Selected Screenshots ({previews.length})</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="relative group overflow-hidden"
                >
                  <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden shadow-md border border-gray-600 group-hover:border-blue-500 transition-colors">
                    <div className="relative h-full">
                      <img
                        src={preview.url || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-xs bg-black/50 backdrop-blur-sm flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="truncate max-w-[80%]">{preview.name}</span>
                        <span>{preview.size}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-gray-900 bg-opacity-70 rounded-full p-1.5 text-gray-300 hover:text-red-500 hover:bg-gray-800 transition-colors shadow-md opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute top-2 left-2 bg-gray-900 bg-opacity-70 rounded-md px-1.5 py-0.5 text-xs text-gray-300 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {preview.type}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-700/50 p-4 rounded-lg mb-4 flex items-start"
          >
            <AlertCircle className="text-red-400 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-700/50 p-4 rounded-lg mb-4 flex items-start"
          >
            <Check className="text-green-400 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-green-300">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parsed Players Status */}
      <AnimatePresence>
        {parsedPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Processing Players ({parsedPlayers.length})</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {parsedPlayers.map((player, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`relative rounded-full px-4 py-3 flex items-center shadow-md border transition-colors ${
                    playerStatuses[index] === "processing"
                      ? "bg-blue-900/20 border-blue-500"
                      : playerStatuses[index] === "success"
                        ? "bg-green-900/20 border-green-500"
                        : playerStatuses[index] === "error"
                          ? "bg-red-900/20 border-red-500"
                          : "bg-gray-800 border-gray-600"
                  }`}
                >
                  <div className="flex-1 mr-2 overflow-hidden">
                    <ImageWithFallback
                      src={player.image || "/placeholder.svg"}
                      alt={player.playerName}
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-300"
                      fallbackSrc="/placeholder.svg?height=64&width=64"
                    />
                    <p className="font-medium text-white truncate">{player.playerName}</p>
                    <p className="text-sm text-gray-300 truncate">{player.threshold} pts</p>
                  </div>
                  <div className="flex-shrink-0">
                    {playerStatuses[index] === "processing" && (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                    )}
                    {playerStatuses[index] === "success" && (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {playerStatuses[index] === "error" && (
                      <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                        <AlertCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {playerStatuses[index] === "pending" && <div className="h-5 w-5 rounded-full bg-gray-500"></div>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload button and progress */}
      <div className="flex flex-col">
        {uploadProgress > 0 && (
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className={`px-6 py-3 rounded-lg font-medium flex items-center shadow-lg transition-all duration-300 ${
              files.length === 0 || uploading
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white transform hover:-translate-y-0.5"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                <span>Process Screenshots</span>
              </>
            )}
          </button>
        </div>
      </div>


      {/* Add CSS for the shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 0% 0; }
          10% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}

export default ScreenshotUploader
