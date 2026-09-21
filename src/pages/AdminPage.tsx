import { useState, useEffect } from 'react'
import { supabase, isLocalMode, generateId } from '../services/storage'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Toast, useToast } from '../components/ui/Toast'
import { PageHeader } from '../components/common/PageHeader'
import { useSpeech } from '../hooks/useSpeech'
import { compressImage } from '../lib/utils'
import { 
  UserPlus, Users, Pencil, Trash2, Plus, Coins, Sparkles, 
  ShieldCheck, BookOpen, Eye, EyeOff, Volume2, Image as ImageIcon, 
  Link as LinkIcon, X, Info, ArrowLeft, ArrowRight, Check, LayoutGrid, List,
  ChevronDown, KeyRound, GraduationCap
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
  const [activeTab, setActiveTab] = useState<'users' | 'levels' | 'decks' | 'words'>('users')
  const [activeModal, setActiveModal] = useState<'addUser' | 'editUser' | 'deleteUser' | 'addLevel' | 'editLevel' | 'editBalance' | 'viewLeagueUsers' | 'officialDeck' | 'wordOfTheDay' | null>(null)
  
  // Novo Usuário Form
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newInitialPassword, setNewInitialPassword] = useState('aura123')
  const [selectedLevelId, setSelectedLevelId] = useState('')
  const [showLevelDropdown, setShowLevelDropdown] = useState(false)
  const [creating, setCreating] = useState(false)

  // Editar Usuário Form
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editLevelId, setEditLevelId] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editMustChangePassword, setEditMustChangePassword] = useState(false)
  const [showEditLevelDropdown, setShowEditLevelDropdown] = useState(false)
  const [savingUser, setSavingUser] = useState(false)

  // Excluir Usuário State
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState(false)

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

const DEFAULT_LOCAL_LEVELS: any[] = []

