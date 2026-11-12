import { useCallback } from 'react'

let currentAudio: HTMLAudioElement | null = null
let cachedVoices: SpeechSynthesisVoice[] = []

function updateVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const list = window.speechSynthesis.getVoices()
    if (list && list.length > 0) {
      cachedVoices = list
    }
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  updateVoices()
  window.speechSynthesis.onvoiceschanged = updateVoices
}

/**
 * Busca estritamente uma voz em Inglês Americano (en-US).
 * NUNCA seleciona vozes em português (pt-BR / pt-PT) ou outro idioma.
 */
function getStrictAmericanEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length > 0 
    ? cachedVoices 
    : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : [])

  if (!voices || voices.length === 0) return null

  // Filtra estritamente vozes em inglês (rejeita explicitamente português ou qualquer idioma que não seja 'en')
  const englishVoices = voices.filter(v => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-')
    return lang.startsWith('en') && !lang.startsWith('pt')
  })

  if (englishVoices.length === 0) return null

  // Prioriza en-US (Inglês Americano)
  const usVoices = englishVoices.filter(v => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-')
    return lang === 'en-us' || lang === 'en'
  })

  const targetPool = usVoices.length > 0 ? usVoices : englishVoices

  // Prioriza vozes neurais / naturais americanas de alta qualidade
  const preferred = targetPool.find(v => {
    const name = v.name.toLowerCase()
    return name.includes('google us') || 
           name.includes('natural') || 
           name.includes('samantha') || 
           name.includes('siri') || 
           name.includes('jenny') || 
           name.includes('zira') || 
           name.includes('guy') || 
           name.includes('david') ||
           name.includes('google')
  })

  return preferred || targetPool[0] || null
}

function speakWithWebSpeech(text: string, lang = 'en-US') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()

  const isEn = lang.toLowerCase().startsWith('en')
  let selectedVoice: SpeechSynthesisVoice | null = null

  if (isEn) {
    selectedVoice = getStrictAmericanEnglishVoice()
    // SE NÃO HOUVER NENHUMA VOZ EM INGLÊS NO SISTEMA, NUNCA FALE EM PORTUGUÊS!
    if (!selectedVoice && cachedVoices.length > 0) {
      console.warn('Nenhuma voz em inglês encontrada no dispositivo. Não executando com voz em português.')
      return
    }
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = selectedVoice ? selectedVoice.lang : (isEn ? 'en-US' : lang)
  if (selectedVoice) {
    utterance.voice = selectedVoice
  }
  utterance.rate = 1.0
  utterance.pitch = 1

  window.speechSynthesis.speak(utterance)
}

export function useSpeech() {
  const speak = useCallback((text: string, lang = 'en-US') => {
    if (!text || !text.trim()) return

    // Cancela áudio em reprodução anterior
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    const clean = text.replace(/<[^>]*>/g, ' ').replace(/[()\[\]{}_]/g, ' ').trim()
    if (!clean) return

    const isEn = lang.toLowerCase().startsWith('en')

    // 1. Motor Principal: API /api/tts (Vercel Edge / Node proxy)
    // Retorna o áudio MP3 autêntico em Inglês Americano do Google Translate (idêntico ao AwesomeTTS)
    // sem bloqueio de cabeçalho Referer do navegador.
    if (isEn && clean.length <= 200) {
      const apiUrl = `/api/tts?text=${encodeURIComponent(clean)}&lang=en-US`
      const audio = new Audio(apiUrl)
      audio.playbackRate = 1.0
      currentAudio = audio

      let fallbackTriggered = false
      const doFallback = () => {
        if (fallbackTriggered) return
        fallbackTriggered = true
        if (currentAudio === audio) {
          currentAudio = null
        }
        speakWithWebSpeech(clean, lang)
      }

      audio.onended = () => {
        if (currentAudio === audio) currentAudio = null
      }
      audio.onerror = doFallback
      audio.play().catch(doFallback)
      return
    }

    // Fallback de emergência (caso offline ou texto longo): Web Speech API estritamente em Inglês
    speakWithWebSpeech(clean, lang)
  }, [])

  const stop = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  return { speak, stop }
}

export const LANGUAGES = [
  { code: 'pt-BR', name: 'Português' },
  { code: 'en-US', name: 'Inglês' },
  { code: 'es-ES', name: 'Espanhol' },
  { code: 'fr-FR', name: 'Francês' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'de-DE', name: 'Alemão' },
  { code: 'ja-JP', name: 'Japonês' },
]
