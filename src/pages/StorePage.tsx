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
      <div className="card-3d w-full max-w-3xl h-96 rounded-3xl animate-pulse bg-slate-100/60" />
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
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingCart size={20} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
              Loja de <span className="text-blue-600 dark:text-blue-400">Decks Oficiais</span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
            Adicione baralhos <strong className="text-slate-800 dark:text-white">prontos e testados</strong> à sua conta com <strong className="text-blue-600 dark:text-blue-400">1 clique</strong>. ✨
          </p>
        </div>

        <div className="card-3d px-4 py-2.5 flex items-center gap-3 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
            <Coins size={18} className="fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="text-xl font-heading font-extrabold text-slate-900 dark:text-white leading-none">
              {user?.coins || 0}
            </div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">Suas moedas</div>
          </div>
        </div>
      </header>

      {visibleOfficialDecks.length === 0 ? (
        <div className="card-3d p-12 text-center flex flex-col items-center justify-center gap-3 rounded-2xl border-dashed">
          <BookOpen size={44} className="text-slate-400 mb-2 opacity-60" />
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white">Nenhum baralho disponível no seu nível</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md">
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
                className="card-3d-interactive p-5 sm:p-6 flex flex-col justify-between gap-4 rounded-2xl"
              >
                {/* Banner / Category */}
                <div className="w-full h-28 rounded-xl bg-gradient-to-br from-blue-50/60 to-amber-50/50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center relative overflow-hidden border border-slate-100 dark:border-slate-700">
                  <Sparkles size={44} className="text-blue-500 opacity-10 absolute" />
                  <div className="absolute top-2.5 right-2.5 bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-heading font-bold flex items-center gap-1 shadow-xs">
                    <Star size={11} className="fill-white" /> Oficial Aura
                  </div>
                  <div className="text-4xl">📚</div>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-heading font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                      Nível: <strong>{deck.level || 'Todos'}</strong>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Layers size={13} className="text-blue-600 dark:text-blue-400" /> <strong className="text-slate-800 dark:text-slate-200">{deck.cards?.length || 0}</strong> cards
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1 leading-snug">
                    {deck.name}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-2">
                    {deck.description || 'Baralho oficial preparado para impulsionar sua fluência e retenção.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  {isClaimed ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-heading font-bold flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                      <Check size={16} /> Já Adicionado aos Seus Decks
                    </div>
                  ) : (
                    <Button 
                      variant="orange" 
                      size="sm" 
                      fullWidth 
                      loading={claiming === deck.id}
                      onClick={() => handleClaimDeck(deck)}
                    >
                      <Plus size={16} /> Adicionar à Minha Coleção (Grátis)
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
