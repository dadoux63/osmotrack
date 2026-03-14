import { createContext, useContext, useEffect, useState } from 'react'
import db from '../db/database'
import { hashPassword, verifyPassword } from '../utils/auth'

const STORAGE_KEY = 'osmotrack_user_id'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(undefined) // undefined = loading
  const [hasUsers, setHasUsers] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const count = await db.users.count()
        setHasUsers(count > 0)

        const storedId = localStorage.getItem(STORAGE_KEY)
        if (storedId) {
          const user = await db.users.get(Number(storedId))
          if (user) {
            setCurrentUser(user)
            return
          }
          localStorage.removeItem(STORAGE_KEY)
        }
        setCurrentUser(null)
      } catch {
        setCurrentUser(null)
      }
    }
    init()
  }, [])

  async function register(username, password) {
    const existing = await db.users.where('username').equals(username).first()
    if (existing) throw new Error('Ce nom d\'utilisateur est déjà pris.')

    const { hash, salt } = await hashPassword(password)
    const id = await db.users.add({
      username,
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    })

    const user = await db.users.get(id)
    localStorage.setItem(STORAGE_KEY, String(id))
    setCurrentUser(user)
    setHasUsers(true)
  }

  async function login(username, password) {
    const user = await db.users.where('username').equals(username).first()
    if (!user) throw new Error('Identifiants incorrects.')

    const valid = await verifyPassword(password, user.passwordHash, user.salt)
    if (!valid) throw new Error('Identifiants incorrects.')

    localStorage.setItem(STORAGE_KEY, String(user.id))
    setCurrentUser(user)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, hasUsers, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
