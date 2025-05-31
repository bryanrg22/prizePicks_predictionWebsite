import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Make sure assets are properly served
  publicDir: "public",
  // Add server proxy configuration
  server: {
    proxy: {
      '/api': {
        // In development, proxy to local Flask server
        target: process.env.NODE_ENV === 'production' 
          ? 'https://prizepicks-backend-788584934715.us-west2.run.app'
          : 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})