import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '../types'

export interface AuthContextValue {
  user: User
  loading: boolean
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

const DEFAULT_USER: User = {
  id: 'local_user_default',
  email: 'aluno@auraup.com',
  name: 'Estudante Aura',
  nickname: 'Estudante',
  role: 'admin', // Permite acesso total inclusive ao painel de administração e loja
  avatar_id: 'avatar_1',
  xp: 1500,
  coins: 50,
  streak: 5,
  is_active: true,
  level: {
    id: 'lvl_1',
    name: 'Nível 1: Hello',
    min_xp: 0,
    color: '#FF8A00',
    icon: 'Rocket',
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('uply_user')
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...DEFAULT_USER, ...parsed, role: 'admin' }
      }
    } catch {
      // ignore JSON parse errors
    }
    return DEFAULT_USER
  })

  useEffect(() => {
    try {
      localStorage.setItem('uply_user', JSON.stringify(user))
    } catch (e) {
      console.error('Erro ao sincronizar usuário no localStorage:', e)
    }
  }, [user])

  function updateUser(updates: Partial<User>) {
    setUser(prev => {
      const next = { ...prev, ...updates }
      localStorage.setItem('uply_user', JSON.stringify(next))
      return next
    })
  }

  // Stubs para compatibilidade retroativa
  async function signUp() {}
  async function signIn() {}
  async function signOut() {}

  return (
    <AuthContext.Provider value={{ user, loading: false, signUp, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
