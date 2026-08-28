import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '../types'
import { authService } from '../services/auth.service'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authService.getCurrentUser().then(u => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  async function signUp(email: string, password: string, name?: string) {
    const u = await authService.signUp(email, password, name)
    setUser(u)
  }

  async function signIn(email: string, password: string) {
    const u = await authService.signIn(email, password)
    setUser(u)
  }

  async function signOut() {
    await authService.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
