import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/storage'
import { useDecks } from '../hooks/useDecks'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { Toast, useToast } from '../components/ui/Toast'
import { useAuth } from '../contexts/AuthContext'
import { useEconomy } from '../contexts/EconomyContext'
import { deckService } from '../services/deck.service'
import { cardService } from '../services/card.service'
import { 
  Plus, FileUp, LayoutGrid, List, 
  ArrowUpDown, Sparkles, Clock, Calendar, Coins, 
  Trophy, Volume2, Zap
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
  const { xp: liveXP, coins: liveCoins, level } = useEconomy()
  const { decks, loading, statsMap, createDeck, deleteDeck, reload } = useDecks()
  const [showCreate, setShowCreate] = useState(false)
  const [deckName, setDeckName] = useState('')
  const [creating, setCreating] = useState(false)
  const [activity, setActivity] = useState<Record<string, number>>({})
  const [ranking, setRanking] = useState<any[]>([])
  const [rankingLoading, setRankingLoading] = useState(true)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // Selecionar Palavra do Dia baseada na data local (troca a meia-noite 00:00)
  const [wordOfTheDay, setWordOfTheDay] = useState<WordOfTheDay>(INITIAL_WORDS_OF_THE_DAY[0])

  useEffect(() => {
    wordsOfTheDayService.getTodayWord().then(setWordOfTheDay)
  }, [])
  
  // Import State
  const [importing, setImporting] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // View Mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('uply_dashboard_view') as 'grid' | 'list') || 'grid'
  })

  // Sort Mode
  const [sortBy, setSortBy] = useState<string>(() => {
    return localStorage.getItem('uply_dashboard_sort') || 'newest'
  })
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  // Aprendizado Semanal e Histórico Único
  const [weeklyLearned, setWeeklyLearned] = useState(0)
  const [totalLearned, setTotalLearned] = useState(0)

  useEffect(() => {
    async function loadLearnedStats() {
      if (!user) return
      try {
        const allReviews = await reviewService.getReviewsForDeck('all', user.id)
        
        // Total histórico de cards únicos aprendidos (apenas 1 por card_id)
        const lifetimeUniqueCards = new Set(allReviews.map((r: any) => r.card_id))
        setTotalLearned(lifetimeUniqueCards.size)

        // Inicio da semana atual (Segunda-feira 00:00:00)
        const now = new Date()
        const day = now.getDay()
        const diffToMonday = day === 0 ? -6 : 1 - day
        const monday = new Date(now)
        monday.setDate(now.getDate() + diffToMonday)
        monday.setHours(0, 0, 0, 0)
        const mondayIso = monday.toISOString()
        const mondayDayKey = getStudyDayKey(monday)

        // Cards aprendidos/estudados nesta semana (Segunda a Domingo)
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
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
    
    // Fetch Mini Ranking
    if (supabase) {
      supabase
        .from('profiles')
        .select('id, name, nickname, xp, avatar_id')
        .eq('role', 'user')
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

  const [importDeckName, setImportDeckName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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

  function handleQuickChallenge() {
    alert('⚡ Desafio Rápido de 1 Minuto iniciando em breve! O minijogo de recompensa bônus está em desenvolvimento.')
  }

  async function handleCreate() {
    try {
      const newDeck = await createDeck(deckName.trim())
      if (newDeck) {
        navigate(`/deck/${newDeck.id}`)
        show('Baralho criado com sucesso!', 'success')
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
    const baseName = file.name.replace(/\.apkg(\.zip)?$/i, '')
    setImportDeckName(baseName)
    setShowImportModal(true)
    e.target.value = ''
  }

  async function handleImportConfirm() {
    if (!selectedFile || !importDeckName.trim()) return
    setImporting(true)
    show('Processando importação...', 'info')
    try {
      const result = await ankiService.importFromApkg(selectedFile, importDeckName.trim())
      if (result.cards && result.cards.length > 0) {
        const userId = user?.id || 'local-user'
        const newDeck = await deckService.createDeck(userId, result.deck_name || importDeckName.trim())
        for (const cardData of result.cards) {
          await cardService.createCard(newDeck.id, cardData.front || '', cardData.back || '', {
            front_image: cardData.front_image,
            back_image: cardData.back_image,
            front_lang: cardData.front_lang || 'en-US',
            back_lang: cardData.back_lang || 'pt-BR',
            front_audio: cardData.front_audio !== false,
            back_audio: cardData.back_audio !== false,
          })
        }
      }
      show(result.message || 'Importação realizada com sucesso!', 'success')
      setShowImportModal(false)
      setSelectedFile(null)
      await reload()
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

  const sortOptions = [
    { value: 'newest', label: 'Mais Recentes' },
    { value: 'due', label: 'Pendentes Primeiro' },
    { value: 'alpha', label: 'A-Z' },
    { value: 'cards', label: 'Tamanho' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 min-h-screen">
      {/* Welcome & User Progress Bar */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3 flex-wrap">
            Olá, <span className="text-[#2563eb]">{user?.nickname || user?.name?.split(' ')[0] || 'estudante'}</span>! 👋
            
            {/* Gamification Badges */}
            <div className="flex items-center gap-2 font-label">
              <span className="badge-gold">
                <Sparkles size={14} className="fill-amber-500 text-amber-500" />
                {liveXP} XP
              </span>
              <span className="badge-blue">
                <Coins size={14} />
                {liveCoins}
              </span>
              <span className="badge-green">
                {user?.role === 'admin' ? '👑 Admin' : `Nível ${level}`}
              </span>
            </div>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-label text-xs sm:text-sm mt-1.5">
            {totalDue > 0 
              ? `Você tem ${totalDue} cards esperando por você hoje.` 
              : 'Você está em dia com seus estudos! Arrasou. ✨'}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto font-label">
          <Button variant="secondary" size="md" onClick={() => document.getElementById('anki-dashboard-import')?.click()} disabled={importing} className="btn-secondary-glass rounded-xl">
            <FileUp size={16} /> <span className="hidden sm:inline-block">Importar</span>
          </Button>
          <Button variant="primary" size="md" onClick={() => setShowCreate(true)} className="btn-primary-glass rounded-xl">
            <Plus size={16} /> Novo Baralho
          </Button>
          <input type="file" id="anki-dashboard-import" accept=".apkg,.zip" className="hidden" onChange={handleFileSelect} />
        </div>
      </header>

      {/* Quick Challenge Banner (Minimalist Glassmorphism) */}
      <div className="mb-6">
        <div 
          onClick={handleQuickChallenge} 
          className="glass-panel-interactive p-6 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer bg-gradient-to-r from-blue-50/80 via-white/80 to-indigo-50/80 border border-blue-200/60"
        >
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-glow-primary">
              <Zap size={24} className="fill-white" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 font-label">
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ⚡ DESAFIO EXPRESSO
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  +50 XP • +10 MOEDAS
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-heading text-slate-900">
                Desafio Rápido de 1 Minuto
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-label mt-0.5">
                Responda o máximo de cards em 60s e conquiste seus bônus diários.
              </p>
            </div>
          </div>

          <Button variant="primary" size="md" className="btn-primary-glass shrink-0 text-xs font-label">
            Iniciar Desafio ✨
          </Button>
        </div>
      </div>

      {/* Word of the Day Section (Thesaurus Style) */}
      <div className="mb-8 animate-pop">
        <Card variant="base" className="border-2 border-primary-300 dark:border-primary-800 bg-gradient-to-br from-primary-50/60 via-white to-sky-50/40 dark:from-slate-800 dark:to-slate-850 p-6">
          <div className="flex items-center justify-between border-b border-primary-200 dark:border-slate-700 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-primary-500 text-white flex items-center justify-center font-black text-xs">
                📖
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  PALAVRA DO DIA
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Word & Pronunciation */}
            <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 pb-4 md:pb-0 md:pr-6">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {wordOfTheDay.word}
                </h3>
                <button
                  onClick={() => speakWord(wordOfTheDay.word)}
                  disabled={isPlayingAudio}
                  aria-label="Ouvir pronúncia"
                  className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Volume2 size={20} className={isPlayingAudio ? 'animate-pulse' : ''} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                  {wordOfTheDay.type}
                </span>
              </div>

              <div className="text-base font-extrabold text-primary-600 dark:text-primary-400">
                🇧🇷 {wordOfTheDay.translation}
              </div>
            </div>

            {/* Definition & Example */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                  Definição
                </h4>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {wordOfTheDay.definition}
                </p>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">
                  Exemplo de Uso
                </h4>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">
                  "{wordOfTheDay.example}"
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {wordOfTheDay.exampleTranslation}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard 
          icon={<Clock className="text-amber-500" size={28} />} 
          label="Para Revisar" 
          value={totalDue} 
          highlight={totalDue > 0}
          onClick={() => totalDue > 0 && navigate('/study/all')}
        />
        <StatCard 
          icon={<Calendar className="text-sky-500" size={28} />} 
          label="Aprendido na Semana" 
          value={weeklyLearned} 
        />
        <StatCard 
          icon={<Trophy className="text-emerald-500" size={28} />} 
          label="Total Aprendido" 
          value={totalLearned} 
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Deck List Section (2 cols) */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Meus Baralhos
              </h2>
              <span className="text-xs font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-950 px-3 py-1 rounded-xl border border-primary-300 dark:border-primary-800">
                {decks.length} ativos
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setViewMode('grid')}
                  aria-label="Modo Grade"
                  className={`p-1.5 rounded-lg border-none flex cursor-pointer transition-all ${
                    viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  aria-label="Modo Lista"
                  className={`p-1.5 rounded-lg border-none flex cursor-pointer transition-all ${
                    viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>

              <div className="relative" ref={sortRef}>
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-2 shadow-3d-slate cursor-pointer"
                >
                  <ArrowUpDown size={14} /> {sortOptions.find(o => o.value === sortBy)?.label}
                </button>
                {isSortOpen && (
                  <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-10 min-w-[180px] p-1.5">
                    {sortOptions.map(opt => (
                      <div 
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setIsSortOpen(false) }}
                        className={`p-2.5 rounded-xl cursor-pointer text-xs font-bold transition-colors ${
                          sortBy === opt.value ? 'bg-primary-50 text-primary-600 dark:bg-slate-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton h-44 rounded-3xl" />
              ))}
            </div>
          ) : sortedDecks.length === 0 ? (
            <EmptyState
              icon="✨"
              title="Comece sua jornada"
              description="Crie seu primeiro baralho de estudos e veja seu progresso decolar!"
              action={<Button variant="primary" size="md" onClick={() => setShowCreate(true)}><Plus size={20} /> Criar Baralho</Button>}
            />
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                : 'flex flex-col gap-3'
            }>
              {sortedDecks.map((deck) => (
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

        {/* Sidebar Section (1 col) */}
        <aside className="space-y-6">
          {/* Dica de Estudo */}
          <Card variant="base" className="bg-primary-500 text-white border-primary-600 shadow-3d-primary p-5">
            <div className="flex items-center gap-2 mb-2 font-black text-sm uppercase tracking-wider">
              <Sparkles size={18} /> Dica de Aprendizado
            </div>
            <p className="text-xs font-bold leading-relaxed opacity-95">
              Estudar pequenos blocos todos os dias é 10x mais eficiente do que estudar horas em um único dia. Mantenha sua ofensiva!
            </p>
          </Card>

          {/* Dias Estudados Heatmap */}
          <Card variant="base" className="p-5">
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-primary-500" /> Dias Estudados
            </h2>
            <StudyHeatmap activity={activity} />
          </Card>

          {/* Mini Ranking Sidebar */}
          <Card variant="base" className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" /> Top 5 Global
              </h2>
              <button 
                onClick={() => navigate('/ranking')} 
                className="text-xs font-extrabold text-primary-500 hover:underline border-none bg-transparent cursor-pointer"
              >
                Ver Todos
              </button>
            </div>
            
            <div className="space-y-3">
              {rankingLoading ? (
                [1, 2, 3].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)
              ) : (
                ranking.map((u, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className={`w-5 text-center font-black text-xs ${idx === 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {idx + 1}º
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm border border-slate-200 dark:border-slate-600">
                      {AVATARS[u.avatar_id] || '👤'}
                    </div>
                    <span className="flex-1 font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {u.nickname || u.name}
                    </span>
                    <span className="font-black text-xs text-slate-900 dark:text-slate-100">
                      {u.xp} XP
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </aside>
      </div>

      {/* Modals */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="✨ Novo Baralho">
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">
              Nome do Baralho
            </label>
            <input
              placeholder="Ex: Inglês — Verbos Irregulares"
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
              autoFocus
              className="input-gamified"
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" size="md" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button variant="primary" size="md" loading={creating} onClick={handleCreate} disabled={!deckName.trim()}>
              Criar Agora
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showImportModal} onClose={() => !importing && setShowImportModal(false)} title="📥 Importar do Anki">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            O Aura English App vai converter seus cards do Anki automaticamente. Como deseja chamar este novo baralho?
          </p>
          <input
            value={importDeckName}
            onChange={e => setImportDeckName(e.target.value)}
            placeholder="Nome do baralho importado"
            disabled={importing}
            className="input-gamified"
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowImportModal(false)} disabled={importing}>Cancelar</Button>
            <Button variant="primary" loading={importing} onClick={handleImportConfirm}>
              Começar Importação
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

function StatCard({ icon, label, value, highlight, onClick }: any) {
  return (
    <Card 
      onClick={onClick}
      variant={highlight ? 'active' : 'interactive'}
      className="flex items-center gap-4 p-5"
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
        {icon}
      </div>
      <div>
        <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{value}</div>
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
      </div>
    </Card>
  )
}
