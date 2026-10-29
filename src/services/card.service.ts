/**
 * Card Service — local mode (localStorage) + Supabase mode
 */

import type { Card } from '../types'
import { isLocalMode, supabase, generateId, lsGet, lsRemove } from './storage'
import { cardIDB } from './idb.storage'

const LS_CARDS = 'uply_cards'

// ── Local Mode (IndexedDB) ──────────────────────────────────────────────────

async function migrateIfNeeded() {
  const oldCards = lsGet<Card>(LS_CARDS);
  if (oldCards && oldCards.length > 0) {
    console.log(`📦 Migrando ${oldCards.length} cards para IndexedDB...`);
    await cardIDB.saveBulk(oldCards as any);
    lsRemove(LS_CARDS);
    console.log('✅ Migração concluída.');
  }
}

async function localGetCards(deckId: string): Promise<Card[]> {
  await migrateIfNeeded();
  const cards = await cardIDB.getByDeck(deckId);
  return cards as Card[];
}

async function localGetCardIds(deckId: string): Promise<{ id: string }[]> {
  const cards = await localGetCards(deckId);
  return cards.map(c => ({ id: c.id }));
}

async function localGetAllUserCards(userId: string): Promise<Card[]> {
  await migrateIfNeeded();
  const decks = lsGet<any>('uply_decks').filter(d => d.user_id === userId || (userId === 'local_user_default' && (d.user_id === 'local' || !d.user_id)));
  const deckIds = decks.map(d => d.id);
  const allCards = await cardIDB.getAll();
  return allCards.filter(c => deckIds.includes(c.deck_id)) as any as Card[];
}

async function localGetAllUserCardIds(userId: string): Promise<{ id: string; deck_id: string }[]> {
  const cards = await localGetAllUserCards(userId);
  return cards.map(c => ({ id: c.id, deck_id: c.deck_id }));
}

async function localGetCardsByIds(cardIds: string[]): Promise<Card[]> {
  if (!cardIds || cardIds.length === 0) return [];
  await migrateIfNeeded();
  const allCards = await cardIDB.getAll();
  const cardMap = new Map<string, Card>(allCards.map((c: any) => [c.id, c as Card]));
  return cardIds.map(id => cardMap.get(id)).filter((c): c is Card => Boolean(c));
}

async function localCreateCard(deckId: string, front: string, back: string, extra?: Partial<Card>): Promise<Card> {
  const card: Card = {
    id: generateId(),
    deck_id: deckId,
    front,
    back,
    ...extra,
    created_at: new Date().toISOString(),
  }
  await cardIDB.save(card as any);
  return card
}

async function localUpdateCard(id: string, updates: Partial<Card>): Promise<Card> {
  const allCards = await cardIDB.getAll();
  const card = allCards.find(c => c.id === id);
  if (!card) throw new Error('Card não encontrado.')
  
  const updatedCard = { ...card, ...updates };
  await cardIDB.save(updatedCard as any);
  return updatedCard as unknown as Card;
}

async function localDeleteCard(id: string): Promise<void> {
  await cardIDB.delete(id);
}

async function localDeleteCardsByDeck(deckId: string): Promise<void> {
  await cardIDB.deleteByDeck(deckId);
}

// ── Supabase Mode ─────────────────────────────────────────────────────────────

async function supabaseGetCards(deckId: string): Promise<Card[]> {
  const { data, error } = await supabase!
    .from('cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Consulta ultra-leve que retorna apenas os IDs dos cartões de um baralho
 * (evita trafegar megabytes de imagens Base64 no carregamento do Dashboard).
 */
async function supabaseGetCardIds(deckId: string): Promise<{ id: string }[]> {
  const { data, error } = await supabase!
    .from('cards')
    .select('id')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

async function supabaseGetAllUserCards(userId: string): Promise<Card[]> {
  const { data, error } = await supabase!
    .from('cards')
    .select('*, decks!inner(user_id)')
    .eq('decks.user_id', userId)
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Consulta ultra-leve que retorna apenas id e deck_id de todos os cartões do aluno
 * (evita baixar todas as imagens Base64 antes de filtrar os cartões vencidos).
 */
async function supabaseGetAllUserCardIds(userId: string): Promise<{ id: string; deck_id: string }[]> {
  const { data, error } = await supabase!
    .from('cards')
    .select('id, deck_id, decks!inner(user_id)')
    .eq('decks.user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []).map((row: any) => ({ id: row.id, deck_id: row.deck_id }))
}

/**
 * Busca os dados completos (incluindo imagens) apenas dos cartões solicitados por ID,
 * preservando exatamente a ordem original de `cardIds`.
 */
async function supabaseGetCardsByIds(cardIds: string[]): Promise<Card[]> {
  if (!cardIds || cardIds.length === 0) return []
  const BATCH_SIZE = 100
  const fetched: Card[] = []

  for (let i = 0; i < cardIds.length; i += BATCH_SIZE) {
    const chunk = cardIds.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase!
      .from('cards')
      .select('*')
      .in('id', chunk)
    if (error) throw new Error(error.message)
    if (data) fetched.push(...(data as Card[]))
  }

  const cardMap = new Map<string, Card>(fetched.map(c => [c.id, c]))
  return cardIds.map(id => cardMap.get(id)).filter((c): c is Card => Boolean(c))
}

async function supabaseCreateCard(deckId: string, front: string, back: string, extra?: Partial<Card>): Promise<Card> {
  const { data, error } = await supabase!
    .from('cards')
    .insert({ deck_id: deckId, front, back, ...extra })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function supabaseUpdateCard(id: string, updates: Partial<Card>): Promise<Card> {
  const { data, error } = await supabase!
    .from('cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function supabaseDeleteCard(id: string): Promise<void> {
  const { error } = await supabase!.from('cards').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

async function supabaseDeleteCardsByDeck(deckId: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('cards').delete().eq('deck_id', deckId)
    if (error) throw new Error(error.message)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const cardService = {
  getCards: isLocalMode ? localGetCards : supabaseGetCards,
  getCardIds: isLocalMode ? localGetCardIds : supabaseGetCardIds,
  getAllUserCards: isLocalMode ? localGetAllUserCards : supabaseGetAllUserCards,
  getAllUserCardIds: isLocalMode ? localGetAllUserCardIds : supabaseGetAllUserCardIds,
  getCardsByIds: isLocalMode ? localGetCardsByIds : supabaseGetCardsByIds,
  createCard: isLocalMode ? localCreateCard : supabaseCreateCard,
  updateCard: isLocalMode ? localUpdateCard : supabaseUpdateCard,
  deleteCard: isLocalMode ? localDeleteCard : supabaseDeleteCard,
  deleteCardsByDeck: isLocalMode ? localDeleteCardsByDeck : supabaseDeleteCardsByDeck,
}
