import { useDeckContext } from '../contexts/DeckContext'

export function useDecks() {
  const context = useDeckContext()
  
  return { 
    decks: context.decks, 
    statsMap: context.statsMap,
    loading: context.loading, 
    error: context.error, 
    createDeck: context.createDeck, 
    updateDeck: context.updateDeck, 
    deleteDeck: context.deleteDeck, 
    getDeckStats: async (deckId: string) => context.statsMap[deckId] || { total: 0, due: 0, new: 0 }, 
    reload: context.reload,
    refreshStats: context.refreshStats,
    recordReviewLocally: context.recordReviewLocally
  }
}
