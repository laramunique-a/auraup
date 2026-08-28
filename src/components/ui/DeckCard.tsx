import { useNavigate } from 'react-router-dom'
import { Rocket, UserCheck, Compass, Sparkles, Settings, Trash2, Layers } from 'lucide-react'
import { Button } from './Button'
import type { Deck, DeckStats } from '../../types'

export interface DeckCardProps {
  deck: Deck
  stats?: DeckStats
  viewMode?: 'grid' | 'list'
  onDelete?: () => void
  onClick?: () => void
}

/**
 * Retorna as propriedades temáticas de exploração espacial com base no nível/categoria do baralho.
 * - Nível 1: Hello (Rocket / Vibrant Orange #ea580c)
 * - Nível 2: Connections (Astronaut / Neon Green #059669)
 * - Nível 3: Discovery (Satellite / Electric Blue #2563eb)
 * - Nível 4/Todos: Cosmos (Galaxy / Electric Blue #2563eb)
 */
export function getSpaceThemeLevel(levelName?: string) {
  const normalized = (levelName || '').toLowerCase()

  if (normalized.includes('iniciante') || normalized.includes('hello') || normalized.includes('nível 1') || normalized.includes('nivel 1')) {
    return {
      label: 'Nível 1: Hello',
      icon: Rocket,
      badgeBg: 'bg-orange-50/80 dark:bg-orange-950/40',
      badgeText: 'text-[#ea580c]',
      badgeBorder: 'border-orange-200/60 dark:border-orange-900/60',
      iconColor: '#ea580c',
    }
  }

  if (normalized.includes('intermediário') || normalized.includes('intermediario') || normalized.includes('connections') || normalized.includes('nível 2') || normalized.includes('nivel 2')) {
    return {
      label: 'Nível 2: Connections',
      icon: UserCheck,
      badgeBg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
      badgeText: 'text-[#059669]',
      badgeBorder: 'border-emerald-200/60 dark:border-emerald-900/60',
      iconColor: '#059669',
    }
  }

  if (normalized.includes('avançado') || normalized.includes('avancado') || normalized.includes('discovery') || normalized.includes('nível 3') || normalized.includes('nivel 3')) {
    return {
      label: 'Nível 3: Discovery',
      icon: Compass,
      badgeBg: 'bg-blue-50/80 dark:bg-blue-950/40',
      badgeText: 'text-[#2563eb]',
      badgeBorder: 'border-blue-200/60 dark:border-blue-900/60',
      iconColor: '#2563eb',
    }
  }

  return {
    label: 'Missão Espacial',
    icon: Sparkles,
    badgeBg: 'bg-blue-50/80 dark:bg-blue-950/40',
    badgeText: 'text-[#2563eb]',
    badgeBorder: 'border-blue-200/60 dark:border-blue-900/60',
    iconColor: '#2563eb',
  }
}

export function DeckCard({ deck, stats, viewMode = 'grid', onDelete, onClick }: DeckCardProps) {
  const navigate = useNavigate()
  const hasDue = (stats?.due || 0) > 0
  const categoryStr = (deck as any).category || (deck as any).level || deck.description || deck.name
  const theme = getSpaceThemeLevel(categoryStr)
  const LevelIcon = theme.icon

  if (viewMode === 'list') {
    return (
      <div 
        onClick={onClick}
        className="glass-panel-interactive flex items-center justify-between p-4 gap-4 cursor-pointer"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-11 h-11 rounded-2xl ${theme.badgeBg} ${theme.badgeBorder} border flex items-center justify-center shrink-0`}>
            <LevelIcon size={20} color={theme.iconColor} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border font-label ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
                {theme.label}
              </span>
            </div>
            <h3 className="font-heading text-slate-900 dark:text-slate-100 text-base truncate">{deck.name}</h3>
            <div className="text-xs font-label text-slate-500 flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1">
                <Layers size={13} /> {stats?.total || 0} cards
              </span>
              {hasDue && (
                <span className="text-[#ea580c] font-semibold flex items-center gap-1">
                  • {stats.due} revisões
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button 
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer" 
            onClick={() => navigate(`/deck/${deck.id}`)}
            title="Configurações do Baralho"
          >
            <Settings size={16} />
          </button>
          {onDelete && (
            <button 
              className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer" 
              onClick={onDelete}
              title="Excluir Baralho"
            >
              <Trash2 size={16} />
            </button>
          )}
          {hasDue ? (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => navigate(`/study/${deck.id}`)}
              className="btn-primary-glass text-xs font-label px-4 py-2"
            >
              Estudar
            </Button>
          ) : (
            <span className="text-xs font-label text-slate-400 bg-slate-100/80 px-3.5 py-1.5 rounded-full">
              Em dia ✨
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div 
      onClick={onClick}
      className="glass-panel-interactive p-6 flex flex-col justify-between gap-4 min-h-[220px] cursor-pointer group"
    >
      <div className="flex justify-between items-start">
        <div className={`w-12 h-12 rounded-2xl ${theme.badgeBg} ${theme.badgeBorder} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}>
          <LevelIcon size={22} color={theme.iconColor} />
        </div>

        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <button 
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer" 
            onClick={() => navigate(`/deck/${deck.id}`)}
            title="Configurações do Baralho"
          >
            <Settings size={16} />
          </button>
          {onDelete && (
            <button 
              className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer" 
              onClick={onDelete}
              title="Excluir Baralho"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div>
        <div className="mb-2">
          <span className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border font-label ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
            {theme.label}
          </span>
        </div>

        <h3 className="font-heading text-slate-900 dark:text-slate-100 text-xl mb-1.5 leading-snug group-hover:text-blue-600 transition-colors">
          {deck.name}
        </h3>

        <div className="flex items-center gap-3 text-xs font-label text-slate-500">
          <span className="flex items-center gap-1">
            <Layers size={13} /> {stats?.total || 0} cards
          </span>
          {hasDue && (
            <span className="text-[#ea580c] font-semibold flex items-center gap-1">
              • {stats.due} revisões pendentes
            </span>
          )}
        </div>
      </div>

      {hasDue ? (
        <Button 
          size="sm" 
          variant="primary" 
          fullWidth 
          onClick={(e) => { e.stopPropagation(); navigate(`/study/${deck.id}`) }}
          className="btn-primary-glass font-label w-full py-3"
        >
          Iniciar Sessão <Rocket size={15} className="ml-1" />
        </Button>
      ) : (
        <div className="bg-slate-100/80 p-3 rounded-2xl text-center text-xs font-label text-slate-400 uppercase tracking-wider">
          Tudo em dia ✨
        </div>
      )}
    </div>
  )
}
