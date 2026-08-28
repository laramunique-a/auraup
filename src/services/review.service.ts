/**
 * Review Service — local mode (localStorage) + Supabase mode
 */

import type { Review, Rating } from '../types'
import { isLocalMode, supabase, lsGet, lsSet, lsGetItem, lsSetItem, generateId } from './storage'
import { calculateSM2, getStudyDayKey } from '../lib/sm2'

const LS_REVIEWS = 'uply_reviews'
const LS_ACTIVITY = 'uply_activity'

// ── Local Mode ────────────────────────────────────────────────────────────────

async function localGetReview(cardId: string, userId: string): Promise<Review | null> {
  const reviews = lsGet<Review>(LS_REVIEWS)
  return reviews.find(r => r.card_id === cardId && r.user_id === userId) || null
}

async function localGetReviewsForDeck(_deckId: string, userId: string): Promise<Review[]> {
  // We need to cross with card IDs — card service will provide them
  // But to avoid circular deps, we filter by user and then cards in that deck
  // Card IDs are passed from the deck study session
  const reviews = lsGet<Review>(LS_REVIEWS)
  return reviews.filter(r => r.user_id === userId)
}

async function localGetDueCardIds(_deckId: string, userId: string, cardIds: string[]): Promise<string[]> {
  const reviews = lsGet<Review>(LS_REVIEWS)
  const today = getStudyDayKey()
  const reviewedIds = new Set(reviews.filter(r => r.user_id === userId).map(r => r.card_id))
  
  // Cards vencidos = (Cards que nunca foram revisados) + (Cards revisados com due_date <= hoje)
  const dueFromReviews = reviews
    .filter(r => r.user_id === userId && cardIds.includes(r.card_id) && r.due_date <= today)
    .map(r => r.card_id)
    
  const neverReviewed = cardIds.filter(id => !reviewedIds.has(id))
  
  return [...neverReviewed, ...dueFromReviews]
}

async function localGetGlobalDueCardIds(userId: string, cardIds: string[]): Promise<string[]> {
  return localGetDueCardIds('all', userId, cardIds)
}

async function localLogActivity(userId: string) {
  // Em modo local, guardamos tudo em uma chave mestre para evitar perdas se o ID mudar
  const globalKey = LS_ACTIVITY + '_global'
  const userKey = LS_ACTIVITY + '_' + userId
  const today = getStudyDayKey()
  
  const activity = lsGetItem<Record<string, number>>(globalKey) || {}
  
  // Se houver dados no ID específico, migramos para o global
  const legacyActivity = lsGetItem<Record<string, number>>(userKey) || {}
  const merged = { ...legacyActivity, ...activity }
  
  merged[today] = (merged[today] || 0) + 1
  lsSetItem(globalKey, merged)
  
  // Limpamos o legado para não duplicar na próxima migração
  if (Object.keys(legacyActivity).length > 0) {
    lsSetItem(userKey, {})
  }
}

async function localGetActivity(userId: string): Promise<Record<string, number>> {
  const globalKey = LS_ACTIVITY + '_global'
  const userKey = LS_ACTIVITY + '_' + userId
  
  let global = lsGetItem<Record<string, number>>(globalKey) || {}
  const userSpecific = lsGetItem<Record<string, number>>(userKey) || {}
  
  // Migração automática na leitura
  if (Object.keys(userSpecific).length > 0) {
    global = { ...userSpecific, ...global }
    lsSetItem(globalKey, global)
    lsSetItem(userKey, {}) // Consumido
  }

  // Tentar encontrar QUALQUER outra chave de atividade legada (ex: de outros IDs gerados)
  const allKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(LS_ACTIVITY) && k !== globalKey && k !== userKey) {
      allKeys.push(k)
    }
  }

  for (const k of allKeys) {
    try {
      const otherData = JSON.parse(localStorage.getItem(k) || '{}')
      global = { ...otherData, ...global }
      localStorage.removeItem(k) // Migrado
    } catch {}
  }

  lsSetItem(globalKey, global)
  return global
}

async function localSaveReview(
  userId: string,
  cardId: string,
  rating: Rating,
): Promise<Review> {
  const reviews = lsGet<Review>(LS_REVIEWS)
  const existing = reviews.find(r => r.card_id === cardId && r.user_id === userId)
  const sm2 = calculateSM2(rating, existing || {})
  const now = new Date().toISOString()

  // Log activity
  await localLogActivity(userId)

  if (existing) {
    const updated = { ...existing, ...sm2, last_reviewed: now }
    const idx = reviews.findIndex(r => r.id === existing.id)
    reviews[idx] = updated
    lsSet(LS_REVIEWS, reviews)
    return updated
  }

  const review: Review = {
    id: generateId(),
    user_id: userId,
    card_id: cardId,
    ...sm2,
    last_reviewed: now,
  }
  lsSet(LS_REVIEWS, [...reviews, review])
  return review
}

