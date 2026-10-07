/**
 * Auth Service — Suporte completo para Modo Local (localStorage) e Supabase
 */

import type { User } from '../types'
import { isLocalMode, supabase, generateId } from './storage'

export interface UserAccount {
  id: string
  email: string
  password: string
  name: string
  nickname: string
  role: 'admin' | 'user'
  avatar_id: string
  xp: number
  coins: number
  streak: number
  level_id?: string
  level?: any
  is_active: boolean
  must_change_password: boolean
}

const LS_ACCOUNTS_KEY = 'uply_accounts_db'

// Contas padrões para inicialização imediata
const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'admin_professor_official',
    email: 'auraenglish7@gmail.com',
    password: '',
    name: 'Professor Aura',
    nickname: 'Professor',
    role: 'admin',
    avatar_id: 'admin',
    xp: 5000,
    coins: 500,
    streak: 30,
    is_active: true,
    must_change_password: false,
  },
]

function getLocalAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(LS_ACCOUNTS_KEY)
    if (raw) {
      const parsed: UserAccount[] = JSON.parse(raw)
      let changed = false

      // Garante que a conta oficial do professor exista e esteja atualizada como admin
      const teacherIdx = parsed.findIndex(a => a.email.toLowerCase() === 'auraenglish7@gmail.com')
      if (teacherIdx === -1) {
        parsed.unshift(INITIAL_ACCOUNTS[0])
        changed = true
      } else {
        if (parsed[teacherIdx].role !== 'admin') {
          parsed[teacherIdx].role = 'admin'
          parsed[teacherIdx].is_active = true
          changed = true
        }
      }

      if (changed) {
        localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(parsed))
      }

      return parsed
    }
    localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(INITIAL_ACCOUNTS))
    return INITIAL_ACCOUNTS
  } catch {
    return INITIAL_ACCOUNTS
  }
}

function saveLocalAccounts(accounts: UserAccount[]) {
  localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accounts))
}

function toUser(acc: UserAccount): User {
  return {
    id: acc.id,
    email: acc.email,
    name: acc.name,
    nickname: acc.nickname,
    role: acc.role,
    avatar_id: acc.avatar_id,
    xp: acc.xp,
    coins: acc.coins,
    streak: acc.streak,
    level_id: acc.level_id,
    level: acc.level,
    is_active: acc.is_active,
    must_change_password: acc.must_change_password,
  }
}

// ── Validação de Senha ────────────────────────────────────────────────────────
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 6) {
    return { valid: false, error: 'A senha deve ter no mínimo 6 caracteres.' }
  }
  // Permite letras e números
  const hasValidChars = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(password)
  if (!hasValidChars) {
    return { valid: false, error: 'A senha contém caracteres inválidos.' }
  }
  return { valid: true }
}

