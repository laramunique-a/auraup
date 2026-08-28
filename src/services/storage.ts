/**
 * Storage adapter — localStorage para modo local, Supabase para produção.
 * Troque LOCAL_MODE=false e configure as variáveis do Supabase para migrar.
 */

import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://qpjfcsrbxpzxapoakegq.supabase.co'
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwamZjc3JieHB6eGFwb2FrZWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzg0MjQsImV4cCI6MjA5MTk1NDQyNH0.s4V5y6whU7eduykAxKEGgEe4pYScn85uFYEUFZM8y2k'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY

export const isLocalMode = false

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
