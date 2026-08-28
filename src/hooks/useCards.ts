import { useState, useEffect, useCallback } from 'react'
import type { Card } from '../types'
import { cardService } from '../services/card.service'

export function useCards(deckId: string) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await cardService.getCards(deckId)
      setCards(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar cards')
    } finally {
      setLoading(false)
    }
  }, [deckId])

  useEffect(() => { loadCards() }, [loadCards])

  async function createCard(front: string, back: string, extra?: Partial<Card>) {
    const card = await cardService.createCard(deckId, front, back, extra)
    setCards(prev => [...prev, card])
    return card
  }

  async function updateCard(id: string, updates: Partial<Card>) {
    const updated = await cardService.updateCard(id, updates)
    setCards(prev => prev.map(c => c.id === id ? updated : c))
    return updated
  }

  async function deleteCard(id: string) {
    await cardService.deleteCard(id)
    setCards(prev => prev.filter(c => c.id !== id))
  }

  return { cards, loading, error, createCard, updateCard, deleteCard, reload: loadCards }
}
