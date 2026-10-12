import type { Level } from '../types'

export const DEFAULT_ACADEMIC_LEVELS = [
  'Básico',
  'Pré-Intermediário',
  'Intermediário',
  'Avançado',
] as const

export type AcademicLevel = typeof DEFAULT_ACADEMIC_LEVELS[number] | string

export function getAcademicLevel(level?: Partial<Level> | string | null): string {
  if (!level) return 'Básico'

  if (typeof level === 'string') {
    const trimmed = level.trim()
    if (trimmed === 'lvl_1') return 'Básico'
    if (trimmed === 'lvl_2') return 'Pré-Intermediário'
    if (trimmed === 'lvl_3') return 'Intermediário'
    if (trimmed === 'lvl_4') return 'Avançado'

    const lower = trimmed.toLowerCase()
    if (lower.includes('pre') || lower.includes('pré')) return 'Pré-Intermediário'
    if (lower.includes('interm') || lower.includes('explore')) return 'Intermediário'
    if (lower.includes('avanç') || lower.includes('adv') || lower.includes('independen')) return 'Avançado'
    if (lower.includes('básic') || lower.includes('basic') || lower.includes('hello') || lower.includes('iniciante')) return 'Básico'
    
    // Se já for um dos nomes canônicos
    const matchCanonical = DEFAULT_ACADEMIC_LEVELS.find(l => l.toLowerCase() === lower)
    if (matchCanonical) return matchCanonical

    return trimmed || 'Básico'
  }

  // Objeto Level
  if (level.academic_level && level.academic_level.trim()) {
    return level.academic_level.trim()
  }

  if (level.id === 'lvl_1') return 'Básico'
  if (level.id === 'lvl_2') return 'Pré-Intermediário'
  if (level.id === 'lvl_3') return 'Intermediário'
  if (level.id === 'lvl_4') return 'Avançado'

  const name = (level.name || '').toLowerCase()
  if (name.includes('pre') || name.includes('pré')) return 'Pré-Intermediário'
  if (name.includes('interm') || name.includes('explore')) return 'Intermediário'
  if (name.includes('avanç') || name.includes('adv') || name.includes('independen')) return 'Avançado'
  if (name.includes('básic') || name.includes('basic') || name.includes('hello') || name.includes('iniciante')) return 'Básico'

  return level.name || 'Básico'
}

export function getAcademicLevelTheme(levelName?: string) {
  const norm = (levelName || '').toLowerCase()
  if (norm.includes('pre') || norm.includes('pré')) {
    return {
      bg: 'bg-sky-50 dark:bg-sky-950/60',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200/80 dark:border-sky-800',
      dot: '#0284c7',
    }
  }
  if (norm.includes('interm') || norm.includes('explore')) {
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200/80 dark:border-amber-800',
      dot: '#d97706',
    }
  }
  if (norm.includes('avanç') || norm.includes('adv') || norm.includes('independen')) {
    return {
      bg: 'bg-purple-50 dark:bg-purple-950/60',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200/80 dark:border-purple-800',
      dot: '#9333ea',
    }
  }
  return {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200/80 dark:border-emerald-800',
    dot: '#10b981',
  }
}
