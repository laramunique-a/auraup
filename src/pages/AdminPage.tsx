import { useState, useEffect } from 'react'
import { supabase, isLocalMode, generateId } from '../services/storage'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Toast, useToast } from '../components/ui/Toast'
import { useSpeech } from '../hooks/useSpeech'
import { compressImage } from '../lib/utils'
import { 
  UserPlus, Users, Pencil, Trash2, Plus, Coins, Sparkles, 
  ShieldCheck, BookOpen, Eye, EyeOff, Volume2, Image as ImageIcon, 
  Link as LinkIcon, X, Info, ArrowLeft, ArrowRight, Check, LayoutGrid, List,
  ChevronDown
} from 'lucide-react'
import type { User } from '../types'
import { officialDeckService, type OfficialDeck, type OfficialCard } from '../services/officialDeck.service'
import { wordsOfTheDayService, type WordOfTheDay } from '../data/wordsOfTheDay'
import { isEnglishText } from '../lib/speechUtils'
import { authService } from '../services/auth.service'

const AVATARS: Record<string, string> = {
  avatar_1: '🦊', avatar_2: '🐨', avatar_3: '🦁',
  avatar_4: '🐼', avatar_5: '🦉', avatar_6: '🦖',
  admin: '👑',
}

export function AdminPage() {
  const { toast, show } = useToast()
  const { speak } = useSpeech()
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'decks' | 'words'>('users')
  const [activeModal, setActiveModal] = useState<'addUser' | 'addLevel' | 'editLevel' | 'editBalance' | 'viewLeagueUsers' | 'officialDeck' | 'wordOfTheDay' | null>(null)
  
  // Novo Usuário Form
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newInitialPassword, setNewInitialPassword] = useState('aura123')
  const [selectedLevelId, setSelectedLevelId] = useState('')
  const [showLevelDropdown, setShowLevelDropdown] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form Baralho Padrão (2-Step Modal)
  const [deckFormStep, setDeckFormStep] = useState<1 | 2>(1)
  const [officialDecks, setOfficialDecks] = useState<OfficialDeck[]>([])
  const [editingOfficialDeck, setEditingOfficialDeck] = useState<OfficialDeck | null>(null)
  const [offName, setOffName] = useState('')
  const [offDesc, setOffDesc] = useState('')
  const [offLevel, setOffLevel] = useState('Todos')
  const [offPublished, setOffPublished] = useState(true)
  const [offCards, setOffCards] = useState<OfficialCard[]>([{ front: '', back: '', front_audio: true, back_audio: false }])
  const [savingOfficialDeck, setSavingOfficialDeck] = useState(false)

  // Form Palavra do Dia & View Mode
  const [wordsOfTheDay, setWordsOfTheDay] = useState<WordOfTheDay[]>([])
  const [wordViewMode, setWordViewMode] = useState<'grid' | 'list'>('grid')
  const [editingWord, setEditingWord] = useState<WordOfTheDay | null>(null)
  const [wordWord, setWordWord] = useState('')
  const [wordType, setWordType] = useState('substantivo')
  const [wordTranslation, setWordTranslation] = useState('')
  const [wordDefinition, setWordDefinition] = useState('')
  const [wordExample, setWordExample] = useState('')
  const [wordExampleTranslation, setWordExampleTranslation] = useState('')
  const [savingWord, setSavingWord] = useState(false)

const LS_ADMIN_USERS = 'uply_admin_users'
const LS_ADMIN_LEVELS = 'uply_admin_levels'

const DEFAULT_LOCAL_LEVELS = [
  { id: 'lvl_1', name: 'Nível 1: Hello', min_xp: 0, color: '#FF8A00' },
  { id: 'lvl_2', name: 'Nível 2: Connections', min_xp: 500, color: '#00E676' },
  { id: 'lvl_3', name: 'Nível 3: Discovery', min_xp: 1500, color: '#00A3FF' },
  { id: 'lvl_4', name: 'Nível 4: Mastery', min_xp: 3000, color: '#8B5CF6' },
]

const DEFAULT_LOCAL_STUDENTS: User[] = [
  {
    id: 'user_1',
    name: 'Lucas Andrade',
    nickname: 'Lucas',
    email: 'lucas.andrade@email.com',
    role: 'user',
    avatar_id: 'avatar_3',
    xp: 2850,
    coins: 140,
    streak: 14,
    level_id: 'lvl_3',
    level: { id: 'lvl_3', name: 'Nível 3: Discovery', min_xp: 1500, color: '#00A3FF' }
  },
  {
    id: 'user_2',
    name: 'Beatriz Lima',
    nickname: 'Bia',
    email: 'beatriz.lima@email.com',
    role: 'user',
    avatar_id: 'avatar_1',
    xp: 2420,
    coins: 95,
    streak: 10,
    level_id: 'lvl_3',
    level: { id: 'lvl_3', name: 'Nível 3: Discovery', min_xp: 1500, color: '#00A3FF' }
  },
  {
    id: 'user_3',
    name: 'Carlos Eduardo',
    nickname: 'Cadu',
    email: 'carlos.edu@email.com',
    role: 'user',
    avatar_id: 'avatar_5',
    xp: 1200,
    coins: 45,
    streak: 7,
    level_id: 'lvl_2',
    level: { id: 'lvl_2', name: 'Nível 2: Connections', min_xp: 500, color: '#00E676' }
  },
  {
    id: 'user_4',
    name: 'Mariana Costa',
    nickname: 'Mari',
    email: 'mariana.costa@email.com',
    role: 'user',
    avatar_id: 'avatar_4',
    xp: 450,
    coins: 20,
    streak: 3,
    level_id: 'lvl_1',
    level: { id: 'lvl_1', name: 'Nível 1: Hello', min_xp: 0, color: '#FF8A00' }
  }
]

function getLocalAdminUsers(): User[] {
  try {
    const raw = localStorage.getItem(LS_ADMIN_USERS)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(LS_ADMIN_USERS, JSON.stringify(DEFAULT_LOCAL_STUDENTS))
    return DEFAULT_LOCAL_STUDENTS
  } catch {
    return DEFAULT_LOCAL_STUDENTS
  }
}

function saveLocalAdminUsers(usersList: User[]) {
  localStorage.setItem(LS_ADMIN_USERS, JSON.stringify(usersList))
}

