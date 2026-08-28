import { useCallback } from 'react'

export function useSpeech() {
  const speak = useCallback((text: string, lang?: string) => {
    if (!window.speechSynthesis) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    if (lang) {
      utterance.lang = lang
    } else {
      // Try to detect or use default
      utterance.lang = 'en-US'
    }

    utterance.rate = 0.9
    utterance.pitch = 1

    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
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
