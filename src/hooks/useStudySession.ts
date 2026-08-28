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
        
        let allCards: Card[] = []
        let reviews: any[] = []
        let dueIds: string[] = []

        if (isGlobal) {
          allCards = await cardService.getAllUserCards(user.id)
          const cardIds = allCards.map(c => c.id)
          reviews = await reviewService.getReviewsForDeck('all', user.id)
          dueIds = await reviewService.getGlobalDueCardIds(user.id, cardIds)
        } else {
          allCards = await cardService.getCards(deckId)
          const cardIds = allCards.map(c => c.id)
          reviews = await reviewService.getReviewsForDeck(deckId, user.id)
          dueIds = await reviewService.getDueCardIds(deckId, user.id, cardIds)
        }

        const reviewMap = new Map(reviews.map(r => [r.card_id, r]))

        const dueCards: StudyCard[] = allCards
          .filter(c => dueIds.includes(c.id))
          .map(c => ({
            ...c,
            review: reviewMap.get(c.id)
          }))
        
        // Initial queue
        let finalQueue: StudyCard[] = []
        
        if (isGlobal) {
          const grouped = dueCards.reduce((acc, card) => {
            if (!acc[card.deck_id]) acc[card.deck_id] = []
            acc[card.deck_id].push(card)
            return acc
          }, {} as Record<string, StudyCard[]>)
          
          Object.values(grouped).forEach(deckCards => {
            finalQueue.push(...[...deckCards].sort(() => Math.random() - 0.5))
          })
        } else {
          finalQueue = [...dueCards].sort(() => Math.random() - 0.5)
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

    const clickCount = (sessionClicks[current.id] || 0) + 1
    const remaining = queue.slice(1)

    const isNew = !current.review || current.review.repetitions === 0
    const shouldGraduate = rating === 3 || (rating === 2 && (!isNew || clickCount >= 2))

    if (shouldGraduate) {
      await reviewService.saveReview(user.id, current.id, rating)
      
      setGraduatedIds(prev => {
        const next = new Set(prev)
        next.add(current.id)
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
      newQueue.splice(insertPos, 0, current)
      
      setSessionClicks(prev => ({ ...prev, [current.id]: clickCount }))
      setQueue(newQueue)
      
      const sameCard = newQueue[0].id === current.id
      if (sameCard) {
        setCurrent(null)
        setTimeout(() => setCurrent(current), 10)
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
