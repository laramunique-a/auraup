import { useState, useMemo } from 'react'
import { Trophy, Flame, Users, Globe, Crown, Medal, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { useEconomy } from '../contexts/EconomyContext'
import { GLOBAL_RANKING_MOCK, CLASS_RANKING_MOCK } from '../mockData'

const AVATARS: Record<string, string> = {
  avatar_1: '🦊', avatar_2: '🐨', avatar_3: '🦁',
  avatar_4: '🐼', avatar_5: '🦉', avatar_6: '🦖',
  admin: '👑',
}

export function RankingPage() {
  const [tab, setTab] = useState<'global' | 'class'>('global')
  const { user } = useAuth()
  const { xp: userXp, streak: userStreak } = useEconomy()

  const currentList = useMemo(() => {
    const rawList = tab === 'global' ? GLOBAL_RANKING_MOCK : CLASS_RANKING_MOCK

    const userName = user?.nickname || user?.name || 'Você'
    const userAvatar = AVATARS[user?.avatar_id || 'avatar_1'] || '🦊'

    const updated = rawList.map(item => {
      if (item.isCurrentUser) {
        return {
          ...item,
          name: userName,
          avatar: userAvatar,
          xp: Math.max(item.xp, userXp),
          streak: Math.max(item.streak, userStreak),
        }
      }
      return item
    })

    return updated
      .sort((a, b) => b.xp - a.xp)
      .map((item, idx) => ({
        ...item,
        posicao: idx + 1,
      }))
  }, [tab, user, userXp, userStreak])

  const top3 = currentList.slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-glow-primary">
          <Trophy size={32} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading text-slate-900 dark:text-slate-100 mb-1">
          Liga dos <span className="text-[#2563eb]">Campeões</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 font-label text-xs sm:text-sm">
          Suba no ranking estudando diariamente e acumulando XP! ✨
        </p>
      </header>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-3 mb-8 font-label">
        <Button
          variant={tab === 'global' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => setTab('global')}
          className="rounded-full text-xs font-semibold px-5 py-2.5"
        >
          <Globe size={16} /> Ranking Global
        </Button>

        <Button
          variant={tab === 'class' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => setTab('class')}
          className="rounded-full text-xs font-semibold px-5 py-2.5"
        >
          <Users size={16} /> Minha Turma
        </Button>
      </div>

      {/* Podium Top 3 */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 items-end max-w-2xl mx-auto">
        {/* Posicao 2 (Prata) */}
        {top3[1] && (
          <div className="glass-panel p-4 flex flex-col items-center text-center rounded-2xl border-slate-200/80 shadow-soft-sm hover:-translate-y-1 transition-all">
            <div className="text-xl mb-1">🥈</div>
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl mb-2 border-2 border-slate-300">
              {top3[1].avatar}
            </div>
            <h3 className="font-heading text-sm text-slate-900 truncate w-full">{top3[1].name}</h3>
            <span className="text-xs font-label font-bold text-blue-600 mt-1">{top3[1].xp} XP</span>
          </div>
        )}

        {/* Posicao 1 (Ouro) */}
        {top3[0] && (
          <div className="glass-panel p-5 flex flex-col items-center text-center rounded-2xl border-amber-300/60 bg-gradient-to-b from-amber-50/60 to-white shadow-soft-md hover:-translate-y-1 transition-all -translate-y-2">
            <div className="text-2xl mb-1"><Crown size={24} className="text-amber-500 fill-amber-400" /></div>
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-3xl mb-2 border-2 border-amber-400">
              {top3[0].avatar}
            </div>
            <h3 className="font-heading text-base text-slate-900 truncate w-full">{top3[0].name}</h3>
            <span className="text-xs font-label font-bold text-amber-600 mt-1">{top3[0].xp} XP</span>
          </div>
        )}

        {/* Posicao 3 (Bronze) */}
        {top3[2] && (
          <div className="glass-panel p-4 flex flex-col items-center text-center rounded-2xl border-amber-700/20 shadow-soft-sm hover:-translate-y-1 transition-all">
            <div className="text-xl mb-1">🥉</div>
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-2xl mb-2 border-2 border-amber-600/40">
              {top3[2].avatar}
            </div>
            <h3 className="font-heading text-sm text-slate-900 truncate w-full">{top3[2].name}</h3>
            <span className="text-xs font-label font-bold text-blue-600 mt-1">{top3[2].xp} XP</span>
          </div>
        )}
      </div>

      {/* Full Leaderboard List */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl shadow-glass border border-slate-900/5">
        <h2 className="text-base font-heading text-slate-900 mb-4 px-2 flex items-center gap-2">
          <Medal size={18} className="text-blue-600" /> Tabela de Classificação
        </h2>

        <div className="flex flex-col gap-2 font-label">
          {currentList.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                item.isCurrentUser
                  ? 'bg-blue-50/80 border-blue-200/80 shadow-soft-sm'
                  : 'bg-white/60 hover:bg-white border-slate-900/5'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-7 text-center font-bold text-xs ${item.posicao <= 3 ? 'text-amber-600' : 'text-slate-400'}`}>
                  #{item.posicao}
                </span>

                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-lg shrink-0 border border-slate-200">
                  {item.avatar}
                </div>

                <div className="min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-1.5">
                    {item.name}
                    {item.isCurrentUser && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">Você</span>
                    )}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Flame size={12} className="text-orange-500 fill-orange-500" /> {item.streak}d ofensiva
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm font-bold text-blue-600 flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-500" /> {item.xp} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