// ── Supabase Mode ─────────────────────────────────────────────────────────────

async function supabaseGetReview(cardId: string, userId: string): Promise<Review | null> {
  const { data } = await supabase!
    .from('reviews')
    .select('*')
    .eq('card_id', cardId)
    .eq('user_id', userId)
    .single()
  return data || null
}

async function supabaseGetReviewsForDeck(_deckId: string, userId: string): Promise<Review[]> {
  const { data } = await supabase!
    .from('reviews')
    .select('*, cards!inner(deck_id)')
    .eq('user_id', userId)
    .eq('cards.deck_id', _deckId)
  return data || []
}

async function supabaseGetDueCardIds(_deckId: string, userId: string, cardIds: string[]): Promise<string[]> {
  const today = getStudyDayKey()
  const { data } = await supabase!
    .from('reviews')
    .select('card_id')
    .eq('user_id', userId)
    .in('card_id', cardIds)
    .lte('due_date', today)

  const reviewedDue = new Set((data || []).map((r: { card_id: string }) => r.card_id))
  const { data: allReviewed } = await supabase!
    .from('reviews')
    .select('card_id')
    .eq('user_id', userId)
    .in('card_id', cardIds)

  const allReviewedIds = new Set((allReviewed || []).map((r: { card_id: string }) => r.card_id))
  const newCards = cardIds.filter(id => !allReviewedIds.has(id))

  return [...newCards, ...Array.from(reviewedDue)]
}

async function supabaseGetGlobalDueCardIds(userId: string, cardIds: string[]): Promise<string[]> {
  return supabaseGetDueCardIds('all', userId, cardIds)
}

async function supabaseLogActivity(userId: string) {
  const today = getStudyDayKey()
  try {
    const { data: existing, error: selectErr } = await supabase!
      .from('activity')
      .select('id, count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (selectErr) throw selectErr

    if (existing) {
      const { error: updateErr } = await supabase!
        .from('activity')
        .update({ count: (existing.count || 0) + 1 })
        .eq('id', existing.id)
      if (updateErr) throw updateErr
    } else {
      const { error: insertErr } = await supabase!
        .from('activity')
        .insert({ user_id: userId, date: today, count: 1 })
      if (insertErr) throw insertErr
    }
  } catch (e) {
    console.error('Failed to log sync activity', e)
    // Fallback to local
    localLogActivity(userId)
  }
}

async function supabaseGetActivity(userId: string): Promise<Record<string, number>> {
  try {
    const { data } = await supabase!
      .from('activity')
      .select('date, count')
      .eq('user_id', userId)
    
    const result: Record<string, number> = {}
    data?.forEach((r: any) => { result[r.date] = r.count })
    return result
  } catch {
    return localGetActivity(userId)
  }
}

async function supabaseSaveReview(userId: string, cardId: string, rating: Rating): Promise<Review> {
  const existing = await supabaseGetReview(cardId, userId)
  const sm2 = calculateSM2(rating, existing || {})
  const now = new Date().toISOString()

  // Log activity
  await supabaseLogActivity(userId)

  if (existing) {
    const { data, error } = await supabase!
      .from('reviews')
      .update({ ...sm2, last_reviewed: now })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await supabase!
    .from('reviews')
    .insert({ user_id: userId, card_id: cardId, ...sm2, last_reviewed: now })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ── Public API ────────────────────────────────────────────────────────────────

export const reviewService = {
  getReview: isLocalMode ? localGetReview : supabaseGetReview,
  getReviewsForDeck: (deckId: string, userId: string) => 
    deckId === 'all' 
      ? (isLocalMode ? lsGet<Review>(LS_REVIEWS).filter(r => r.user_id === userId) : supabase!.from('reviews').select('*').eq('user_id', userId).then(r => r.data || []))
      : (isLocalMode ? localGetReviewsForDeck(deckId, userId) : supabaseGetReviewsForDeck(deckId, userId)),
  getDueCardIds: isLocalMode ? localGetDueCardIds : supabaseGetDueCardIds,
  getGlobalDueCardIds: isLocalMode ? localGetGlobalDueCardIds : supabaseGetGlobalDueCardIds,
  saveReview: isLocalMode ? localSaveReview : supabaseSaveReview,
  getActivity: isLocalMode ? localGetActivity : supabaseGetActivity,
}
