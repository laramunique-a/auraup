/**
 * Official Decks Service — Admin managed default decks & Store claiming
 */

import { isLocalMode, supabase, generateId } from './storage'
import { deckService } from './deck.service'
import { cardService } from './card.service'

export interface OfficialCard {
  front: string
  back: string
  front_image?: string
  back_image?: string
  front_audio?: boolean
  back_audio?: boolean
}

export interface OfficialDeck {
  id: string
  name: string
  description?: string
  category?: string
  level: string // "Todos", "Iniciante", "Intermediário", "Avançado", "Mestre", etc.
  is_published: boolean
  created_at: string
  cards: OfficialCard[]
}

const LS_OFFICIAL_DECKS = 'uply_official_decks'

const INITIAL_OFFICIAL_DECKS: OfficialDeck[] = [
  {
    id: 'off_deck_1',
    name: '50 Palavras Essenciais do Inglês',
    description: 'Vocabulário fundamental e indispensável para quem está começando.',
    category: 'Iniciante',
    level: 'Todos',
    is_published: true,
    created_at: new Date().toISOString(),
    cards: [
      { front: 'Hello', back: 'Olá', front_audio: true },
      { front: 'Thank you', back: 'Obrigado(a)', front_audio: true },
      { front: 'Please', back: 'Por favor', front_audio: true },
      { front: 'Good morning', back: 'Bom dia', front_audio: true },
      { front: 'Good night', back: 'Boa noite', front_audio: true },
      { front: 'Goodbye', back: 'Adeus / Tchau', front_audio: true },
      { front: 'Yes', back: 'Sim', front_audio: true },
      { front: 'No', back: 'Não', front_audio: true },
      { front: 'Water', back: 'Água', front_audio: true },
      { front: 'Food', back: 'Comida', front_audio: true },
      { front: 'Help', back: 'Ajuda', front_audio: true },
      { front: 'Friend', back: 'Amigo(a)', front_audio: true },
      { front: 'Family', back: 'Família', front_audio: true },
      { front: 'Time', back: 'Tempo / Hora', front_audio: true },
      { front: 'Day', back: 'Dia', front_audio: true },
    ]
  },
  {
    id: 'off_deck_2',
    name: 'Expressões do Dia a Dia',
    description: 'Gírias e expressões nativas usadas em conversas reais.',
    category: 'Intermediário',
    level: 'Intermediário',
    is_published: true,
    created_at: new Date().toISOString(),
    cards: [
      { front: 'What’s up?', back: 'E aí? / Como vai?', front_audio: true },
      { front: 'Piece of cake', back: 'Mamão com açúcar (muito fácil)', front_audio: true },
      { front: 'Break a leg', back: 'Boa sorte!', front_audio: true },
      { front: 'Under the weather', back: 'Chateado ou meio doente', front_audio: true },
      { front: 'Hit the sack', back: 'Ir dormir / Ir pra cama', front_audio: true },
      { front: 'Call it a day', back: 'Encerrar o trabalho por hoje', front_audio: true },
      { front: 'Better late than never', back: 'Antes tarde do que nunca', front_audio: true },
    ]
  },
  {
    id: 'off_deck_3',
    name: 'Inglês para Viagens & Aeroporto',
    description: 'Frases práticas para embarque, hotel, táxi e restaurantes.',
    category: 'Iniciante',
    level: 'Iniciante',
    is_published: true,
    created_at: new Date().toISOString(),
    cards: [
      { front: 'Where is the gate?', back: 'Onde fica o portão de embarque?', front_audio: true },
      { front: 'I have a reservation', back: 'Eu tenho uma reserva', front_audio: true },
      { front: 'How much is this?', back: 'Quanto custa isto?', front_audio: true },
      { front: 'Where is the restroom?', back: 'Onde fica o banheiro?', front_audio: true },
      { front: 'Check-in', back: 'Entrada / Registro', front_audio: true },
      { front: 'Check-out', back: 'Saída / Encerramento', front_audio: true },
    ]
  },
  {
    id: 'off_deck_4',
    name: 'Vocabulário de Negócios (Business English)',
    description: 'Termos corporativos, reuniões e comunicação profissional.',
    category: 'Avançado',
    level: 'Avançado',
    is_published: true,
    created_at: new Date().toISOString(),
    cards: [
      { front: 'Deadline', back: 'Prazo final', front_audio: true },
      { front: 'Feedback', back: 'Retorno / Avaliação de desempenho', front_audio: true },
      { front: 'Brainstorming', back: 'Tempestade de ideias', front_audio: true },
      { front: 'Networking', back: 'Rede de contatos profissionais', front_audio: true },
      { front: 'Quarterly report', back: 'Relatório trimestral', front_audio: true },
      { front: 'Win-win situation', back: 'Situação em que todos ganham', front_audio: true },
    ]
  }
]

function getLocalOfficialDecks(): OfficialDeck[] {
  const data = localStorage.getItem(LS_OFFICIAL_DECKS)
  if (!data) {
    localStorage.setItem(LS_OFFICIAL_DECKS, JSON.stringify(INITIAL_OFFICIAL_DECKS))
    return INITIAL_OFFICIAL_DECKS
  }
  try {
    const parsed = JSON.parse(data)
    return parsed.map((d: any) => ({
      ...d,
      level: d.level || d.category || 'Todos'
    }))
  } catch {
    return INITIAL_OFFICIAL_DECKS
  }
}

