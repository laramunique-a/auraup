/**
 * Dicionário & Serviço da Palavra do Dia (Word of the Day)
 * Suporta armazenamento local com fallback e tabela do Supabase (words_of_the_day).
 */

import { isLocalMode, supabase, generateId } from '../services/storage'

export interface WordOfTheDay {
  id?: string
  word: string
  type: string
  translation: string
  definition: string
  example: string
  exampleTranslation: string
  created_at?: string
}

export const INITIAL_WORDS_OF_THE_DAY: WordOfTheDay[] = [
  {
    id: 'word_1',
    word: 'Resilience',
    type: 'substantivo',
    translation: 'Resiliência',
    definition: 'A capacidade de se recuperar rapidamente de dificuldades ou desafios.',
    example: 'Her resilience helped her overcome every obstacle in learning English.',
    exampleTranslation: 'A resiliência dela a ajudou a superar cada obstáculo ao aprender inglês.',
  },
  {
    id: 'word_2',
    word: 'Endeavor',
    type: 'substantivo / verbo',
    translation: 'Esforço / Empreendimento',
    definition: 'Uma tentativa séria ou esforço para alcançar um objetivo.',
    example: 'Learning a new language is a noble endeavor.',
    exampleTranslation: 'Aprender um novo idioma é um empreendimento nobre.',
  },
  {
    id: 'word_3',
    word: 'Serendipity',
    type: 'substantivo',
    translation: 'Acaso afortunado',
    definition: 'A ocorrência de eventos por um acaso benéfico ou feliz.',
    example: 'Finding this study app was pure serendipity.',
    exampleTranslation: 'Encontrar este aplicativo de estudos foi um puro acaso feliz.',
  },
  {
    id: 'word_4',
    word: 'Perseverance',
    type: 'substantivo',
    translation: 'Perseverança',
    definition: 'Persistência em fazer algo apesar da dificuldade ou demora.',
    example: 'With perseverance, fluency is just a matter of time.',
    exampleTranslation: 'Com perseverança, a fluência é apenas uma questão de tempo.',
  },
  {
    id: 'word_5',
    word: 'Eloquent',
    type: 'adjetivo',
    translation: 'Eloquente',
    definition: 'Fluente ou expressivo na fala ou na escrita.',
    example: 'She gave an eloquent speech in English yesterday.',
    exampleTranslation: 'Ela fez um discurso eloquente em inglês ontem.',
  },
  {
    id: 'word_6',
    word: 'Empowerment',
    type: 'substantivo',
    translation: 'Empoderamento / Capacitação',
    definition: 'O processo de se tornar mais forte e confiante no controle de sua vida.',
    example: 'Speaking English fluently gives you a sense of personal empowerment.',
    exampleTranslation: 'Falar inglês fluentemente dá uma sensação de empoderamento pessoal.',
  },
  {
    id: 'word_7',
    word: 'Proactive',
    type: 'adjetivo',
    translation: 'Proativo',
    definition: 'Pessoa que toma a iniciativa para fazer as coisas acontecerem antecedendo problemas.',
    example: 'Being proactive in your daily practice accelerates your learning.',
    exampleTranslation: 'Ser proativo na sua prática diária acelera seu aprendizado.',
  },
  {
    id: 'word_8',
    word: 'Mindset',
    type: 'substantivo',
    translation: 'Mentalidade / Modelo mental',
    definition: 'O conjunto de atitudes ou crenças mantidas por alguém.',
    example: 'A growth mindset is essential to master new skills.',
    exampleTranslation: 'Uma mentalidade de crescimento é essencial para dominar novas habilidades.',
  },
  {
    id: 'word_9',
    word: 'Breakthrough',
    type: 'substantivo',
    translation: 'Avanço / Conquista importante',
    definition: 'Uma descoberta ou avanço repentino e significativo.',
    example: 'Understanding native speakers without subtitles was a major breakthrough.',
    exampleTranslation: 'Entender falantes nativos sem legendas foi um grande avanço.',
  },
  {
    id: 'word_10',
    word: 'Consistency',
    type: 'substantivo',
    translation: 'Consistência / Constância',
    definition: 'Manutenção de padrões ou hábitos com regularidade ao longo do tempo.',
    example: 'Consistency is far more powerful than intensity when learning vocabulary.',
    exampleTranslation: 'A consistência é muito mais poderosa do que a intensidade ao aprender vocabulário.',
  },
  {
    id: 'word_11',
    word: 'Mastery',
    type: 'substantivo',
    translation: 'Domínio / Maestria',
    definition: 'Conhecimento ou habilidade abrangente e profundo sobre determinado assunto.',
    example: 'Daily flashcard review leads to complete mastery of the words.',
    exampleTranslation: 'A revisão diária de cartões leva ao domínio completo das palavras.',
  },
  {
    id: 'word_12',
    word: 'Tenacity',
    type: 'substantivo',
    translation: 'Tenacidade / Determinação',
    definition: 'A qualidade de se manter firme e determinado para alcançar um propósito.',
    example: 'Her tenacity in studying every morning brought incredible results.',
    exampleTranslation: 'A tenacidade dela em estudar todas as manhãs trouxe resultados incríveis.',
  },
  {
    id: 'word_13',
    word: 'Ubiquitous',
    type: 'adjetivo',
    translation: 'Onipresente / Presente em toda parte',
    definition: 'Presente, encontrado ou existente em quase todos os lugares.',
    example: 'English has become a ubiquitous language in global business.',
    exampleTranslation: 'O inglês se tornou uma língua onipresente nos negócios globais.',
  },
  {
    id: 'word_14',
    word: 'Pragmatic',
    type: 'adjetivo',
    translation: 'Pragmático / Prático',
    definition: 'Tratar as coisas de forma realista e prática com foco em resultados.',
    example: 'Taking a pragmatic approach to grammar saves time and boosts confidence.',
    exampleTranslation: 'Adotar uma abordagem pragmática da gramática economiza tempo e aumenta a confiança.',
  },
  {
    id: 'word_15',
    word: 'Versatile',
    type: 'adjetivo',
    translation: 'Versátil / Polivalente',
    definition: 'Capaz de se adaptar a muitas funções ou atividades diferentes.',
    example: 'He is a versatile professional who communicates well in multiple contexts.',
    exampleTranslation: 'Ele é um profissional versátil que se comunica bem em múltiplos contextos.',
  },
  {
    id: 'word_16',
    word: 'Integrity',
    type: 'substantivo',
    translation: 'Integridade / Honestidade',
    definition: 'A qualidade de ser honesto e ter princípios morais fortes.',
    example: 'Her professional integrity earned her the respect of international colleagues.',
    exampleTranslation: 'A integridade profissional dela lhe rendeu o respeito de colegas internacionais.',
  },
  {
    id: 'word_17',
    word: 'Synergy',
    type: 'substantivo',
    translation: 'Sinergia',
    definition: 'A cooperação de duas ou mais partes para produzir um efeito combinado superior.',
    example: 'Combining audio listening with text creates a powerful synergy for memory.',
    exampleTranslation: 'Combinar a escuta de áudio com texto cria uma forte sinergia para a memória.',
  },
  {
    id: 'word_18',
    word: 'Thrive',
    type: 'verbo',
    translation: 'Prosperar / Desenvolver-se bem',
    definition: 'Crescer ou se desenvolver vigorosamente; ter muito sucesso.',
    example: 'Students thrive when they practice a little bit every day.',
    exampleTranslation: 'Os alunos prosperam quando praticam um pouco todos os dias.',
  },
  {
    id: 'word_19',
    word: 'Insightful',
    type: 'adjetivo',
    translation: 'Esclarecedor / Profundo',
    definition: 'Que demonstra ou proporciona uma compreensão profunda de um problema.',
    example: 'The teacher provided an insightful explanation of idiomatic expressions.',
    exampleTranslation: 'O professor forneceu uma explicação esclarecedora sobre expressões idiomáticas.',
  },
  {
    id: 'word_20',
    word: 'Empathy',
    type: 'substantivo',
    translation: 'Empatia',
    definition: 'A capacidade de entender e compartilhar os sentimentos de outra pessoa.',
    example: 'Empathy helps you connect deeply when speaking with people from other cultures.',
    exampleTranslation: 'A empatia ajuda você a se conectar profundamente ao falar com pessoas de outras culturas.',
  },
  {
    id: 'word_21',
    word: 'Leverage',
    type: 'verbo / substantivo',
    translation: 'Alavancar / Aproveitar ao máximo',
    definition: 'Usar algo para obter uma vantagem máxima ou alcance maior.',
    example: 'You can leverage daily micro-learning to achieve fluency faster.',
    exampleTranslation: 'Você pode alavancar o microaprendizado diário para alcançar a fluência mais rápido.',
  },
  {
    id: 'word_22',
    word: 'Authentic',
    type: 'adjetivo',
    translation: 'Autêntico / Genuíno',
    definition: 'Fiel à sua própria personalidade, valores ou origem real.',
    example: 'Listening to authentic English podcasts improves natural pronunciation.',
    exampleTranslation: 'Ouvir podcasts de inglês autêntico melhora a pronúncia natural.',
  },
  {
    id: 'word_23',
    word: 'Grit',
    type: 'substantivo',
    translation: 'Garra / Determinação inabalável',
    definition: 'Coragem e firmeza de caráter ao enfrentar dificuldades prolongadas.',
    example: 'Grit is the secret ingredient behind mastering any difficult skill.',
    exampleTranslation: 'A garra é o ingrediente secreto por trás do domínio de qualquer habilidade difícil.',
  },
  {
    id: 'word_24',
    word: 'Meticulous',
    type: 'adjetivo',
    translation: 'Meticuloso / Detalhista',
    definition: 'Que demonstra muita atenção aos detalhes; extremamente cuidadoso.',
    example: 'His meticulous review of new cards guaranteed long-term retention.',
    exampleTranslation: 'Sua revisão meticulosa de novos cartões garantiu a retenção de longo prazo.',
  },
  {
    id: 'word_25',
    word: 'Compelling',
    type: 'adjetivo',
    translation: 'Cativante / Convincente',
    definition: 'Que atrai uma atenção forte e irresistível pela sua qualidade.',
    example: 'She shared a compelling story during the international meeting.',
    exampleTranslation: 'Ela compartilhou uma história cativante durante a reunião internacional.',
  },
  {
    id: 'word_26',
    word: 'Resolute',
    type: 'adjetivo',
    translation: 'Resoluto / Firme em seu propósito',
    definition: 'Admiravelmente determinado e inabalável em uma decisão.',
    example: 'Be resolute in your commitment to study English every single day.',
    exampleTranslation: 'Seja resoluto no seu compromisso de estudar inglês todos os dias.',
  },
  {
    id: 'word_27',
    word: 'Exemplary',
    type: 'adjetivo',
    translation: 'Exemplar',
    definition: 'Que serve como um modelo ideal a ser seguido.',
    example: 'Your study streak on Uply is exemplary!',
    exampleTranslation: 'Sua sequência de estudos no Uply é exemplar!',
  },
  {
    id: 'word_28',
    word: 'Innovation',
    type: 'substantivo',
    translation: 'Inovação',
    definition: 'A introdução de algo novo; novos métodos ou ideias.',
    example: 'Gamified learning is an effective innovation in modern education.',
    exampleTranslation: 'O aprendizado gamificado é uma inovação eficaz na educação moderna.',
  },
  {
    id: 'word_29',
    word: 'Unwavering',
    type: 'adjetivo',
    translation: 'Inabalável / Firme',
    definition: 'Que não vacila, hesita ou fraqueja em momento algum.',
    example: 'With unwavering focus, you will reach your fluency goals.',
    exampleTranslation: 'Com foco inabalável, você alcançará suas metas de fluência.',
  },
  {
    id: 'word_30',
    word: 'Wisdom',
    type: 'substantivo',
    translation: 'Sabedoria',
    definition: 'A qualidade de ter experiência, conhecimento e bom senso.',
    example: 'Wisdom comes from small, continuous efforts accumulated over time.',
    exampleTranslation: 'A sabedoria vem de pequenos esforços contínuos acumulados ao longo do tempo.',
  },
]

