import { useState, useEffect } from 'react'
import type { Card, StudyCard, Rating } from '../types'
import { cardService } from '../services/card.service'
import { reviewService } from '../services/review.service'
import { useAuth } from '../contexts/AuthContext'

export function useStudySession(deckId: string) {
  const { user } = useAuth()
  const [queue, setQueue] = useState<StudyCard[]>([])
  const [current, setCurrent] = useState<StudyCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionDone, setSessionDone] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [total, setTotal] = useState(0)

  const [sessionClicks, setSessionClicks] = useState<Record<string, number>>({})
  const [, setGraduatedIds] = useState<Set<string>>(new Set())
  
  // Estatísticas detalhadas da sessão
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [endTime, setEndTime] = useState<number | null>(null)
  const [ratingCounts, setRatingCounts] = useState<Record<Rating, number>>({ 0: 0, 1: 0, 2: 0, 3: 0 })

  useEffect(() => {
    async function loadSession() {
      if (!user) return
      setLoading(true)
      try {
        const isGlobal = deckId === 'all'
        
        let reviews: any[] = []
        let dueIds: string[] = []
        let allCardIds: string[] = []

        if (isGlobal) {
          // 1. Carrega apenas os IDs leves (sem imagens Base64) para identificar quais cartões estão vencidos
          const cardRefs = await cardService.getAllUserCardIds(user.id)
          allCardIds = cardRefs.map(c => c.id)
          reviews = await reviewService.getReviewsForDeck('all', user.id)
          dueIds = await reviewService.getGlobalDueCardIds(user.id, allCardIds)
        } else {
          // 1. Carrega apenas os IDs leves do baralho para identificar quais cartões estão vencidos
          const cardRefs = await cardService.getCardIds(deckId)
          allCardIds = cardRefs.map(c => c.id)
          reviews = await reviewService.getReviewsForDeck(deckId, user.id)
          dueIds = await reviewService.getDueCardIds(deckId, user.id, allCardIds)
        }

        const reviewMap = new Map(reviews.map(r => [r.card_id, r]))

        // 2. Define quais cartões realmente serão estudados nesta sessão
        // Se não houver cartões estritamente vencidos, carrega todos os cartões do baralho para estudo contínuo
        const targetCardIds = dueIds.length > 0 ? dueIds : allCardIds

        // 3. Baixa os dados completos (com imagens) SOMENTE dos cartões que entrarão na sessão
        const fetchedCards: Card[] = targetCardIds.length > 0
          ? await cardService.getCardsByIds(targetCardIds)
          : []

        const dueCards: StudyCard[] = fetchedCards.map(c => ({
          ...c,
          review: reviewMap.get(c.id)
        }))

        // Fila inicial de estudo (mantém a ordem das cartas desde o número 1 para baralhos específicos)
        let finalQueue: StudyCard[] = []
        
        if (isGlobal) {
          const grouped = dueCards.reduce((acc, card) => {
            if (!acc[card.deck_id]) acc[card.deck_id] = []
            acc[card.deck_id].push(card)
            return acc
          }, {} as Record<string, StudyCard[]>)
          
          Object.values(grouped).forEach(deckCards => {
            finalQueue.push(...deckCards)
          })
        } else {
          finalQueue = [...dueCards]
        }

        setTotal(finalQueue.length)
        setReviewed(0)
        setGraduatedIds(new Set())
        setQueue(finalQueue)
        setCurrent(finalQueue[0] || null)
        setStartTime(Date.now())
        setEndTime(null)
        setRatingCounts({ 0: 0, 1: 0, 2: 0, 3: 0 })

        if (finalQueue.length === 0) {
          setSessionDone(true)
          setEndTime(Date.now())
        }
      } finally {
        setLoading(false)
      }
    }
    loadSession()
  }, [deckId, user])

  async function submitRating(rating: Rating) {
    if (!user || !current) return
    
    // Contabiliza a resposta
    setRatingCounts(prev => ({ ...prev, [rating]: (prev[rating] || 0) + 1 }))

    const cardToSave = current
    const clickCount = (sessionClicks[cardToSave.id] || 0) + 1
    const remaining = queue.slice(1)

    // Qualquer nota positiva (1 = Difícil, 2 = Bom, 3 = Fácil) gradua a carta e avança a barra de desempenho
    // Apenas a nota 0 (De novo) recoloca a carta na fila para repetição na mesma sessão
    const shouldGraduate = rating >= 1

    if (shouldGraduate) {
      // 1. Atualiza estado e avança para a próxima carta IMEDIATAMENTE (zero delay no PWA)
      setGraduatedIds(prev => {
        const next = new Set(prev)
        next.add(cardToSave.id)
        setReviewed(next.size)
        return next
      })

      setQueue(remaining)
      if (remaining.length === 0) {
        setSessionDone(true)
        setEndTime(Date.now())
        setCurrent(null)
      } else {
        setCurrent(remaining[0])
      }

      // 2. Persistência assíncrona em segundo plano (não bloqueia a troca de cartas na interface)
      reviewService.saveReview(user.id, cardToSave.id, rating).catch(err => {
        console.warn('[ReviewService] Erro ao persistir revisão em segundo plano:', err)
      })
    } else {
      let insertPos = remaining.length
      
      if (rating === 0) {
        insertPos = Math.min(remaining.length, Math.floor(Math.random() * 2) + 1)
      } else if (rating === 1) {
        insertPos = Math.min(remaining.length, Math.floor(Math.random() * 3) + 3)
      } else if (rating === 2) {
        insertPos = Math.min(remaining.length, Math.floor(Math.random() * 5) + 6)
      }

      const newQueue = [...remaining]
      newQueue.splice(insertPos, 0, cardToSave)
      
      setSessionClicks(prev => ({ ...prev, [cardToSave.id]: clickCount }))
      setQueue(newQueue)
      
      const sameCard = newQueue[0].id === cardToSave.id
      if (sameCard) {
        setCurrent(null)
        setTimeout(() => setCurrent(cardToSave), 20)
      } else {
        setCurrent(newQueue[0])
      }
    }
  }

  const finalEndTime = endTime || Date.now()
  const durationSeconds = Math.max(1, Math.round((finalEndTime - startTime) / 1000))
  const totalAnswers = ratingCounts[0] + ratingCounts[1] + ratingCounts[2] + ratingCounts[3]
  const positiveAnswers = ratingCounts[2] + ratingCounts[3]
  const accuracy = totalAnswers > 0 ? Math.round((positiveAnswers / totalAnswers) * 100) : 100

  return {
    current,
    loading,
    sessionDone,
    reviewed,
    total,
    submitRating,
    sessionStats: {
      durationSeconds,
      ratingCounts,
      totalAnswers,
      accuracy
    }
  }
}