function saveLocalOfficialDecks(decks: OfficialDeck[]) {
  localStorage.setItem(LS_OFFICIAL_DECKS, JSON.stringify(decks))
}

// ── Public Official Deck API ──────────────────────────────────────────────────

export const officialDeckService = {
  async getOfficialDecks(onlyPublished = false): Promise<OfficialDeck[]> {
    if (isLocalMode || !supabase) {
      const all = getLocalOfficialDecks()
      return onlyPublished ? all.filter(d => d.is_published) : all
    }

    try {
      let query = supabase.from('official_decks').select('*').order('created_at', { ascending: false })
      if (onlyPublished) {
        query = query.eq('is_published', true)
      }
      const { data, error } = await query
      if (error || !data) return getLocalOfficialDecks()
      return data.map((d: any) => ({
        ...d,
        level: d.level || d.category || 'Todos'
      }))
    } catch {
      const all = getLocalOfficialDecks()
      return onlyPublished ? all.filter(d => d.is_published) : all
    }
  },

  async createOfficialDeck(deckData: Omit<OfficialDeck, 'id' | 'created_at'>): Promise<OfficialDeck> {
    const newDeck: OfficialDeck = {
      ...deckData,
      id: 'off_' + generateId(),
      created_at: new Date().toISOString(),
    }

    if (isLocalMode || !supabase) {
      const decks = getLocalOfficialDecks()
      decks.unshift(newDeck)
      saveLocalOfficialDecks(decks)
      return newDeck
    }

    try {
      const { data, error } = await supabase
        .from('official_decks')
        .insert(newDeck)
        .select()
        .single()
      if (error || !data) throw error
      return { ...data, level: data.level || data.category || 'Todos' }
    } catch {
      const decks = getLocalOfficialDecks()
      decks.unshift(newDeck)
      saveLocalOfficialDecks(decks)
      return newDeck
    }
  },

  async updateOfficialDeck(id: string, updates: Partial<OfficialDeck>): Promise<OfficialDeck> {
    if (isLocalMode || !supabase) {
      const decks = getLocalOfficialDecks()
      const idx = decks.findIndex(d => d.id === id)
      if (idx === -1) throw new Error('Baralho oficial não encontrado.')
      decks[idx] = { ...decks[idx], ...updates }
      saveLocalOfficialDecks(decks)
      return decks[idx]
    }

    try {
      const { data, error } = await supabase
        .from('official_decks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error || !data) throw error
      return { ...data, level: data.level || data.category || 'Todos' }
    } catch {
      const decks = getLocalOfficialDecks()
      const idx = decks.findIndex(d => d.id === id)
      if (idx === -1) throw new Error('Baralho oficial não encontrado.')
      decks[idx] = { ...decks[idx], ...updates }
      saveLocalOfficialDecks(decks)
      return decks[idx]
    }
  },

  async deleteOfficialDeck(id: string): Promise<void> {
    if (isLocalMode || !supabase) {
      const decks = getLocalOfficialDecks().filter(d => d.id !== id)
      saveLocalOfficialDecks(decks)
      return
    }

    try {
      await supabase.from('official_decks').delete().eq('id', id)
    } catch {
      const decks = getLocalOfficialDecks().filter(d => d.id !== id)
      saveLocalOfficialDecks(decks)
    }
  },

  async togglePublish(id: string): Promise<boolean> {
    const all = await this.getOfficialDecks(false)
    const target = all.find(d => d.id === id)
    if (!target) throw new Error('Baralho oficial não encontrado.')
    const nextState = !target.is_published
    await this.updateOfficialDeck(id, { is_published: nextState })
    return nextState
  },

  async claimOfficialDeckToUser(userId: string, officialDeckId: string): Promise<string> {
    const all = await this.getOfficialDecks(false)
    const officialDeck = all.find(d => d.id === officialDeckId)
    if (!officialDeck) throw new Error('Baralho oficial não encontrado.')

    // Criar cópia do baralho para a conta do usuário (tratando nome duplicado se necessário)
    let deckName = officialDeck.name
    let userDeck
    try {
      userDeck = await deckService.createDeck(userId, deckName, officialDeck.description)
    } catch (err: any) {
      if (err.message?.includes('Já existe')) {
        const timestamp = new Date().toLocaleTimeString('pt-BR', { minute: '2-digit', second: '2-digit' })
        deckName = `${officialDeck.name} (${timestamp})`
        userDeck = await deckService.createDeck(userId, deckName, officialDeck.description)
      } else {
        throw err
      }
    }

    // Copiar cada card com imagem e audio para o novo baralho do usuário
    if (officialDeck.cards && officialDeck.cards.length > 0) {
      for (const c of officialDeck.cards) {
        await cardService.createCard(userDeck.id, c.front, c.back, {
          front_image: c.front_image,
          back_image: c.back_image,
          front_lang: 'en-US',
          back_lang: 'en-US',
          front_audio: c.front_audio === true,
          back_audio: c.back_audio === true,
        })
      }
    }

    return userDeck.id
  }
}
