import type { Level } from '../types'

export interface AcademicLevelConfig {
  key: string
  name: string
  pedagogical: string
  label: string
  prefix: string
  color: string
}

export const OFFICIAL_ACADEMIC_LEVELS: AcademicLevelConfig[] = [
  {
    key: 'hello',
    name: 'Hello',
    pedagogical: 'Básico',
    label: 'Hello (Básico)',
    prefix: 'H',
    color: '#2563EB', // Azul
  },
  {
    key: 'connections',
    name: 'Connections',
    pedagogical: 'Pré-Intermediário',
    label: 'Connections (Pré-Intermediário)',
    prefix: 'C',
    color: '#10B981', // Verde
  },
  {
    key: 'explore',
    name: 'Explore',
    pedagogical: 'Intermediário',
    label: 'Explore (Intermediário)',
    prefix: 'E',
    color: '#F59E0B', // Laranja
  },
  {
    key: 'independence',
    name: 'Independence',
    pedagogical: 'Avançado',
    label: 'Independence (Avançado)',
    prefix: 'I',
    color: '#EF4444', // Vermelha
  },
]

export const DEFAULT_ACADEMIC_LEVELS = OFFICIAL_ACADEMIC_LEVELS.map(l => l.label)

export type AcademicLevel = typeof DEFAULT_ACADEMIC_LEVELS[number] | string

const LS_ACADEMIC_LEVELS = 'uply_academic_levels'

export function getAcademicLevelConfig(levelOrName?: Partial<Level> | string | null): AcademicLevelConfig {
  if (!levelOrName) return OFFICIAL_ACADEMIC_LEVELS[0]

  const text = typeof levelOrName === 'string' 
    ? levelOrName.toLowerCase() 
    : ((levelOrName.academic_level || levelOrName.name || levelOrName.id || '').toLowerCase())

  if (text.includes('connection') || text.includes('pré') || text.includes('pre')) {
    return OFFICIAL_ACADEMIC_LEVELS[1] // Connections
  }
  if (text.includes('explore') || (text.includes('interm') && !text.includes('pre') && !text.includes('pré'))) {
    return OFFICIAL_ACADEMIC_LEVELS[2] // Explore
  }
  if (text.includes('independen') || text.includes('avanç') || text.includes('adv') || text.includes('master')) {
    return OFFICIAL_ACADEMIC_LEVELS[3] // Independence
  }
  return OFFICIAL_ACADEMIC_LEVELS[0] // Hello
}

/**
 * Gera automaticamente o próximo código sequencial de turma (ex: H001, H002, C001, E001, I001)
 * baseado na letra inicial do nível e na quantidade de turmas já existentes daquele nível.
 */
export function generateNextTurmaCode(prefix: string, existingLevels: Level[] = []): string {
  const cleanPrefix = (prefix || 'H').toUpperCase().slice(0, 1)

  // Encontra turmas que já usam esse prefixo no código
  const matchingCodes = existingLevels
    .filter(lvl => {
      if (lvl.code && lvl.code.toUpperCase().startsWith(cleanPrefix)) return true
      const cfg = getAcademicLevelConfig(lvl)
      return cfg.prefix === cleanPrefix
    })
    .map(lvl => {
      if (lvl.code && lvl.code.toUpperCase().startsWith(cleanPrefix)) {
        const numPart = parseInt(lvl.code.replace(new RegExp(`^${cleanPrefix}`, 'i'), ''), 10)
        return isNaN(numPart) ? 0 : numPart
      }
      return 0
    })

  const maxSeq = matchingCodes.length > 0 ? Math.max(0, ...matchingCodes) : 0
  const nextSeq = Math.max(maxSeq + 1, existingLevels.filter(lvl => getAcademicLevelConfig(lvl).prefix === cleanPrefix).length + 1)

  return `${cleanPrefix}${String(nextSeq).padStart(3, '0')}`
}

export function getCustomAcademicLevels(): string[] {
  try {
    const raw = localStorage.getItem(LS_ACADEMIC_LEVELS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Array.from(new Set([...DEFAULT_ACADEMIC_LEVELS, ...parsed.map((s: string) => s.trim()).filter(Boolean)]))
      }
    }
  } catch { /* ignore */ }
  return [...DEFAULT_ACADEMIC_LEVELS]
}

export function saveCustomAcademicLevels(levels: string[]): void {
  try {
    const clean = Array.from(new Set(levels.map(s => s.trim()).filter(Boolean)))
    localStorage.setItem(LS_ACADEMIC_LEVELS, JSON.stringify(clean))
  } catch { /* ignore */ }
}

export function addCustomAcademicLevel(newLevelName: string): string[] {
  const current = getCustomAcademicLevels()
  const trimmed = newLevelName.trim()
  if (!trimmed) return current

  const already = current.find(l => l.toLowerCase() === trimmed.toLowerCase())
  if (!already) {
    current.push(trimmed)
    saveCustomAcademicLevels(current)
    return current
  }
  return current
}

