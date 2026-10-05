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

async function logActivity(userId: string, count: number = 1): Promise<Record<string, number>> {
  if (!userId) return {}
  const today = getStudyDayKey()
  const userKey = LS_ACTIVITY + '_' + userId

  // 1. Atualiza dados no localStorage estritamente para o perfil deste usuário
  const userSpecific = lsGetItem<Record<string, number>>(userKey) || {}
  userSpecific[today] = (userSpecific[today] || 0) + count
  lsSetItem(userKey, userSpecific)

  // Remove qualquer cache global legado para evitar contaminação entre perfis
  try {
    localStorage.removeItem(LS_ACTIVITY + '_global')
  } catch {}

  // 2. Dispara evento para atualizar o Heatmap na tela em tempo real
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('uply_activity_sync', { detail: { date: today, count: userSpecific[today] } }))
  }

  // 3. Sincroniza com Supabase se disponível
  if (!isLocalMode && supabase) {
    try {
      const { data: existing, error: selectErr } = await supabase
        .from('activity')
        .select('id, count')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle()

      if (!selectErr && existing) {
        await supabase
          .from('activity')
          .update({ count: Math.max(existing.count || 0, userSpecific[today]) })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('activity')
          .upsert({ user_id: userId, date: today, count: userSpecific[today] }, { onConflict: 'user_id,date' })
      }
    } catch (e) {
      console.warn('[ActivitySync] Salvo localmente, pendente nuvem:', e)
    }
  }

  return userSpecific
}

async function getActivity(userId: string): Promise<Record<string, number>> {
  if (!userId) return {}
  const userKey = LS_ACTIVITY + '_' + userId

  // Limpa qualquer cache global legado para que perfis nunca compartilhem dados de outros
  try {
    localStorage.removeItem(LS_ACTIVITY + '_global')
  } catch {}

  const userSpecific = lsGetItem<Record<string, number>>(userKey) || {}
  const merged: Record<string, number> = { ...userSpecific }
  const today = getStudyDayKey()

  // 1. Modo Supabase: consulta revisões reais do usuário
  if (!isLocalMode && supabase) {
    try {
      const { data: cloudReviews } = await supabase
        .from('reviews')
        .select('last_reviewed')
        .eq('user_id', userId)

      const hasRealReviews = cloudReviews && cloudReviews.length > 0

      // Se o aluno nunca estudou um card (perfil novo), sua constância deve ser totalmente zerada
      if (!hasRealReviews) {
        lsSetItem(userKey, {})
        try {
          await supabase.from('activity').delete().eq('user_id', userId)
        } catch {}
        return {}
      }

      // Se tem revisões, recupera as atividades reais registradas no banco para este usuário
      const { data: cloudActivity } = await supabase
        .from('activity')
        .select('date, count')
        .eq('user_id', userId)

      const cloudMap: Record<string, number> = {}

      if (cloudActivity && Array.isArray(cloudActivity)) {
        for (const row of cloudActivity) {
          if (row.date && row.date <= today) {
            cloudMap[row.date] = Math.max(cloudMap[row.date] || 0, row.count || 0)
          }
        }
      }

      if (cloudReviews && Array.isArray(cloudReviews)) {
        for (const r of cloudReviews) {
          if (r.last_reviewed) {
            const parsedDate = new Date(r.last_reviewed)
            const d = !isNaN(parsedDate.getTime()) ? getStudyDayKey(parsedDate) : r.last_reviewed.split('T')[0]
            if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today) {
              cloudMap[d] = Math.max(cloudMap[d] || 0, 1)
            }
          }
        }
      }

      // Remove no banco de dados qualquer data futura incorreta
      try {
        await supabase.from('activity').delete().eq('user_id', userId).gt('date', today)
      } catch {}

      lsSetItem(userKey, cloudMap)
      return cloudMap
    } catch (e) {
      console.warn('[Activity] Usando dados locais como fallback:', e)
    }
  }

  // 2. Modo Local (ou fallback offline): recupera apenas revisões que pertencem estritamente a este user_id
  try {
    const localReviews = lsGet<Review>(LS_REVIEWS).filter(r => r.user_id === userId)
    if (localReviews.length === 0 && Object.keys(userSpecific).length > 0) {
      lsSetItem(userKey, {})
      return {}
    }
    for (const r of localReviews) {
      if (r.last_reviewed) {
        const parsedDate = new Date(r.last_reviewed)
        const d = !isNaN(parsedDate.getTime()) ? getStudyDayKey(parsedDate) : r.last_reviewed.split('T')[0]
        if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today) {
          merged[d] = (merged[d] || 0) + 1
        }
      }
    }
  } catch {}

  // 3. Expurgar quaisquer datas futuras residuais no cache local
  for (const k of Object.keys(merged)) {
    if (k > today) {
      delete merged[k]
    }
  }

  lsSetItem(userKey, merged)
  return merged
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
  await logActivity(userId, 1)

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
  if (!cardIds || cardIds.length === 0) return []
  const today = getStudyDayKey()

  try {
    let query = supabase!
      .from('reviews')
      .select('card_id, due_date')
      .eq('user_id', userId)

    if (cardIds.length <= 100) {
      query = query.in('card_id', cardIds)
    }

    const { data, error } = await query
    if (error) throw error

    const reviewMap = new Map((data || []).map((r: any) => [r.card_id, r]))
    return cardIds.filter(id => {
      const rev = reviewMap.get(id)
      if (!rev) return true // Card nunca revisado (novo)
      return !rev.due_date || rev.due_date <= today
    })
  } catch (err) {
    console.warn('[ReviewService] Erro ao buscar due cards, utilizando todos como fallback:', err)
    return cardIds
  }
}

async function supabaseGetGlobalDueCardIds(userId: string, cardIds: string[]): Promise<string[]> {
  return supabaseGetDueCardIds('all', userId, cardIds)
}

async function supabaseSaveReview(userId: string, cardId: string, rating: Rating): Promise<Review> {
  const existing = await supabaseGetReview(cardId, userId)
  const sm2 = calculateSM2(rating, existing || {})
  const now = new Date().toISOString()

  // Log activity
  await logActivity(userId, 1)

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
  logActivity,
  getActivity,
}
