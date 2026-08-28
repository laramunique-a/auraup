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
    setFrontAudio(false)
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
    setFrontAudio(card.front_audio === true)
    setBackAudio(card.back_audio === true)
  }

  async function handleSaveCard() {
    if (!(front.trim() || frontImage) || !(back.trim() || backImage)) return
    setSaving(true)
    const extraFields = { 
      front_image: frontImage, 
      back_image: backImage, 
      front_lang: 'en-US', 
      back_lang: 'en-US', 
      front_audio: frontAudio, 
      back_audio: backAudio 
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
    <div style={{
      maxWidth: '1200px', margin: '0 auto', padding: '1.25rem',
      background: 'radial-gradient(circle at top, var(--accent-soft), transparent 800px), var(--bg-primary)',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', 
        marginBottom: '1.5rem', gap: '2rem', animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          <button onClick={() => navigate('/')} className="btn-icon-soft" style={{ width: '48px', height: '48px' }}>
            <ArrowLeft size={24} />
          </button>
          
          <div style={{ flex: 1 }}>
            {editDeckName ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  value={newDeckName}
                  onChange={e => setNewDeckName(e.target.value)}
                  autoFocus
                  style={{ fontSize: '1.25rem', fontWeight: 900, height: 'auto', padding: '0.5rem 0', borderBottom: '2px solid var(--accent)' }}
                  onKeyDown={e => { if (e.key === 'Enter') handleUpdateDeckName(); if (e.key === 'Escape') setEditDeckName(false) }}
                />
                <Button onClick={handleUpdateDeckName}>Salvar</Button>
                <Button variant="ghost" onClick={() => setEditDeckName(false)}>Cancelar</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.05em' }}>
                  {deck?.name || 'Carregando...'}
                </h1>
                <button 
                  onClick={() => { setNewDeckName(deck?.name || ''); setEditDeckName(true) }}
                  className="btn-icon-soft"
                >
                  <Pencil size={20} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8125rem' }}>
                <Layers size={18} color="var(--accent)" /> {cards.length} Cards
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8125rem' }}>
                <Sparkles size={18} color="var(--warning)" fill="var(--warning)" /> Baralho Pessoal
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {cards.length > 0 && (
            <Button variant="vibrant" size="md" onClick={() => navigate(`/study/${id}`)}>
              <Play size={18} fill="white" /> Estudar Agora
            </Button>
          )}
          <Button variant="secondary" size="md" onClick={openCreate}>
            <Plus size={18} /> Novo Card
          </Button>
        </div>
      </header>

      {/* Grid Section */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '32px' }} />)}
        </div>
      ) : cards.length === 0 ? (
        <div style={{ animation: 'popIn 0.8s ease' }}>
          <EmptyState
            icon="🎴"
            title="Baralho Vazio"
            description="Seu baralho ainda não tem cards. Comece adicionando novas palavras ou frases para aprender!"
            action={<Button variant="vibrant" size="md" onClick={openCreate}><Plus size={20} /> Criar Primeiro Card</Button>}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {cards.map((card, idx) => (
            <div 
              key={card.id} 
              className="card animate-pop"
              style={{ 
                padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
                animationDelay: `${idx * 0.05}s`, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Frente</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>{card.front}</div>
                </div>
                {card.front_image && <img src={card.front_image} style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', border: '2px solid var(--border)' }} />}
              </div>
              
              <div style={{ height: '1px', background: 'var(--border)', opacity: 0.5 }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Verso</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{card.back}</div>
                </div>
                {card.back_image && <img src={card.back_image} style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', border: '2px solid var(--border)' }} />}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', justifyContent: 'flex-end' }}>
                <button onClick={() => openEdit(card)} className="btn-icon-soft" title="Editar"><Pencil size={18} /></button>
                <button onClick={() => handleDeleteCard(card.id)} className="btn-icon-soft" title="Excluir" style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}><Trash2 size={18} /></button>
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
        maxWidth="600px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Visual Hint Banner */}
          <div style={{
            background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: '16px',
            padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
            color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 700
          }}>
            <Info size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 900, color: 'var(--accent)' }}>Dica:</span> Você pode colar (<kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.75rem' }}>Ctrl + V</kbd>) uma imagem copiada diretamente na caixa de texto!
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            
            {/* Front Side */}
            <div style={{
              background: 'var(--bg-surface)', border: '2px solid var(--border)', borderRadius: '24px',
              padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Frente
                </h3>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {/* Flag de Audio Unico */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 800, color: frontAudio ? 'var(--accent)' : 'var(--text-muted)' }}>
                    <input 
                      type="checkbox" 
                      checked={frontAudio} 
                      onChange={e => setFrontAudio(e.target.checked)}
                      style={{ accentColor: 'var(--accent)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <Volume2 size={16} /> Áudio (Inglês)
                  </label>

                  {frontAudio && front.trim() && (
                    <button onClick={() => speak(front.trim(), 'en-US')} className="btn-icon-soft" style={{ width: '32px', height: '32px' }} title="Ouvir pronúncia em inglês">
                      <Volume2 size={16} />
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
                className="input-gamified"
                style={{ fontSize: '1rem', fontWeight: 700, resize: 'vertical' }} 
              />
              
              {/* Image Options for Front */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)',
                    padding: '0.5rem 1rem', borderRadius: '14px', border: '2px solid var(--border)',
                    cursor: 'pointer', fontWeight: 800, fontSize: '0.8125rem', color: 'var(--text-primary)',
                    flexShrink: 0
                  }} className="hover-bounce">
                    <ImageIcon size={16} color="var(--accent)" /> Inserir Imagem
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'front')} style={{ display: 'none' }} />
                  </label>

                  <div style={{ position: 'relative', flex: 1 }}>
                    <LinkIcon size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="url"
                      placeholder="ou cole o link da imagem aqui (ex: https://...)" 
                      value={frontImageUrl}
                      onChange={e => handleImageUrlChange(e.target.value, 'front')}
                      style={{
                        width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.75rem', fontWeight: 700,
                        borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {frontImage && (
                  <div style={{ position: 'relative', width: 'fit-content', marginTop: '0.25rem' }}>
                    <img src={frontImage} alt="Front preview" style={{ width: '90px', height: '90px', borderRadius: '14px', objectFit: 'cover', border: '2px solid var(--border)' }} />
                    <button 
                      onClick={() => { setFrontImage(null); setFrontImageUrl('') }} 
                      style={{ 
                        position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', 
                        color: 'white', borderRadius: '50%', border: 'none', width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      title="Remover imagem"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Back Side */}
            <div style={{
              background: 'var(--bg-card)', border: '2px solid var(--border)', borderRadius: '24px',
              padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Verso
                </h3>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {/* Flag de Audio Unico */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 800, color: backAudio ? 'var(--accent)' : 'var(--text-muted)' }}>
                    <input 
                      type="checkbox" 
                      checked={backAudio} 
                      onChange={e => setBackAudio(e.target.checked)}
                      style={{ accentColor: 'var(--accent)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <Volume2 size={16} /> Áudio (Inglês)
                  </label>

                  {backAudio && back.trim() && (
                    <button onClick={() => speak(back.trim(), 'en-US')} className="btn-icon-soft" style={{ width: '32px', height: '32px' }} title="Ouvir pronúncia em inglês">
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <textarea 
                placeholder="Ex: Apple (tradução ou resposta no verso)" 
                value={back} 
                onChange={e => setBack(e.target.value)} 
                onPaste={e => handlePaste(e, 'back')} 
                rows={2} 
                className="input-gamified"
                style={{ fontSize: '1rem', fontWeight: 700, resize: 'vertical' }} 
              />
              
              {/* Image Options for Back */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)',
                    padding: '0.5rem 1rem', borderRadius: '14px', border: '2px solid var(--border)',
                    cursor: 'pointer', fontWeight: 800, fontSize: '0.8125rem', color: 'var(--text-primary)',
                    flexShrink: 0
                  }} className="hover-bounce">
                    <ImageIcon size={16} color="var(--accent)" /> Inserir Imagem
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'back')} style={{ display: 'none' }} />
                  </label>

                  <div style={{ position: 'relative', flex: 1 }}>
                    <LinkIcon size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="url"
                      placeholder="ou cole o link da imagem aqui (ex: https://...)" 
                      value={backImageUrl}
                      onChange={e => handleImageUrlChange(e.target.value, 'back')}
                      style={{
                        width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.75rem', fontWeight: 700,
                        borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-surface)', outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {backImage && (
                  <div style={{ position: 'relative', width: 'fit-content', marginTop: '0.25rem' }}>
                    <img src={backImage} alt="Back preview" style={{ width: '90px', height: '90px', borderRadius: '14px', objectFit: 'cover', border: '2px solid var(--border)' }} />
                    <button 
                      onClick={() => { setBackImage(null); setBackImageUrl('') }} 
                      style={{ 
                        position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', 
                        color: 'white', borderRadius: '50%', border: 'none', width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      title="Remover imagem"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button variant="ghost" size="md" onClick={() => { setShowCreate(false); setEditingCard(null); resetForm() }}>
              Cancelar
            </Button>
            <Button 
              variant="vibrant" 
              size="md" 
              loading={saving} 
              onClick={handleSaveCard} 
              disabled={!((front.trim() || frontImage) && (back.trim() || backImage))}
            >
              {editingCard ? 'Salvar Alterações' : 'Criar Card'}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