export function getAcademicLevel(level?: Partial<Level> | string | null): string {
  if (!level) return OFFICIAL_ACADEMIC_LEVELS[0].label

  const customLevels = getCustomAcademicLevels()

  if (typeof level === 'string') {
    const trimmed = level.trim()
    if (trimmed === 'lvl_1') return OFFICIAL_ACADEMIC_LEVELS[0].label
    if (trimmed === 'lvl_2') return OFFICIAL_ACADEMIC_LEVELS[1].label
    if (trimmed === 'lvl_3') return OFFICIAL_ACADEMIC_LEVELS[2].label
    if (trimmed === 'lvl_4') return OFFICIAL_ACADEMIC_LEVELS[3].label

    const lower = trimmed.toLowerCase()

    // Match nos níveis oficiais (canônicos)
    if (lower.includes('connection') || lower.includes('pré') || lower.includes('pre')) {
      return OFFICIAL_ACADEMIC_LEVELS[1].label
    }
    if (lower.includes('explore') || (lower.includes('interm') && !lower.includes('pre') && !lower.includes('pré'))) {
      return OFFICIAL_ACADEMIC_LEVELS[2].label
    }
    if (lower.includes('independen') || lower.includes('avanç') || lower.includes('adv') || lower.includes('master')) {
      return OFFICIAL_ACADEMIC_LEVELS[3].label
    }
    if (lower.includes('básic') || lower.includes('basic') || lower.includes('hello') || lower.includes('iniciante')) {
      return OFFICIAL_ACADEMIC_LEVELS[0].label
    }

    const matchCustom = customLevels.find(l => l.toLowerCase() === lower)
    if (matchCustom) return matchCustom

    return getAcademicLevelConfig(trimmed).label
  }

  // Objeto Level
  if (level.academic_level && level.academic_level.trim()) {
    const raw = level.academic_level.trim()
    const lower = raw.toLowerCase()
    if (lower.includes('connection') || lower.includes('pré') || lower.includes('pre')) return OFFICIAL_ACADEMIC_LEVELS[1].label
    if (lower.includes('explore') || (lower.includes('interm') && !lower.includes('pre') && !lower.includes('pré'))) return OFFICIAL_ACADEMIC_LEVELS[2].label
    if (lower.includes('independen') || lower.includes('avanç') || lower.includes('adv') || lower.includes('master')) return OFFICIAL_ACADEMIC_LEVELS[3].label
    if (lower.includes('básic') || lower.includes('basic') || lower.includes('hello') || lower.includes('iniciante')) return OFFICIAL_ACADEMIC_LEVELS[0].label
    return raw
  }

  if (level.id === 'lvl_1') return OFFICIAL_ACADEMIC_LEVELS[0].label
  if (level.id === 'lvl_2') return OFFICIAL_ACADEMIC_LEVELS[1].label
  if (level.id === 'lvl_3') return OFFICIAL_ACADEMIC_LEVELS[2].label
  if (level.id === 'lvl_4') return OFFICIAL_ACADEMIC_LEVELS[3].label

  const name = (level.name || '').toLowerCase()
  if (name.includes('connection') || name.includes('pré') || name.includes('pre')) return OFFICIAL_ACADEMIC_LEVELS[1].label
  if (name.includes('explore') || (name.includes('interm') && !name.includes('pre') && !name.includes('pré'))) return OFFICIAL_ACADEMIC_LEVELS[2].label
  if (name.includes('independen') || name.includes('avanç') || name.includes('adv') || name.includes('master')) return OFFICIAL_ACADEMIC_LEVELS[3].label
  if (name.includes('básic') || name.includes('basic') || name.includes('hello') || name.includes('iniciante')) return OFFICIAL_ACADEMIC_LEVELS[0].label

  return getAcademicLevelConfig(level).label
}

export function getAcademicLevelTheme(levelName?: string) {
  const norm = (levelName || '').toLowerCase()
  if (norm.includes('pre') || norm.includes('pré') || norm.includes('connection')) {
    // Verde (#10B981) - Connections
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200/80 dark:border-emerald-800',
      dot: '#10b981',
    }
  }
  if (norm.includes('interm') || norm.includes('explore')) {
    // Laranja (#F59E0B) - Explore
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200/80 dark:border-amber-800',
      dot: '#f59e0b',
    }
  }
  if (norm.includes('avanç') || norm.includes('adv') || norm.includes('independen')) {
    // Vermelho (#EF4444) - Independence
    return {
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200/80 dark:border-rose-800',
      dot: '#ef4444',
    }
  }
  // Azul (#2563EB) - Hello (Básico)
  return {
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200/80 dark:border-blue-800',
    dot: '#2563eb',
  }
}
