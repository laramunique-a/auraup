/**
 * Card Service — local mode (localStorage) + Supabase mode
 */

import type { Card } from '../types'
import { isLocalMode, supabase, generateId, lsGet, lsRemove } from './storage'
import { cardIDB } from './idb.storage'

const LS_CARDS = 'uply_cards'

// ── Local Mode (IndexedDB) ──────────────────────────────────────────────────

let isMigrated = false;

async function migrateIfNeeded() {
  if (isMigrated) return;
  const oldCards = lsGet<Card>(LS_CARDS);
  if (oldCards.length > 0) {
    console.log(`📦 Migrando ${oldCards.length} cards para IndexedDB...`);
    await cardIDB.saveBulk(oldCards as any);
    lsRemove(LS_CARDS);
    console.log('✅ Migração concluída.');
  }
  isMigrated = true;
}

async function localGetCards(deckId: string): Promise<Card[]> {
  await migrateIfNeeded();
  const cards = await cardIDB.getByDeck(deckId);
  return cards as Card[];
}

async function localGetAllUserCards(userId: string): Promise<Card[]> {
  await migrateIfNeeded();
  const decks = lsGet<any>('uply_decks').filter(d => d.user_id === userId);
  const deckIds = decks.map(d => d.id);
  const allCards = await cardIDB.getAll();
  return allCards.filter(c => deckIds.includes(c.deck_id)) as any as Card[];
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

async function supabaseGetAllUserCards(userId: string): Promise<Card[]> {
  const { data, error } = await supabase!
    .from('cards')
    .select('*, decks!inner(user_id)')
    .eq('decks.user_id', userId)
  if (error) throw new Error(error.message)
  return data || []
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

// ── Public API ────────────────────────────────────────────────────────────────

export const cardService = {
  getCards: isLocalMode ? localGetCards : supabaseGetCards,
  getAllUserCards: isLocalMode ? localGetAllUserCards : supabaseGetAllUserCards,
  createCard: isLocalMode ? localCreateCard : supabaseCreateCard,
  updateCard: isLocalMode ? localUpdateCard : supabaseUpdateCard,
  deleteCard: isLocalMode ? localDeleteCard : supabaseDeleteCard,
}
