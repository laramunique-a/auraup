/**
 * Auth Service — local mode (localStorage) + Supabase mode
 */

import type { User } from '../types'
import { supabase } from './storage'

// ── Supabase Mode ─────────────────────────────────────────────────────────────

async function supabaseSignUp(email: string, password: string, name?: string): Promise<User> {
  const { data, error } = await supabase!.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  if (error) throw new Error(error.message)
  const u = data.user!
  
  // Tenta criar/garantir o perfil na tabela pública profiles
  const profileName = name || email.split('@')[0]
  await supabase!
    .from('profiles')
    .upsert({
      id: u.id,
      email: u.email!,
      full_name: profileName,
      nickname: profileName,
      role: 'user',
      avatar_id: 'avatar_1',
      xp: 0,
      coins: 0,
      streak: 0,
      is_active: true
    }, { onConflict: 'id' })

  const profile = await fetchUserProfile(u.id, u.email, profileName)
  
  return { 
    id: u.id, 
    email: u.email!, 
    name: profile.name || u.user_metadata?.name || profileName,
    role: profile.role || 'user',
    avatar_id: profile.avatar_id || 'avatar_1',
    xp: profile.xp || 0,
    coins: profile.coins || 0,
    streak: profile.streak || 0,
    is_active: true,
    ...profile
  }
}

async function supabaseSignIn(email: string, password: string): Promise<User> {
  const { data, error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password })
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('E-mail ou senha incorretos.')
    }
    throw new Error(error.message)
  }
  const u = data.user
  const profile = await fetchUserProfile(u.id, u.email, u.user_metadata?.name)

  return { 
    id: u.id, 
    email: u.email!, 
    name: profile.name || u.user_metadata?.name,
    role: profile.role || 'user',
    avatar_id: profile.avatar_id || 'avatar_1',
    xp: profile.xp || 0,
    coins: profile.coins || 0,
    streak: profile.streak || 0,
    is_active: true,
    ...profile
  } as User
}

async function supabaseSignOut(): Promise<void> {
  await supabase!.auth.signOut()
}

async function supabaseGetCurrentUser(): Promise<User | null> {
  const { data } = await supabase!.auth.getUser()
  if (!data.user) return null
  const u = data.user
  const profile = await fetchUserProfile(u.id, u.email, u.user_metadata?.name)

  return {
    id: u.id,
    email: u.email!,
    name: profile.name || u.user_metadata?.name,
    role: profile.role || 'user',
    avatar_id: profile.avatar_id || 'avatar_1',
    xp: profile.xp || 0,
    coins: profile.coins || 0,
    streak: profile.streak || 0,
    is_active: true,
    ...profile
  } as User
}

async function fetchUserProfile(userId: string, email?: string, name?: string): Promise<Partial<User>> {
  try {
    const { data, error } = await supabase!
      .from('profiles')
      .select('*, level:levels(*)')
      .eq('id', userId)
      .maybeSingle()
    
    if (error || !data) {
      // Se o perfil não existir ainda, tenta criar automaticamente
      const fallbackName = name || (email ? email.split('@')[0] : 'Estudante')
      const { data: newProfile } = await supabase!
        .from('profiles')
        .upsert({
          id: userId,
          email: email || '',
          full_name: fallbackName,
          nickname: fallbackName,
          role: 'user',
          avatar_id: 'avatar_1',
          xp: 0,
          coins: 0,
          streak: 0,
          is_active: true
        }, { onConflict: 'id' })
        .select()
        .maybeSingle()

      if (newProfile) {
        return {
          nickname: newProfile.nickname,
          role: newProfile.role,
          avatar_id: newProfile.avatar_id,
          xp: newProfile.xp,
          coins: newProfile.coins,
          streak: newProfile.streak,
          is_active: newProfile.is_active,
          name: newProfile.full_name || newProfile.nickname
        }
      }
      return {}
    }

    return {
      nickname: data.nickname,
      role: data.role,
      avatar_id: data.avatar_id,
      xp: data.xp,
      coins: data.coins,
      streak: data.streak,
      level: data.level,
      is_active: data.is_active,
      name: data.full_name || data.nickname
    }
  } catch {
    return {}
  }
}


// ── Public API ────────────────────────────────────────────────────────────────

export const authService = {
  signUp: supabaseSignUp,
  signIn: supabaseSignIn,
  signOut: supabaseSignOut,
  getCurrentUser: supabaseGetCurrentUser,
}

