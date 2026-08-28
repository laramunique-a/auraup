export type UserRole = 'admin' | 'user'

export interface Level {
  id: string
  name: string
  min_xp: number
  color: string
  icon: string
}

export interface User {
  id: string
  email: string
  name?: string
  nickname?: string
  role: UserRole
  avatar_id: string
  xp: number
  coins: number
  streak: number
  level_id?: string
  level?: Level
  is_active: boolean
}

export interface Deck {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
}

export interface Card {
  id: string
  deck_id: string
  front: string
  back: string
  front_image?: string // Base64 or URL
  back_image?: string // Base64 or URL
  front_lang?: string // Language code for TTS
  back_lang?: string // Language code for TTS
  front_audio?: boolean // Toggle auto-play for front
  back_audio?: boolean  // Toggle auto-play for back
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  card_id: string
  repetitions: number
  interval: number
  ease_factor: number
  due_date: string // ISO date string YYYY-MM-DD
  last_reviewed?: string
}

export type Rating = 0 | 1 | 2 | 3 // 0=De novo, 1=Difícil, 2=Bom, 3=Fácil

export interface StudyCard extends Card {
  review?: Review
}

export interface DeckStats {
  total: number
  due: number
  new: number
  lastReview?: string
}
