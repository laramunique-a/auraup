import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
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

function getDeckCacheKey(userId: string) {
  return `uply_decks_cache_${userId}`
}

function getStatsCacheKey(userId: string) {
  return `uply_stats_cache_${userId}`
}

export function DeckProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [decks, setDecks] = useState<Deck[]>(() => {
    if (!user?.id) return []
    try {
      const raw = localStorage.getItem(getDeckCacheKey(user.id))
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [statsMap, setStatsMap] = useState<Record<string, DeckStats>>(() => {
    if (!user?.id) return {}
    try {
      const raw = localStorage.getItem(getStatsCacheKey(user.id))
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })
  const [loading, setLoading] = useState<boolean>(() => {
    if (!user?.id) return false
    try {
      return !localStorage.getItem(getDeckCacheKey(user.id))
    } catch {
      return true
    }
  })
  const [error, setError] = useState<string | null>(null)
  const inFlightRef = useRef<Promise<void> | null>(null)

  const saveDecksCache = useCallback((userId: string, nextDecks: Deck[]) => {
    try {
      localStorage.setItem(getDeckCacheKey(userId), JSON.stringify(nextDecks))
    } catch {
      // ignore storage quota errors
    }
  }, [])

  const saveStatsCache = useCallback((userId: string, nextStats: Record<string, DeckStats>) => {
    try {
      localStorage.setItem(getStatsCacheKey(userId), JSON.stringify(nextStats))
    } catch {
      // ignore storage quota errors
    }
  }, [])

  const loadStats = useCallback(async (decksToLoad: Deck[]) => {
    if (!user?.id || decksToLoad.length === 0) return
    
    try {
      const batchStats = await deckService.getAllDeckStats(decksToLoad, user.id)
      setStatsMap(prev => {
        const merged = { ...prev, ...batchStats }
        saveStatsCache(user.id, merged)
        return merged
      })
    } catch (e) {
      console.error('Error loading stats:', e)
    }
  }, [user?.id, saveStatsCache])

  const loadData = useCallback(async () => {
    if (!user) {
      setDecks([])
      setStatsMap({})
      setLoading(false)
      return
    }

    if (inFlightRef.current) {
      return inFlightRef.current
    }

    const run = async () => {
      // Hidrata do cache local imediatamente se disponível para exibição em 0ms
      let hasCachedDecks = false
      try {
        const cachedDecksRaw = localStorage.getItem(getDeckCacheKey(user.id))
        const cachedStatsRaw = localStorage.getItem(getStatsCacheKey(user.id))
        if (cachedDecksRaw) {
          const parsedDecks: Deck[] = JSON.parse(cachedDecksRaw)
          setDecks(parsedDecks)
          hasCachedDecks = parsedDecks.length > 0
        }
        if (cachedStatsRaw) {
          setStatsMap(JSON.parse(cachedStatsRaw))
        }
      } catch {
        // ignore cache parse errors
      }

      if (!hasCachedDecks) {
        setLoading(true)
      }
      setError(null)

      try {
        const data = await deckService.getDecks(user.id)
        setDecks(data)
        saveDecksCache(user.id, data)
        // Libera a visualização dos baralhos IMEDIATAMENTE antes mesmo das estatísticas terminarem
        setLoading(false)
        await loadStats(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar baralhos')
      } finally {
        setLoading(false)
        inFlightRef.current = null
      }
    }

    inFlightRef.current = run()
    return inFlightRef.current
  }, [user, loadStats, saveDecksCache])

  const refreshStats = useCallback(async () => {
    if (!user?.id) return
    try {
      const currentDecks = await deckService.getDecks(user.id)
      setDecks(currentDecks)
      saveDecksCache(user.id, currentDecks)
      await loadStats(currentDecks)
    } catch (e) {
      console.error('Error refreshing stats:', e)
    }
  }, [user?.id, loadStats, saveDecksCache])

  useEffect(() => {
    loadData()
  }, [loadData])

  const recordReviewLocally = useCallback((deckId: string, rating: Rating) => {
    setStatsMap(prev => {
      const currentStats = prev[deckId]
      if (!currentStats) return prev

      // Se a nota for maior que 0 (Difícil, Bom, Fácil), o card não está mais pendente hoje
      if (rating > 0) {
        const next = {
          ...prev,
          [deckId]: {
            ...currentStats,
            due: Math.max(0, currentStats.due - 1),
            lastReview: new Date().toISOString()
          }
        }
        if (user?.id) saveStatsCache(user.id, next)
        return next
      }
      return prev
    })
  }, [user?.id, saveStatsCache])

  const createDeck = async (name: string, description?: string) => {
    if (!user) return
    const deck = await deckService.createDeck(user.id, name, description)
    setDecks(prev => {
      const next = [deck, ...prev]
      saveDecksCache(user.id, next)
      return next
    })
    // Initialize stats for new deck
    setStatsMap(prev => {
      const next = { ...prev, [deck.id]: { total: 0, due: 0, new: 0 } }
      saveStatsCache(user.id, next)
      return next
    })
    return deck
  }

  const updateDeck = async (id: string, updates: Partial<Pick<Deck, 'name' | 'description'>>) => {
    const updated = await deckService.updateDeck(id, updates)
    setDecks(prev => {
      const next = prev.map(d => d.id === id ? updated : d)
      if (user?.id) saveDecksCache(user.id, next)
      return next
    })
    return updated
  }

  const deleteDeck = async (id: string) => {
    await deckService.deleteDeck(id)
    setDecks(prev => {
      const next = prev.filter(d => d.id !== id)
      if (user?.id) saveDecksCache(user.id, next)
      return next
    })
    const newStats = { ...statsMap }
    delete newStats[id]
    setStatsMap(newStats)
    if (user?.id) saveStatsCache(user.id, newStats)
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
