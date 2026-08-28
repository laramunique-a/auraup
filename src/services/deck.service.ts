/**
 * Deck Service — local mode (localStorage) + Supabase mode
 */

import type { Deck, DeckStats } from '../types'
import { isLocalMode, supabase, lsGet, lsSet, generateId } from './storage'
import { cardService } from './card.service'
import { reviewService } from './review.service'
import { isCardDue } from '../lib/sm2'

const LS_DECKS = 'uply_decks'

// ── Local Mode ────────────────────────────────────────────────────────────────

async function localGetDecks(userId: string): Promise<Deck[]> {
  return lsGet<Deck>(LS_DECKS).filter(d => d.user_id === userId)
}

async function localCreateDeck(userId: string, name: string, description?: string): Promise<Deck> {
  const decks = lsGet<Deck>(LS_DECKS)
  
  // Check for duplicate name
  const exists = decks.some(d => d.user_id === userId && d.name.toLowerCase() === name.trim().toLowerCase())
  if (exists) throw new Error('Já existe um baralho com este nome.')

  const deck: Deck = {
    id: generateId(),
    user_id: userId,
    name: name.trim(),
    description,
    created_at: new Date().toISOString(),
  }
  lsSet(LS_DECKS, [...decks, deck])
  return deck
}

async function localUpdateDeck(id: string, updates: Partial<Pick<Deck, 'name' | 'description'>>): Promise<Deck> {
  const decks = lsGet<Deck>(LS_DECKS)
  const idx = decks.findIndex(d => d.id === id)
  if (idx === -1) throw new Error('Baralho não encontrado.')

  const deck = decks[idx]
  
  // Check for duplicate name if name is being changed
  if (updates.name && updates.name.toLowerCase() !== deck.name.toLowerCase()) {
    const exists = decks.some(d => d.user_id === deck.user_id && d.name.toLowerCase() === updates.name?.toLowerCase())
    if (exists) throw new Error('Já existe outro baralho com este nome.')
  }

  decks[idx] = { ...decks[idx], ...updates }
  lsSet(LS_DECKS, decks)
  return decks[idx]
}

async function localDeleteDeck(id: string): Promise<void> {
  const decks = lsGet<Deck>(LS_DECKS).filter(d => d.id !== id)
  lsSet(LS_DECKS, decks)
}

// ── Supabase Mode ─────────────────────────────────────────────────────────────

async function supabaseGetDecks(userId: string): Promise<Deck[]> {
  const { data, error } = await supabase!
    .from('decks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

async function supabaseCreateDeck(userId: string, name: string, description?: string): Promise<Deck> {
  // Check for duplicate name
  const { data: existing } = await supabase!
    .from('decks')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', name.trim())
    .maybeSingle()
  
  if (existing) throw new Error('Já existe um baralho com este nome.')

  const { data, error } = await supabase!
    .from('decks')
    .insert({ user_id: userId, name: name.trim(), description })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function supabaseUpdateDeck(id: string, updates: Partial<Pick<Deck, 'name' | 'description'>>): Promise<Deck> {
  // If name is updating, check for conflicts
  if (updates.name) {
    // Get deck owner first
    const { data: current } = await supabase!.from('decks').select('user_id').eq('id', id).single()
    if (current) {
      const { data: existing } = await supabase!
        .from('decks')
        .select('id')
        .eq('user_id', current.user_id)
        .ilike('name', updates.name.trim())
        .neq('id', id)
        .maybeSingle()
      
      if (existing) throw new Error('Já existe outro baralho com este nome.')
    }
  }

  const { data, error } = await supabase!
    .from('decks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function supabaseDeleteDeck(id: string): Promise<void> {
  const { error } = await supabase!.from('decks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Stats (shared logic) ──────────────────────────────────────────────────────

async function getDeckStats(deckId: string, userId: string): Promise<DeckStats> {
  const cards = await cardService.getCards(deckId)
  const reviews = await reviewService.getReviewsForDeck(deckId, userId)
  const reviewMap = new Map<string, any>(reviews.map(r => [r.card_id, r] as [string, any]))

  let due = 0
  let newCards = 0
  let lastReview: string | undefined = undefined

  for (const card of cards) {
    const review = reviewMap.get(card.id)
    if (!review) {
      newCards++
      due++ // Cards novos também estão "vencidos" (disponíveis para estudo)
    } else {
      if (isCardDue(review.due_date)) {
        due++
      }
      // Check for most recent review
      if (review.last_reviewed) {
        if (!lastReview || review.last_reviewed > lastReview) {
          lastReview = review.last_reviewed
        }
      }
    }
  }

  return { total: cards.length, due, new: newCards, lastReview }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const deckService = {
  getDecks: isLocalMode ? localGetDecks : supabaseGetDecks,
  createDeck: isLocalMode ? localCreateDeck : supabaseCreateDeck,
  updateDeck: isLocalMode ? localUpdateDeck : supabaseUpdateDeck,
  deleteDeck: isLocalMode ? localDeleteDeck : supabaseDeleteDeck,
  getDeckStats,
}
