import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDecks } from '../hooks/useDecks'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Toast, useToast } from '../components/ui/Toast'
import { useAuth } from '../contexts/AuthContext'
import { useEconomy } from '../contexts/EconomyContext'
import { 
  Plus, FileUp, LayoutGrid, List, 
  Sparkles, Calendar, Trophy, Volume2, 
  Flame, Target, ArrowRight, Globe, Users,
  ArrowUpDown
} from 'lucide-react'
import { StudyHeatmap } from '../components/dashboard/StudyHeatmap'
import { reviewService } from '../services/review.service'
import { DeckCard } from '../components/ui/DeckCard'
import { ankiService } from '../services/anki.service'
import { getStudyDayKey } from '../lib/sm2'
import { wordsOfTheDayService, INITIAL_WORDS_OF_THE_DAY, type WordOfTheDay } from '../data/wordsOfTheDay'
import { GLOBAL_RANKING_MOCK, CLASS_RANKING_MOCK } from '../mockData'

const AVATARS: Record<string, string> = {
  avatar_1: '🦊', avatar_2: '🐨', avatar_3: '🦁',
  avatar_4: '🐼', avatar_5: '🦉', avatar_6: '🦖',
  admin: '👑',
}

export function DashboardPage() {
  const { user } = useAuth()
  const { 
    xp: liveXP, 
    coins: liveCoins, 
    streak: liveStreak,
    level, 
    xpForNextLevel, 
    progressToNextLevel 
  } = useEconomy()

  const { decks, loading, statsMap, createDeck, deleteDeck, reload, refreshStats } = useDecks()
  const [showCreate, setShowCreate] = useState(false)
  const [deckName, setDeckName] = useState('')
  const [creating, setCreating] = useState(false)
  const [activity, setActivity] = useState<Record<string, number>>({})
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // Palavra do Dia
  const [wordOfTheDay, setWordOfTheDay] = useState<WordOfTheDay>(INITIAL_WORDS_OF_THE_DAY[0])

  useEffect(() => {
    const updateWord = () => {
      wordsOfTheDayService.getTodayWord().then(setWordOfTheDay)
    }
    updateWord()

    // Atualiza automaticamente se o dia virar enquanto a aba está aberta
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') updateWord()
    }
    window.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', updateWord)
    const interval = setInterval(updateWord, 10 * 60 * 1000)

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', updateWord)
      clearInterval(interval)
    }
  }, [])
  
  // Import Anki State
  const [importing, setImporting] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importDeckName, setImportDeckName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // View Mode & Sort Mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('uply_dashboard_view') as 'grid' | 'list') || 'grid'
  })
  const [sortBy, setSortBy] = useState<string>(() => {
    return localStorage.getItem('uply_dashboard_sort') || 'newest'
  })

  // Aba ativa no Mobile/PWA
  const [mobileTab, setMobileTab] = useState<'decks' | 'word' | 'stats'>('decks')

  // Aprendizado Semanal e Histórico
  const [weeklyLearned, setWeeklyLearned] = useState(0)
  const [totalLearned, setTotalLearned] = useState(0)

  useEffect(() => {
    async function loadLearnedStats() {
      if (!user) return
      try {
        const allReviews = await reviewService.getReviewsForDeck('all', user.id)
        const lifetimeUniqueCards = new Set(allReviews.map((r: any) => r.card_id))
        setTotalLearned(lifetimeUniqueCards.size)

        const now = new Date()
        const day = now.getDay()
        const diffToMonday = day === 0 ? -6 : 1 - day
        const monday = new Date(now)
        monday.setDate(now.getDate() + diffToMonday)
        monday.setHours(0, 0, 0, 0)
        const mondayIso = monday.toISOString()
        const mondayDayKey = getStudyDayKey(monday)

        const weeklyReviews = allReviews.filter((r: any) => {
          if (r.last_reviewed && r.last_reviewed >= mondayIso) return true
          if (r.due_date && r.due_date >= mondayDayKey) return true
          return false
        })
        const weeklyUniqueCards = new Set(weeklyReviews.map((r: any) => r.card_id))
        setWeeklyLearned(weeklyUniqueCards.size)
      } catch (e) {
        console.error('Erro ao carregar estatísticas de aprendizado:', e)
      }
    }
    loadLearnedStats()
  }, [user, decks])

  const { toast, show } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    reload()
  }, [])

  useEffect(() => {
    localStorage.setItem('uply_dashboard_view', viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem('uply_dashboard_sort', sortBy)
  }, [sortBy])

  useEffect(() => {
    if (!user?.id) return
    reviewService.getActivity(user.id).then(data => {
      setActivity(data)
    })
  }, [user?.id])

  // Cálculo dinâmico e em tempo real da colocação do usuário nos dois rankings
  const userRankings = useMemo(() => {
    // 1. Ranking Global
    const globalList = GLOBAL_RANKING_MOCK.map(item => {
      if (item.isCurrentUser) {
        return { ...item, xp: Math.max(item.xp, liveXP) }
      }
      return item
    }).sort((a, b) => b.xp - a.xp)

    const globalIndex = globalList.findIndex(item => item.isCurrentUser)
    const globalPos = globalIndex !== -1 ? globalIndex + 1 : 1
    const totalGlobal = globalList.length

    // 2. Ranking Minha Turma
    const classList = CLASS_RANKING_MOCK.map(item => {
      if (item.isCurrentUser) {
        return { ...item, xp: Math.max(item.xp, liveXP) }
      }
      return item
    }).sort((a, b) => b.xp - a.xp)

    const classIndex = classList.findIndex(item => item.isCurrentUser)
    const classPos = classIndex !== -1 ? classIndex + 1 : 1
    const totalClass = classList.length

    return {
      global: { pos: globalPos, total: totalGlobal },
      turma: { pos: classPos, total: totalClass },
    }
  }, [liveXP])

  function speakWord(word: string) {
    if ('speechSynthesis' in window) {
      setIsPlayingAudio(true)
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      utterance.onend = () => setIsPlayingAudio(false)
      utterance.onerror = () => setIsPlayingAudio(false)
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    } else {
      show('Áudio não suportado neste navegador.', 'info')
    }
  }

  async function handleCreate() {
    if (!deckName.trim()) return
    setCreating(true)
    try {
      const newDeck = await createDeck(deckName.trim())
      if (newDeck) {
        navigate(`/deck/${newDeck.id}`)
        show('Baralho criado com sucesso! ✨', 'success')
      }
    } catch (err: any) {
      show(err.message || 'Erro ao criar baralho.', 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir "${name}"? Todos os cards serão perdidos.`)) return
    await deleteDeck(id)
    show('Baralho excluído.', 'info')
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setImportDeckName(file.name.replace(/\.apkg(\.zip)?$/i, ''))
    setShowImportModal(true)
  }

  async function handleImportConfirm() {
    if (!selectedFile) return
    setImporting(true)
    try {
      const result = await ankiService.importFromApkg(
        selectedFile,
        importDeckName.trim(),
        user?.id || 'local_user_default'
      )
      if (!result.success) throw new Error(result.message)

      show(result.message || 'Importação realizada com sucesso! ✨', 'success')
      setShowImportModal(false)
      setSelectedFile(null)
      const fileInput = document.getElementById('anki-dashboard-import') as HTMLInputElement | null
      if (fileInput) fileInput.value = ''
      await reload()
      await refreshStats()
    } catch (err: any) {
      show(err.message || 'Erro na importação.', 'error')
    } finally {
      setImporting(false)
    }
  }

  const totalDue = Object.values(statsMap || {}).reduce((a, s) => a + (s?.due || 0), 0)

  const sortedDecks = [...decks].sort((a, b) => {
    const statsA = statsMap[a.id]
    const statsB = statsMap[b.id]
    switch (sortBy) {
      case 'alpha': return a.name.localeCompare(b.name)
      case 'recent': return (statsB?.lastReview || '').localeCompare(statsA?.lastReview || '')
      case 'newest': return b.created_at.localeCompare(a.created_at)
      case 'oldest': return a.created_at.localeCompare(b.created_at)
      case 'cards': return (statsB?.total || 0) - (statsA?.total || 0)
      case 'due': return (statsB?.due || 0) - (statsA?.due || 0)
      default: return 0
    }
  })

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-8 space-y-4 sm:space-y-8 flex-1 w-full max-w-full overflow-x-hidden">
      
      {/* ========================================================================== */}
      {/* 📱 VERSÃO EXCLUSIVA MOBILE / PWA (< 768px)                                */}
      {/* ========================================================================== */}
      <div className="block md:hidden space-y-3.5 w-full max-w-full">
        {/* Card de Missão Diária (Limpo, Moderno e Direto ao Ponto) */}
        <section className="card-3d p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs space-y-3">
          {/* Top: Saudação com Nome e Nível */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2">
            <h1 className="text-sm sm:text-base font-heading font-bold text-slate-800 dark:text-white truncate">
              Olá, <span className="text-blue-600 dark:text-blue-400">{user?.nickname || user?.name?.split(' ')[0] || 'Estudante'}</span>! 👋
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-heading font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900 px-2 py-0.5 rounded-md shadow-2xs shrink-0">
              🛡️ Nível {level}
            </span>
          </div>

          {/* Status da Meta Diária */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 border ${
              totalDue > 0 
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/80' 
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/80'
            }`}>
              {totalDue > 0 ? '🎯' : '🏆'}
            </div>
            
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-tight">
                {totalDue > 0 ? 'Meta de Hoje' : 'Status dos Estudos'}
              </span>
              <h2 className="text-xs sm:text-sm font-heading font-extrabold text-slate-800 dark:text-white truncate">
                {totalDue > 0 ? `${totalDue} ${totalDue === 1 ? 'card pendente' : 'cards pendentes'}` : 'Tudo em dia por aqui! ✨'}
              </h2>
            </div>
          </div>

          {/* Barra de Progresso do Nível */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span>Progresso do Nível</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Faltam {xpForNextLevel} XP ⭐
              </span>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-700/80 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-600/80">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(6, progressToNextLevel)}%` }}
              />
            </div>
          </div>

          {/* Botão de Ação Primário Direto */}
          {totalDue > 0 ? (
            <Button 
              variant="orange" 
              size="md" 
              onClick={() => navigate('/study/all')}
              className="w-full !py-2 text-xs font-heading font-bold shadow-xs active:scale-95 transition-transform"
            >
              <Flame size={14} className="fill-white shrink-0" />
              Começar Revisão Diária ({totalDue})
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMobileTab('decks')}
              className="w-full !py-1.5 text-xs font-heading font-semibold"
            >
              Ver Coleção de Baralhos 📚
            </Button>
          )}
        </section>

        {/* 3. Segmented Controls / Abas do Mobile */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileTab('decks')}
            className={`flex-1 py-2 text-xs font-heading font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 select-none active:scale-95 ${
              mobileTab === 'decks'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <LayoutGrid size={13} />
            <span>Baralhos ({decks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('word')}
            className={`flex-1 py-2 text-xs font-heading font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 select-none active:scale-95 ${
              mobileTab === 'word'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <span>📖</span>
            <span>Palavra</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('stats')}
            className={`flex-1 py-2 text-xs font-heading font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 select-none active:scale-95 ${
              mobileTab === 'stats'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <Trophy size={13} />
            <span>Desempenho</span>
          </button>
        </div>

        {/* 4. Conteúdo Dinâmico por Aba no Mobile */}
        {mobileTab === 'decks' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Coleção de Estudos
              </span>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => document.getElementById('anki-dashboard-import')?.click()} 
                  disabled={importing}
                  className="text-xs !py-1 !px-2.5"
                >
                  <FileUp size={12} /> Importar
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => setShowCreate(true)}
                  className="text-xs !py-1 !px-2.5"
                >
                  <Plus size={13} /> Novo
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card-3d h-28 animate-pulse bg-slate-100/60" />
                ))}
              </div>
            ) : decks.length === 0 ? (
              <div className="card-3d p-5 text-center space-y-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shadow-2xs border border-blue-100 dark:border-blue-900/50">
                  📚
                </div>
                <h3 className="text-sm sm:text-base font-heading font-bold text-slate-800 dark:text-white">
                  Nenhum baralho criado ainda
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Crie seu primeiro baralho de flashcards para começar seus estudos com repetição espaçada!
                </p>
                <Button variant="orange" size="sm" onClick={() => setShowCreate(true)} className="text-xs !py-1.5 !px-3">
                  <Plus size={14} /> Criar Baralho
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedDecks.map(deck => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    stats={statsMap[deck.id]}
                    viewMode="list"
                    onDelete={() => handleDelete(deck.id, deck.name)}
                    onClick={() => navigate(statsMap[deck.id]?.due > 0 ? `/study/${deck.id}` : `/deck/${deck.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {mobileTab === 'word' && (
          <div className="pt-1">
            <section className="card-3d p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                <span className="text-[11px] font-heading font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/80 dark:border-blue-800 flex items-center gap-1.5">
                  <span>📖</span> Palavra do Dia
                </span>
                <span className="text-[11px] font-medium text-slate-400 capitalize flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-heading font-bold text-slate-800 dark:text-white">
                      {wordOfTheDay.word}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-heading font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60">
                        {wordOfTheDay.type}
                      </span>
                      <span className="text-xs font-heading font-bold text-blue-600 dark:text-blue-400">
                        🇧🇷 {wordOfTheDay.translation}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakWord(wordOfTheDay.word)}
                    disabled={isPlayingAudio}
                    className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
                    title="Ouvir Pronúncia"
                  >
                    <Volume2 size={18} className={isPlayingAudio ? 'animate-pulse' : ''} />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Definição
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {wordOfTheDay.definition}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-heading font-semibold text-amber-600 dark:text-amber-400">
                    <Sparkles size={12} />
                    <span>Exemplo em Contexto</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-white italic">
                    "{wordOfTheDay.example}"
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {wordOfTheDay.exampleTranslation}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {mobileTab === 'stats' && (
          <div className="space-y-3 pt-1 w-full max-w-full">
            {/* Header da Seção de Desempenho no mesmo padrão de Baralhos */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Desempenho dos Estudos
              </span>
              <button
                type="button"
                onClick={() => navigate('/ranking')}
                className="text-xs font-heading font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 active:scale-95 transition-transform"
              >
                Ver Ranking <ArrowRight size={13} />
              </button>
            </div>

            {/* 1. Cards de Métricas Rápidas: Cards na Semana & Total Dominado */}
            <div className="grid grid-cols-2 gap-2.5 w-full min-w-0">
              <div className="card-3d p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs flex flex-col justify-between min-w-0">
                <div className="flex items-center justify-between mb-1.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/70 flex items-center justify-center shrink-0">
                    <Calendar size={16} />
                  </div>
                  <span className="text-[10px] font-heading font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded shrink-0">
                    7 dias
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-heading font-extrabold text-slate-800 dark:text-white leading-none truncate">
                    {weeklyLearned}
                  </div>
                  <div className="text-[11px] font-heading font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Cards na Semana
                  </div>
                </div>
              </div>

              <div className="card-3d p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs flex flex-col justify-between min-w-0">
                <div className="flex items-center justify-between mb-1.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/70 flex items-center justify-center shrink-0">
                    <Trophy size={16} />
                  </div>
                  <span className="text-[10px] font-heading font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded shrink-0">
                    Total
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-heading font-extrabold text-slate-800 dark:text-white leading-none truncate">
                    {totalLearned}
                  </div>
                  <div className="text-[11px] font-heading font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Total Dominado
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Colocação no Ranking (Global e Turma) no padrão visual de lista */}
            <div className="card-3d p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs space-y-2.5 w-full min-w-0">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                    <Trophy size={13} />
                  </div>
                  <h3 className="text-xs font-heading font-bold text-slate-800 dark:text-white truncate">
                    Sua Posição no Ranking
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/ranking')}
                  className="text-[11px] font-heading font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0 active:scale-95 transition-transform"
                >
                  Ver Pódio <ArrowRight size={12} />
                </button>
              </div>

              <div className="space-y-2 w-full">
                <div 
                  onClick={() => navigate('/ranking')}
                  className="p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/40 dark:bg-slate-900/50 flex items-center justify-between cursor-pointer active:scale-98 transition-transform min-w-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs shadow-2xs">
                      <Globe size={13} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-heading font-bold uppercase text-blue-600 dark:text-blue-400 block leading-tight">
                        Global
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                        {userRankings.global.total} alunos
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-heading font-bold text-xs shrink-0 shadow-2xs">
                    {userRankings.global.pos}º lugar
                  </span>
                </div>

                <div 
                  onClick={() => navigate('/ranking')}
                  className="p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-slate-900/50 flex items-center justify-between cursor-pointer active:scale-98 transition-transform min-w-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs shadow-2xs">
                      <Users size={13} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-heading font-bold uppercase text-emerald-600 dark:text-emerald-400 block leading-tight">
                        Minha Turma
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                        {userRankings.turma.total} colegas
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-heading font-bold text-xs shrink-0 shadow-2xs">
                    {userRankings.turma.pos}º lugar
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Calendário de Dias Estudados (Heatmap) Adaptado para Mobile / PWA */}
            <section className="card-3d p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs space-y-3 w-full min-w-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0 text-xs">
                    📅
                  </div>
                  <h3 className="text-xs font-heading font-bold text-slate-800 dark:text-white truncate">
                    Dias Estudados (Heatmap)
                  </h3>
                </div>
                <span className="text-[10px] font-heading font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800 shrink-0">
                  Frequência
                </span>
              </div>

              <StudyHeatmap activity={activity} />
            </section>
          </div>
        )}
      </div>

      {/* ========================================================================== */}
      {/* 💻 VERSÃO DESKTOP (>= 768px)                                              */}
      {/* ========================================================================== */}
      <div className="hidden md:block space-y-8">
        {/* -------------------------------------------------------------------------- */}
        {/* 1. HERO DE AVENTURA GAMIFICADO                                            */}
        {/* -------------------------------------------------------------------------- */}
      <section className="card-3d p-6 sm:p-7 bg-white relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Avatar e Boas-vindas */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-50 dark:bg-slate-800 border border-blue-200/80 dark:border-blue-900 flex items-center justify-center text-4xl sm:text-5xl shadow-xs shrink-0">
              {AVATARS[user?.avatar_id || 'avatar_1'] || '🦊'}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge-level text-xs">
                  🛡️ Nível {level}
                </span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {user?.role === 'admin' ? 'Comandante Admin' : 'Explorador(a)'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-slate-800 dark:text-white tracking-tight">
                Olá, <span className="text-blue-600 dark:text-blue-400 font-bold">{user?.nickname || user?.name?.split(' ')[0] || 'Estudante'}</span>! 👋
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm font-normal mt-1">
                {totalDue > 0 ? (
                  <span>
                    Você tem <span className="text-blue-600 dark:text-blue-400 font-semibold">{totalDue} cards</span> esperando por você hoje. Pronto para <span className="text-slate-700 dark:text-slate-200 font-semibold">subir de nível</span>?
                  </span>
                ) : (
                  <span>
                    Parabéns! Todas as suas revisões estão <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% em dia</span>. Arrasou! ✨
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Badges de Economia Virtual (XP, Streak, Moedas) */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Streak */}
            <div className="badge-streak font-heading text-xs px-3 py-1.5">
              <Flame size={15} className="animate-flame" />
              <span><span className="font-semibold">{liveStreak}</span> dias</span>
            </div>

            {/* XP */}
            <div className="badge-xp font-heading text-xs px-3 py-1.5">
              <Sparkles size={15} className="fill-amber-500" />
              <span><span className="font-semibold">{liveXP}</span> XP</span>
            </div>

            {/* Moedas */}
            <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-heading font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs text-xs">
              <span>🟡</span>
              <span><span className="font-semibold">{liveCoins}</span> moedas</span>
            </div>
          </div>
        </div>

        {/* Barra de Progresso Físico de Nível */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-blue-600 dark:text-blue-400 font-heading font-medium">
              Progresso do <span className="font-semibold">Nível {level}</span>
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-heading font-medium">
              Faltam <span className="font-semibold">{xpForNextLevel} XP</span> para o <span className="font-semibold">Nível {level + 1}</span> ⭐
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-md overflow-hidden p-0.5 border border-slate-200 dark:border-slate-600">
            <div 
              className="h-full bg-blue-500 rounded-sm transition-all duration-500"
              style={{ width: `${Math.max(6, progressToNextLevel)}%` }}
            />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* 2. MISSÃO DO DIA (Daily Goal Card)                                        */}
      {/* -------------------------------------------------------------------------- */}
      <section className="card-3d p-6 border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-11 h-11 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              {totalDue > 0 ? <Target size={22} /> : <Trophy size={22} />}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-heading font-semibold px-2.5 py-0.5 rounded-md">
                  {totalDue > 0 ? '🎯 Missão de Hoje' : '🏆 Missão Cumprida'}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">+10 XP</span> por acerto
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-heading font-semibold text-slate-800 dark:text-white">
                {totalDue > 0 ? (
                  <span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{totalDue} cards</span> precisam de revisão agora
                  </span>
                ) : (
                  <span>Nenhum card pendente por hoje!</span>
                )}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-normal mt-0.5">
                {totalDue > 0 ? (
                  <span>
                    Complete sua meta diária de <span className="text-slate-700 dark:text-slate-200 font-medium">repetição espaçada</span> e mantenha seu <span className="text-amber-600 dark:text-amber-400 font-medium">streak ativo</span>! 🔥
                  </span>
                ) : (
                  <span>
                    Você está invicto(a)! Aproveite para adicionar novos baralhos ou praticar vocabulário.
                  </span>
                )}
              </p>
            </div>
          </div>

          {totalDue > 0 ? (
            <Button 
              variant="orange" 
              size="md" 
              onClick={() => navigate('/study/all')}
              className="shrink-0 w-full sm:w-auto"
            >
              Começar Missão Diária 🔥
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/store')}
              className="shrink-0 w-full sm:w-auto"
            >
              Explorar Loja de Decks ✨
            </Button>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* 3. PALAVRA DO DIA & MÉTRICAS                                              */}
      {/* -------------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Palavra do Dia (Card Estilizado e Harmonioso) */}
        <section className="lg:col-span-2 card-3d p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex flex-col justify-between">
          <div>
            {/* Header da Palavra do Dia */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-heading font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-200/80 dark:border-blue-800 flex items-center gap-1.5 shadow-xs">
                  <span>📖</span> Palavra do Dia
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 capitalize flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>

            {/* Conteúdo Principal */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Coluna Esquerda: Palavra, Pronúncia, Tipo e Tradução */}
              <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700/80 pb-5 md:pb-0 md:pr-6 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl sm:text-3xl font-heading font-bold text-slate-800 dark:text-white tracking-tight">
                    {wordOfTheDay.word}
                  </h3>
                  <button
                    onClick={() => speakWord(wordOfTheDay.word)}
                    disabled={isPlayingAudio}
                    aria-label="Ouvir pronúncia"
                    title="Ouvir Pronúncia"
                    className="w-9 h-9 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
                  >
                    <Volume2 size={18} className={isPlayingAudio ? 'animate-pulse' : ''} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 inline-block">
                    {wordOfTheDay.type}
                  </span>
                  <div className="text-sm font-heading font-semibold text-blue-600 dark:text-blue-400">
                    🇧🇷 {wordOfTheDay.translation}
                  </div>
                </div>
              </div>

              {/* Coluna Direita: Definição e Exemplo em Contexto */}
              <div className="md:col-span-7 space-y-3">
                <div>
                  <h4 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Definição
                  </h4>
                  <p className="text-sm font-normal text-slate-600 dark:text-slate-300 leading-snug">
                    {wordOfTheDay.definition}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-heading font-semibold text-amber-600 dark:text-amber-400">
                    <Sparkles size={12} />
                    <span>Exemplo no Dia a Dia</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white italic">
                    "{wordOfTheDay.example}"
                  </p>
                  <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1">
                    {wordOfTheDay.exampleTranslation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cards de Métricas Rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card-3d p-5 flex flex-col justify-between">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <Calendar size={18} />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-heading font-bold text-slate-800 dark:text-white">{weeklyLearned}</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Aprendidos na <span className="font-semibold text-slate-700 dark:text-slate-300">Semana</span></div>
            </div>
          </div>

          <div className="card-3d p-5 flex flex-col justify-between">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <Trophy size={18} />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-heading font-bold text-slate-800 dark:text-white">{totalLearned}</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total <span className="font-semibold text-slate-700 dark:text-slate-300">Dominado</span></div>
            </div>
          </div>

          <div className="col-span-2 card-3d p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs font-medium opacity-90">Pronto para praticar?</div>
              <div className="text-base sm:text-lg font-heading font-semibold">Revisão Rápida Geral</div>
            </div>
            <Button 
              variant="orange" 
              size="sm" 
              onClick={() => navigate('/study/all')}
            >
              Iniciar <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* 4. MEUS BARALHOS & CAMINHO DE APRENDIZADO                                  */}
      {/* -------------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <section className="lg:col-span-2 space-y-4">
          {/* Header da Coleção & Barra de Ações Integrada */}
          <div className="space-y-3.5">
            {/* Linha 1: Título e Ações Primárias */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-800 dark:text-white tracking-tight">
                  Meus Baralhos
                </h2>
                <span className="text-xs font-heading font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <span className="font-bold text-blue-600 dark:text-blue-400">{decks.length}</span> {decks.length === 1 ? 'baralho' : 'baralhos'}
                </span>
              </div>

              {/* Botões de Ação Principais (Importar Anki e Novo Baralho) */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => document.getElementById('anki-dashboard-import')?.click()} 
                  disabled={importing}
                  className="text-xs"
                >
                  <FileUp size={14} className="text-slate-500 dark:text-slate-400" /> Importar
                </Button>
                <input type="file" id="anki-dashboard-import" accept=".apkg,.zip" className="hidden" onChange={handleFileSelect} />

                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => setShowCreate(true)}
                  className="text-xs"
                >
                  <Plus size={15} /> Novo Baralho
                </Button>
              </div>
            </div>

            {/* Linha 2: Barra de Ferramentas (Ordenação e Modo de Visualização) */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              {/* Ordenação: Rótulo + Select unificados no lado esquerdo */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                  <ArrowUpDown size={13} className="text-slate-400" />
                  Organizar por:
                </span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="h-8 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 pl-2.5 pr-8 py-1 rounded-md border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                  title="Ordenar Baralhos"
                >
                  <option value="newest">Mais Recentes</option>
                  <option value="due">Pendentes Primeiro</option>
                  <option value="alpha">Ordem Alfabética (A-Z)</option>
                  <option value="cards">Mais Cards</option>
                </select>
              </div>

              {/* Alternador de Visualização Grade / Lista com ícones e rótulos */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`h-7 px-2.5 rounded flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                    viewMode === 'grid' 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-800' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
                  }`}
                  title="Visualização em Grade"
                >
                  <LayoutGrid size={13} />
                  <span>Grade</span>
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`h-7 px-2.5 rounded flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                    viewMode === 'list' 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-800' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
                  }`}
                  title="Visualização em Lista"
                >
                  <List size={13} />
                  <span>Lista</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Baralhos Táteis */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card-3d h-48 animate-pulse bg-slate-100/60" />
              ))}
            </div>
          ) : decks.length === 0 ? (
            <div className="card-3d p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-aura-soft-blue text-aura-blue flex items-center justify-center text-3xl shadow-sm">
                📚
              </div>
              <h3 className="text-xl font-heading font-black text-aura-text-primary">
                Nenhum baralho criado ainda
              </h3>
              <p className="text-sm font-bold text-aura-text-secondary max-w-md mx-auto">
                Crie seu primeiro baralho de flashcards ou importe um arquivo .apkg do Anki para começar a memorização acelerada!
              </p>
              <Button variant="orange" size="md" onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Criar Meu Primeiro Baralho
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'space-y-4'}>
              {sortedDecks.map(deck => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  stats={statsMap[deck.id]}
                  viewMode={viewMode}
                  onDelete={() => handleDelete(deck.id, deck.name)}
                  onClick={() => navigate(statsMap[deck.id]?.due > 0 ? `/study/${deck.id}` : `/deck/${deck.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* -------------------------------------------------------------------------- */}
        {/* 5. SIDEBAR: HEATMAP & RANKING GLOBAL                                      */}
        {/* -------------------------------------------------------------------------- */}
        <aside className="space-y-6">
          {/* Dias Estudados Heatmap */}
          <div className="card-3d p-5">
            <h2 className="text-sm font-heading font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600 dark:text-blue-400" /> Constância Diária
            </h2>
            <StudyHeatmap activity={activity} />
          </div>

          {/* Box: Colocação no Ranking (Global e Minha Turma) */}
          <div className="card-3d p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center border border-amber-200 dark:border-amber-800 shadow-xs">
                  <Trophy size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-heading font-bold text-slate-800 dark:text-white leading-tight">
                    Sua Colocação
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">Liga dos Campeões</p>
                </div>
              </div>

              <button 
                onClick={() => navigate('/ranking')} 
                className="text-xs font-heading font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                title="Ver ranking completo e pódio"
              >
                Ver Ranking <ArrowRight size={13} />
              </button>
            </div>

            {/* Grid com as duas colocações: Global e Minha Turma */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Ranking Global */}
              <div 
                onClick={() => navigate('/ranking')}
                className="p-3.5 rounded-lg border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-slate-800/90 flex items-center justify-between gap-3 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Globe size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                      Ranking Global
                    </span>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Entre {userRankings.global.total} estudantes
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-heading font-extrabold text-sm shadow-2xs">
                    {userRankings.global.pos}º lugar
                  </span>
                </div>
              </div>

              {/* Ranking Minha Turma */}
              <div 
                onClick={() => navigate('/ranking')}
                className="p-3.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-slate-800/90 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Users size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                      Minha Turma
                    </span>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Entre {userRankings.turma.total} colegas
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-heading font-extrabold text-sm shadow-2xs">
                    {userRankings.turma.pos}º lugar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* MODALS                                                                     */}
      {/* -------------------------------------------------------------------------- */}
      <Modal 
        open={showCreate} 
        onClose={() => setShowCreate(false)} 
        title="✨ Novo Baralho de Estudo"
        footer={
          <div className="w-full flex items-center justify-end gap-2.5">
            <Button variant="ghost" size="md" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button variant="orange" size="md" loading={creating} onClick={handleCreate} disabled={!deckName.trim()}>
              Criar Baralho 🚀
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome do Baralho
            </label>
            <input
              placeholder="Ex: Inglês — Vocabulário Essencial"
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium text-base text-slate-900 dark:text-white outline-none transition-all"
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            />
          </div>
        </div>
      </Modal>

      <Modal 
        open={showImportModal} 
        onClose={() => !importing && setShowImportModal(false)} 
        title="📥 Importar do Anki (.apkg)"
        footer={
          <div className="w-full flex items-center justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setShowImportModal(false)} disabled={importing}>Cancelar</Button>
            <Button variant="primary" loading={importing} onClick={handleImportConfirm}>
              Começar Importação ⚡
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            O AuraUP vai converter seus cards, imagens e áudios do Anki automaticamente. Como deseja chamar este novo baralho?
          </p>
          <input
            value={importDeckName}
            onChange={e => setImportDeckName(e.target.value)}
            placeholder="Nome do baralho importado"
            disabled={importing}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium text-base text-slate-900 dark:text-white outline-none transition-all"
          />
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
