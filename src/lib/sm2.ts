import type { Rating, Review } from '../types'

/**
 * SM-2 Spaced Repetition Algorithm
 * Based on SuperMemo SM-2: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * Rating:
 *   0 = Errei (complete blackout)
 *   1 = Difícil (correct but hard, significant hesitation)
 *   2 = Fácil (perfect, easy response)
 */

interface SM2Result {
  repetitions: number
  interval: number
  ease_factor: number
  due_date: string
}

function addDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export function calculateSM2(rating: Rating, review: Partial<Review>): SM2Result {
  let { repetitions = 0, interval = 1, ease_factor = 2.5 } = review

  if (rating === 0) {
    // De novo (Again) — Reset learning
    repetitions = 0
    interval = 1
    ease_factor = Math.max(1.3, ease_factor - 0.2)
  } else {
    // Acertou
    if (repetitions === 0) {
      // First success for new card (Graduation steps)
      if (rating === 1) interval = 1 
      else if (rating === 2) interval = 1 
      else interval = 3 // Fácil -> 3 dias
    } else if (repetitions === 1) {
      if (rating === 1) interval = 2
      else if (rating === 2) interval = 4
      else interval = 7
    } else {
      // General case
      const multipliers: Record<number, number> = {
        1: 1.2,           // Hard
        2: ease_factor,   // Good
        3: ease_factor * 1.3 // Easy
      }
      interval = Math.round(interval * (multipliers[rating] || ease_factor))
    }

    repetitions += 1

    if (rating === 1) ease_factor = Math.max(1.3, ease_factor - 0.15)
    else if (rating === 3) ease_factor = Math.min(5.0, ease_factor + 0.15)
  }

  return {
    repetitions,
    interval,
    ease_factor: parseFloat(ease_factor.toFixed(4)),
    due_date: addDays(interval),
  }
}

/**
 * Returns human-readable predicted intervals for the UI buttons
 */
export function predictNextIntervals(review: Partial<Review>): Record<Rating, string> {
  const isNew = !review.repetitions || review.repetitions === 0
  
  if (isNew) {
    return {
      0: '<1min',
      1: '<6min',
      2: '<10min',
      3: '3d'
    }
  }

  // Calculate actual values for non-new cards or fallback
  const results: Record<Rating, string> = {
    0: '<1min',
    1: '',
    2: '',
    3: ''
  }

  // Calculate actual values for non-new cards or fallback
  const ratings: Rating[] = [0, 1, 2, 3]
  ratings.forEach(r => {
    if (results[r]) return // Skip if already set for new cards
    
    const res = calculateSM2(r, review)
    let label = ''
    if (res.interval < 30) label = `${res.interval}d`
    else if (res.interval < 365) label = `${Math.round(res.interval / 30)}m`
    else label = `${(res.interval / 365).toFixed(1)}a`
    results[r] = label
  })

  return results
}

export function isCardDue(due_date: string): boolean {
  const today = toLocalISOString()
  return due_date <= today
}

/**
 * Returns YYYY-MM-DD in local timezone safely.
 * Used for activity logging and heatmap keys.
 */
export function getStudyDayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function toLocalISOString(): string {
  return getStudyDayKey()
}
