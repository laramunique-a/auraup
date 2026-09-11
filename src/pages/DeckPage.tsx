import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCards } from '../hooks/useCards'
import { useDecks } from '../hooks/useDecks'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Toast, useToast } from '../components/ui/Toast'
import { useSpeech } from '../hooks/useSpeech'
import { compressImage } from '../lib/utils'
import { ArrowLeft, Plus, Pencil, Trash2, Play, Volume2, Image as ImageIcon, X, Sparkles, Layers, Link as LinkIcon, Info } from 'lucide-react'
import { isEnglishText } from '../lib/speechUtils'

export function DeckPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { decks, updateDeck } = useDecks()
  const { cards, loading, createCard, updateCard, deleteCard } = useCards(id!)
  const { speak } = useSpeech()
  const deck = decks.find(d => d.id === id)

  const [showCreate, setShowCreate] = useState(false)
  const [editingCard, setEditingCard] = useState<any>(null)
  
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)
  const [frontImageUrl, setFrontImageUrl] = useState('')
  const [backImageUrl, setBackImageUrl] = useState('')

  const [frontAudio, setFrontAudio] = useState(false)
  const [backAudio, setBackAudio] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [editDeckName, setEditDeckName] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const { toast, show } = useToast()

  function resetForm() {
    setFront('')
    setBack('')
    setFrontImage(null)
    setBackImage(null)
    setFrontImageUrl('')
    setBackImageUrl('')
    setFrontAudio(true)
    setBackAudio(false)
  }

  function openCreate() { resetForm(); setShowCreate(true) }

  function openEdit(card: any) { 
    setEditingCard(card)
    setFront(card.front)
    setBack(card.back)
    setFrontImage(card.front_image)
    setBackImage(card.back_image)
    setFrontImageUrl(card.front_image && card.front_image.startsWith('http') ? card.front_image : '')
    setBackImageUrl(card.back_image && card.back_image.startsWith('http') ? card.back_image : '')
    setFrontAudio(card.front_audio !== false)
    setBackAudio(card.back_audio === true)
  }

  async function handleSaveCard() {
    if (!(front.trim() || frontImage) || !(back.trim() || backImage)) return
    setSaving(true)
    const frontIsEn = isEnglishText(front)
    const backIsEn = isEnglishText(back)
    const extraFields = { 
      front_image: frontImage, 
      back_image: backImage, 
      front_lang: frontIsEn ? 'en-US' : 'pt-BR', 
      back_lang: backIsEn ? 'en-US' : 'pt-BR', 
      front_audio: frontAudio && frontIsEn, 
      back_audio: backAudio && backIsEn 
    }
    try {
      if (editingCard) {
        await updateCard(editingCard.id, { front: front.trim(), back: back.trim(), ...extraFields })
        setEditingCard(null)
        show('Card atualizado! ✨', 'success')
      } else {
        await createCard(front.trim(), back.trim(), extraFields)
        setShowCreate(false)
        show('Card criado com sucesso! 🚀', 'success')
      }
      resetForm()
    } catch {
      show('Erro ao salvar card.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await compressImage(file)
      if (side === 'front') {
        setFrontImage(base64)
        setFrontImageUrl('')
      } else {
        setBackImage(base64)
        setBackImageUrl('')
      }
    } catch {
      show('Erro ao processar imagem.', 'error')
    }
  }

  function handleImageUrlChange(url: string, side: 'front' | 'back') {
    if (side === 'front') {
      setFrontImageUrl(url)
      setFrontImage(url.trim() ? url.trim() : null)
    } else {
      setBackImageUrl(url)
      setBackImage(url.trim() ? url.trim() : null)
    }
  }

  async function handlePaste(e: React.ClipboardEvent, side: 'front' | 'back') {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          try {
            const base64 = await compressImage(file)
            if (side === 'front') {
              setFrontImage(base64)
              setFrontImageUrl('')
            } else {
              setBackImage(base64)
              setBackImageUrl('')
            }
            show('Imagem colada com sucesso! ✨', 'success')
          } catch {
            show('Erro ao colar imagem.', 'error')
          }
        }
      }
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm('Excluir este card permanentemente?')) return
    try {
      await deleteCard(cardId)
      show('Card removido.', 'success')
    } catch {
      show('Erro ao excluir.', 'error')
    }
  }

  async function handleUpdateDeckName() {
    if (!newDeckName.trim()) return
    try {
      await updateDeck(id!, { name: newDeckName.trim() })
      setEditDeckName(false)
      show('Nome atualizado!', 'success')
    } catch {
      show('Erro ao atualizar nome.', 'error')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 shadow-xs flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer" 
            title="Voltar aos Baralhos"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex-1">
            {editDeckName ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  value={newDeckName}
                  onChange={e => setNewDeckName(e.target.value)}
                  autoFocus
                  className="text-lg sm:text-xl font-heading font-bold text-slate-900 dark:text-white px-3 py-1.5 rounded-xl border border-blue-500 bg-white dark:bg-slate-800 focus:outline-none shadow-xs"
                  onKeyDown={e => { if (e.key === 'Enter') handleUpdateDeckName(); if (e.key === 'Escape') setEditDeckName(false) }}
                />
                <Button size="sm" onClick={handleUpdateDeckName}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditDeckName(false)}>Cancelar</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-800 dark:text-white tracking-tight">
                  {deck?.name || 'Carregando...'}
                </h1>
                <button 
                  onClick={() => { setNewDeckName(deck?.name || ''); setEditDeckName(true) }}
                  className="w-8 h-8 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-xs flex items-center justify-center transition-all cursor-pointer"
                  title="Renomear Baralho"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-2.5 mt-2">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-heading font-semibold text-xs bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800">
                <Layers size={13} /> <span className="font-bold">{cards.length}</span> {cards.length === 1 ? 'card' : 'cards'}
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-heading font-semibold text-xs bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800">
                <Sparkles size={13} className="fill-amber-500 text-amber-500" /> Baralho Pessoal
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {cards.length > 0 && (
            <Button variant="orange" size="sm" onClick={() => navigate(`/study/${id}`)}>
              <Play size={15} className="fill-white" /> Estudar Agora
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus size={16} /> Novo Card
          </Button>
        </div>
      </header>

      {/* Grid Section */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card-3d h-48 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon="🎴"
          title="Baralho Vazio"
          description="Seu baralho ainda não tem cards. Comece adicionando novas palavras ou frases para aprender!"
          action={<Button variant="orange" size="md" onClick={openCreate}><Plus size={16} /> Criar Primeiro Card</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => (
            <div 
              key={card.id} 
              className="card-3d p-5 flex flex-col justify-between gap-3 transition-all hover:-translate-y-1 relative rounded-2xl"
            >
              {/* Frente */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                    Frente
                  </div>
                  <div className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug break-words">
                    {card.front}
                  </div>
                </div>
                {card.front_image && (
                  <img 
                    src={card.front_image} 
                    alt="Frente" 
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs" 
                  />
                )}
              </div>
              
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

              {/* Verso */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Verso
                  </div>
                  <div className="font-medium text-sm text-slate-600 dark:text-slate-300 leading-snug break-words">
                    {card.back}
                  </div>
                </div>
                {card.back_image && (
                  <img 
                    src={card.back_image} 
                    alt="Verso" 
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs" 
                  />
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-700 mt-auto">
                <button 
                  onClick={() => openEdit(card)} 
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-xs flex items-center justify-center transition-all cursor-pointer" 
                  title="Editar Card"
                >
                  <Pencil size={14} />
                </button>
                <button 
                  onClick={() => handleDeleteCard(card.id)} 
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-200 shadow-xs flex items-center justify-center transition-all cursor-pointer" 
                  title="Excluir Card"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Card Form */}
      <Modal 
        open={showCreate || !!editingCard} 
        onClose={() => { setShowCreate(false); setEditingCard(null); resetForm() }} 
        title={editingCard ? "✏️ Editar Card" : "✨ Criar Novo Card"}
        maxWidth="640px"
        footer={
          <div className="w-full flex items-center justify-end gap-2.5">
            <Button variant="ghost" size="md" onClick={() => { setShowCreate(false); setEditingCard(null); resetForm() }}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              size="md" 
              loading={saving} 
              onClick={handleSaveCard} 
              disabled={!((front.trim() || frontImage) && (back.trim() || backImage))}
            >
              {editingCard ? 'Salvar Alterações' : 'Criar Card'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          {/* Visual Hint Banner */}
          <div className="bg-aura-soft-blue/50 border border-aura-blue/20 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold text-aura-text-primary">
            <Info size={20} className="text-aura-blue shrink-0" />
            <div>
              <span className="font-black text-aura-blue">Dica:</span> Você pode colar (<kbd className="bg-white px-2 py-0.5 rounded-lg border border-aura-blue/20 text-[11px] font-black">Ctrl + V</kbd>) uma imagem copiada diretamente na caixa de texto!
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Frente */}
            <div className="card-3d p-5 flex flex-col gap-3 rounded-2xl border-2 border-aura-blue/20 bg-white">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-xs font-display font-black text-aura-blue uppercase tracking-wider">
                  Frente (Inglês)
                </h3>
                
                <div className="flex items-center gap-3">
                  <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-heading font-bold ${frontAudio ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    <input 
                      type="checkbox" 
                      checked={frontAudio} 
                      onChange={e => setFrontAudio(e.target.checked)}
                      className="accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <Volume2 size={15} /> Áudio (Inglês)
                  </label>

                  {frontAudio && front.trim() && isEnglishText(front) && (
                    <button 
                      onClick={() => speak(front.trim(), 'en-US')} 
                      className="btn-3d-icon w-8 h-8 !rounded-xl text-blue-600" 
                      title="Ouvir pronúncia"
                    >
                      <Volume2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <textarea 
                placeholder="Ex: Apple (palavra ou frase na frente)" 
                value={front} 
                onChange={e => setFront(e.target.value)} 
                onPaste={e => handlePaste(e, 'front')} 
                rows={2} 
                className="w-full rounded-2xl p-3.5 text-sm font-sans font-bold border-2 border-slate-200 focus:border-aura-blue focus:outline-none transition-colors" 
              />
              
              {/* Imagem Frente */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="btn-3d-white text-xs px-4 py-2 !rounded-xl flex items-center gap-2 cursor-pointer font-bold">
                    <ImageIcon size={15} /> Inserir Imagem
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'front')} className="hidden" />
                  </label>

                  <div className="relative flex-1 min-w-[200px]">
                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="url"
                      placeholder="ou cole o link da imagem (https://...)" 
                      value={frontImageUrl}
                      onChange={e => handleImageUrlChange(e.target.value, 'front')}
                      className="w-full pl-9 pr-3 py-2 text-xs font-sans font-bold rounded-xl border-2 border-slate-200 focus:border-aura-blue focus:outline-none"
                    />
                  </div>
                </div>

                {frontImage && (
                  <div className="relative w-fit mt-1">
                    <img src={frontImage} alt="Preview frente" className="w-20 h-20 rounded-2xl object-cover border-2 border-aura-blue/20 shadow-sm" />
                    <button 
                      onClick={() => { setFrontImage(null); setFrontImageUrl('') }} 
                      className="absolute -top-2 -right-2 bg-aura-red text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer shadow-md hover:scale-105"
                      title="Remover imagem"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Verso */}
            <div className="card-3d p-5 flex flex-col gap-3 rounded-2xl border-2 border-slate-200 bg-white">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-xs font-display font-black text-aura-text-muted uppercase tracking-wider">
                  Verso (Tradução / Resposta)
                </h3>
                
                <div className="flex items-center gap-3">
                  <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-heading font-bold ${backAudio ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    <input 
                      type="checkbox" 
                      checked={backAudio} 
                      onChange={e => setBackAudio(e.target.checked)}
                      className="accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <Volume2 size={15} /> Áudio (Inglês)
                  </label>

                  {backAudio && back.trim() && isEnglishText(back) && (
                    <button 
                      onClick={() => speak(back.trim(), 'en-US')} 
                      className="btn-3d-icon w-8 h-8 !rounded-xl text-blue-600" 
                      title="Ouvir pronúncia"
                    >
                      <Volume2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <textarea 
                placeholder="Ex: Maçã (tradução ou resposta no verso)" 
                value={back} 
                onChange={e => setBack(e.target.value)} 
                onPaste={e => handlePaste(e, 'back')} 
                rows={2} 
                className="w-full rounded-2xl p-3.5 text-sm font-sans font-bold border-2 border-slate-200 focus:border-aura-blue focus:outline-none transition-colors" 
              />
              
              {/* Imagem Verso */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="btn-3d-white text-xs px-4 py-2 !rounded-xl flex items-center gap-2 cursor-pointer font-bold">
                    <ImageIcon size={15} /> Inserir Imagem
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'back')} className="hidden" />
                  </label>

                  <div className="relative flex-1 min-w-[200px]">
                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="url"
                      placeholder="ou cole o link da imagem (https://...)" 
                      value={backImageUrl}
                      onChange={e => handleImageUrlChange(e.target.value, 'back')}
                      className="w-full pl-9 pr-3 py-2 text-xs font-sans font-bold rounded-xl border-2 border-slate-200 focus:border-aura-blue focus:outline-none"
                    />
                  </div>
                </div>

                {backImage && (
                  <div className="relative w-fit mt-1">
                    <img src={backImage} alt="Preview verso" className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-sm" />
                    <button 
                      onClick={() => { setBackImage(null); setBackImageUrl('') }} 
                      className="absolute -top-2 -right-2 bg-aura-red text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer shadow-md hover:scale-105"
                      title="Remover imagem"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
