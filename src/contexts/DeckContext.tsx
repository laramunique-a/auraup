import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Deck, DeckStats, Rating } from '../types'
import { deckService } from '../services/deck.service'
import { useAuth } from './AuthContext'

interface DeckContextType {
  decks: Deck[]
  statsMap: Record<string, DeckStats>
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  refreshStats: () => Promise<void>
  recordReviewLocally: (deckId: string, rating: Rating) => void
  createDeck: (name: string, description?: string) => Promise<Deck | undefined>
  updateDeck: (id: string, updates: Partial<Pick<Deck, 'name' | 'description'>>) => Promise<Deck>
  deleteDeck: (id: string) => Promise<void>
}

const DeckContext = createContext<DeckContextType | undefined>(undefined)

export function DeckProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [decks, setDecks] = useState<Deck[]>([])
  const [statsMap, setStatsMap] = useState<Record<string, DeckStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async (decksToLoad: Deck[]) => {
    if (!user?.id || decksToLoad.length === 0) return
    
    try {
      const statsEntries = await Promise.all(
        decksToLoad.map(async (deck) => {
          const stats = await deckService.getDeckStats(deck.id, user.id)
          return [deck.id, stats] as [string, DeckStats]
        })
      )
      setStatsMap(Object.fromEntries(statsEntries))
    } catch (e) {
      console.error('Error loading stats:', e)
    }
  }, [user?.id])

  const loadData = useCallback(async () => {
    if (!user) {
      setDecks([])
      setStatsMap({})
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await deckService.getDecks(user.id)
      setDecks(data)
      // Carrega stats em segundo plano ou logo após os decks
      await loadStats(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar baralhos')
    } finally {
      setLoading(false)
    }
  }, [user, loadStats])

  const refreshStats = useCallback(async () => {
    if (decks.length > 0) {
      await loadStats(decks)
    }
  }, [decks, loadStats])

  useEffect(() => {
    loadData()
  }, [loadData])

  const recordReviewLocally = useCallback((deckId: string, rating: Rating) => {
    setStatsMap(prev => {
      const currentStats = prev[deckId]
      if (!currentStats) return prev

      // Se a nota for maior que 0 (Difícil, Bom, Fácil), o card não está mais pendente hoje
      if (rating > 0) {
        return {
          ...prev,
          [deckId]: {
            ...currentStats,
            due: Math.max(0, currentStats.due - 1),
            lastReview: new Date().toISOString()
          }
        }
      }
      return prev
    })
  }, [])

  const createDeck = async (name: string, description?: string) => {
    if (!user) return
    const deck = await deckService.createDeck(user.id, name, description)
    setDecks(prev => [deck, ...prev])
    // Initialize stats for new deck
    setStatsMap(prev => ({ ...prev, [deck.id]: { total: 0, due: 0, new: 0 } }))
    return deck
  }

  const updateDeck = async (id: string, updates: Partial<Pick<Deck, 'name' | 'description'>>) => {
    const updated = await deckService.updateDeck(id, updates)
    setDecks(prev => prev.map(d => d.id === id ? updated : d))
    return updated
  }

  const deleteDeck = async (id: string) => {
    await deckService.deleteDeck(id)
    setDecks(prev => prev.filter(d => d.id !== id))
    const newStats = { ...statsMap }
    delete newStats[id]
    setStatsMap(newStats)
  }

  return (
    <DeckContext.Provider value={{ 
      decks, statsMap, loading, error, 
      reload: loadData, refreshStats, recordReviewLocally,
      createDeck, updateDeck, deleteDeck 
    }}>
      {children}
    </DeckContext.Provider>
  )
}

export function useDeckContext() {
  const context = useContext(DeckContext)
  if (context === undefined) {
    throw new Error('useDeckContext must be used within a DeckProvider')
  }
  return context
}
