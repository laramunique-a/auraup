import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStudySession } from '../hooks/useStudySession'
import { useDecks } from '../hooks/useDecks'
import { useAuth } from '../contexts/AuthContext'
import { useEconomy } from '../contexts/EconomyContext'
import { profileService } from '../services/profile.service'
import { FlashCard } from '../components/study/FlashCard'
import { Button } from '../components/ui/Button'
import { ArrowLeft, Home, Clock, Target, BookOpen } from 'lucide-react'
import type { Rating } from '../types'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function playRewardSound(rating: Rating) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    if (rating === 3) {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.08) // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.16) // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      osc.start()
      osc.stop(ctx.currentTime + 0.35)
    } else if (rating === 2) {
      osc.frequency.setValueAtTime(440, ctx.currentTime) // A4
      osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.12) // D5
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    } else if (rating === 1) {
      osc.frequency.setValueAtTime(392, ctx.currentTime) // G4
      gain.gain.setValueAtTime(0.10, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.20)
      osc.start()
      osc.stop(ctx.currentTime + 0.20)
    }
  } catch {
    // Ignore audio errors
  }
}

export function StudyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addReward: addEconomyReward, recordActivity } = useEconomy()
  const { current, loading, sessionDone, reviewed, total, submitRating, sessionStats } = useStudySession(id!)
  const { refreshStats, recordReviewLocally } = useDecks()

  const [sessionXP, setSessionXP] = useState(0)
  const [sessionCoins, setSessionCoins] = useState(0)
  const [floatingXP, setFloatingXP] = useState<{ text: string, id: number } | null>(null)

  const handleRating = async (rating: Rating) => {
    playRewardSound(rating)

    if (current && user) {
      recordReviewLocally(current.deck_id, rating)
      let xp = 0; let coins = 0
      if (rating === 3) { xp = 10; coins = 2 }
      else if (rating === 2) { xp = 5; coins = 1 }
      else if (rating === 1) { xp = 2 }
      
      if (xp > 0 || coins > 0) {
        setSessionXP(prev => prev + xp)
        setSessionCoins(prev => prev + coins)
        addEconomyReward(xp, coins)
        profileService.addReward(user.id, xp, coins)
        
        // Efeito comemorativo de XP flutuante
        setFloatingXP({ text: `+${xp} XP ⭐`, id: Date.now() })
        setTimeout(() => setFloatingXP(null), 900)
      }
    }
    await submitRating(rating)
  }

  useEffect(() => {
    if (sessionDone && user) {
      refreshStats()
      recordActivity()
      profileService.updateStreak(user.id)
    }
  }, [sessionDone, refreshStats, user, recordActivity])

  useEffect(() => {
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel() }
  }, [])

  // Cálculo de progresso tátil estilo Duolingo (garante feedback visual imediato a cada card)
  const progressPercent = total > 0 
    ? total <= 50
      ? Math.min(100, Math.max(reviewed > 0 ? (reviewed / total) * 100 : 4, 4))
      : Math.min(100, Math.max(4, (Math.log10(reviewed + 1) / Math.log10(total + 1)) * 100 * 1.35))
    : 0

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-aura-bg">
      <div className="text-center card-3d p-8 max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-aura-blue/30 border-t-aura-blue rounded-full animate-spin" />
        <p className="font-heading font-black text-aura-text-primary text-lg">Preparando seus cards... ✨</p>
      </div>
    </div>
  )

  // --------------------------------------------------------------------------
  // TELA DE CELEBRAÇÃO ÉPICA DE CONCLUSÃO
  // --------------------------------------------------------------------------
  if (sessionDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aura-bg p-4 sm:p-6 relative overflow-hidden">
        {/* Confetes / Partículas decorativas no fundo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-1/4 text-3xl animate-bounce">🎉</div>
          <div className="absolute top-20 right-1/4 text-2xl animate-pulse">⭐</div>
          <div className="absolute top-1/3 left-10 text-3xl animate-float-smooth">✨</div>
          <div className="absolute bottom-20 right-10 text-4xl animate-bounce">🔥</div>
          <div className="absolute top-12 right-12 text-2xl">🎊</div>
        </div>

        <div className="card-3d p-8 sm:p-10 max-w-lg w-full text-center relative z-10 animate-pop-in space-y-6">
          {/* Troféu 3D comemorativo */}
          <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-amber-400 to-amber-200 rounded-3xl flex items-center justify-center text-5xl shadow-3d-orange animate-float-smooth border-2 border-white">
            🏆
          </div>
          
          <div>
            <span className="badge-xp text-xs mb-2 inline-block">
              SESSÃO FINALIZADA!
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-aura-text-primary tracking-tight">
              Mandou Bem Demais! 🎉
            </h2>
            <p className="text-aura-text-secondary text-sm font-bold mt-1">
              Você revisou com sucesso <strong className="text-aura-blue font-extrabold">{reviewed} cards</strong> nesta rodada.
            </p>
          </div>

          {/* Recompensas XP & Moedas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-3d p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-center">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-xl mb-1 shadow-sm">
                ⭐
              </div>
              <div className="text-2xl font-heading font-extrabold text-aura-orange">+{sessionXP} XP</div>
              <div className="text-[11px] font-heading font-bold uppercase text-aura-text-muted">Experiência</div>
            </div>

            <div className="card-3d p-4 bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 text-center">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-blue-100 flex items-center justify-center text-xl mb-1 shadow-sm">
                🟡
              </div>
              <div className="text-2xl font-heading font-extrabold text-aura-blue">+{sessionCoins}</div>
              <div className="text-[11px] font-heading font-bold uppercase text-aura-text-muted">Moedas Ganhas</div>
            </div>
          </div>

          {/* Estatísticas da Sessão */}
          <div className="card-3d p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 text-left space-y-4">
            <div className="flex justify-between items-center text-xs font-heading font-bold uppercase tracking-wider text-aura-text-muted">
              <span>📊 Métricas do Treino</span>
              <span className="text-aura-green font-extrabold">Retenção: <strong>{sessionStats.accuracy}%</strong></span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-aura-blue" />
                <span>Tempo: {formatDuration(sessionStats.durationSeconds)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={16} className="text-aura-green" />
                <span>Cards Estudados: <strong className="font-extrabold">{reviewed}</strong></span>
              </div>
            </div>

            {/* Pílulas de Respostas */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200">
              <div className="text-center p-2 rounded-xl bg-red-50 text-red-700">
                <div className="font-black text-sm">{sessionStats.ratingCounts[0]}</div>
                <div className="text-[10px] font-bold">De novo</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-orange-50 text-orange-700">
                <div className="font-black text-sm">{sessionStats.ratingCounts[1]}</div>
                <div className="text-[10px] font-bold">Difícil</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-blue-50 text-blue-700">
                <div className="font-black text-sm">{sessionStats.ratingCounts[2]}</div>
                <div className="text-[10px] font-bold">Bom</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <div className="font-black text-sm">{sessionStats.ratingCounts[3]}</div>
                <div className="text-[10px] font-bold">Fácil</div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3 pt-2">
            <Button 
              variant="orange" 
              size="lg" 
              fullWidth 
              onClick={() => navigate('/')}
            >
              <Home size={20} /> Continuar Jornada 🚀
            </Button>
            {id !== 'all' && (
              <Button 
                variant="secondary" 
                size="md" 
                fullWidth 
                onClick={() => navigate(`/deck/${id}`)}
              >
                <BookOpen size={18} /> Gerenciar Este Baralho
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // TELA DE ESTUDO ATIVA
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-aura-bg flex flex-col justify-between p-4 sm:p-6 relative">
      
      {/* XP Floating Toast (Animação de Recompensa) */}
      {floatingXP && (
        <div 
          key={floatingXP.id}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-xp-rise pointer-events-none"
        >
          <div className="badge-xp text-lg px-6 py-2.5 shadow-2xl">
            {floatingXP.text}
          </div>
        </div>
      )}

      {/* Header com Barra de Progresso Tátil */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between gap-4 py-2">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-aura-text-secondary hover:text-aura-blue flex items-center justify-center shadow-xs active:scale-95 cursor-pointer"
          title="Sair do estudo"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Barra de Progresso Tátil */}
        <div className="flex-1 px-1">
          <div className="w-full h-3.5 bg-slate-200/90 dark:bg-slate-700 rounded-md overflow-hidden p-0.5 border border-slate-300/80 dark:border-slate-600 shadow-inner relative flex items-center">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 rounded-sm transition-all duration-500 ease-out relative shadow-[inset_0_2px_0_rgba(255,255,255,0.45)]"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Brilho Superior / Highlight */}
              <div className="absolute inset-x-2 top-0.5 h-0.5 bg-white/40 rounded-sm pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Contador */}
        <span className="text-xs font-heading font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 shadow-xs shrink-0">
          <span className="font-bold">{Math.min(reviewed + 1, total)}</span> / {total}
        </span>
      </header>

      {/* Flashcard 3D */}
      <main className="flex-1 flex items-center justify-center my-6">
        {current && (
          <FlashCard
            key={current.id}
            card={current}
            onRating={handleRating}
          />
        )}
      </main>

      {/* Footer Dica */}
      <footer className="max-w-xl mx-auto w-full text-center text-xs font-normal text-slate-500 dark:text-slate-400 py-2">
        Repita em <span className="text-slate-700 dark:text-slate-200 font-semibold">voz alta</span> para acelerar a <span className="text-blue-600 dark:text-blue-400 font-semibold">retenção neural</span> 🎧
      </footer>
    </div>
  )
}
