// Firebase configuration and initialization
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey:              import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:          import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:           import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:       import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:               import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:       import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Only initialize analytics in browser environment
let analytics = null
if (typeof window !== "undefined") {
  analytics = getAnalytics(app)
}

export { db, analytics }

