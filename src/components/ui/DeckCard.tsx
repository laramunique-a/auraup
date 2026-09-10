import { useNavigate } from 'react-router-dom'
import { Rocket, UserCheck, Compass, Sparkles, Settings, Trash2, Layers, CheckCircle2, Play } from 'lucide-react'
import { Button } from './Button'
import type { Deck, DeckStats } from '../../types'

export interface DeckCardProps {
  deck: Deck
  stats?: DeckStats
  viewMode?: 'grid' | 'list'
  onDelete?: () => void
  onClick?: () => void
}

export function getSpaceThemeLevel(levelName?: string) {
  const normalized = (levelName || '').toLowerCase()

  if (normalized.includes('iniciante') || normalized.includes('hello') || normalized.includes('nível 1') || normalized.includes('nivel 1')) {
    return {
      label: 'Nível 1 • Hello',
      icon: Rocket,
      badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
      badgeText: 'text-aura-orange',
      badgeBorder: 'border-orange-200 dark:border-orange-800',
      iconColor: '#FF9800',
    }
  }

  if (normalized.includes('intermediário') || normalized.includes('intermediario') || normalized.includes('connections') || normalized.includes('nível 2') || normalized.includes('nivel 2')) {
    return {
      label: 'Nível 2 • Connections',
      icon: UserCheck,
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      badgeText: 'text-aura-green',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800',
      iconColor: '#32C875',
    }
  }

  if (normalized.includes('avançado') || normalized.includes('avancado') || normalized.includes('discovery') || normalized.includes('nível 3') || normalized.includes('nivel 3')) {
    return {
      label: 'Nível 3 • Discovery',
      icon: Compass,
      badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
      badgeText: 'text-aura-blue',
      badgeBorder: 'border-blue-200 dark:border-blue-800',
      iconColor: '#1769D5',
    }
  }

  return {
    label: 'Aura Aventura',
    icon: Sparkles,
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-aura-blue',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    iconColor: '#1769D5',
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
        className="card-3d-interactive flex items-center justify-between p-4 sm:p-5 gap-4 cursor-pointer"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-12 h-12 rounded-2xl ${theme.badgeBg} ${theme.badgeBorder} border flex items-center justify-center shrink-0 shadow-sm`}>
            <LevelIcon size={22} color={theme.iconColor} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-heading font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
                {theme.label}
              </span>
            </div>
            <h3 className="font-heading font-extrabold text-aura-text-primary text-base sm:text-lg truncate">{deck.name}</h3>
            <div className="text-xs font-bold text-aura-text-muted flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <Layers size={14} /> <strong>{stats?.total || 0}</strong> cards
              </span>
              {hasDue ? (
                <span className="text-aura-orange font-extrabold flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md">
                  🔥 <strong>{stats?.due}</strong> para revisar
                </span>
              ) : (
                <span className="text-aura-green font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Tudo em dia
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button 
            className="btn-3d-icon w-8 h-8 !rounded-xl text-aura-text-muted hover:text-aura-blue" 
            onClick={() => navigate(`/deck/${deck.id}`)}
            title="Configurações do Baralho"
          >
            <Settings size={15} />
          </button>
          {onDelete && (
            <button 
              className="btn-3d-icon w-8 h-8 !rounded-xl text-aura-text-muted hover:text-aura-red hover:border-red-200" 
              onClick={onDelete}
              title="Excluir Baralho"
            >
              <Trash2 size={15} />
            </button>
          )}
          {hasDue ? (
            <Button 
              variant="orange" 
              size="sm" 
              onClick={() => navigate(`/study/${deck.id}`)}
            >
              <Play size={14} className="fill-white" /> Estudar
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/study/${deck.id}`)}
            >
              Praticar
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div 
      onClick={onClick}
      className="card-3d-interactive p-6 flex flex-col justify-between gap-4 min-h-[240px] cursor-pointer group relative overflow-hidden"
    >
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div className={`w-14 h-14 rounded-2xl ${theme.badgeBg} ${theme.badgeBorder} border-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-sm`}>
          <LevelIcon size={26} color={theme.iconColor} />
        </div>

        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          <button 
            className="btn-3d-icon w-8 h-8 !rounded-xl text-aura-text-muted hover:text-aura-blue" 
            onClick={() => navigate(`/deck/${deck.id}`)}
            title="Configurações do Baralho"
          >
            <Settings size={15} />
          </button>
          {onDelete && (
            <button 
              className="btn-3d-icon w-8 h-8 !rounded-xl text-aura-text-muted hover:text-aura-red hover:border-red-200" 
              onClick={onDelete}
              title="Excluir Baralho"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
      
      {/* Deck Info */}
      <div className="my-auto">
        <div className="mb-2">
          <span className={`text-[11px] font-heading font-extrabold tracking-wider uppercase px-3 py-1 rounded-full border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
            {theme.label}
          </span>
        </div>

        <h3 className="font-heading font-extrabold text-aura-text-primary text-xl mb-2 leading-snug group-hover:text-aura-blue transition-colors">
          {deck.name}
        </h3>

        <div className="flex items-center gap-3 text-xs font-bold text-aura-text-muted">
          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            <Layers size={14} className="text-aura-blue" /> <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{stats?.total || 0}</strong> cards
          </span>
          {hasDue ? (
            <span className="text-aura-orange font-extrabold flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-lg">
              🔥 <strong className="font-extrabold">{stats?.due}</strong> pendentes
            </span>
          ) : (
            <span className="text-aura-green font-extrabold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
              ✓ Em dia
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div>
        {hasDue ? (
          <Button 
            size="md" 
            variant="orange" 
            fullWidth 
            onClick={(e) => { e.stopPropagation(); navigate(`/study/${deck.id}`) }}
            className="w-full"
          >
            <Play size={16} className="fill-white" /> Estudar Agora ({stats?.due})
          </Button>
        ) : (
          <Button
            size="md"
            variant="secondary"
            fullWidth
            onClick={(e) => { e.stopPropagation(); navigate(`/study/${deck.id}`) }}
            className="w-full"
          >
            Revisar Baralho ✨
          </Button>
        )}
      </div>
    </div>
  )
}
