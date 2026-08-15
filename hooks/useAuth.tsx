'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

interface DbUser {
  id: string
  name: string
  email: string
  role: string
  photo: string | null
  phone: string | null
  joinDate: string
  isVerified: boolean
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null
  dbUser: DbUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  refreshDbUser: () => Promise<void>
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const getToken = async () => {
    return firebaseUser ? firebaseUser.getIdToken() : null
  }

  const syncToDb = async (user: FirebaseUser) => {
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: user.displayName || user.email?.split('@')[0],
          email: user.email,
          photo: user.photoURL,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setDbUser(data.user)
      }
    } catch (err) {
      console.error('Failed to sync user:', err)
    }
  }

  const refreshDbUser = async () => {
    if (firebaseUser) await syncToDb(firebaseUser)
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        await syncToDb(user)
      } else {
        setDbUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
    router.push('/dashboard')
  }

  const register = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await sendEmailVerification(cred.user)
    router.push('/verify-email')
  }

  const logout = async () => {
    await signOut(auth)
    setDbUser(null)
    router.push('/login')
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    router.push('/dashboard')
  }

  const value: AuthContextType = {
    firebaseUser,
    dbUser,
    loading,
    login,
    register,
    logout,
    resetPassword,
    loginWithGoogle,
    refreshDbUser,
    getToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
