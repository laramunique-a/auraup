import { useState, useEffect } from 'react'
import type { StudyCard, Rating } from '../../types'
import { RotateCcw, Volume2, Sparkles, AlertCircle, Check, Zap } from 'lucide-react'
import { useSpeech } from '../../hooks/useSpeech'
import { predictNextIntervals } from '../../lib/sm2'
import { shouldAutoPlaySpeech, canPlaySpeech } from '../../lib/speechUtils'

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

  // Auto-play áudio da Frente: SOMENTE quando configurado (front_audio === true)
  // E SOMENTE palavras/frases em inglês (nunca em português)
  useEffect(() => {
    if (!flipped && shouldAutoPlaySpeech(card.front, card.front_audio, card.front_lang)) {
      const timer = setTimeout(() => {
        speak(card.front.trim(), 'en-US')
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [card.id, flipped, card.front, card.front_audio, card.front_lang])

  // Auto-play áudio do Verso: SOMENTE quando configurado (back_audio === true)
  // E SOMENTE palavras/frases em inglês (nunca em português)
  useEffect(() => {
    if (flipped && shouldAutoPlaySpeech(card.back, card.back_audio, card.back_lang)) {
      const timer = setTimeout(() => {
        speak(card.back.trim(), 'en-US')
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [card.id, flipped, card.back, card.back_audio, card.back_lang])

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
    }, 320)
  }

  const ratingOptions: { value: Rating; label: string; sub: string; btnClass: string; icon: any }[] = [
    { value: 0, label: 'De novo', sub: estimates[0], btnClass: 'btn-3d-red', icon: <RotateCcw size={16} /> },
    { value: 1, label: 'Difícil', sub: estimates[1], btnClass: 'btn-3d-orange', icon: <AlertCircle size={16} /> },
    { value: 2, label: 'Bom', sub: estimates[2], btnClass: 'btn-3d-blue', icon: <Check size={16} /> },
    { value: 3, label: 'Fácil', sub: estimates[3], btnClass: 'btn-3d-green', icon: <Zap size={16} className="fill-white" /> },
  ]

  const hasFrontText = Boolean(card.front && card.front.trim())
  const hasBackText = Boolean(card.back && card.back.trim())
  const canPlayFront = Boolean(card.front && canPlaySpeech(card.front, card.front_lang))
  const canPlayBack = Boolean(card.back && canPlaySpeech(card.back, card.back_lang))

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Cena 3D do Flashcard */}
      <div className="card-scene min-h-[300px] sm:min-h-[380px] md:min-h-[420px] relative w-full">
        <div className={`card-wrapper ${flipped ? 'flipped' : ''} min-h-[300px] sm:min-h-[380px] md:min-h-[420px]`}>
          
          {/* Frente do Card */}
          <div
            onClick={handleFlip}
            className={`card-face card-front card-3d p-4 sm:p-7 flex flex-col justify-between items-center cursor-pointer select-none border-2 border-aura-blue/20 bg-gradient-to-b from-white via-white to-aura-soft-blue/30 transition-opacity duration-200 overflow-hidden ${
              flipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {/* Top Label */}
            <div className="w-full flex items-center justify-between text-xs font-medium text-slate-500 shrink-0">
              <span className="flex items-center gap-1.5 text-blue-600 font-heading font-semibold">
                <Sparkles size={15} /> Frente
              </span>
              <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md text-xs font-heading font-semibold border border-blue-200/60 dark:border-blue-800">
                Toque para virar 👆
              </span>
            </div>
            
            {/* Body Content */}
            <div className="flex flex-col items-center gap-3 my-auto w-full text-center overflow-y-auto max-h-[calc(100%-55px)] py-2">
              {card.front_image && (
                <img 
                  src={card.front_image} 
                  alt="Ilustração frente"
                  className="max-w-full max-h-32 sm:max-h-40 object-contain rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 shrink-0" 
                />
              )}
              
              {hasFrontText && (
                <h2 className="font-heading font-bold text-xl sm:text-3xl md:text-4xl text-slate-900 dark:text-white leading-tight tracking-tight break-words px-1">
                  {card.front}
                </h2>
              )}

              {canPlayFront && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation()
                    speak(card.front.trim(), 'en-US') 
                  }}
                  className="rounded-lg text-xs font-heading font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                  title="Ouvir pronúncia em inglês"
                >
                  <Volume2 size={14} /> Ouvir Pronúncia 🔊
                </button>
              )}
            </div>

            {/* Bottom Indicator */}
            <div className="text-slate-400 dark:text-slate-500 text-[11px] sm:text-xs font-medium flex items-center gap-1.5 pt-1 shrink-0">
              <RotateCcw size={13} /> Toque no card para ver a resposta
            </div>
          </div>

          {/* Verso do Card */}
          <div
            className={`card-face card-back card-3d p-4 sm:p-7 flex flex-col justify-between items-center border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 transition-opacity duration-200 overflow-hidden ${
              !flipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {/* Top Label */}
            <div className="w-full flex items-center justify-between text-xs font-heading font-semibold text-amber-600 dark:text-amber-400 shrink-0">
              <span>💡 Resposta</span>
              <span className="text-slate-400 font-normal text-xs font-sans">Classifique como foi</span>
            </div>

            {/* Body Content */}
            <div className="flex flex-col items-center gap-3 my-auto w-full text-center overflow-y-auto max-h-[calc(100%-55px)] py-2">
              {card.back_image && (
                <img 
                  src={card.back_image} 
                  alt="Ilustração verso"
                  className="max-w-full max-h-32 sm:max-h-40 object-contain rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 shrink-0" 
                />
              )}

              {hasBackText && (
                <h2 className="font-heading font-bold text-xl sm:text-3xl md:text-4xl text-slate-900 dark:text-white leading-tight tracking-tight break-words px-1">
                  {card.back}
                </h2>
              )}

              {canPlayBack && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation()
                    speak(card.back.trim(), 'en-US') 
                  }}
                  className="rounded-lg text-xs font-heading font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                  title="Ouvir pronúncia em inglês"
                >
                  <Volume2 size={14} /> Ouvir Pronúncia 🔊
                </button>
              )}
            </div>

            <div className="h-2 shrink-0" />
          </div>

        </div>
      </div>

      {/* Botões Táteis de Classificação SM-2 */}
      <div className="w-full mt-3 sm:mt-5 min-h-[56px] sm:min-h-[64px] flex items-center">
        {flipped ? (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 w-full animate-pop-in">
            {ratingOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleRating(opt.value)}
                className={`${opt.btnClass} py-2 px-1 sm:py-2.5 sm:px-2 flex flex-col items-center justify-center text-center gap-0.5 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer`}
              >
                <div className="flex items-center justify-center gap-1 w-full">
                  {opt.icon}
                  <span className="text-[11px] sm:text-xs font-heading font-bold truncate">{opt.label}</span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium opacity-85 leading-none">{opt.sub}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="w-full text-center text-slate-500 dark:text-slate-400 text-xs font-semibold flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <Sparkles size={14} className="text-amber-500 shrink-0" />
            <span>Toque no card para revelar a resposta</span>
          </div>
        )}
      </div>
    </div>
  )
}
