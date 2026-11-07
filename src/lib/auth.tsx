import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@netlify/identity'
import {
  getUser,
  handleAuthCallback,
  login as identityLogin,
  logout as identityLogout,
  onAuthChange,
  signup as identitySignup,
} from '@netlify/identity'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login(email: string, password: string): Promise<User>
  signup(email: string, password: string, name: string): Promise<User>
  logout(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const unsubscribe = onAuthChange((_event, nextUser) => {
      if (active) setUser(nextUser)
    })

    void (async () => {
      try {
        const callback = await handleAuthCallback()
        const current = callback?.user ?? await getUser()
        if (active) setUser(current)
      } catch {
        if (active) setUser(await getUser())
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) {
      const nextUser = await identityLogin(email, password)
      setUser(nextUser)
      return nextUser
    },
    async signup(email, password, name) {
      const nextUser = await identitySignup(email, password, { full_name: name })
      setUser(await getUser())
      return nextUser
    },
    async logout() {
      await identityLogout()
      setUser(null)
    },
  }), [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