export const authService = {
  /**
   * Login do usuário (Email e Senha)
   */
  async signIn(emailInput: string, passwordInput: string): Promise<User> {
    const email = emailInput.trim().toLowerCase()
    const password = passwordInput.trim()

    if (!email || !password) {
      throw new Error('Preencha seu e-mail e sua senha.')
    }

    // 1. Tenta autenticação via Supabase (permite acesso em múltiplos dispositivos e mobile)
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (!error && data?.user) {
          const u = data.user
          let { data: profile } = await supabase
            .from('profiles')
            .select('*, level:levels(*)')
            .eq('id', u.id)
            .maybeSingle()

          // Auto-cura de perfil caso ainda não tenha sido gerado
          if (!profile) {
            const newProfile = {
              id: u.id,
              email: u.email || email,
              full_name: u.user_metadata?.name || email.split('@')[0],
              nickname: u.user_metadata?.name?.split(' ')[0] || email.split('@')[0],
              role: email === 'auraenglish7@gmail.com' ? 'admin' : 'user',
              avatar_id: 'avatar_1',
              xp: 0,
              coins: 0,
              streak: 0,
              is_active: true,
              must_change_password: email !== 'auraenglish7@gmail.com'
            }
            try {
              await supabase.from('profiles').upsert(newProfile)
              const { data: healed } = await supabase
                .from('profiles')
                .select('*, level:levels(*)')
                .eq('id', u.id)
                .maybeSingle()
              profile = healed || (newProfile as any)
            } catch {
              profile = newProfile as any
            }
          }

          if (profile && profile.is_active === false) {
            await supabase.auth.signOut()
            throw new Error('Esta conta de aluno está desativada. Solicite seu acesso ao administrador.')
          }

          const user: User = {
            id: u.id,
            email: u.email!,
            name: profile?.full_name || u.user_metadata?.name || email.split('@')[0],
            nickname: profile?.nickname || email.split('@')[0],
            role: profile?.role || 'user',
            avatar_id: profile?.avatar_id || 'avatar_1',
            xp: profile?.xp || 0,
            coins: profile?.coins || 0,
            streak: profile?.streak || 0,
            level_id: profile?.level_id,
            level: profile?.level,
            is_active: profile?.is_active ?? true,
            must_change_password: profile?.must_change_password ?? false,
          }

          localStorage.setItem('uply_user', JSON.stringify(user))

          const ecoState = {
            xp: user.xp,
            coins: user.coins,
            streak: user.streak,
          }
          localStorage.setItem('uply_economy_state', JSON.stringify(ecoState))
          window.dispatchEvent(new CustomEvent('uply_economy_sync'))

          return user
        }

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            // Verifica se existe conta local antes de lançar erro de senha
            const accounts = getLocalAccounts()
            const localAcc = accounts.find(a => a.email.toLowerCase() === email)
            if (!localAcc) {
              throw new Error('E-mail ou senha incorretos.')
            }
          }
        }
      } catch (sbErr: any) {
        if (sbErr.message === 'E-mail ou senha incorretos.' || sbErr.message.includes('desativada')) {
          throw sbErr
        }
        // Em caso de falha de conexão com Supabase, tenta o login local abaixo
      }
    }

    // 2. Modo Local (localStorage) / Fallback offline
    const accounts = getLocalAccounts()
    const account = accounts.find(a => a.email.toLowerCase() === email)

    if (!account) {
      throw new Error('E-mail não cadastrado. Solicite seu acesso ao administrador.')
    }

    if (account.password !== password) {
      throw new Error('Senha incorreta. Verifique e tente novamente.')
    }

    if (!account.is_active) {
      throw new Error('Esta conta de aluno está desativada.')
    }

    const user = toUser(account)
    localStorage.setItem('uply_user', JSON.stringify(user))
    
    // Sincroniza economia local do usuário logado
    const ecoState = {
      xp: user.xp,
      coins: user.coins,
      streak: user.streak,
    }
    localStorage.setItem('uply_economy_state', JSON.stringify(ecoState))
    window.dispatchEvent(new CustomEvent('uply_economy_sync'))

    return user
  },

  /**
   * Troca obrigatória de senha no PRIMEIRO ACESSO do aluno
   */
  async firstLoginChangePassword(userId: string, newPasswordInput: string): Promise<User> {
    const newPassword = newPasswordInput.trim()
    const val = validatePassword(newPassword)
    if (!val.valid) throw new Error(val.error)

    if (isLocalMode || !supabase) {
      const accounts = getLocalAccounts()
      const idx = accounts.findIndex(a => a.id === userId)
      if (idx === -1) throw new Error('Usuário não encontrado.')

      accounts[idx].password = newPassword
      accounts[idx].must_change_password = false
      saveLocalAccounts(accounts)

      const updatedUser = toUser(accounts[idx])
      localStorage.setItem('uply_user', JSON.stringify(updatedUser))
      return updatedUser
    }

    try {
      const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword })
      if (pwdError) throw pwdError

      await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', userId)

      const raw = localStorage.getItem('uply_user')
      const current = raw ? JSON.parse(raw) : {}
      const updatedUser = { ...current, must_change_password: false }
      localStorage.setItem('uply_user', JSON.stringify(updatedUser))
      return updatedUser
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao definir nova senha.')
    }
  },

  /**
   * Alteração voluntária de senha em Meu Perfil
   */
  async changePassword(userId: string, currentPasswordInput: string, newPasswordInput: string): Promise<void> {
    const currentPassword = currentPasswordInput.trim()
    const newPassword = newPasswordInput.trim()

    const val = validatePassword(newPassword)
    if (!val.valid) throw new Error(val.error)

    if (currentPassword === newPassword) {
      throw new Error('A nova senha deve ser diferente da senha atual.')
    }

    if (isLocalMode || !supabase) {
      const accounts = getLocalAccounts()
      const idx = accounts.findIndex(a => a.id === userId)
      if (idx === -1) throw new Error('Usuário não encontrado.')

      if (accounts[idx].password !== currentPassword) {
        throw new Error('A senha atual informada está incorreta.')
      }

      accounts[idx].password = newPassword
      accounts[idx].must_change_password = false
      saveLocalAccounts(accounts)

      const updatedUser = toUser(accounts[idx])
      localStorage.setItem('uply_user', JSON.stringify(updatedUser))
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao atualizar senha.')
    }
  },

  /**
   * Criação de novo aluno pelo Administrador com senha inicial padrão e flag de primeiro acesso
   */
  async adminRegisterStudent(userData: {
    name: string
    email: string
    initialPassword?: string
    level_id?: string
    level?: any
    initialXP?: number
  }): Promise<User> {
    const email = userData.email.trim().toLowerCase()
    const initialPassword = (userData.initialPassword || 'aura123').trim()
    const val = validatePassword(initialPassword)
    if (!val.valid) throw new Error(`Senha padrão inválida: ${val.error}`)

    const newAccount: UserAccount = {
      id: 'user_' + generateId(),
      email,
      password: initialPassword,
      name: userData.name.trim(),
      nickname: userData.name.trim().split(' ')[0],
      role: 'user',
      avatar_id: 'avatar_1',
      xp: userData.initialXP || 0,
      coins: 0,
      streak: 1,
      level_id: userData.level_id || 'lvl_1',
      level: userData.level,
      is_active: true,
      must_change_password: true, // Força primeiro acesso
    }

    const accounts = getLocalAccounts()
    if (accounts.some(a => a.email.toLowerCase() === email)) {
      throw new Error('Já existe um aluno cadastrado com este e-mail.')
    }

    accounts.unshift(newAccount)
    saveLocalAccounts(accounts)

    return toUser(newAccount)
  },

  /**
   * Atualização de dados de aluno pelo Administrador
   */
  async adminUpdateStudent(userId: string, data: {
    name?: string
    email?: string
    newPassword?: string
    level_id?: string
    level?: any
    is_active?: boolean
    must_change_password?: boolean
  }): Promise<User> {
    if (!isLocalMode && supabase) {
      if (data.newPassword && data.newPassword.trim().length > 0) {
        const val = validatePassword(data.newPassword.trim())
        if (!val.valid) throw new Error(val.error)
        try {
          await supabase.rpc('admin_update_user_password', {
            target_user_id: userId,
            new_password: data.newPassword.trim()
          })
        } catch (rpcErr) {
          console.warn('Não foi possível alterar a senha no auth.users via RPC:', rpcErr)
        }
      }

      const updates: Record<string, any> = {
        updated_at: new Date().toISOString()
      }
      if (data.name !== undefined) {
        updates.full_name = data.name.trim()
        updates.nickname = data.name.trim().split(' ')[0]
      }
      if (data.email !== undefined) {
        updates.email = data.email.trim().toLowerCase()
      }
      if (data.level_id !== undefined) {
        updates.level_id = data.level_id
      }
      if (data.is_active !== undefined) {
        updates.is_active = data.is_active
      }
      if (data.must_change_password !== undefined) {
        updates.must_change_password = data.must_change_password
      }

      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('*, level:levels(*)')
        .single()

      if (profileError) {
        throw new Error(profileError.message || 'Erro ao atualizar dados do aluno no Supabase.')
      }

      // Sincroniza local caso o usuário exista no cache do navegador
      const accounts = getLocalAccounts()
      const idx = accounts.findIndex(a => a.id === userId)
      if (idx !== -1) {
        if (data.email) accounts[idx].email = data.email.trim().toLowerCase()
        if (data.name) {
          accounts[idx].name = data.name.trim()
          accounts[idx].nickname = data.name.trim().split(' ')[0]
        }
        if (data.newPassword && data.newPassword.trim().length > 0) {
          accounts[idx].password = data.newPassword.trim()
        }
        if (data.level_id) accounts[idx].level_id = data.level_id
        if (data.level) accounts[idx].level = data.level
        if (data.is_active !== undefined) accounts[idx].is_active = data.is_active
        if (data.must_change_password !== undefined) accounts[idx].must_change_password = data.must_change_password
        saveLocalAccounts(accounts)
      }

      return {
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.full_name || updatedProfile.nickname || updatedProfile.email?.split('@')[0],
        nickname: updatedProfile.nickname || updatedProfile.full_name?.split(' ')[0],
        role: updatedProfile.role || 'user',
        avatar_id: updatedProfile.avatar_id || 'avatar_1',
        xp: updatedProfile.xp || 0,
        coins: updatedProfile.coins || 0,
        streak: updatedProfile.streak || 0,
        level_id: updatedProfile.level_id,
        level: updatedProfile.level || data.level,
        is_active: updatedProfile.is_active,
        must_change_password: updatedProfile.must_change_password,
        created_at: updatedProfile.created_at,
      } as User
    }

    // Modo local offline
    const accounts = getLocalAccounts()
    const idx = accounts.findIndex(a => a.id === userId)
    if (idx === -1) throw new Error('Aluno não encontrado.')

    if (data.email) {
      const cleanEmail = data.email.trim().toLowerCase()
      if (accounts.some((a, i) => i !== idx && a.email.toLowerCase() === cleanEmail)) {
        throw new Error('Já existe outro usuário com este e-mail.')
      }
      accounts[idx].email = cleanEmail
    }

    if (data.name) {
      accounts[idx].name = data.name.trim()
      accounts[idx].nickname = data.name.trim().split(' ')[0]
    }

    if (data.newPassword && data.newPassword.trim().length > 0) {
      const val = validatePassword(data.newPassword.trim())
      if (!val.valid) throw new Error(val.error)
      accounts[idx].password = data.newPassword.trim()
    }

    if (data.level_id) {
      accounts[idx].level_id = data.level_id
      if (data.level) accounts[idx].level = data.level
    }

    if (data.is_active !== undefined) {
      accounts[idx].is_active = data.is_active
    }

    if (data.must_change_password !== undefined) {
      accounts[idx].must_change_password = data.must_change_password
    }

    saveLocalAccounts(accounts)

    return toUser(accounts[idx])
  },

  /**
   * Exclusão de aluno pelo Administrador
   */
  async adminDeleteStudent(userId: string): Promise<void> {
    const accounts = getLocalAccounts()
    const filtered = accounts.filter(a => a.id !== userId)
    saveLocalAccounts(filtered)

    const currentUser = this.getCurrentUser()
    if (currentUser?.id === userId) {
      localStorage.removeItem('uply_user')
      localStorage.removeItem('uply_economy_state')
    }

    if (!isLocalMode && supabase) {
      // 1. Tenta excluir da tabela auth.users via RPC para revogar totalmente qualquer login
      try {
        const { error: rpcErr } = await supabase.rpc('admin_delete_user', { target_user_id: userId })
        if (!rpcErr) return
      } catch {
        // ignora se RPC ainda não foi criada no banco
      }

      // 2. Se a RPC não estiver instalada, exclui da tabela profiles
      const { error } = await supabase.from('profiles').delete().eq('id', userId)
      if (error) {
        throw new Error(error.message || 'Erro ao excluir aluno no banco de dados.')
      }
    }
  },

  /**
   * Valida se a sessão do usuário ainda é válida (conta existe e não está desativada)
   */
  async validateSession(userId: string): Promise<boolean> {
    if (!userId) return false

    // 1. Usuário de sessão local
    if (userId.startsWith('user_') || userId.startsWith('admin_')) {
      const accounts = getLocalAccounts()
      const account = accounts.find(a => a.id === userId)
      if (account && account.is_active === false) {
        return false
      }
      return true
    }

    // 2. Usuário de sessão Supabase (UUID)
    if (supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, is_active')
          .eq('id', userId)
          .maybeSingle()

        // SÓ invalida se o perfil foi explicitamente retornado e marcado como inativo
        if (profile && profile.is_active === false) {
          return false
        }
        return true
      } catch {
        return true
      }
    }

    return true
  },

  /**
   * Encerra a sessão ativa
   */
  async signOut(): Promise<void> {
    localStorage.removeItem('uply_user')
    localStorage.removeItem('uply_economy_state')
    localStorage.removeItem('uply_activity_global')
    if (!isLocalMode && supabase) {
      try {
        await supabase.auth.signOut()
      } catch {
        // ignore
      }
    }
  },

  /**
   * Recupera o usuário atualmente autenticado
   */
  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem('uply_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
}
