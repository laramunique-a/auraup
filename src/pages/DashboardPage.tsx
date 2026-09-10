import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/storage'
import { useDecks } from '../hooks/useDecks'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Toast, useToast } from '../components/ui/Toast'
import { useAuth } from '../contexts/AuthContext'
import { useEconomy } from '../contexts/EconomyContext'
import { 
  Plus, FileUp, LayoutGrid, List, 
  Sparkles, Calendar, Trophy, Volume2, 
  Flame, Target, ArrowRight
} from 'lucide-react'
import { StudyHeatmap } from '../components/dashboard/StudyHeatmap'
import { reviewService } from '../services/review.service'
import { DeckCard } from '../components/ui/DeckCard'
import { ankiService } from '../services/anki.service'
import { getStudyDayKey } from '../lib/sm2'
import { wordsOfTheDayService, INITIAL_WORDS_OF_THE_DAY, type WordOfTheDay } from '../data/wordsOfTheDay'

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
  const [ranking, setRanking] = useState<any[]>([])
  const [rankingLoading, setRankingLoading] = useState(true)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // Palavra do Dia
  const [wordOfTheDay, setWordOfTheDay] = useState<WordOfTheDay>(INITIAL_WORDS_OF_THE_DAY[0])

  useEffect(() => {
    wordsOfTheDayService.getTodayWord().then(setWordOfTheDay)
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
    
    if (supabase) {
      supabase
        .from('profiles')
        .select('id, name, nickname, xp, avatar_id')
        .order('xp', { ascending: false })
        .limit(5)
        .then(({ data }: any) => {
          setRanking(data || [])
          setRankingLoading(false)
        }, () => {
          setRankingLoading(false)
        })
    } else {
      setRankingLoading(false)
    }
  }, [user?.id])

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-screen space-y-8">
      
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
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {user?.role === 'admin' ? 'Comandante Admin' : 'Explorador(a)'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
                Olá, <span className="text-blue-600 dark:text-blue-400">{user?.nickname || user?.name?.split(' ')[0] || 'Estudante'}</span>! 👋
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium mt-1">
                {totalDue > 0 ? (
                  <span>
                    Você tem <strong className="text-blue-600 dark:text-blue-400 font-extrabold">{totalDue} cards</strong> esperando por você hoje. Pronto para <strong className="text-slate-800 dark:text-white font-extrabold">subir de nível</strong>?
                  </span>
                ) : (
                  <span>
                    Parabéns! Todas as suas revisões estão <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">100% em dia</strong>. Arrasou! ✨
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Badges de Economia Virtual (XP, Streak, Moedas) */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Streak */}
            <div className="badge-streak font-heading text-sm px-3.5 py-1.5">
              <Flame size={17} className="animate-flame" />
              <span><strong>{liveStreak}</strong> dias</span>
            </div>

            {/* XP */}
            <div className="badge-xp font-heading text-sm px-3.5 py-1.5">
              <Sparkles size={17} className="fill-amber-500" />
              <span><strong>{liveXP}</strong> XP</span>
            </div>

            {/* Moedas */}
            <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-heading font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs text-sm">
              <span>🟡</span>
              <span><strong>{liveCoins}</strong> moedas</span>
            </div>
          </div>
        </div>

        {/* Barra de Progresso Físico de Nível */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="text-blue-600 dark:text-blue-400 font-heading">
              Progresso do <strong>Nível {level}</strong>
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-heading">
              Faltam <strong className="font-extrabold">{xpForNextLevel} XP</strong> para o <strong className="font-extrabold">Nível {level + 1}</strong> ⭐
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-600">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
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
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              {totalDue > 0 ? <Target size={24} /> : <Trophy size={24} />}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-heading font-bold px-2.5 py-0.5 rounded-full">
                  {totalDue > 0 ? '🎯 Missão de Hoje' : '🏆 Missão Cumprida'}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <strong>+10 XP</strong> por acerto
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white">
                {totalDue > 0 ? (
                  <span>
                    <strong className="text-amber-600 dark:text-amber-400">{totalDue} cards</strong> precisam de revisão agora
                  </span>
                ) : (
                  <span>Nenhum card pendente por hoje!</span>
                )}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium mt-0.5">
                {totalDue > 0 ? (
                  <span>
                    Complete sua meta diária de <strong className="text-slate-800 dark:text-white">repetição espaçada</strong> e mantenha seu <strong className="text-amber-600 dark:text-amber-400">streak ativo</strong>! 🔥
                  </span>
                ) : (
                  <span>
                    Você está invicto(a)! Aproveite para adicionar <strong className="text-slate-800 dark:text-white">novos baralhos</strong> ou praticar vocabulário.
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
                <span className="text-xs font-heading font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200/80 dark:border-blue-800 flex items-center gap-1.5 shadow-xs">
                  <span>📖</span> Palavra do Dia
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 capitalize flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>

            {/* Conteúdo Principal */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Coluna Esquerda: Palavra, Pronúncia, Tipo e Tradução */}
              <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700/80 pb-5 md:pb-0 md:pr-6 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {wordOfTheDay.word}
                  </h3>
                  <button
                    onClick={() => speakWord(wordOfTheDay.word)}
                    disabled={isPlayingAudio}
                    aria-label="Ouvir pronúncia"
                    title="Ouvir Pronúncia"
                    className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
                  >
                    <Volume2 size={19} className={isPlayingAudio ? 'animate-pulse' : ''} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 inline-block">
                    {wordOfTheDay.type}
                  </span>
                  <div className="text-sm font-heading font-bold text-blue-600 dark:text-blue-400">
                    🇧🇷 {wordOfTheDay.translation}
                  </div>
                </div>
              </div>

              {/* Coluna Direita: Definição e Exemplo em Contexto */}
              <div className="md:col-span-7 space-y-3">
                <div>
                  <h4 className="text-[11px] font-heading font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Definição
                  </h4>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                    {wordOfTheDay.definition}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-heading font-bold text-amber-600 dark:text-amber-400">
                    <Sparkles size={12} />
                    <span>Exemplo no Dia a Dia</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white italic">
                    "{wordOfTheDay.example}"
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
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
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <Calendar size={20} />
            </div>
            <div>
              <div className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">{weeklyLearned}</div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Aprendidos na <strong className="text-slate-700 dark:text-slate-300">Semana</strong></div>
            </div>
          </div>

          <div className="card-3d p-5 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">{totalLearned}</div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total <strong className="text-slate-700 dark:text-slate-300">Dominado</strong></div>
            </div>
          </div>

          <div className="col-span-2 card-3d p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs font-bold opacity-90">Pronto para praticar?</div>
              <div className="text-lg font-heading font-bold">Revisão Rápida Geral</div>
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
          {/* Header da Coleção (Estruturado em 2 níveis limpos) */}
          <div className="space-y-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            {/* Nível 1: Título e Ações Primárias */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Meus Baralhos
                </h2>
                <span className="text-xs font-heading font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 shadow-xs">
                  <strong>{decks.length}</strong> {decks.length === 1 ? 'baralho' : 'baralhos'}
                </span>
              </div>

              {/* Botões de Ação Principais (Importar e Novo Baralho) */}
              <div className="flex items-center gap-2.5">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => document.getElementById('anki-dashboard-import')?.click()} 
                  disabled={importing}
                >
                  <FileUp size={15} /> Importar
                </Button>
                <input type="file" id="anki-dashboard-import" accept=".apkg,.zip" className="hidden" onChange={handleFileSelect} />

                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => setShowCreate(true)}
                >
                  <Plus size={16} /> Novo Baralho
                </Button>
              </div>
            </div>

            {/* Nível 2: Barra de Filtros e Visualização */}
            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                Organizar por:
              </span>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="h-9 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 px-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs"
                  title="Ordenar Baralhos"
                >
                  <option value="newest">Mais Recentes</option>
                  <option value="due">Pendentes Primeiro</option>
                  <option value="alpha">A-Z</option>
                  <option value="cards">Mais Cards</option>
                </select>

                <div className="h-9 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex items-center border border-slate-200 dark:border-slate-700 shadow-xs">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    title="Modo Grade"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    title="Modo Lista"
                  >
                    <List size={15} />
                  </button>
                </div>
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

          {/* Mini Ranking dos Campeões */}
          <div className="card-3d p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-heading font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" /> Liga dos Campeões
              </h2>
              <button 
                onClick={() => navigate('/ranking')} 
                className="text-xs font-heading font-bold text-blue-600 dark:text-blue-400 hover:underline border-none bg-transparent cursor-pointer"
              >
                Ver Ranking →
              </button>
            </div>
            
            <div className="space-y-2.5">
              {rankingLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />)
              ) : (
                ranking.map((u, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <span className={`w-5 text-center font-heading font-extrabold text-xs ${
                      idx === 0 ? 'text-amber-500' : 
                      idx === 1 ? 'text-slate-400' : 
                      idx === 2 ? 'text-amber-700' : 'text-slate-400'
                    }`}>
                      {idx + 1}º
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm shadow-xs">
                      {AVATARS[u.avatar_id] || '👤'}
                    </div>
                    <span className="flex-1 font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {u.nickname || u.name}
                    </span>
                    <span className="font-heading font-bold text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200/60 dark:border-blue-800">
                      <strong>{u.xp}</strong> XP
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* MODALS                                                                     */}
      {/* -------------------------------------------------------------------------- */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="✨ Novo Baralho de Estudo">
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome do Baralho
            </label>
            <input
              placeholder="Ex: Inglês — Vocabulário Essencial"
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium text-sm text-slate-900 dark:text-white outline-none transition-all"
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            />
          </div>
          <div className="flex gap-2.5 justify-end pt-2">
            <Button variant="ghost" size="md" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button variant="orange" size="md" loading={creating} onClick={handleCreate} disabled={!deckName.trim()}>
              Criar Baralho 🚀
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showImportModal} onClose={() => !importing && setShowImportModal(false)} title="📥 Importar do Anki (.apkg)">
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            O AuraUP vai converter seus cards, imagens e áudios do Anki automaticamente. Como deseja chamar este novo baralho?
          </p>
          <input
            value={importDeckName}
            onChange={e => setImportDeckName(e.target.value)}
            placeholder="Nome do baralho importado"
            disabled={importing}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium text-sm text-slate-900 dark:text-white outline-none transition-all"
          />
          <div className="flex gap-2.5 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowImportModal(false)} disabled={importing}>Cancelar</Button>
            <Button variant="primary" loading={importing} onClick={handleImportConfirm}>
              Começar Importação ⚡
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
