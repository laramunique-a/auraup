import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useDecks } from '../hooks/useDecks'
import { Button } from '../components/ui/Button'
import { Coins, Sparkles, Star, ShoppingCart, Check, Layers, BookOpen, Plus } from 'lucide-react'
import { useToast } from '../components/ui/Toast'
import { officialDeckService, type OfficialDeck } from '../services/officialDeck.service'

export function StorePage() {
  const { user } = useAuth()
  const { decks, reload } = useDecks()
  const { show } = useToast()
  
  const [officialDecks, setOfficialDecks] = useState<OfficialDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimedDeckIds, setClaimedDeckIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadStoreDecks() {
      setLoading(true)
      try {
        const publishedDecks = await officialDeckService.getOfficialDecks(true)
        setOfficialDecks(publishedDecks)
      } catch (err) {
        show('Erro ao carregar a Loja de Decks.', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadStoreDecks()
  }, [])

  const handleClaimDeck = async (deck: OfficialDeck) => {
    if (!user) return
    setClaiming(deck.id)
    try {
      await officialDeckService.claimOfficialDeckToUser(user.id, deck.id)
      await reload()
      setClaimedDeckIds(prev => new Set(prev).add(deck.id))
      show(`Baralho "${deck.name}" adicionado com sucesso! Ele já está disponível em "Meus Baralhos". ✨`, 'success')
    } catch (err: any) {
      show(err?.message || 'Erro ao adicionar o baralho.', 'error')
    } finally {
      setClaiming(null)
    }
  }

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex justify-center items-center min-h-[60vh]">
      <div className="glass-panel w-full max-w-3xl h-96 rounded-2xl animate-pulse" />
    </div>
  )

  const isAdmin = user?.role === 'admin'
  const userLevelName = user?.level?.name || 'Iniciante'
  const userLevelId = user?.level_id

  const visibleOfficialDecks = officialDecks.filter(deck => {
    if (!deck.is_published) return false
    if (isAdmin) return true
    
    const deckLevel = deck.level || deck.category || 'Todos'
    if (!deckLevel || deckLevel === 'Todos' || deckLevel.toLowerCase() === 'todos') {
      return true
    }
    return (
      deckLevel.toLowerCase() === userLevelName.toLowerCase() ||
      deckLevel === userLevelId
    )
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-glow-primary">
              <ShoppingCart size={20} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading text-slate-900 dark:text-slate-100">
              Loja de <span className="text-[#2563eb]">Decks Oficiais</span>
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-label">
            Adicione baralhos prontos e testados à sua conta com 1 clique. ✨
          </p>
        </div>

        <div className="glass-panel px-5 py-3 flex items-center gap-3 rounded-2xl border border-slate-900/5">
          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Coins size={18} className="fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="text-lg font-heading text-slate-900 leading-tight">
              {user?.coins || 0}
            </div>
            <div className="text-[10px] font-label font-semibold text-slate-400 uppercase tracking-wider">Suas Moedas</div>
          </div>
        </div>
      </header>

      {visibleOfficialDecks.length === 0 ? (
        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center gap-3 rounded-2xl border-dashed">
          <BookOpen size={48} className="text-slate-400 mb-2 opacity-60" />
          <h2 className="text-xl font-heading text-slate-900">Nenhum baralho disponível no seu nível</h2>
          <p className="text-sm font-label text-slate-500 max-w-md">
            Nossos professores estão criando novos baralhos padrões para seu nível. Volte em breve!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleOfficialDecks.map((deck) => {
            const isClaimed = claimedDeckIds.has(deck.id) || decks.some(d => d.name.toLowerCase().trim() === deck.name.toLowerCase().trim())
            return (
              <div 
                key={deck.id} 
                className="glass-panel-interactive p-6 flex flex-col justify-between gap-5 rounded-2xl"
              >
                {/* Banner / Category */}
                <div className="w-full h-32 rounded-xl bg-gradient-to-br from-slate-100/80 via-white to-blue-50/50 flex items-center justify-center relative overflow-hidden border border-slate-900/5">
                  <Sparkles size={50} className="text-blue-500 opacity-10 absolute" />
                  <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-label font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Star size={10} className="fill-white" /> OFICIAL AURA ENGLISH
                  </div>
                  <div className="text-5xl">📚</div>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2 font-label">
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                      NÍVEL: {deck.level || 'Todos'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Layers size={13} className="text-blue-600" /> {deck.cards?.length || 0} Cards
                    </span>
                  </div>

                  <h3 className="font-heading text-lg text-slate-900 mb-1 leading-snug">
                    {deck.name}
                  </h3>
                  
                  <p className="text-xs font-label text-slate-500 leading-relaxed">
                    {deck.description || 'Baralho padronizado pela equipe Aura English.'}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-900/5 flex items-center justify-between gap-2 font-label">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                    <Coins size={14} className="text-amber-500 fill-amber-500" /> Grátis
                  </div>

                  {isClaimed ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                      <Check size={14} /> Na sua conta
                    </span>
                  ) : (
                    <Button 
                      variant="primary" 
                      size="sm"
                      loading={claiming === deck.id}
                      onClick={() => handleClaimDeck(deck)}
                      className="btn-primary-glass text-xs font-semibold px-4 py-2 rounded-xl"
                    >
                      <Plus size={14} /> Adicionar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
