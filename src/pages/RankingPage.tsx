import { useState, useMemo, useEffect } from 'react'
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [tab])

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-8 flex-1">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-3 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xs">
          <Trophy size={28} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight">
          Liga dos <span className="text-blue-600 dark:text-blue-400">Campeões</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
          Suba no ranking <strong className="text-slate-800 dark:text-white">estudando diariamente</strong> e acumulando <strong className="text-blue-600 dark:text-blue-400">XP</strong>! ✨
        </p>
      </header>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <Button
          variant={tab === 'global' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTab('global')}
        >
          <Globe size={16} /> Ranking Global
        </Button>

        <Button
          variant={tab === 'class' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTab('class')}
        >
          <Users size={16} /> Minha Turma
        </Button>
      </div>

      {/* Podium Top 3 */}
      <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-8 items-end max-w-2xl mx-auto">
        {/* Posicao 2 (Prata) */}
        {top3[1] && (
          <div className="card-3d p-4 sm:p-5 flex flex-col items-center text-center rounded-xl border border-slate-200 bg-white dark:bg-slate-800 shadow-xs hover:-translate-y-1 transition-transform">
            <div className="text-2xl mb-1">🥈</div>
            <div className="w-11 h-11 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-xl mb-2 border border-slate-200 dark:border-slate-600 shadow-xs">
              {top3[1].avatar}
            </div>
            <h3 className="font-heading font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate w-full">{top3[1].name}</h3>
            <span className="font-heading font-semibold text-xs text-blue-700 dark:text-blue-300 mt-1 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60">
              <span className="font-bold">{top3[1].xp}</span> XP
            </span>
          </div>
        )}

        {/* Posicao 1 (Ouro) */}
        {top3[0] && (
          <div className="card-3d p-5 sm:p-6 flex flex-col items-center text-center rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/30 shadow-xs -translate-y-2 hover:-translate-y-3 transition-transform">
            <div className="text-2xl mb-1"><Crown size={24} className="text-amber-500 fill-amber-400" /></div>
            <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-2xl mb-2 border-2 border-amber-400 shadow-xs">
              {top3[0].avatar}
            </div>
            <h3 className="font-heading font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate w-full">{top3[0].name}</h3>
            <span className="font-heading font-semibold text-xs text-amber-800 dark:text-amber-300 mt-1 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
              <span className="font-bold">{top3[0].xp}</span> XP
            </span>
          </div>
        )}

        {/* Posicao 3 (Bronze) */}
        {top3[2] && (
          <div className="card-3d p-4 sm:p-5 flex flex-col items-center text-center rounded-xl border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-800 shadow-xs hover:-translate-y-1 transition-transform">
            <div className="text-2xl mb-1">🥉</div>
            <div className="w-11 h-11 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-xl mb-2 border border-slate-200 dark:border-slate-600 shadow-xs">
              {top3[2].avatar}
            </div>
            <h3 className="font-heading font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate w-full">{top3[2].name}</h3>
            <span className="font-heading font-semibold text-xs text-blue-700 dark:text-blue-300 mt-1 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60">
              <span className="font-bold">{top3[2].xp}</span> XP
            </span>
          </div>
        )}
      </div>

      {/* Full Leaderboard List */}
      <div className="card-3d p-5 sm:p-6 rounded-xl">
        <h2 className="text-base font-heading font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Medal size={17} className="text-blue-600 dark:text-blue-400" /> Tabela de Classificação
        </h2>

        <div className="flex flex-col gap-2">
          {currentList.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                item.isCurrentUser
                  ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 shadow-xs'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-6 text-center font-heading font-bold text-xs sm:text-sm ${item.posicao <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                  #{item.posicao}
                </span>

                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-base shrink-0 border border-slate-200 dark:border-slate-600 shadow-xs">
                  {item.avatar}
                </div>

                <div className="min-w-0">
                  <h4 className="font-heading font-semibold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    {item.name}
                    {item.isCurrentUser && (
                      <span className="text-[11px] font-heading font-semibold px-2 py-0.5 rounded-md bg-blue-600 text-white">Você</span>
                    )}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Flame size={12} className="text-amber-500 fill-amber-500" /> <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.streak}d</span> de ofensiva
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm font-heading font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-800">
                  <Sparkles size={13} className="text-amber-500 fill-amber-500" /> <span className="font-bold">{item.xp}</span> XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
