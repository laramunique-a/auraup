import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '../types'
import { authService } from '../services/auth.service'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  completeFirstPasswordChange: (newPassword: string) => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    return authService.getCurrentUser()
  })
  const [loading, setLoading] = useState(false)

  // Sincroniza usuário ativo no localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('uply_user', JSON.stringify(user))
      } else {
        localStorage.removeItem('uply_user')
      }
    } catch (e) {
      console.error('Erro ao sincronizar usuário no localStorage:', e)
    }
  }, [user])

  async function signIn(email: string, password: string): Promise<User> {
    setLoading(true)
    try {
      const loggedUser = await authService.signIn(email, password)
      setUser(loggedUser)
      return loggedUser
    } finally {
      setLoading(false)
    }
  }

  async function signOut(): Promise<void> {
    setLoading(true)
    try {
      await authService.signOut()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!user) throw new Error('Usuário não autenticado.')
    await authService.changePassword(user.id, currentPassword, newPassword)
    setUser(prev => prev ? { ...prev, must_change_password: false } : null)
  }

  async function completeFirstPasswordChange(newPassword: string): Promise<void> {
    if (!user) throw new Error('Usuário não autenticado.')
    const updated = await authService.firstLoginChangePassword(user.id, newPassword)
    setUser(updated)
  }

  function updateUser(updates: Partial<User>) {
    setUser(prev => {
      if (!prev) return null
      const next = { ...prev, ...updates }
      localStorage.setItem('uply_user', JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        changePassword,
        completeFirstPasswordChange,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
