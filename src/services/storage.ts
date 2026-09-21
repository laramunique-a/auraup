/**
 * Storage adapter — localStorage para modo local, Supabase para produção.
 * Troque LOCAL_MODE=false e configure as variáveis do Supabase para migrar.
 */

import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://gyxrwavcjkxxgplvqsgf.supabase.co'
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eHJ3YXZjamt4eGdwbHZxc2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODEyMzIsImV4cCI6MjEwNDY1NzIzMn0.K3MITJbrepqK7XtDa0s80XM52YROVhUkmNNM1Q7OiDI'

function getValidEnv(val: unknown, fallback: string): string {
  if (typeof val === 'string' && val.trim().length > 15) {
    return val.trim()
  }
  return fallback
}

const supabaseUrl = getValidEnv(import.meta.env.VITE_SUPABASE_URL, DEFAULT_SUPABASE_URL)
const supabaseAnonKey = getValidEnv(import.meta.env.VITE_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_KEY)

export const isLocalMode = true

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Migração / Reset Automático de Lançamento ──────────────────────────────
const STORAGE_RESET_VERSION_KEY = 'auraup_launch_clean_v2026_1'

export function ensureCleanLaunchData(): void {
  try {
    if (localStorage.getItem(STORAGE_RESET_VERSION_KEY) === 'done') {
      return
    }

    // 1. Zera turmas antigas
    localStorage.setItem('uply_admin_levels', JSON.stringify([]))

    // 2. Zera alunos da lista administrativa
    localStorage.setItem('uply_admin_users', JSON.stringify([]))

    // 3. Limpa contas de alunos legados, mantendo apenas o professor oficial
    const ADMIN_ACCOUNT = {
      id: 'admin_professor_official',
      email: 'auraenglish7@gmail.com',
      password: '@ura2026',
      name: 'Professor Aura',
      nickname: 'Professor',
      role: 'admin',
      avatar_id: 'admin',
      xp: 0,
      coins: 0,
      streak: 0,
      is_active: true,
      must_change_password: false,
    }
    localStorage.setItem('uply_accounts_db', JSON.stringify([ADMIN_ACCOUNT]))

    // 4. Força todos os baralhos oficiais pré-cadastrados para ocultos (is_published = false)
    const rawDecks = localStorage.getItem('uply_official_decks')
    if (rawDecks) {
      try {
        const decks = JSON.parse(rawDecks)
        if (Array.isArray(decks)) {
          const hiddenDecks = decks.map(d => ({ ...d, is_published: false }))
          localStorage.setItem('uply_official_decks', JSON.stringify(hiddenDecks))
        }
      } catch {
        localStorage.removeItem('uply_official_decks')
      }
    }

    localStorage.setItem(STORAGE_RESET_VERSION_KEY, 'done')
  } catch (err) {
    console.warn('[AuraUP] Auto-reset storage check:', err)
  }
}

// Executa na carga do bundle
ensureCleanLaunchData()

// Helpers para localStorage
export function lsGet<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[]
  } catch {
    return []
  }
}

export function lsSet<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export function lsGetItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : null
  } catch {
    return null
  }
}

export function lsSetItem<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export function lsRemove(key: string): void {
  localStorage.removeItem(key)
}

export function generateId(): string {
  return crypto.randomUUID()
}
