import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStudySession } from '../hooks/useStudySession'
import { useDecks } from '../hooks/useDecks'
import { useAuth } from '../contexts/AuthContext'
import { profileService } from '../services/profile.service'
import { FlashCard } from '../components/study/FlashCard'
import { Button } from '../components/ui/Button'
import { ArrowLeft, CheckCircle, Zap, Trophy, Coins, Home, Clock, Target, RotateCcw, AlertCircle, Check, BookOpen } from 'lucide-react'
import type { Rating } from '../types'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

export function StudyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { current, loading, sessionDone, reviewed, total, submitRating, sessionStats } = useStudySession(id!)
  const { refreshStats, recordReviewLocally } = useDecks()

  const [sessionXP, setSessionXP] = useState(0)
  const [sessionCoins, setSessionCoins] = useState(0)

  const handleRating = async (rating: Rating) => {
    if (current && user) {
      recordReviewLocally(current.deck_id, rating)
      let xp = 0; let coins = 0
      if (rating === 3) { xp = 10; coins = 2 }
      else if (rating === 2) { xp = 5; coins = 1 }
      else if (rating === 1) { xp = 2 }
      
      if (xp > 0 || coins > 0) {
        setSessionXP(prev => prev + xp)
        setSessionCoins(prev => prev + coins)
        profileService.addReward(user.id, xp, coins)
      }
    }
    await submitRating(rating)
  }

  useEffect(() => {
    if (sessionDone && user) {
      refreshStats()
      profileService.updateStreak(user.id)
    }
  }, [sessionDone, refreshStats, user])

  useEffect(() => {
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel() }
  }, [])

  const progress = total > 0 ? (reviewed / total) * 100 : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', border: '4px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.125rem' }}>Preparando seus cards... ✨</p>
      </div>
    </div>
  )

  if (sessionDone) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at center, var(--accent-soft), transparent 70%), var(--bg-primary)',
        padding: '2rem 1.5rem'
      }}>
        <div style={{
          textAlign: 'center', maxWidth: '520px', width: '100%',
          animation: 'popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          {/* Header Icon */}
          <div style={{ 
            width: '72px', height: '72px', margin: '0 auto 1.25rem',
            background: 'var(--success)', color: 'white', borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 24px rgba(16, 185, 129, 0.25)'
          }} className="animate-float">
            <CheckCircle size={40} strokeWidth={2.5} />
          </div>
          
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Sessão Finalizada! 🎉
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1.75rem' }}>
            Parabéns! Você revisou <span style={{ fontWeight: 900, color: 'var(--accent)' }}>{reviewed}</span> cards nesta rodada.
          </p>

          {/* Recompensas XP & Moedas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <RewardCard icon={<Trophy size={24} color="#f59e0b" />} label="XP GANHO" value={`+${sessionXP}`} delay="0.1s" />
            <RewardCard icon={<Coins size={24} color="var(--accent)" />} label="MOEDAS" value={`+${sessionCoins}`} delay="0.2s" />
          </div>

          {/* Estatísticas Detalhadas da Sessão */}
          <div style={{
            background: 'var(--bg-card)', border: '2px solid var(--border)', borderRadius: '24px',
            padding: '1.5rem', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)', textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Estatísticas da Sessão
            </h3>

            {/* Métrica de Tempo e Precisão */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Tempo Total</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--text-primary)' }}>{formatDuration(sessionStats.durationSeconds)}</div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Target size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Retenção / Acertos</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--text-primary)' }}>{sessionStats.accuracy}%</div>
                </div>
              </div>
            </div>

            {/* Distribuição dos Botoes Clicados */}
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Desempenho por Resposta
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              <StatPill icon={<RotateCcw size={14} />} count={sessionStats.ratingCounts[0]} label="De novo" color="#ef4444" />
              <StatPill icon={<AlertCircle size={14} />} count={sessionStats.ratingCounts[1]} label="Difícil" color="#f59e0b" />
              <StatPill icon={<Check size={14} />} count={sessionStats.ratingCounts[2]} label="Bom" color="#6366f1" />
              <StatPill icon={<Zap size={14} />} count={sessionStats.ratingCounts[3]} label="Fácil" color="#10b981" />
            </div>
          </div>

          {/* Botoes de Ação */}
          <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
            <Button variant="vibrant" size="md" fullWidth onClick={() => navigate('/')}>
              <Home size={20} /> Voltar ao Início
            </Button>
            {id !== 'all' && (
              <Button variant="secondary" size="md" fullWidth onClick={() => navigate(`/deck/${id}`)}>
                <BookOpen size={20} /> Gerenciar Baralho
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header with Progress */}
      <div style={{ 
        padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem',
        background: 'var(--bg-secondary)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10
      }}>
        <button onClick={() => navigate('/')} className="btn-icon-soft" style={{ width: '44px', height: '44px' }}>
          <ArrowLeft size={22} />
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Progresso</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent)' }}>{reviewed} de {total}</span>
          </div>
          <div style={{ height: '10px', background: 'var(--bg-surface)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-gradient)', borderRadius: '10px', transition: 'width 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)' }} />
          </div>
        </div>

        <div style={{ 
          background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '50px',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--text-primary)'
        }}>
          <Zap size={16} fill="var(--warning)" color="var(--warning)" /> {sessionXP} XP
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        {current && <FlashCard key={current.id} card={current} onRating={handleRating} />}
      </div>
    </div>
  )
}

function RewardCard({ icon, label, value, delay }: any) {
  return (
    <div className="card animate-pop" style={{ 
      padding: '1.25rem 1.0rem', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', gap: '0.35rem', animationDelay: delay 
    }}>
      <div style={{ 
        width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

function StatPill({ icon, count, label, color }: { icon: any; count: number; label: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', borderRadius: '14px', padding: '0.6rem 0.4rem',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem'
    }}>
      <div style={{ color, display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 800 }}>
        {icon} {count}
      </div>
      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}
