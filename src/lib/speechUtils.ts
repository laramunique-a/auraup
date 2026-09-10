/**
 * Speech & Language utilities for AuraUP.
 * 
 * Rules:
 * 1. AuraUP is an English learning platform for Portuguese speakers.
 * 2. Speech synthesis ('en-US') must ONLY pronounce English words/phrases.
 * 3. Portuguese text must NEVER be pronounced automatically or with English TTS.
 * 4. Cards must only auto-play when explicitly enabled via card audio flag (front_audio / back_audio).
 */

// Regex matching Portuguese diacritics / accent marks (never found in English vocabulary)
const PORTUGUESE_DIACRITICS_REGEX = /[áàâãéèêíïóòôõúùûçÁÀÂÃÉÈÊÍÏÓÒÔÕÚÙÛÇ]/

// Purely Portuguese words that do NOT exist in English vocabulary
// (Notice ambiguous words like 'no', 'time', 'me', 'a', 'do', 'in', 'or' are intentionally omitted)
const PORTUGUESE_EXCLUSIVE_WORDS = /\b(o|os|as|um|uma|uns|umas|de|da|dos|das|na|nos|nas|por|pelo|pela|pelos|pelas|para|pra|pro|pras|pros|com|sem|sob|sobre|que|não|nao|sim|mas|mais|como|quando|onde|porque|porquê|qual|quais|quanto|quanta|quantos|quantas|quem|eu|tu|ele|ela|nós|eles|elas|você|vocês|lhe|lhes|meu|minha|meus|minhas|teu|tua|teus|tuas|seu|sua|seus|suas|nosso|nossa|nossos|nossas|esse|essa|esses|essas|este|esta|estes|estas|aquele|aquela|aqueles|aquelas|isto|isso|aquilo|foi|era|são|está|estao|estavam|ser|estar|ter|tem|têm|tinha|tinham|fazer|faz|fiz|feito|dizer|disse|dito|vai|vou|fui|foram|muito|muita|muitos|muitas|pouco|pouca|poucos|poucas|tudo|nada|algo|alguém|ninguém|sempre|nunca|jamais|já|ainda|agora|hoje|ontem|amanhã|aqui|aí|ali|lá|bom|boa|bons|boas|dia|noite|tarde|olá|ola|oi|tchau|adeus|obrigado|obrigada|favor|ajuda|amigo|amiga|família|familia|tempo|hora|horas|água|agua|comida|casa|cachorro|gato|homem|mulher|menino|menina|filho|filha|pai|mãe|mae|irmão|irmao|irmã|irma|porta|janela|mesa|cadeira|cama|quarto|banheiro|cozinha|comer|beber|dormir|falar|andar|correr|ver|ouvir|sentir|pensar|gostar|querer|poder|saber|conhecer|novo|velho|grande|pequeno|bonito|feio|mau|certo|errado|alto|baixo|quente|frio|menos|depois|antes|tradução|traducao|resposta|significado|exemplo|palavra|frase|livro|escola|trabalho|dinheiro|cidade|país|pais|situação|situacao|todos|ganham|portão|embarque|reserva|custa|mamão|açúcar|doente|encerrar|prazo|retorno|avaliação|tempestade|ideias|rede|contatos|relatório|trimestral|sorte|chateado|dormir)\b/i

// Portuguese word suffixes
const PORTUGUESE_SUFFIXES_REGEX = /(ção|ções|mente|ando|endo|indo|ada|adas|ado|ados|eza|ável|íveis|aria|arias|avam|aram|íamos|sse|sses)$/i

/**
 * Checks if a string contains Portuguese words, accents, or grammatical patterns.
 */
export function isPortugueseText(text: string | undefined | null): boolean {
  if (!text) return false
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/[()\[\]{}_]/g, ' ').trim()
  if (!clean) return false

  // 1. Any accented character specific to Portuguese
  if (PORTUGUESE_DIACRITICS_REGEX.test(clean)) {
    return true
  }

  // 2. Contains common Portuguese-exclusive words
  if (PORTUGUESE_EXCLUSIVE_WORDS.test(clean)) {
    return true
  }

  // 3. Ends with Portuguese grammatical suffix
  const words = clean.toLowerCase().split(/\s+/).filter(Boolean)
  for (const w of words) {
    if (w.length > 4 && PORTUGUESE_SUFFIXES_REGEX.test(w)) {
      return true
    }
  }

  return false
}

/**
 * Checks if text is valid English and safe for English TTS ('en-US').
 * Must NOT contain Portuguese words or accents.
 */
export function isEnglishText(text: string | undefined | null, langCode?: string): boolean {
  if (!text) return false
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/[()\[\]{}_]/g, ' ').trim()
  if (!clean) return false

  // Explicitly marked as Portuguese
  if (langCode === 'pt-BR' || langCode === 'pt') {
    return false
  }

  // If it has Portuguese diacritics or words, it is NOT English
  if (isPortugueseText(clean)) {
    return false
  }

  // Must contain some alphabetic letters
  if (!/[a-zA-Z]/.test(clean)) {
    return false
  }

  return true
}

/**
 * Determines whether a card side should be auto-played aloud when shown.
 * 
 * STRICT CONDITIONS:
 * 1. Audio must be enabled on the card (e.g. front_audio === true or back_audio === true)
 * 2. The text MUST be in English and MUST NOT contain Portuguese words/accents.
 */
export function shouldAutoPlaySpeech(
  text: string | undefined | null,
  audioEnabled: boolean | undefined | null,
  langCode?: string
): boolean {
  // 1. Must be explicitly enabled in card configuration
  if (audioEnabled !== true) {
    return false
  }

  // 2. Must be valid English and NOT Portuguese
  return isEnglishText(text, langCode)
}

/**
 * Determines whether a manual speech button ("Ouvir Pronúncia 🔊") should be available.
 * Only English text may be pronounced using English TTS.
 */
export function canPlaySpeech(
  text: string | undefined | null,
  langCode?: string
): boolean {
  return isEnglishText(text, langCode)
}