function getLocalAdminLevels(): any[] {
  try {
    const raw = localStorage.getItem(LS_ADMIN_LEVELS)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(LS_ADMIN_LEVELS, JSON.stringify(DEFAULT_LOCAL_LEVELS))
    return DEFAULT_LOCAL_LEVELS
  } catch {
    return DEFAULT_LOCAL_LEVELS
  }
}

function saveLocalAdminLevels(levelsList: any[]) {
  localStorage.setItem(LS_ADMIN_LEVELS, JSON.stringify(levelsList))
}

  useEffect(() => {
    loadUsers()
    loadLevels()
    loadOfficialDecks()
    loadWordsOfTheDay()
  }, [])

  async function loadUsers() {
    if (isLocalMode || !supabase) {
      setUsers(getLocalAdminUsers())
      return
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, level:levels(*)')
        .order('created_at', { ascending: false })
      
      if (error || !data || data.length === 0) {
        setUsers(getLocalAdminUsers())
        return
      }
      setUsers(data)
    } catch {
      setUsers(getLocalAdminUsers())
    }
  }

  async function loadOfficialDecks() {
    try {
      const decks = await officialDeckService.getOfficialDecks(false)
      setOfficialDecks(decks)
    } catch {
      show('Erro ao carregar baralhos oficiais.', 'error')
    }
  }

  async function loadWordsOfTheDay() {
    try {
      const words = await wordsOfTheDayService.getAllWords()
      setWordsOfTheDay(words.sort((a, b) => a.word.localeCompare(b.word)))
    } catch {
      show('Erro ao carregar palavras do dia.', 'error')
    }
  }

  async function handleCreateUser() {
    if (!newEmail || !newName) return
    if (newInitialPassword.length < 6) {
      show('A senha padrão deve ter no mínimo 6 caracteres.', 'error')
      return
    }

    setCreating(true)
    try {
      if (isLocalMode || !supabase) {
        const localLevels = getLocalAdminLevels()
        const selectedLvl = localLevels.find(l => l.id === selectedLevelId) || localLevels[0]
        const initialXP = selectedLvl ? (selectedLvl.min_xp || 0) : 0

        const newUser = await authService.adminRegisterStudent({
          name: newName.trim(),
          email: newEmail.trim(),
          initialPassword: newInitialPassword.trim(),
          level_id: selectedLvl?.id || 'lvl_1',
          level: selectedLvl,
          initialXP
        })

        const currentList = getLocalAdminUsers()
        currentList.unshift(newUser)
        saveLocalAdminUsers(currentList)
        setUsers(currentList)
        setActiveModal(null)
        setNewEmail('')
        setNewName('')
        setNewInitialPassword('aura123')
        setSelectedLevelId('')
        show(`Aluno cadastrado com sucesso com ${initialXP} XP inicial!`, 'success')
        return
      }

      const selectedLvl = levels.find(l => l.id === selectedLevelId)
      const initialXP = selectedLvl ? (selectedLvl.min_xp || 0) : 0

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { 
          email: newEmail.trim(), 
          password: newInitialPassword.trim() || 'aura123', 
          name: newName.trim(),
          level_id: selectedLevelId || undefined,
          xp: initialXP,
          must_change_password: true
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      if (data?.user?.id) {
        await supabase.from('profiles').update({ 
          xp: initialXP,
          must_change_password: true
        }).eq('id', data.user.id)
      }

      setActiveModal(null)
      setNewEmail('')
      setNewName('')
      setNewInitialPassword('aura123')
      setSelectedLevelId('')
      show(`Aluno cadastrado com sucesso com ${initialXP} XP inicial!`, 'success')
      await loadUsers()
    } catch (err: any) {
      show(err.message || 'Erro ao criar usuário.', 'error')
    } finally {
      setCreating(false)
    }
  }

  // Official Deck Handlers
  function resetOfficialDeckForm() {
    setDeckFormStep(1)
    setEditingOfficialDeck(null)
    setOffName('')
    setOffDesc('')
    setOffLevel('Todos')
    setOffPublished(true)
    setOffCards([{ front: '', back: '', front_audio: true, back_audio: false }])
  }

  function openCreateOfficialDeck() {
    resetOfficialDeckForm()
    setActiveModal('officialDeck')
  }

  function openEditOfficialDeck(deck: OfficialDeck) {
    setDeckFormStep(1)
    setEditingOfficialDeck(deck)
    setOffName(deck.name)
    setOffDesc(deck.description || '')
    setOffLevel(deck.level || deck.category || 'Todos')
    setOffPublished(deck.is_published)
    setOffCards(deck.cards && deck.cards.length > 0 ? deck.cards.map(c => ({ ...c, front_audio: c.front_audio !== false, back_audio: !!c.back_audio })) : [{ front: '', back: '', front_audio: true, back_audio: false }])
    setActiveModal('officialDeck')
  }

  async function handleSaveOfficialDeck() {
    if (!offName.trim()) return
    setSavingOfficialDeck(true)
    const validCards = offCards
      .filter(c => c.front.trim() || c.front_image || c.back.trim() || c.back_image)
      .map(c => ({
        ...c,
        front_audio: c.front_audio && isEnglishText(c.front),
        back_audio: c.back_audio && isEnglishText(c.back),
      }))
    
    try {
      if (editingOfficialDeck) {
        await officialDeckService.updateOfficialDeck(editingOfficialDeck.id, {
          name: offName.trim(),
          description: offDesc.trim(),
          level: offLevel,
          category: offLevel,
          is_published: offPublished,
          cards: validCards,
        })
        show('Baralho padrão atualizado! ✨', 'success')
      } else {
        await officialDeckService.createOfficialDeck({
          name: offName.trim(),
          description: offDesc.trim(),
          level: offLevel,
          category: offLevel,
          is_published: offPublished,
          cards: validCards,
        })
        show('Baralho padrão criado com sucesso! 🚀', 'success')
      }
      setActiveModal(null)
      resetOfficialDeckForm()
      await loadOfficialDecks()
    } catch {
      show('Erro ao salvar baralho padrão.', 'error')
    } finally {
      setSavingOfficialDeck(false)
    }
  }

  async function handleTogglePublish(id: string) {
    try {
      const nextState = await officialDeckService.togglePublish(id)
      show(nextState ? 'Baralho publicado na Loja! 🌐' : 'Baralho ocultado da Loja. 🔒', 'info')
      await loadOfficialDecks()
    } catch {
      show('Erro ao alterar status de publicação.', 'error')
    }
  }

  async function handleDeleteOfficialDeck(id: string) {
    if (!confirm('Excluir este baralho padrão permanentemente?')) return
    try {
      await officialDeckService.deleteOfficialDeck(id)
      show('Baralho padrão removido.', 'success')
      await loadOfficialDecks()
    } catch {
      show('Erro ao excluir baralho padrão.', 'error')
    }
  }

  // Word of the Day Handlers
  function resetWordForm() {
    setEditingWord(null)
    setWordWord('')
    setWordType('substantivo')
    setWordTranslation('')
    setWordDefinition('')
    setWordExample('')
    setWordExampleTranslation('')
  }

  function openCreateWord() {
    resetWordForm()
    setActiveModal('wordOfTheDay')
  }

  function openEditWord(word: WordOfTheDay) {
    setEditingWord(word)
    setWordWord(word.word)
    setWordType(word.type || 'substantivo')
    setWordTranslation(word.translation)
    setWordDefinition(word.definition)
    setWordExample(word.example)
    setWordExampleTranslation(word.exampleTranslation)
    setActiveModal('wordOfTheDay')
  }

  async function handleSaveWord() {
    if (!wordWord.trim() || !wordTranslation.trim() || !wordDefinition.trim()) return
    setSavingWord(true)

    const payload = {
      word: wordWord.trim(),
      type: wordType.trim(),
      translation: wordTranslation.trim(),
      definition: wordDefinition.trim(),
      example: wordExample.trim(),
      exampleTranslation: wordExampleTranslation.trim(),
    }

    try {
      if (editingWord && editingWord.id) {
        await wordsOfTheDayService.updateWord(editingWord.id, payload)
        show('Palavra do dia atualizada! ✨', 'success')
      } else {
        await wordsOfTheDayService.addWord(payload)
        show('Palavra do dia adicionada com sucesso! 🚀', 'success')
      }
      setActiveModal(null)
      resetWordForm()
      await loadWordsOfTheDay()
    } catch {
      show('Erro ao salvar palavra do dia.', 'error')
    } finally {
      setSavingWord(false)
    }
  }

  async function handleDeleteWord(id: string) {
    if (!confirm('Excluir esta palavra do dia permanentemente?')) return
    try {
      await wordsOfTheDayService.deleteWord(id)
      show('Palavra do dia removida.', 'success')
      await loadWordsOfTheDay()
    } catch {
      show('Erro ao excluir palavra do dia.', 'error')
    }
  }

  // Handlers para Imagem e Audio nos Cards do Baralho Padrão
  async function handleCardImageUpload(e: React.ChangeEvent<HTMLInputElement>, index: number, side: 'front' | 'back') {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await compressImage(file)
      const updated = [...offCards]
      if (side === 'front') {
        updated[index].front_image = base64
      } else {
        updated[index].back_image = base64
      }
      setOffCards(updated)
    } catch {
      show('Erro ao processar imagem.', 'error')
    }
  }

  function handleCardImageUrlChange(url: string, index: number, side: 'front' | 'back') {
    const updated = [...offCards]
    if (side === 'front') {
      updated[index].front_image = url.trim() ? url.trim() : undefined
    } else {
      updated[index].back_image = url.trim() ? url.trim() : undefined
    }
    setOffCards(updated)
  }

  async function handleCardPaste(e: React.ClipboardEvent, index: number, side: 'front' | 'back') {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          try {
            const base64 = await compressImage(file)
            const updated = [...offCards]
            if (side === 'front') {
              updated[index].front_image = base64
            } else {
              updated[index].back_image = base64
            }
            setOffCards(updated)
            show('Imagem colada no card com sucesso! ✨', 'success')
          } catch {
            show('Erro ao colar imagem.', 'error')
          }
        }
      }
    }
  }

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [adjustXP, setAdjustXP] = useState<string | number>(0)
  const [adjustCoins, setAdjustCoins] = useState<string | number>(0)
  const [updatingBalance, setUpdatingBalance] = useState(false)

  async function handleUpdateBalance() {
    if (!selectedUser) return
    setUpdatingBalance(true)
    const xpToAdd = parseInt(adjustXP.toString()) || 0
    const coinsToAdd = parseInt(adjustCoins.toString()) || 0

    try {
      if (isLocalMode || !supabase) {
        const currentList = getLocalAdminUsers()
        const idx = currentList.findIndex(u => u.id === selectedUser.id)
        if (idx !== -1) {
          currentList[idx] = {
            ...currentList[idx],
            xp: Math.max(0, (currentList[idx].xp || 0) + xpToAdd),
            coins: Math.max(0, (currentList[idx].coins || 0) + coinsToAdd)
          }
          saveLocalAdminUsers(currentList)
          setUsers([...currentList])
        }

        // Se for o usuário conectado atualmente, sincronizar também uply_user e economia
        const rawUser = localStorage.getItem('uply_user')
        if (rawUser) {
          const currentLogged = JSON.parse(rawUser)
          if (currentLogged.id === selectedUser.id || selectedUser.id === 'user_1') {
            currentLogged.xp = Math.max(0, (currentLogged.xp || 0) + xpToAdd)
            currentLogged.coins = Math.max(0, (currentLogged.coins || 0) + coinsToAdd)
            localStorage.setItem('uply_user', JSON.stringify(currentLogged))
          }
        }
        const savedEco = localStorage.getItem('uply_economy_state')
        if (savedEco) {
          const eco = JSON.parse(savedEco)
          eco.xp = Math.max(0, (eco.xp || 0) + xpToAdd)
          eco.coins = Math.max(0, (eco.coins || 0) + coinsToAdd)
          localStorage.setItem('uply_economy_state', JSON.stringify(eco))
          window.dispatchEvent(new CustomEvent('uply_economy_sync'))
        }

        show('Saldo atualizado com sucesso!', 'success')
        setActiveModal(null)
        return
      }

      const { error } = await supabase.rpc('add_user_reward', {
        user_id: selectedUser.id,
        xp_to_add: xpToAdd,
        coins_to_add: coinsToAdd
      })
      if (error) throw error
      show('Saldo atualizado com sucesso!', 'success')
      setActiveModal(null)
      await loadUsers()
    } catch {
      show('Erro ao atualizar saldo.', 'error')
    } finally {
      setUpdatingBalance(false)
    }
  }

  const [levels, setLevels] = useState<any[]>([])
  const [editingLevel, setEditingLevel] = useState<any>(null)
  const [newLevelName, setNewLevelName] = useState('')
  const [newLevelXP, setNewLevelXP] = useState<string | number>(0)
  const [newLevelColor, setNewLevelColor] = useState('#6366f1')

  const PRESET_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

  async function loadLevels() {
    if (isLocalMode || !supabase) {
      setLevels(getLocalAdminLevels())
      return
    }
    try {
      const { data, error } = await supabase.from('levels').select('*').order('min_xp', { ascending: true })
      if (error || !data || data.length === 0) {
        setLevels(getLocalAdminLevels())
        return
      }
      setLevels(data)
    } catch {
      setLevels(getLocalAdminLevels())
    }
  }

  async function handleCreateLevel() {
    const minXp = parseInt(newLevelXP.toString()) || 0
    if (isLocalMode || !supabase) {
      const newLvl = {
        id: 'lvl_' + generateId(),
        name: newLevelName.trim() || 'Nova Liga',
        min_xp: minXp,
        color: newLevelColor
      }
      const list = getLocalAdminLevels()
      list.push(newLvl)
      list.sort((a, b) => a.min_xp - b.min_xp)
      saveLocalAdminLevels(list)
      setLevels(list)
      show('Liga criada!', 'success')
      setActiveModal(null)
      setNewLevelName('')
      setNewLevelXP(0)
      return
    }

    const { error } = await supabase.from('levels').insert({
      name: newLevelName,
      min_xp: minXp,
      color: newLevelColor
    })
    if (error) show('Erro ao criar liga.', 'error')
    else {
      show('Liga criada!', 'success')
      setActiveModal(null)
      setNewLevelName('')
      setNewLevelXP(0)
      loadLevels()
    }
  }

  async function handleUpdateLevel() {
    if (!editingLevel) return
    const minXp = parseInt(newLevelXP.toString()) || 0
    if (isLocalMode || !supabase) {
      const list = getLocalAdminLevels()
      const idx = list.findIndex(l => l.id === editingLevel.id)
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          name: newLevelName.trim() || list[idx].name,
          min_xp: minXp,
          color: newLevelColor
        }
        list.sort((a, b) => a.min_xp - b.min_xp)
        saveLocalAdminLevels(list)
        setLevels(list)

        // Sincronizar alunos dessa liga que tenham menos que o novo XP mínimo
        const usersList = getLocalAdminUsers()
        let updatedUsers = false
        for (const u of usersList) {
          if (u.level_id === editingLevel.id && (u.xp || 0) < minXp) {
            u.xp = minXp
            updatedUsers = true
          }
        }
        if (updatedUsers) {
          saveLocalAdminUsers(usersList)
          setUsers([...usersList])
        }
      }
      show('Liga atualizada!', 'success')
      setActiveModal(null)
      setEditingLevel(null)
      setNewLevelName('')
      setNewLevelXP(0)
      return
    }

    const { error } = await supabase
      .from('levels')
      .update({
        name: newLevelName,
        min_xp: minXp,
        color: newLevelColor
      })
      .eq('id', editingLevel.id)

    if (error) show('Erro ao atualizar liga.', 'error')
    else {
      await supabase.rpc('sync_league_xp', {
        target_level_id: editingLevel.id,
        new_min_xp: minXp
      })
      show('Liga atualizada!', 'success')
      setActiveModal(null)
      setEditingLevel(null)
      setNewLevelName('')
      setNewLevelXP(0)
      loadLevels()
      loadUsers()
    }
  }

  async function handleDeleteLevel() {
    if (!editingLevel) return
    if (!confirm('Tem certeza que deseja remover esta liga?')) return

    if (isLocalMode || !supabase) {
      const list = getLocalAdminLevels().filter(l => l.id !== editingLevel.id)
      saveLocalAdminLevels(list)
      setLevels(list)
      show('Liga removida!', 'success')
      setActiveModal(null)
      return
    }

    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('level_id', editingLevel.id)
    if (countError) return show('Erro ao verificar alunos.', 'error')
    if (count && count > 0) return show(`Não é possível deletar liga com ${count} alunos.`, 'error')
    
    const { error } = await supabase.from('levels').delete().eq('id', editingLevel.id)
    if (error) show('Erro ao deletar liga.', 'error')
    else {
      show('Liga removida!', 'success')
      setActiveModal(null)
      loadLevels()
    }
  }

  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string | null>(null)
  const allStudents = users.filter(u => u.role === 'user')
  const leagueStudents = users.filter(u => u.role === 'user' && u.level_id === selectedLevelFilter)

  // Combina opções de Níveis (Todos + Ligas do Sistema)
  const availableLevelOptions = ['Todos', ...new Set(levels.map(l => l.name))]

  // Lista de Palavras sempre ordenada alfabeticamente
  const sortedWordsOfTheDay = [...wordsOfTheDay].sort((a, b) => a.word.localeCompare(b.word))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      {/* Header com Navegação de Abas */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
              Painel <span className="text-blue-600 dark:text-blue-400">Admin</span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
            Gerencie o ecossistema <strong className="text-slate-700 dark:text-slate-300">AuraUP</strong>, <strong className="text-blue-600 dark:text-blue-400">baralhos oficiais</strong> e <strong className="text-amber-600 dark:text-amber-400">palavras do dia</strong>.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant={activeTab === 'users' ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveTab('users')}>
            <Users size={16} /> Alunos & Ligas
          </Button>
          <Button variant={activeTab === 'decks' ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveTab('decks')}>
            <BookOpen size={16} /> Baralhos Oficiais
          </Button>
          <Button variant={activeTab === 'words' ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveTab('words')}>
            <Sparkles size={16} /> Palavras do Dia
          </Button>
        </div>
      </header>

      {/* Grid de Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <AdminStatCard icon={<Users size={22} />} label="Alunos ativos" value={allStudents.length} color="blue" />
        <AdminStatCard icon={<BookOpen size={22} />} label="Baralhos oficiais" value={officialDecks.length} color="amber" />
        <AdminStatCard icon={<Sparkles size={22} />} label="Palavras cadastradas" value={wordsOfTheDay.length} color="emerald" />
      </div>

      {activeTab === 'users' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Gestão de Alunos */}
          <section className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-heading font-semibold text-slate-800 dark:text-white">Alunos Cadastrados</h2>
                <span className="text-xs font-heading font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800 shadow-xs">
                  <span className="font-bold">{allStudents.length}</span> {allStudents.length === 1 ? 'aluno' : 'alunos'}
                </span>
              </div>
              <Button variant="primary" size="sm" onClick={() => setActiveModal('addUser')}>
                <UserPlus size={15} /> Novo Aluno
              </Button>
            </div>

            <div className="card-3d overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl bg-white dark:bg-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Aluno</th>
                      <th className="py-3 px-4">Liga Atual</th>
                      <th className="py-3 px-4">Saldo</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                    {allStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Nenhum aluno cadastrado ainda.
                        </td>
                      </tr>
                    ) : (
                      allStudents.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-base shrink-0 border border-slate-200/60 dark:border-slate-600 shadow-xs">
                                {AVATARS[u.avatar_id] || '👤'}
                              </div>
                              <div>
                                <div className="font-heading font-semibold text-slate-800 dark:text-white leading-tight">{u.nickname || u.name}</div>
                                <div className="text-xs text-slate-400 font-normal">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-heading font-semibold px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200">
                              {u.level?.name || 'Iniciante'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                <Sparkles size={13} className="fill-amber-500 text-amber-500" />
                                <span className="font-semibold">{u.xp}</span> XP
                              </div>
                              <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-medium">
                                <Coins size={13} className="fill-amber-500 text-amber-500" />
                                <span className="font-semibold">{u.coins}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => {
                                setSelectedUser(u)
                                setAdjustXP(0); setAdjustCoins(0)
                                setActiveModal('editBalance')
                              }}
                            >
                              Premiar
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Sidebar: Ligas */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg sm:text-xl font-heading font-semibold text-slate-800 dark:text-white">Ligas</h2>
              <Button variant="primary" size="sm" onClick={() => setActiveModal('addLevel')}>
                <Plus size={15} /> Nova Liga
              </Button>
            </div>
            
            <div className="space-y-2.5">
              {levels.map((lvl) => (
                <div 
                  key={lvl.id} 
                  onClick={() => { setSelectedLevelFilter(lvl.id); setActiveModal('viewLeagueUsers') }}
                  className="card-3d-interactive p-3.5 flex justify-between items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs cursor-pointer hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2 h-7 rounded-sm shrink-0" 
                      style={{ backgroundColor: lvl.color || '#3B82F6' }} 
                    />
                    <div>
                      <div className="font-heading font-semibold text-sm text-slate-800 dark:text-white leading-tight">{lvl.name}</div>
                      <div className="text-xs font-normal text-slate-400 mt-0.5">Mínimo <span className="font-semibold text-slate-600 dark:text-slate-300">{lvl.min_xp} XP</span></div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingLevel(lvl)
                      setNewLevelName(lvl.name)
                      setNewLevelXP(lvl.min_xp)
                      setActiveModal('editLevel')
                    }}
                    className="btn-3d-icon w-8 h-8 !rounded-lg text-slate-500 hover:text-blue-600"
                    title="Editar Liga"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </div>
      ) : activeTab === 'decks' ? (
        /* Gestão de Baralhos Padrões */
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 900 }}>Baralhos Oficiais Administráveis</h2>
            <Button variant="vibrant" size="sm" onClick={openCreateOfficialDeck}>
              <Plus size={16} /> Criar Baralho Padrão
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {officialDecks.map((deck) => (
              <div key={deck.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: '8px' }}>
                      NÍVEL: {deck.level || 'Todos'}
                    </span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 900, marginTop: '0.5rem' }}>{deck.name}</h3>
                  </div>

                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: '50px',
                    background: deck.is_published ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: deck.is_published ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {deck.is_published ? 'PUBLICADO' : 'OCULTO'}
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500, flex: 1 }}>
                  {deck.description || 'Sem descrição.'}
                </p>

                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  🎴 {deck.cards?.length || 0} cards inclusos
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleTogglePublish(deck.id)} 
                    style={{ flex: 1 }}
                  >
                    {deck.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                    {deck.is_published ? 'Ocultar' : 'Publicar'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => openEditOfficialDeck(deck)}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteOfficialDeck(deck.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* Gestão de Palavras do Dia (Com Modos Quadros / Lista e Ordem Alfabética) */
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 900 }}>Gerenciamento de Palavras do Dia (A-Z)</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {sortedWordsOfTheDay.length} palavras registradas em ordem alfabética.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Botões de Alternância de Visualização (Quadros / Lista) */}
              <div style={{ 
                background: 'var(--bg-surface)', padding: '4px', borderRadius: '14px', 
                border: '1px solid var(--border)', display: 'flex', gap: '4px' 
              }}>
                <button
                  onClick={() => setWordViewMode('grid')}
                  style={{
                    padding: '6px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: wordViewMode === 'grid' ? 'var(--accent)' : 'transparent',
                    color: wordViewMode === 'grid' ? 'white' : 'var(--text-muted)',
                    fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem'
                  }}
                  title="Visualização em Quadros"
                >
                  <LayoutGrid size={15} /> Quadros
                </button>

                <button
                  onClick={() => setWordViewMode('list')}
                  style={{
                    padding: '6px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: wordViewMode === 'list' ? 'var(--accent)' : 'transparent',
                    color: wordViewMode === 'list' ? 'white' : 'var(--text-muted)',
                    fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem'
                  }}
                  title="Visualização em Lista (Compacta)"
                >
                  <List size={15} /> Lista
                </button>
              </div>

              <Button variant="vibrant" size="sm" onClick={openCreateWord}>
                <Plus size={16} /> Nova Palavra
              </Button>
            </div>
          </div>

          {wordViewMode === 'grid' ? (
            /* Visualização 1: QUADROS (GRID) */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {sortedWordsOfTheDay.map((w, idx) => (
                <div key={w.id || idx} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent)' }}>{w.word}</h3>
                        <button onClick={() => speak(w.word, 'en-US')} className="btn-icon-soft" style={{ width: '28px', height: '28px' }} title="Ouvir pronúncia">
                          <Volume2 size={14} />
                        </button>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {w.type}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button onClick={() => openEditWord(w)} className="btn-icon-soft" title="Editar palavra">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => w.id && handleDeleteWord(w.id)} className="btn-icon-soft danger" title="Excluir palavra">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {w.translation}
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {w.definition}
                    </p>
                  </div>

                  <div style={{ fontSize: '0.8125rem', background: 'var(--accent-glow)', padding: '0.75rem', borderRadius: '12px' }}>
                    <p style={{ fontStyle: 'italic', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.25rem' }}>
                      "{w.example}"
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {w.exampleTranslation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Visualização 2: LISTA COMPACTA (TABELA) */
            <div className="card" style={{ overflow: 'hidden', border: 'none', transform: 'none', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', background: 'var(--bg-surface)' }}>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Palavra / Pronúncia</th>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tradução & Classe</th>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Definição Explicativa</th>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exemplo em Inglês</th>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedWordsOfTheDay.map((w, idx) => (
                      <tr key={w.id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--accent)' }}>{w.word}</span>
                            <button onClick={() => speak(w.word, 'en-US')} className="btn-icon-soft" style={{ width: '26px', height: '26px' }} title="Ouvir pronúncia">
                              <Volume2 size={13} />
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{w.translation}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{w.type}</div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500, maxWidth: '280px' }}>
                          {w.definition}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', maxWidth: '280px' }}>
                          <div style={{ fontStyle: 'italic', fontWeight: 700, color: 'var(--accent)' }}>"{w.example}"</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{w.exampleTranslation}</div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => openEditWord(w)} className="btn-icon-soft" title="Editar palavra">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => w.id && handleDeleteWord(w.id)} className="btn-icon-soft danger" title="Excluir palavra">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Modal Criar/Editar Baralho Padrão (2 Páginas) */}
      <Modal 
        open={activeModal === 'officialDeck'} 
        onClose={() => setActiveModal(null)} 
        title={
          deckFormStep === 1 
            ? (editingOfficialDeck ? "✨ Editar Baralho Padrão" : "✨ Criar Baralho Padrão")
            : `🎴 Cartões do Baralho: ${offName}`
        } 
        maxWidth={deckFormStep === 1 ? "540px" : "680px"}
      >
        <div className="space-y-4 py-2">
          {deckFormStep === 1 ? (
            /* 📄 PÁGINA 1: DADOS DO BARALHO */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                  Nome do Baralho
                </label>
                <input
                  placeholder="Ex: 50 Palavras Essenciais do Inglês"
                  value={offName}
                  onChange={e => setOffName(e.target.value)}
                  autoFocus
                  className="input-gamified"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                  Descrição Explicativa
                </label>
                <input
                  placeholder="Descreva o propósito deste baralho padrão..."
                  value={offDesc}
                  onChange={e => setOffDesc(e.target.value)}
                  className="input-gamified"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                    Nível
                  </label>
                  <select 
                    value={offLevel} 
                    onChange={e => setOffLevel(e.target.value)}
                    style={{
                      width: '100%', padding: '0.875rem 1rem', background: 'var(--bg-surface)',
                      border: '2px solid var(--border)', borderRadius: 'var(--radius)',
                      fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)'
                    }}
                  >
                    {availableLevelOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                    Status
                  </label>
                  <select 
                    value={offPublished ? 'published' : 'hidden'} 
                    onChange={e => setOffPublished(e.target.value === 'published')}
                    style={{
                      width: '100%', padding: '0.875rem 1rem', background: 'var(--bg-surface)',
                      border: '2px solid var(--border)', borderRadius: 'var(--radius)',
                      fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)'
                    }}
                  >
                    <option value="published">Publicado (Visível na Loja)</option>
                    <option value="hidden">Oculto (Rascunho)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="ghost" size="md" onClick={() => setActiveModal(null)}>
                  Cancelar
                </Button>

                <div className="flex gap-2">
                  {editingOfficialDeck && (
                    <Button variant="secondary" size="md" loading={savingOfficialDeck} onClick={handleSaveOfficialDeck} disabled={!offName.trim()}>
                      Salvar Alterações
                    </Button>
                  )}
                  <Button variant="vibrant" size="md" onClick={() => setDeckFormStep(2)} disabled={!offName.trim()}>
                    Adicionar Cards <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* 📄 PÁGINA 2: GERENCIAMENTO DE CARDS */
            <div className="space-y-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <Button variant="ghost" size="sm" onClick={() => setDeckFormStep(1)}>
                  <ArrowLeft size={16} /> Voltar para Dados do Baralho
                </Button>
                <span className="text-xs font-extrabold text-slate-400">
                  Página 2 de 2
                </span>
              </div>

              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', 
                borderRadius: '16px', background: 'var(--accent-glow)', border: '1px solid var(--accent-glow)',
                color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 700
              }}>
                <Info size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
                <div>
                  <span style={{ fontWeight: 900, color: 'var(--accent)' }}>Dica:</span> Você pode colar (<kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.75rem' }}>Ctrl + V</kbd>) uma imagem copiada diretamente em qualquer caixa de texto!
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {offCards.map((c, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-surface)', border: '2px solid var(--border)', borderRadius: '20px',
                    padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Card #{i + 1}
                      </span>
                      <button 
                        onClick={() => setOffCards(offCards.filter((_, idx) => idx !== i))}
                        className="btn-icon-soft" 
                        style={{ width: '32px', height: '32px', color: 'var(--danger)' }}
                        title="Remover card"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Frente Side */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase' }}>Frente (Inglês)</span>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: c.front_audio ? 'var(--accent)' : 'var(--text-muted)' }}>
                            <input 
                              type="checkbox" 
                              checked={!!c.front_audio} 
                              onChange={e => {
                                const updated = [...offCards]
                                updated[i].front_audio = e.target.checked
                                setOffCards(updated)
                              }}
                              style={{ accentColor: 'var(--accent)', width: '14px', height: '14px', cursor: 'pointer' }}
                            />
                            <Volume2 size={14} /> Áudio (Inglês)
                          </label>
                          {c.front_audio && c.front.trim() && isEnglishText(c.front) && (
                            <button onClick={() => speak(c.front.trim(), 'en-US')} className="btn-icon-soft" style={{ width: '28px', height: '28px' }} title="Ouvir pronúncia">
                              <Volume2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <textarea 
                        placeholder="Ex: Apple (palavra ou frase na frente)" 
                        value={c.front} 
                        onChange={e => {
                          const updated = [...offCards]
                          updated[i].front = e.target.value
                          setOffCards(updated)
                        }} 
                        onPaste={e => handleCardPaste(e, i, 'front')}
                        rows={2}
                        className="input-gamified"
                        style={{ fontSize: '0.875rem', fontWeight: 700, resize: 'vertical' }}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-surface)',
                            padding: '0.4rem 0.75rem', borderRadius: '12px', border: '1px solid var(--border)',
                            cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-primary)', flexShrink: 0
                          }} className="hover-bounce">
                            <ImageIcon size={14} color="var(--accent)" /> Inserir Imagem
                            <input type="file" accept="image/*" onChange={e => handleCardImageUpload(e, i, 'front')} style={{ display: 'none' }} />
                          </label>

                          <div style={{ position: 'relative', flex: 1 }}>
                            <LinkIcon size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                              type="url"
                              placeholder="ou cole o link da imagem (ex: https://...)" 
                              value={c.front_image && c.front_image.startsWith('http') ? c.front_image : ''}
                              onChange={e => handleCardImageUrlChange(e.target.value, i, 'front')}
                              style={{
                                width: '100%', padding: '0.4rem 0.5rem 0.4rem 2rem', fontSize: '0.75rem', fontWeight: 700,
                                borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-surface)', outline: 'none'
                              }}
                            />
                          </div>
                        </div>

                        {c.front_image && (
                          <div style={{ position: 'relative', width: 'fit-content', marginTop: '0.25rem' }}>
                            <img src={c.front_image} alt="Front preview" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--border)' }} />
                            <button 
                              onClick={() => {
                                const updated = [...offCards]
                                updated[i].front_image = undefined
                                setOffCards(updated)
                              }}
                              style={{ 
                                position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', 
                                color: 'white', borderRadius: '50%', border: 'none', width: '22px', height: '22px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                              }}
                              title="Remover imagem"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verso Side */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verso (Português)</span>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: c.back_audio ? 'var(--accent)' : 'var(--text-muted)' }}>
                            <input 
                              type="checkbox" 
                              checked={!!c.back_audio} 
                              onChange={e => {
                                const updated = [...offCards]
                                updated[i].back_audio = e.target.checked
                                setOffCards(updated)
                              }}
                              style={{ accentColor: 'var(--accent)', width: '14px', height: '14px', cursor: 'pointer' }}
                            />
                            <Volume2 size={14} /> Áudio (Inglês)
                          </label>
                          {c.back_audio && c.back.trim() && isEnglishText(c.back) && (
                            <button onClick={() => speak(c.back.trim(), 'en-US')} className="btn-icon-soft" style={{ width: '28px', height: '28px' }} title="Ouvir pronúncia">
                              <Volume2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <textarea 
                        placeholder="Ex: Maçã (tradução no verso)" 
                        value={c.back} 
                        onChange={e => {
                          const updated = [...offCards]
                          updated[i].back = e.target.value
                          setOffCards(updated)
                        }} 
                        onPaste={e => handleCardPaste(e, i, 'back')}
                        rows={2}
                        className="input-gamified"
                        style={{ fontSize: '0.875rem', fontWeight: 700, resize: 'vertical' }}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-surface)',
                            padding: '0.4rem 0.75rem', borderRadius: '12px', border: '1px solid var(--border)',
                            cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-primary)', flexShrink: 0
                          }} className="hover-bounce">
                            <ImageIcon size={14} color="var(--accent)" /> Inserir Imagem
                            <input type="file" accept="image/*" onChange={e => handleCardImageUpload(e, i, 'back')} style={{ display: 'none' }} />
                          </label>

                          <div style={{ position: 'relative', flex: 1 }}>
                            <LinkIcon size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                              type="url"
                              placeholder="ou cole o link da imagem (ex: https://...)" 
                              value={c.back_image && c.back_image.startsWith('http') ? c.back_image : ''}
                              onChange={e => handleCardImageUrlChange(e.target.value, i, 'back')}
                              style={{
                                width: '100%', padding: '0.4rem 0.5rem 0.4rem 2rem', fontSize: '0.75rem', fontWeight: 700,
                                borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-surface)', outline: 'none'
                              }}
                            />
                          </div>
                        </div>

                        {c.back_image && (
                          <div style={{ position: 'relative', width: 'fit-content', marginTop: '0.25rem' }}>
                            <img src={c.back_image} alt="Back preview" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--border)' }} />
                            <button 
                              onClick={() => {
                                const updated = [...offCards]
                                updated[i].back_image = undefined
                                setOffCards(updated)
                              }}
                              style={{ 
                                position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', 
                                color: 'white', borderRadius: '50%', border: 'none', width: '22px', height: '22px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                              }}
                              title="Remover imagem"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                variant="ghost" 
                size="sm" 
                fullWidth 
                onClick={() => setOffCards([...offCards, { front: '', back: '', front_audio: true, back_audio: false }])}
                style={{ border: '2px dashed var(--border)', padding: '0.75rem' }}
              >
                <Plus size={16} /> Adicionar Mais Um Card
              </Button>

              <div className="flex gap-3 justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="ghost" size="md" onClick={() => setDeckFormStep(1)}>
                  <ArrowLeft size={16} /> Voltar
                </Button>
                <Button variant="vibrant" size="md" loading={savingOfficialDeck} onClick={handleSaveOfficialDeck} disabled={!offName.trim()}>
                  <Check size={16} /> {editingOfficialDeck ? 'Salvar Alterações' : 'Concluir e Salvar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Criar/Editar Palavra do Dia (Sem transcrição fonética) */}
      <Modal
        open={activeModal === 'wordOfTheDay'}
        onClose={() => setActiveModal(null)}
        title={editingWord ? "✨ Editar Palavra do Dia" : "✨ Nova Palavra do Dia"}
        maxWidth="560px"
      >
        <div className="space-y-4 py-2">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                Palavra em Inglês
              </label>
              <input
                placeholder="Ex: Resilience"
                value={wordWord}
                onChange={e => setWordWord(e.target.value)}
                autoFocus
                className="input-gamified"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                Classe Gramatical
              </label>
              <input
                placeholder="Ex: substantivo / adjetivo / verbo"
                value={wordType}
                onChange={e => setWordType(e.target.value)}
                className="input-gamified"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">
              Tradução em Português
            </label>
            <input
              placeholder="Ex: Resiliência"
              value={wordTranslation}
              onChange={e => setWordTranslation(e.target.value)}
              className="input-gamified"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">
              Definição Explicativa
            </label>
            <textarea
              placeholder="Ex: A capacidade de se recuperar rapidamente de dificuldades ou desafios."
              value={wordDefinition}
              onChange={e => setWordDefinition(e.target.value)}
              rows={2}
              className="input-gamified"
              style={{ fontSize: '0.875rem', fontWeight: 600, resize: 'vertical' }}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">
              Frase de Exemplo (Inglês)
            </label>
            <input
              placeholder="Ex: Her resilience helped her overcome every obstacle."
              value={wordExample}
              onChange={e => setWordExample(e.target.value)}
              className="input-gamified"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">
              Tradução da Frase de Exemplo
            </label>
            <input
              placeholder="Ex: A resiliência dela a ajudou a superar cada obstáculo."
              value={wordExampleTranslation}
              onChange={e => setWordExampleTranslation(e.target.value)}
              className="input-gamified"
            />
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-slate-200 dark:border-slate-700">
            <Button variant="ghost" size="md" onClick={() => setActiveModal(null)}>
              Cancelar
            </Button>
            <Button 
              variant="vibrant" 
              size="md" 
              loading={savingWord} 
              onClick={handleSaveWord} 
              disabled={!wordWord.trim() || !wordTranslation.trim() || !wordDefinition.trim()}
            >
              {editingWord ? 'Salvar Alterações' : 'Cadastrar Palavra'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Outros Modals */}
      <Modal open={activeModal === 'addUser'} onClose={() => setActiveModal(null)} title="✨ Novo Aluno">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <AdminField label="Nome Completo" value={newName} onChange={setNewName} placeholder="Ex: João Silva" />
          <AdminField label="E-mail" value={newEmail} onChange={setNewEmail} placeholder="aluno@email.com" type="email" />
          
          <AdminField 
            label="Senha Inicial Padrão (mínimo 6 caracteres)" 
            value={newInitialPassword} 
            onChange={setNewInitialPassword} 
            placeholder="Ex: aura123" 
            type="text" 
          />
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Liga Obrigatória
            </label>
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                className="w-full rounded-lg p-2.5 sm:p-3 text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:outline-none transition-colors text-slate-900 dark:text-white flex items-center justify-between text-left cursor-pointer shadow-2xs"
              >
                <span>
                  {selectedLevelId ? (
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {levels.find(l => l.id === selectedLevelId)?.name}
                      </span>
                      <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 font-semibold">
                        {levels.find(l => l.id === selectedLevelId)?.min_xp || 0} XP
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">Selecione uma liga...</span>
                  )}
                </span>
                <ChevronDown 
                  size={18} 
                  className={`text-slate-400 transition-transform duration-200 ${showLevelDropdown ? 'rotate-180' : ''}`} 
                />
              </button>

              {showLevelDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden py-1 max-h-60 overflow-y-auto">
                  {levels.map(l => (
                    <div 
                      key={l.id} 
                      onClick={() => { setSelectedLevelId(l.id); setShowLevelDropdown(false) }} 
                      className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-between text-sm text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: l.color || '#3B82F6' }} />
                        <span className="font-medium">{l.name}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-600">
                        Mínimo {l.min_xp} XP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedLevelId && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5 font-medium">
                <Sparkles size={13} className="text-amber-500 shrink-0" />
                <span>O aluno iniciará automaticamente com <strong className="text-amber-600 dark:text-amber-400 font-semibold">{levels.find(l => l.id === selectedLevelId)?.min_xp || 0} XP</strong> (mínimo desta liga).</span>
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="ghost" size="md" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button variant="vibrant" size="md" loading={creating} onClick={handleCreateUser} disabled={!newEmail || !newName || !selectedLevelId}>
              Cadastrar Agora
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={activeModal === 'editBalance'} onClose={() => setActiveModal(null)} title="🏆 Premiar Aluno">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Premiando <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{selectedUser?.name}</span></p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <AdminField label="Adicionar XP" value={adjustXP} onChange={setAdjustXP} type="number" />
            <AdminField label="Adicionar Moedas" value={adjustCoins} onChange={setAdjustCoins} type="number" />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="ghost" size="md" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button variant="vibrant" size="md" loading={updatingBalance} onClick={handleUpdateBalance}>Confirmar Recompensa</Button>
          </div>
        </div>
      </Modal>

      <Modal open={activeModal === 'viewLeagueUsers'} onClose={() => setActiveModal(null)} title="👥 Alunos da Liga">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {leagueStudents.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nenhum aluno nesta liga ainda. ✨</p>
          ) : (
            leagueStudents.map(u => (
              <div key={u.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>{AVATARS[u.avatar_id] || '👤'}</div>
                  <div style={{ fontWeight: 700 }}>{u.nickname || u.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, color: 'var(--warning)', fontSize: '1rem' }}>{u.xp} XP</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.8125rem' }}>{u.coins} Moedas</div>
                </div>
              </div>
            ))
          )}
          <Button variant="vibrant" fullWidth size="md" onClick={() => setActiveModal(null)} style={{ marginTop: '1rem' }}>Fechar</Button>
        </div>
      </Modal>

      <Modal open={activeModal === 'addLevel' || activeModal === 'editLevel'} onClose={() => setActiveModal(null)} title={editingLevel ? "📝 Editar Liga" : "🚀 Nova Liga"}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <AdminField label="Nome da Liga" value={newLevelName} onChange={setNewLevelName} placeholder="Ex: Mestre" />
          <AdminField label="XP Necessário" value={newLevelXP} onChange={setNewLevelXP} type="number" />
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Cor da Liga</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewLevelColor(c)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', background: c,
                    border: newLevelColor === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    transform: newLevelColor === c ? 'scale(1.1)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            {editingLevel && (
              <Button variant="danger" onClick={handleDeleteLevel}><Trash2 size={18} /> Excluir</Button>
            )}
            <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
              <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancelar</Button>
              <Button variant="vibrant" onClick={editingLevel ? handleUpdateLevel : handleCreateLevel}>
                {editingLevel ? 'Salvar Alterações' : 'Criar Liga'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

function AdminStatCard({ icon, label, value, color = 'blue' }: any) {
  const colorMap: Record<string, { bg: string, text: string, border: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200/80 dark:border-blue-800' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/80 dark:border-amber-800' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/80 dark:border-emerald-800' },
  }
  const theme = colorMap[color] || colorMap.blue

  return (
    <div className="card-3d p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${theme.bg} ${theme.text} ${theme.border} border flex items-center justify-center shrink-0 shadow-xs`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white leading-none">{value}</div>
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{label}</div>
      </div>
    </div>
  )
}

function AdminField({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full rounded-lg p-2.5 sm:p-3 text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:outline-none transition-colors text-slate-900 dark:text-white shadow-2xs"
      />
    </div>
  )
}
