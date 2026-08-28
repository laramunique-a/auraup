import { useState, useEffect } from 'react'
import type { StudyCard, Rating } from '../../types'
import { RotateCcw, Volume2, Sparkles, AlertCircle, Check, Zap } from 'lucide-react'
import { useSpeech } from '../../hooks/useSpeech'
import { predictNextIntervals } from '../../lib/sm2'

interface FlashCardProps {
  card: StudyCard
  onRating: (rating: Rating) => void
}

export function FlashCard({ card, onRating }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [animating, setAnimating] = useState(false)
  const { speak } = useSpeech()

  const estimates = predictNextIntervals(card.review || {})

  // Resetar estado ao mudar de card
  useEffect(() => {
    setFlipped(false)
    setAnimating(false)
  }, [card.id])

  // Auto-play áudio da Frente (Pergunta em Inglês) automaticamente ao exibir o card
  useEffect(() => {
    if (!flipped && card.front && card.front.trim()) {
      const timer = setTimeout(() => {
        speak(card.front.trim(), 'en-US')
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [card.id, flipped, card.front])

  // Auto-play áudio do Verso (Resposta) automaticamente ao virar o card
  useEffect(() => {
    if (flipped && card.back && card.back.trim()) {
      const timer = setTimeout(() => {
        speak(card.back.trim(), 'en-US')
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [card.id, flipped, card.back])

  function handleFlip() {
    if (animating) return
    setFlipped(f => !f)
  }

  function handleRating(rating: Rating) {
    if (animating) return
    setAnimating(true)
    onRating(rating)
    setTimeout(() => {
      setFlipped(false)
      setAnimating(false)
    }, 350)
  }

  const ratingOptions: { value: Rating; label: string; sub: string; color: string; icon: any }[] = [
    { value: 0, label: 'De novo', sub: estimates[0], color: '#ef4444', icon: <RotateCcw size={16} /> },
    { value: 1, label: 'Difícil', sub: estimates[1], color: '#ea580c', icon: <AlertCircle size={16} /> },
    { value: 2, label: 'Bom', sub: estimates[2], color: '#2563eb', icon: <Check size={16} /> },
    { value: 3, label: 'Fácil', sub: estimates[3], color: '#059669', icon: <Zap size={16} className="fill-[#059669]" /> },
  ]

  const hasFrontText = Boolean(card.front && card.front.trim())
  const hasBackText = Boolean(card.back && card.back.trim())

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Cena 3D do Card */}
      <div className="card-scene min-h-[380px] sm:min-h-[420px] relative w-full">
        <div className={`card-wrapper ${flipped ? 'flipped' : ''} min-h-[380px] sm:min-h-[420px]`}>
          
          {/* Frente do Card */}
          <div
            onClick={handleFlip}
            className={`card-face card-front glass-panel p-8 flex flex-col justify-between items-center cursor-pointer select-none rounded-[2.5rem] shadow-glass border border-slate-900/10 transition-opacity ${
              flipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {/* Top Label */}
            <div className="w-full flex items-center justify-between font-label text-xs uppercase tracking-wider text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <Sparkles size={14} /> Pergunta
              </span>
              <span>Toque para virar</span>
            </div>
            
            {/* Body Content */}
            <div className="flex flex-col items-center gap-4 my-auto w-full text-center">
              {card.front_image && (
                <img 
                  src={card.front_image} 
                  alt="Ilustração frente"
                  className="max-w-full max-h-40 object-contain rounded-2xl shadow-soft-sm" 
                />
              )}
              
              {hasFrontText && (
                <h2 className="font-heading text-2xl sm:text-4xl text-slate-900 dark:text-slate-100 leading-tight">
                  {card.front}
                </h2>
              )}

              {hasFrontText && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation()
                    speak(card.front.trim(), 'en-US') 
                  }}
                  className="btn-secondary-glass rounded-full text-xs font-label px-4 py-2 text-blue-600 border-blue-200/60 mt-2"
                  title="Ouvir novamente"
                >
                  <Volume2 size={16} /> Ouvir Áudio 🔊
                </button>
              )}
            </div>

            {/* Bottom Indicator */}
            <div className="text-slate-400 text-xs font-label flex items-center gap-1.5 pt-2">
              <RotateCcw size={14} /> Clique em qualquer lugar para ver a resposta
            </div>
          </div>

          {/* Verso do Card */}
          <div
            className={`card-face card-back glass-panel p-8 flex flex-col justify-between items-center rounded-[2.5rem] shadow-glass border-2 border-blue-600/80 transition-opacity ${
              !flipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {/* Top Label */}
            <div className="w-full flex items-center justify-between font-label text-xs uppercase tracking-wider text-blue-600 font-semibold">
              <span>Resposta 💡</span>
              <span className="text-slate-400 font-medium">Classifique abaixo</span>
            </div>

            {/* Body Content */}
            <div className="flex flex-col items-center gap-4 my-auto w-full text-center">
              {card.back_image && (
                <img 
                  src={card.back_image} 
                  alt="Ilustração verso"
                  className="max-w-full max-h-40 object-contain rounded-2xl shadow-soft-sm" 
                />
              )}

              {hasBackText && (
                <h2 className="font-heading text-2xl sm:text-4xl text-slate-900 dark:text-slate-100 leading-tight">
                  {card.back}
                </h2>
              )}

              {hasBackText && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation()
                    speak(card.back.trim(), 'en-US') 
                  }}
                  className="btn-secondary-glass rounded-full text-xs font-label px-4 py-2 text-blue-600 border-blue-200/60 mt-2"
                  title="Ouvir novamente"
                >
                  <Volume2 size={16} /> Ouvir Áudio 🔊
                </button>
              )}
            </div>

            <div className="h-4" />
          </div>

        </div>
      </div>

      {/* Classificação SM-2 (Disponível quando virado) */}
      <div className="w-full mt-6 min-h-[90px] font-label">
        {flipped ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 animate-fade-in">
            {ratingOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleRating(opt.value)}
                style={{ borderColor: `${opt.color}40` }}
                className="glass-panel p-3.5 flex flex-col items-center justify-center text-center gap-1 rounded-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-soft-sm"
              >
                <div style={{ color: opt.color }}>{opt.icon}</div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{opt.label}</span>
                <span className="text-[10px] font-medium text-slate-400">{opt.sub}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-400 text-xs font-label flex items-center justify-center gap-2 py-4">
            <Sparkles size={15} className="text-blue-600" /> Clique no card para revelar a resposta e classificar
          </div>
        )}
      </div>
    </div>
  )
}
