import { db } from "../firebase"
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  increment,
  deleteDoc,
} from "firebase/firestore"


// list all active players
export const getProcessedPlayers = async () => {
  const activeRef = collection(db, "processedPlayers", "players", "active")
  const snaps     = await getDocs(activeRef)
  return snaps.docs.map(docSnap => ({
    id:   docSnap.id,
    ...docSnap.data(),
  }))
}

// get one by key ("first_last_threshold")
export const getProcessedPlayer = async (playerName, threshold) => {
  const key = playerName.toLowerCase().replace(/\s+/g, "_")
  const ref = doc(
    db,
    "processedPlayers", "players", "active",
    `${key}_${threshold}`
  )
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}


// add or update a pick in users/{username}.picks[]
export const addUserPick = async (username, pickData) => {
  // 1) fetch user doc
  const userRef  = doc(db, "users", username)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return []

  const docId = pickData.id 

  // 2) fetch that processedPlayer
  const ppRef  = doc(
    db,
    "processedPlayers", "players", "active",
    docId
  )
  const ppSnap = await getDoc(ppRef)
  if (!ppSnap.exists()) {
    throw new Error(`No processedPlayer at players/active/${docId}`)
  }
  const processedData = ppSnap.data()

  // 3) upsert into user.picks[]
  const picks = userSnap.data().picks || []
  const idx   = picks.findIndex(p => p.id === docId)
  const newPick = { id: docId, ...processedData }

  if (idx >= 0) picks[idx] = newPick
            else picks.push(newPick)

  await updateDoc(userRef, { picks })
  return picks
}

// remove a pick
export const removeUserPick = async (username, pickId) => {
  const userRef  = doc(db, "users", username)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return []

  const updated = (userSnap.data().picks || [])
                    .filter(p => p.id !== pickId)

  await updateDoc(userRef, { picks: updated })
  return updated
}

export const getUserPicks = async (username) => {
  const userRef  = doc(db, "users", username)
  const userSnap = await getDoc(userRef)
  return userSnap.exists() ? (userSnap.data().picks || []) : []
}

// ===== active Bets =====
export const getActiveBets = async (userId) => {
  // new structure
  const betsRef = collection(db, "users", userId, "activeBets")
  const snap    = await getDocs(betsRef)
  if (!snap.empty) {
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }
  // fallback old-structure
  const userRef  = doc(db, "users", userId)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return []
  return (userSnap.data().bets || [])
           .filter(b => b.status === "Active")
}

// Create a new bet
export const createBet = async (userId, betData) => {
  let gameDate = betData.gameDate || new Date().toISOString().substring(0,10)
  // normalize YYYY-MM-DD...
  const betsRef = collection(db, "users", userId, "activeBets")
  const docRef  = await addDoc(betsRef, {
    ...betData,
    gameDate,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

// if you need to read history, keep just the read methods:
export const getBetHistory = async (userId, year, month) => {
  const histRef = collection(db, "users", userId, "betHistory", year, month)
  const snap    = await getDocs(histRef)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Get bet history for a specific month
export const getAllBetHistory = async (userId) => {
  const now = new Date()
  const y   = now.getFullYear().toString()
  const m   = String(now.getMonth()+1).padStart(2,"0")
  return await getBetHistory(userId, y, m)
}