const LS_WORDS_KEY = 'uply_words_of_the_day'

function getLocalWords(): WordOfTheDay[] {
  const data = localStorage.getItem(LS_WORDS_KEY)
  if (!data) {
    localStorage.setItem(LS_WORDS_KEY, JSON.stringify(INITIAL_WORDS_OF_THE_DAY))
    return INITIAL_WORDS_OF_THE_DAY
  }
  try {
    const parsed: WordOfTheDay[] = JSON.parse(data)
    return parsed.sort((a, b) => a.word.localeCompare(b.word))
  } catch {
    return INITIAL_WORDS_OF_THE_DAY
  }
}

function saveLocalWords(words: WordOfTheDay[]) {
  localStorage.setItem(LS_WORDS_KEY, JSON.stringify(words))
}

export const wordsOfTheDayService = {
  async getAllWords(): Promise<WordOfTheDay[]> {
    if (isLocalMode || !supabase) {
      return getLocalWords().sort((a, b) => a.word.localeCompare(b.word))
    }

    try {
      const { data, error } = await supabase
        .from('words_of_the_day')
        .select('*')
        .order('word', { ascending: true })

      if (error || !data || data.length === 0) {
        return getLocalWords().sort((a, b) => a.word.localeCompare(b.word))
      }
      return data.sort((a, b) => a.word.localeCompare(b.word))
    } catch {
      return getLocalWords().sort((a, b) => a.word.localeCompare(b.word))
    }
  },

  async addWord(wordData: Omit<WordOfTheDay, 'id' | 'created_at'>): Promise<WordOfTheDay> {
    const newWord: WordOfTheDay = {
      ...wordData,
      id: 'word_' + generateId(),
      created_at: new Date().toISOString(),
    }

    if (isLocalMode || !supabase) {
      const words = getLocalWords()
      words.push(newWord)
      saveLocalWords(words)
      return newWord
    }

    try {
      const { data, error } = await supabase
        .from('words_of_the_day')
        .insert(wordData)
        .select()
        .single()

      if (error || !data) throw error
      return data
    } catch {
      const words = getLocalWords()
      words.push(newWord)
      saveLocalWords(words)
      return newWord
    }
  },

  async updateWord(id: string, updates: Partial<WordOfTheDay>): Promise<WordOfTheDay> {
    if (isLocalMode || !supabase) {
      const words = getLocalWords()
      const idx = words.findIndex(w => w.id === id)
      if (idx === -1) throw new Error('Palavra não encontrada.')
      words[idx] = { ...words[idx], ...updates }
      saveLocalWords(words)
      return words[idx]
    }

    try {
      const { data, error } = await supabase
        .from('words_of_the_day')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error || !data) throw error
      return data
    } catch {
      const words = getLocalWords()
      const idx = words.findIndex(w => w.id === id)
      if (idx === -1) throw new Error('Palavra não encontrada.')
      words[idx] = { ...words[idx], ...updates }
      saveLocalWords(words)
      return words[idx]
    }
  },

  async deleteWord(id: string): Promise<void> {
    if (isLocalMode || !supabase) {
      const words = getLocalWords().filter(w => w.id !== id)
      saveLocalWords(words)
      return
    }

    try {
      await supabase.from('words_of_the_day').delete().eq('id', id)
    } catch {
      const words = getLocalWords().filter(w => w.id !== id)
      saveLocalWords(words)
    }
  },

  async getTodayWord(): Promise<WordOfTheDay> {
    const words = await this.getAllWords()
    if (!words || words.length === 0) return INITIAL_WORDS_OF_THE_DAY[0]

    const now = new Date()
    const localDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const baseDate = new Date(2026, 0, 1)
    const diffInMs = localDateObj.getTime() - baseDate.getTime()
    const dayIndex = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    const safeIndex = Math.abs(dayIndex) % words.length
    return words[safeIndex]
  }
}