const DEFAULT_LOCAL_STUDENTS: User[] = []

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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [activeTab])

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

  function handleOpenEditUser(u: User) {
    setEditingUser(u)
    setEditName(u.name || u.nickname || '')
    setEditEmail(u.email)
    setEditPassword('')
    setEditLevelId(u.level_id || u.level?.id || 'lvl_1')
    setEditIsActive(u.is_active !== false)
    setEditMustChangePassword(u.must_change_password ?? false)
    setShowEditLevelDropdown(false)
    setActiveModal('editUser')
  }

  async function handleSaveEditUser() {
    if (!editingUser) return
    if (!editName.trim() || !editEmail.trim()) {
      show('Preencha o nome e o e-mail do aluno.', 'error')
      return
    }

    if (editPassword && editPassword.trim().length > 0 && editPassword.trim().length < 6) {
      show('A nova senha deve ter no mínimo 6 caracteres.', 'error')
      return
    }

    setSavingUser(true)
    try {
      const selectedLvl = levels.find(l => l.id === editLevelId) || levels[0]

      const updated = await authService.adminUpdateStudent(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        newPassword: editPassword.trim() || undefined,
        level_id: editLevelId,
        level: selectedLvl,
        is_active: editIsActive,
        must_change_password: editMustChangePassword
      })

      // Atualiza lista local
      const currentList = getLocalAdminUsers()
      const idx = currentList.findIndex(u => u.id === editingUser.id)
      if (idx !== -1) {
        currentList[idx] = { ...currentList[idx], ...updated }
        saveLocalAdminUsers(currentList)
        setUsers([...currentList])
      } else {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updated } : u))
      }

      show('Dados do aluno atualizados com sucesso!', 'success')
      setActiveModal(null)
      setEditingUser(null)
    } catch (err: any) {
      show(err.message || 'Erro ao atualizar aluno.', 'error')
    } finally {
      setSavingUser(false)
    }
  }

  async function handleConfirmDeleteUser() {
    if (!userToDelete) return
    setDeletingUser(true)
    try {
      await authService.adminDeleteStudent(userToDelete.id)

      const currentList = getLocalAdminUsers().filter(u => u.id !== userToDelete.id)
      saveLocalAdminUsers(currentList)
      setUsers(currentList)

      show(`Aluno ${userToDelete.name || userToDelete.email} excluído com sucesso.`, 'success')
      setActiveModal(null)
      setUserToDelete(null)
    } catch (err: any) {
      show(err.message || 'Erro ao excluir aluno.', 'error')
    } finally {
      setDeletingUser(false)
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
        name: newLevelName.trim() || 'Nova Turma',
        min_xp: minXp,
        color: newLevelColor
      }
      const list = getLocalAdminLevels()
      list.push(newLvl)
      list.sort((a, b) => a.min_xp - b.min_xp)
      saveLocalAdminLevels(list)
      setLevels(list)
      show('Turma criada!', 'success')
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
    if (error) show('Erro ao criar turma.', 'error')
    else {
      show('Turma criada!', 'success')
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

        // Sincronizar alunos dessa turma que tenham menos que o novo XP mínimo
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
      show('Turma atualizada!', 'success')
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

    if (error) show('Erro ao atualizar turma.', 'error')
    else {
      await supabase.rpc('sync_league_xp', {
        target_level_id: editingLevel.id,
        new_min_xp: minXp
      })
      show('Turma atualizada!', 'success')
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
    if (!confirm('Tem certeza que deseja remover esta turma?')) return

    if (isLocalMode || !supabase) {
      const list = getLocalAdminLevels().filter(l => l.id !== editingLevel.id)
      saveLocalAdminLevels(list)
      setLevels(list)
      show('Turma removida!', 'success')
      setActiveModal(null)
      return
    }

    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('level_id', editingLevel.id)
    if (countError) return show('Erro ao verificar alunos.', 'error')
    if (count && count > 0) return show(`Não é possível deletar turma com ${count} alunos.`, 'error')
    
    const { error } = await supabase.from('levels').delete().eq('id', editingLevel.id)
    if (error) show('Erro ao deletar turma.', 'error')
    else {
      show('Turma removida!', 'success')
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
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-3.5 sm:py-8 flex-1 w-full">
      {/* Header Padronizado */}
      <PageHeader
        icon={ShieldCheck}
        title={<>Painel <span className="text-blue-600 dark:text-blue-400">Admin</span></>}
        subtitle={<>Gerencie o ecossistema <strong className="text-slate-700 dark:text-slate-300">AuraUP</strong>, <strong className="text-blue-600 dark:text-blue-400">alunos</strong>, <strong className="text-indigo-600 dark:text-indigo-400">turmas</strong>, <strong className="text-amber-600 dark:text-amber-400">baralhos</strong> e <strong className="text-emerald-600 dark:text-emerald-400">palavras</strong>.</>}
        actions={
          <div className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-4 gap-1 shadow-2xs">
            <button
              type="button"
              title="Alunos"
              onClick={() => setActiveTab('users')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Users size={15} className="shrink-0" />
              <span className="truncate">Alunos</span>
            </button>

            <button
              type="button"
              title="Turmas"
              onClick={() => setActiveTab('levels')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer ${
                activeTab === 'levels'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <GraduationCap size={15} className="shrink-0" />
              <span className="truncate">Turmas</span>
            </button>

            <button
              type="button"
              title="Baralhos Oficiais"
              onClick={() => setActiveTab('decks')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer ${
                activeTab === 'decks'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <BookOpen size={15} className="shrink-0" />
              <span className="truncate">Baralhos</span>
            </button>

            <button
              type="button"
              title="Palavras do Dia"
              onClick={() => setActiveTab('words')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer ${
                activeTab === 'words'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Sparkles size={15} className="shrink-0" />
              <span className="truncate">Palavras</span>
            </button>
          </div>
        }
      />

      {/* Grid de Stats Compacto */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-5">
        <AdminStatCard icon={<Users size={16} />} label="Alunos ativos" value={allStudents.length} color="blue" />
        <AdminStatCard icon={<GraduationCap size={16} />} label="Turmas ativas" value={levels.length} color="indigo" />
        <AdminStatCard icon={<BookOpen size={16} />} label="Baralhos oficiais" value={officialDecks.length} color="amber" />
        <AdminStatCard icon={<Sparkles size={16} />} label="Palavras cadastradas" value={wordsOfTheDay.length} color="emerald" />
      </div>

      {activeTab === 'users' ? (
        <section className="w-full space-y-4">
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

          <div className="card-3d border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl bg-white dark:bg-slate-800 overflow-hidden">
            {/* Tabela para Telas Médias e Grandes (Desktop) */}
            <div className="hidden md:block w-full">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-3 sm:px-4">Aluno</th>
                    <th className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">Turma</th>
                    <th className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">Saldo</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap">Ações</th>
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
                        <td className="py-2.5 px-3 sm:px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-sm shrink-0 border border-slate-200/60 dark:border-slate-600 shadow-xs">
                              {AVATARS[u.avatar_id] || '👤'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-heading font-semibold text-slate-800 dark:text-white leading-tight text-xs sm:text-sm">{u.nickname || u.name}</span>
                                {u.is_active === false && (
                                  <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900">
                                    Inativo
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-normal truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-heading font-semibold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 whitespace-nowrap shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: u.level?.color || '#3B82F6' }} />
                            {u.level?.name || 'Iniciante'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 text-xs font-medium">
                            <div className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                              <Sparkles size={12} className="fill-amber-500 text-amber-500" />
                              <span className="font-semibold">{u.xp}</span>
                            </div>
                            <div className="flex items-center gap-0.5 text-amber-700 dark:text-amber-300">
                              <Coins size={12} className="fill-amber-500 text-amber-500" />
                              <span className="font-semibold">{u.coins}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              type="button"
                              title="Premiar Aluno com XP ou Moedas"
                              className="px-2 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1 cursor-pointer"
                              onClick={() => {
                                setSelectedUser(u)
                                setAdjustXP(0); setAdjustCoins(0)
                                setActiveModal('editBalance')
                              }}
                            >
                              <Sparkles size={12} className="text-amber-500" />
                              <span className="hidden sm:inline">Premiar</span>
                            </button>

                            <button 
                              type="button"
                              title="Editar dados do aluno"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer"
                              onClick={() => handleOpenEditUser(u)}
                            >
                              <Pencil size={14} />
                            </button>

                            <button 
                              type="button"
                              title="Excluir aluno"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/50 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900 cursor-pointer"
                              onClick={() => {
                                setUserToDelete(u)
                                setActiveModal('deleteUser')
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Lista Otimizada para Mobile / PWA */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {allStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm font-medium">
                  Nenhum aluno cadastrado ainda.
                </div>
              ) : (
                allStudents.map((u) => (
                  <div key={u.id} className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-base shrink-0 border border-slate-200/60 dark:border-slate-600 shadow-xs">
                          {AVATARS[u.avatar_id] || '👤'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-heading font-bold text-slate-800 dark:text-white text-sm truncate leading-tight">
                              {u.nickname || u.name}
                            </span>
                            {u.is_active === false && (
                              <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900">
                                Inativo
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal truncate mt-0.5">{u.email}</div>
                        </div>
                      </div>

                      {/* Botões de Ação Imediatos e Acessíveis no Mobile */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          type="button"
                          title="Premiar Aluno"
                          onClick={() => {
                            setSelectedUser(u)
                            setAdjustXP(0); setAdjustCoins(0)
                            setActiveModal('editBalance')
                          }}
                          className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                        >
                          <Sparkles size={14} className="text-amber-500" />
                        </button>

                        <button 
                          type="button"
                          title="Editar Aluno"
                          onClick={() => handleOpenEditUser(u)}
                          className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-600 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                        >
                          <Pencil size={14} />
                        </button>

                        <button 
                          type="button"
                          title="Excluir Aluno"
                          onClick={() => {
                            setUserToDelete(u)
                            setActiveModal('deleteUser')
                          }}
                          className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Linha Inferior: Turma e Saldo */}
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100/80 dark:border-slate-700/60">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: u.level?.color || '#3B82F6' }} />
                        {u.level?.name || 'Iniciante'}
                      </span>

                      <div className="inline-flex items-center gap-2.5 text-xs font-semibold">
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Sparkles size={12} className="fill-amber-500 text-amber-500" />
                          <span>{u.xp} XP</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                          <Coins size={12} className="fill-amber-500 text-amber-500" />
                          <span>{u.coins}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      ) : activeTab === 'levels' ? (
        /* Gestão de Turmas / Níveis */
        <section className="w-full space-y-4">
          <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-heading font-semibold text-slate-800 dark:text-white">Turmas Cadastradas</h2>
              <span className="text-xs font-heading font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800 shadow-xs">
                <span className="font-bold">{levels.length}</span> {levels.length === 1 ? 'turma' : 'turmas'}
              </span>
            </div>
            <Button variant="primary" size="sm" onClick={() => setActiveModal('addLevel')}>
              <Plus size={15} /> Nova Turma
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {levels.map((lvl) => {
              const studentsInTurma = allStudents.filter(s => s.level_id === lvl.id || s.level?.id === lvl.id)
              return (
                <div 
                  key={lvl.id}
                  className="card-3d p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs hover:border-blue-400/60 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-3.5 h-8 rounded-md shrink-0 shadow-xs" 
                        style={{ backgroundColor: lvl.color || '#3B82F6' }} 
                      />
                      <div>
                        <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white leading-snug">
                          {lvl.name}
                        </h3>
                        <div className="text-xs font-normal text-slate-400 mt-0.5">
                          Ingresso: <span className="font-semibold text-amber-600 dark:text-amber-400">{lvl.min_xp} XP</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setEditingLevel(lvl)
                        setNewLevelName(lvl.name)
                        setNewLevelXP(lvl.min_xp)
                        setNewLevelColor(lvl.color || '#3B82F6')
                        setActiveModal('editLevel')
                      }}
                      className="btn-3d-icon w-8 h-8 !rounded-lg text-slate-500 hover:text-blue-600 cursor-pointer"
                      title="Editar Turma"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Users size={14} className="text-blue-500" />
                      <strong>{studentsInTurma.length}</strong> {studentsInTurma.length === 1 ? 'aluno' : 'alunos'}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLevelFilter(lvl.id)
                        setActiveModal('viewLeagueUsers')
                      }}
                      className="text-xs font-heading font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Ver alunos →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : activeTab === 'decks' ? (
        /* Gestão de Baralhos Padrões */
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-heading font-semibold text-slate-800 dark:text-white">Baralhos Oficiais</h2>
              <span className="text-xs font-heading font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800 shadow-xs">
                <span className="font-bold">{officialDecks.length}</span> {officialDecks.length === 1 ? 'baralho' : 'baralhos'}
              </span>
            </div>
            <Button variant="primary" size="sm" onClick={openCreateOfficialDeck}>
              <Plus size={15} /> Criar Baralho Padrão
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-heading font-semibold text-slate-800 dark:text-white">Palavras do Dia (A-Z)</h2>
              <span className="text-xs font-heading font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800 shadow-xs">
                <span className="font-bold">{sortedWordsOfTheDay.length}</span> {sortedWordsOfTheDay.length === 1 ? 'palavra' : 'palavras'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Botões de Alternância de Visualização (Quadros / Lista) */}
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-1">
                <button
                  type="button"
                  onClick={() => setWordViewMode('grid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-heading font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    wordViewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                  title="Visualização em Quadros"
                >
                  <LayoutGrid size={14} /> Quadros
                </button>

                <button
                  type="button"
                  onClick={() => setWordViewMode('list')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-heading font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    wordViewMode === 'list'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                  title="Visualização em Lista (Compacta)"
                >
                  <List size={14} /> Lista
                </button>
              </div>

              <Button variant="primary" size="sm" onClick={openCreateWord}>
                <Plus size={15} /> Nova Palavra
              </Button>
            </div>
          </div>

          {wordViewMode === 'grid' ? (
            /* Visualização 1: QUADROS (GRID) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        footer={
          deckFormStep === 1 ? (
            <div className="w-full flex items-center justify-between gap-2">
              <Button variant="ghost" size="md" onClick={() => setActiveModal(null)}>
                Cancelar
              </Button>
              <div className="flex items-center gap-2">
                {editingOfficialDeck && (
                  <Button variant="secondary" size="md" loading={savingOfficialDeck} onClick={handleSaveOfficialDeck} disabled={!offName.trim()}>
                    Salvar
                  </Button>
                )}
                <Button variant="vibrant" size="md" onClick={() => setDeckFormStep(2)} disabled={!offName.trim()}>
                  Cards <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between gap-2">
              <Button variant="ghost" size="md" onClick={() => setDeckFormStep(1)}>
                <ArrowLeft size={16} /> Voltar
              </Button>
              <Button variant="vibrant" size="md" loading={savingOfficialDeck} onClick={handleSaveOfficialDeck} disabled={!offName.trim()}>
                <Check size={16} /> {editingOfficialDeck ? 'Salvar' : 'Concluir'}
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4 py-2">
          {deckFormStep === 1 ? (
            /* 📄 PÁGINA 1: DADOS DO BARALHO */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome do Baralho
                </label>
                <input
                  placeholder="Ex: 50 Palavras Essenciais do Inglês"
                  value={offName}
                  onChange={e => setOffName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-800 dark:text-white font-medium placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400/80 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Descrição Explicativa
                </label>
                <input
                  placeholder="Descreva o propósito deste baralho padrão..."
                  value={offDesc}
                  onChange={e => setOffDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-800 dark:text-white font-medium placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400/80 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Turma / Nível
                  </label>
                  <select 
                    value={offLevel} 
                    onChange={e => setOffLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-800 dark:text-white font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all shadow-2xs cursor-pointer"
                  >
                    {availableLevelOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Status de Publicação
                  </label>
                  <select 
                    value={offPublished ? 'published' : 'hidden'} 
                    onChange={e => setOffPublished(e.target.value === 'published')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-800 dark:text-white font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="published">🟢 Publicado (visível para alunos)</option>
                    <option value="hidden">🟡 Rascunho (oculto)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* 📄 PÁGINA 2: GERENCIAMENTO DE CARDS */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <Button variant="ghost" size="sm" onClick={() => setDeckFormStep(1)}>
                  <ArrowLeft size={15} /> Voltar para Dados do Baralho
                </Button>
                <span className="text-xs font-semibold text-slate-400">
                  Etapa 2 de 2
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <strong className="text-blue-600 dark:text-blue-400 font-semibold">Dica:</strong> Você pode colar (<kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[11px]">Ctrl + V</kbd>) imagens diretamente em qualquer card!
                </div>
              </div>

              <div className="flex flex-col gap-3.5 max-h-[360px] overflow-y-auto pr-1">
                {offCards.map((c, i) => (
                  <div key={i} className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        Card #{i + 1}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setOffCards(offCards.filter((_, idx) => idx !== i))}
                        className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors cursor-pointer" 
                        title="Remover card"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Frente Side */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 sm:p-3.5 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Frente (Inglês)</span>
                        
                        <div className="flex gap-2 items-center">
                          <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-semibold ${c.front_audio ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                            <input 
                              type="checkbox" 
                              checked={!!c.front_audio} 
                              onChange={e => {
                                const updated = [...offCards]
                                updated[i].front_audio = e.target.checked
                                setOffCards(updated)
                              }}
                              className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                            />
                            <Volume2 size={14} /> Áudio (Inglês)
                          </label>
                          {c.front_audio && c.front.trim() && isEnglishText(c.front) && (
                            <button onClick={() => speak(c.front.trim(), 'en-US')} className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center cursor-pointer" title="Ouvir pronúncia">
                              <Volume2 size={13} />
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs sm:text-sm text-slate-800 dark:text-white font-medium placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400/80 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs resize-y"
                      />

                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs shrink-0">
                            <ImageIcon size={14} className="text-blue-600 dark:text-blue-400" /> Inserir Imagem
                            <input type="file" accept="image/*" onChange={e => handleCardImageUpload(e, i, 'front')} className="hidden" />
                          </label>

                          <div className="relative flex-1">
                            <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="url"
                              placeholder="ou cole o link da imagem (ex: https://...)" 
                              value={c.front_image && c.front_image.startsWith('http') ? c.front_image : ''}
                              onChange={e => handleCardImageUrlChange(e.target.value, i, 'front')}
                              className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 placeholder:text-[11px] placeholder:font-normal placeholder:text-slate-400/80"
                            />
                          </div>
                        </div>

                        {c.front_image && (
                          <div className="relative w-fit mt-1">
                            <img src={c.front_image} alt="Front preview" className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-2xs" />
                            <button 
                              type="button"
                              onClick={() => {
                                const updated = [...offCards]
                                updated[i].front_image = undefined
                                setOffCards(updated)
                              }}
                              className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer shadow-xs"
                              title="Remover imagem"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verso Side */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 sm:p-3.5 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Verso (Português)</span>
                        
                        <div className="flex gap-2 items-center">
                          <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-semibold ${c.back_audio ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                            <input 
                              type="checkbox" 
                              checked={!!c.back_audio} 
                              onChange={e => {
                                const updated = [...offCards]
                                updated[i].back_audio = e.target.checked
                                setOffCards(updated)
                              }}
                              className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                            />
                            <Volume2 size={14} /> Áudio (Inglês)
                          </label>
                          {c.back_audio && c.back.trim() && isEnglishText(c.back) && (
                            <button onClick={() => speak(c.back.trim(), 'en-US')} className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center cursor-pointer" title="Ouvir pronúncia">
                              <Volume2 size={13} />
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs sm:text-sm text-slate-800 dark:text-white font-medium placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400/80 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs resize-y"
                      />

                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs shrink-0">
                            <ImageIcon size={14} className="text-blue-600 dark:text-blue-400" /> Inserir Imagem
                            <input type="file" accept="image/*" onChange={e => handleCardImageUpload(e, i, 'back')} className="hidden" />
                          </label>

                          <div className="relative flex-1">
                            <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="url"
                              placeholder="ou cole o link da imagem (ex: https://...)" 
                              value={c.back_image && c.back_image.startsWith('http') ? c.back_image : ''}
                              onChange={e => handleCardImageUrlChange(e.target.value, i, 'back')}
                              className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 placeholder:text-[11px] placeholder:font-normal placeholder:text-slate-400/80"
                            />
                          </div>
                        </div>

                        {c.back_image && (
                          <div className="relative w-fit mt-1">
                            <img src={c.back_image} alt="Back preview" className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-2xs" />
                            <button 
                              type="button"
                              onClick={() => {
                                const updated = [...offCards]
                                updated[i].back_image = undefined
                                setOffCards(updated)
                              }}
                              className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer shadow-xs"
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

              <button 
                type="button" 
                onClick={() => setOffCards([...offCards, { front: '', back: '', front_audio: true, back_audio: false }])}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 font-heading font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30"
              >
                <Plus size={16} /> Adicionar Mais Um Card
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Criar/Editar Palavra do Dia */}
      <Modal
        open={activeModal === 'wordOfTheDay'}
        onClose={() => setActiveModal(null)}
        title={editingWord ? "✨ Editar Palavra do Dia" : "✨ Nova Palavra do Dia"}
        maxWidth="560px"
        footer={
          <div className="w-full flex items-center justify-end gap-2.5">
            <Button variant="ghost" size="md" onClick={() => setActiveModal(null)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              size="md" 
              loading={savingWord} 
              onClick={handleSaveWord} 
              disabled={!wordWord.trim() || !wordTranslation.trim() || !wordDefinition.trim()}
            >
              {editingWord ? 'Salvar Alterações' : 'Cadastrar Palavra'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField 
              label="Palavra em Inglês"
              placeholder="Ex: Resilience"
              value={wordWord}
              onChange={setWordWord}
            />

            <AdminField 
              label="Classe Gramatical"
              placeholder="Ex: substantivo / adjetivo / verbo"
              value={wordType}
              onChange={setWordType}
            />
          </div>

          <AdminField 
            label="Tradução em Português"
            placeholder="Ex: Resiliência"
            value={wordTranslation}
            onChange={setWordTranslation}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Definição Explicativa
            </label>
            <textarea
              placeholder="Ex: A capacidade de se recuperar rapidamente de dificuldades ou desafios."
              value={wordDefinition}
              onChange={e => setWordDefinition(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400/80 shadow-2xs resize-y"
            />
          </div>

          <AdminField 
            label="Frase de Exemplo (Inglês)"
            placeholder="Ex: Her resilience helped her overcome every obstacle."
            value={wordExample}
            onChange={setWordExample}
          />

          <AdminField 
            label="Tradução da Frase de Exemplo"
            placeholder="Ex: A resiliência dela a ajudou a superar cada obstáculo."
            value={wordExampleTranslation}
            onChange={setWordExampleTranslation}
          />
        </div>
      </Modal>

      {/* Outros Modals */}
      <Modal 
        open={activeModal === 'addUser'} 
        onClose={() => setActiveModal(null)} 
        title="✨ Novo Aluno"
        footer={
          <div className="w-full flex items-center justify-end gap-2.5">
            <Button variant="ghost" size="md" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button variant="primary" size="md" loading={creating} onClick={handleCreateUser} disabled={!newEmail || !newName || !selectedLevelId}>
              Cadastrar Aluno
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 py-1">
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Turma Obrigatória
            </label>
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:outline-none transition-all text-slate-900 dark:text-white flex items-center justify-between text-left cursor-pointer shadow-2xs"
              >
                <span>
                  {selectedLevelId ? (
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {levels.find(l => l.id === selectedLevelId)?.name}
                      </span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800 font-semibold">
                        {levels.find(l => l.id === selectedLevelId)?.min_xp || 0} XP
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal text-xs sm:text-sm">Selecione uma turma...</span>
                  )}
                </span>
                <ChevronDown 
                  size={16} 
                  className={`text-slate-400 transition-transform duration-200 ${showLevelDropdown ? 'rotate-180' : ''}`} 
                />
              </button>

              {showLevelDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden py-1 max-h-60 overflow-y-auto">
                  {levels.map(l => (
                    <div 
                      key={l.id} 
                      onClick={() => { setSelectedLevelId(l.id); setShowLevelDropdown(false) }} 
                      className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-between text-xs sm:text-sm text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0"
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
                <span>O aluno iniciará automaticamente com <strong className="text-amber-600 dark:text-amber-400 font-semibold">{levels.find(l => l.id === selectedLevelId)?.min_xp || 0} XP</strong> (mínimo desta turma).</span>
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal Editar Aluno */}
      <Modal 
        open={activeModal === 'editUser'} 
        onClose={() => { setActiveModal(null); setEditingUser(null) }} 
        title="📝 Editar Aluno"
        footer={
          <div className="w-full flex items-center justify-end gap-2.5">
            <Button variant="ghost" size="md" onClick={() => { setActiveModal(null); setEditingUser(null) }}>Cancelar</Button>
            <Button variant="primary" size="md" loading={savingUser} onClick={handleSaveEditUser} disabled={!editName || !editEmail}>
              Salvar Alterações
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 py-1">
          <AdminField 
            label="Nome Completo" 
            value={editName} 
            onChange={setEditName} 
            placeholder="Ex: João Silva" 
          />
          <AdminField 
            label="E-mail" 
            value={editEmail} 
            onChange={setEditEmail} 
            placeholder="aluno@email.com" 
            type="email" 
          />
          
          <AdminField 
            label="Redefinir Senha (opcional)" 
            value={editPassword} 
            onChange={setEditPassword} 
            placeholder="Deixe em branco para manter a senha atual" 
            type="text" 
          />
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Turma do Aluno
            </label>
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowEditLevelDropdown(!showEditLevelDropdown)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:outline-none transition-all text-slate-900 dark:text-white flex items-center justify-between text-left cursor-pointer shadow-2xs"
              >
                <span>
                  {editLevelId ? (
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {levels.find(l => l.id === editLevelId)?.name || 'Selecionar turma...'}
                      </span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800 font-semibold">
                        {levels.find(l => l.id === editLevelId)?.min_xp || 0} XP
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal text-xs sm:text-sm">Selecione uma turma...</span>
                  )}
                </span>
                <ChevronDown 
                  size={16} 
                  className={`text-slate-400 transition-transform duration-200 ${showEditLevelDropdown ? 'rotate-180' : ''}`} 
                />
              </button>

              {showEditLevelDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden py-1 max-h-60 overflow-y-auto">
                  {levels.map(l => (
                    <div 
                      key={l.id} 
                      onClick={() => { setEditLevelId(l.id); setShowEditLevelDropdown(false) }} 
                      className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-between text-xs sm:text-sm text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0"
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
          </div>

          {/* Status da Conta */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Status do Acesso</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {editIsActive ? 'Aluno pode fazer login normalmente' : 'Acesso bloqueado temporariamente'}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={editIsActive} 
                onChange={e => setEditIsActive(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Exigir Troca de Senha (1º Acesso) */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <KeyRound size={13} className="text-amber-600 dark:text-amber-400" />
                Exigir Troca de Senha no Próximo Login
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                {editMustChangePassword ? 'O modal bloqueante de 1º acesso abrirá ao logar' : 'Aluno entrará direto no painel'}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={editMustChangePassword} 
                onChange={e => setEditMustChangePassword(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-amber-200 peer-focus:outline-none rounded-full peer dark:bg-amber-900 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-amber-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-amber-800 peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>
      </Modal>

      {/* Modal Excluir Aluno */}
      <Modal 
        open={activeModal === 'deleteUser'} 
        onClose={() => { setActiveModal(null); setUserToDelete(null) }} 
        title="🗑️ Excluir Aluno"
        footer={
          <div className="w-full flex items-center justify-end gap-2.5">
            <Button variant="ghost" size="md" onClick={() => { setActiveModal(null); setUserToDelete(null) }}>Cancelar</Button>
            <button 
              type="button"
              disabled={deletingUser}
              onClick={handleConfirmDeleteUser}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {deletingUser ? 'Excluindo...' : 'Sim, Excluir Aluno'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-300">
              <Trash2 size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">Atenção: Ação Irreversível</h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                Você está prestes a excluir o aluno <strong className="font-semibold text-rose-950 dark:text-white">{userToDelete?.name || userToDelete?.nickname}</strong> ({userToDelete?.email}).
                Todos os dados de progresso e histórico deste aluno serão removidos da plataforma.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal 
        open={activeModal === 'editBalance'} 
        onClose={() => setActiveModal(null)} 
        title="🏆 Premiar Aluno"
        footer={
          <div className="w-full flex items-center justify-end gap-2.5">
            <Button variant="ghost" size="md" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button variant="primary" size="md" loading={updatingBalance} onClick={handleUpdateBalance}>Confirmar Recompensa</Button>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Premiando <span className="font-extrabold text-slate-900 dark:text-white">{selectedUser?.name}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField label="Adicionar XP" value={adjustXP} onChange={setAdjustXP} type="number" />
            <AdminField label="Adicionar Moedas" value={adjustCoins} onChange={setAdjustCoins} type="number" />
          </div>
        </div>
      </Modal>

      <Modal 
        open={activeModal === 'viewLeagueUsers'} 
        onClose={() => setActiveModal(null)} 
        title="👥 Alunos da Turma"
        footer={
          <Button variant="primary" fullWidth size="md" onClick={() => setActiveModal(null)}>Fechar</Button>
        }
      >
        <div className="space-y-3 py-1">
          {leagueStudents.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-medium text-sm">Nenhum aluno nesta turma ainda. ✨</p>
          ) : (
            leagueStudents.map(u => (
              <div key={u.id} className="card-3d p-3 flex justify-between items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{AVATARS[u.avatar_id] || '👤'}</div>
                  <div className="font-bold text-sm text-slate-800 dark:text-white">{u.nickname || u.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">{u.xp} XP</div>
                  <div className="font-semibold text-blue-600 dark:text-blue-400 text-xs">{u.coins} Moedas</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal 
        open={activeModal === 'addLevel' || activeModal === 'editLevel'} 
        onClose={() => setActiveModal(null)} 
        title={editingLevel ? "📝 Editar Turma" : "🚀 Nova Turma"}
        footer={
          <div className="w-full flex items-center justify-between gap-2">
            {editingLevel ? (
              <Button variant="danger" size="md" onClick={handleDeleteLevel}><Trash2 size={16} /> Excluir</Button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="md" onClick={() => setActiveModal(null)}>Cancelar</Button>
              <Button variant="primary" size="md" onClick={editingLevel ? handleUpdateLevel : handleCreateLevel}>
                {editingLevel ? 'Salvar Alterações' : 'Criar Turma'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3.5 py-1">
          <AdminField label="Nome da Turma" value={newLevelName} onChange={setNewLevelName} placeholder="Ex: Iniciante, Intermediário, Turma A" />
          <AdminField label="XP Mínimo para Ingresso" value={newLevelXP} onChange={setNewLevelXP} type="number" />
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Cor de Identificação da Turma</label>
            <div className="flex gap-2.5 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewLevelColor(c)}
                  className="w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-105"
                  style={{
                    background: c,
                    outline: newLevelColor === c ? '3px solid #2563eb' : 'none',
                    outlineOffset: '2px',
                    transform: newLevelColor === c ? 'scale(1.1)' : 'none'
                  }}
                />
              ))}
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
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200/80 dark:border-indigo-800' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/80 dark:border-amber-800' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/80 dark:border-emerald-800' },
  }
  const theme = colorMap[color] || colorMap.blue

  return (
    <div className="card-3d px-2.5 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3 rounded-xl shadow-2xs">
      <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg ${theme.bg} ${theme.text} ${theme.border} border flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm sm:text-xl font-heading font-extrabold text-slate-900 dark:text-white leading-none">{value}</div>
        <div className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-tight truncate">{label}</div>
      </div>
    </div>
  )
}

function AdminField({ label, value, onChange, placeholder, type = 'text', disabled = false }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-normal placeholder:text-slate-400/80 shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  )
}
