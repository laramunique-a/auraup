import { useCallback } from 'react'

let currentAudio: HTMLAudioElement | null = null

function speakWithWebSpeech(text: string, lang = 'en-US') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 1.0
  utterance.pitch = 1

  const voices = window.speechSynthesis.getVoices()
  if (voices && voices.length > 0) {
    const isEn = lang.startsWith('en')
    if (isEn) {
      // Prioridade: Google US English > Microsoft Natural > Samantha > qualquer en-US
      const preferred = voices.find(v => 
        (v.lang === 'en-US' || v.lang === 'en_US') && (
          v.name.includes('Google') || 
          v.name.toLowerCase().includes('natural') || 
          v.name.includes('Samantha') ||
          v.name.includes('Siri')
        )
      ) || voices.find(v => v.lang.startsWith('en'))

      if (preferred) {
        utterance.voice = preferred
      }
    }
  }

  window.speechSynthesis.speak(utterance)
}

export function useSpeech() {
  const speak = useCallback((text: string, lang = 'en-US') => {
    if (!text || !text.trim()) return

    // Cancela áudio em reprodução
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    const clean = text.replace(/<[^>]*>/g, ' ').replace(/[()\[\]{}_]/g, ' ').trim()
    if (!clean) return

    // Motor Principal: Google Translate TTS (en-US) - Idêntico ao AwesomeTTS do Anki
    const isEn = lang.startsWith('en')
    if (isEn && clean.length <= 200) {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en-US&client=tw-ob&q=${encodeURIComponent(clean)}`
      const audio = new Audio(ttsUrl)
      audio.playbackRate = 1.0 // Velocidade normal (1.0x) validada pelo usuário
      currentAudio = audio

      const fallbackToWebSpeech = () => {
        if (currentAudio === audio) {
          currentAudio = null
        }
        speakWithWebSpeech(clean, lang)
      }

      audio.onerror = fallbackToWebSpeech
      audio.play().catch(fallbackToWebSpeech)
      return
    }

    // Fallback: Web Speech API com seleção de vozes de alta definição
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
