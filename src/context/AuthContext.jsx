import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase'
import { migrateToFirestore } from '../db/migrateToFirestore'
import { seedDatabase } from '../db/seedData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(undefined) // undefined = loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Set currentUser immediately so the app stops spinning
      setCurrentUser(user ?? null)
      if (user) {
        // Run migration + seed in background; UI reflects data as it arrives
        migrateToFirestore(user.uid)
          .then(() => seedDatabase(user.uid))
          .catch((err) => console.error('[OsmoTrack] Init error:', err))
      }
    })
    return unsubscribe
  }, [])

  async function register(displayName, email, password) {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName })
  }

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    return signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ currentUser, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
