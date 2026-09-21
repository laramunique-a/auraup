import { useState, useMemo, useEffect } from 'react'
import { Trophy, Flame, Users, Globe, Crown, Medal, Sparkles, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import { useEconomy } from '../contexts/EconomyContext'

const AVATARS: Record<string, string> = {
  avatar_1: '🦊', avatar_2: '🐨', avatar_3: '🦁',
  avatar_4: '🐼', avatar_5: '🦉', avatar_6: '🦖',
  admin: '👑',
}

// ─── Lê todos os usuários alunos do localStorage (modo local) ────────────────
function getStudentsFromStorage() {
  try {
    const raw = localStorage.getItem('uply_accounts_db')
    if (raw) {
      const accounts: any[] = JSON.parse(raw)
      return accounts.filter(a => a.role === 'user' && a.is_active !== false)
    }
    // fallback: admin_users
    const raw2 = localStorage.getItem('uply_admin_users')
    if (raw2) {
      return (JSON.parse(raw2) as any[]).filter(u => u.role !== 'admin')
    }
  } catch { /* ignore */ }
  return []
}

// ─── Tipos internos ──────────────────────────────────────────────────────────
interface RankEntry {
  id: string
  name: string
  avatar: string
  xp: number
  streak: number
  posicao: number
  isCurrentUser?: boolean
}

interface TurmaGroup {
  levelId: string
  levelName: string
  levelColor: string
  entries: RankEntry[]
}

// ─── Componente auxiliar: PodiumCard ─────────────────────────────────────────
function PodiumCard({ entry, place }: { entry: RankEntry; place: 1 | 2 | 3 }) {
  const medal = place === 1 ? <Crown size={22} className="text-amber-500 fill-amber-400" /> : place === 2 ? '🥈' : '🥉'
  const border = place === 1
    ? 'border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/30 -translate-y-2 hover:-translate-y-3'
    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:-translate-y-1'
  const avatarSize = place === 1 ? 'w-12 h-12 text-2xl border-2 border-amber-400' : 'w-11 h-11 text-xl border border-slate-200 dark:border-slate-600'
  const xpStyle = place === 1
    ? 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700'
    : 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200/60'

  return (
    <div className={`card-3d p-4 sm:p-5 flex flex-col items-center text-center rounded-xl border shadow-xs transition-transform ${border}`}>
      <div className="text-2xl mb-1">{medal}</div>
      <div className={`${avatarSize} rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-2 shadow-xs`}>
        {entry.avatar}
      </div>
      <h3 className="font-heading font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate w-full">{entry.name}</h3>
      <span className={`font-heading font-semibold text-xs mt-1 px-2 py-0.5 rounded-md border ${xpStyle}`}>
        <span className="font-bold">{entry.xp}</span> XP
      </span>
    </div>
  )
}

// ─── Componente auxiliar: LeaderboardRow ─────────────────────────────────────
function LeaderboardRow({ item }: { item: RankEntry }) {
  return (
    <div
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
  )
}

// ─── Componente auxiliar: TurmaSection (para admin) ──────────────────────────
function TurmaSection({ group }: { group: TurmaGroup }) {
  const [expanded, setExpanded] = useState(false)
  const top3 = group.entries.slice(0, 3)

  return (
    <div className="card-3d rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
      {/* Header da Turma */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: group.levelColor }}
          />
          <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            {group.levelName}
          </h3>
          <span className="text-xs font-heading font-semibold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {group.entries.length} aluno{group.entries.length !== 1 ? 's' : ''}
          </span>
        </div>
        {expanded
          ? <ChevronUp size={17} className="text-slate-400 shrink-0" />
          : <ChevronDown size={17} className="text-slate-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="p-4 sm:p-5">
          {group.entries.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              Nenhum aluno nesta turma ainda.
            </p>
          ) : (
            <>
              {/* Mini Podium Top 3 */}
              {top3.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 items-end max-w-sm mx-auto">
                  {top3[1] ? <PodiumCard entry={top3[1]} place={2} /> : <div />}
                  {top3[0] ? <PodiumCard entry={top3[0]} place={1} /> : <div />}
                  {top3[2] ? <PodiumCard entry={top3[2]} place={3} /> : <div />}
                </div>
              )}

              {/* Lista completa */}
              <div className="flex flex-col gap-2">
                {group.entries.map(item => (
                  <LeaderboardRow key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── RankingPage Principal ────────────────────────────────────────────────────
export function RankingPage() {
  const [tab, setTab] = useState<'global' | 'class'>('global')
  const { user } = useAuth()
  const { xp: userXp, streak: userStreak } = useEconomy()
  const isAdmin = user?.role === 'admin'

  // ── Dados de turmas para o Admin ──────────────────────────────────────────
  const turmaGroups = useMemo<TurmaGroup[]>(() => {
    if (!isAdmin) return []

    const students = getStudentsFromStorage()

    // Mapeia níveis únicos
    const levelsMap = new Map<string, { name: string; color: string; min_xp: number }>()
    students.forEach((s: any) => {
      const lvlId = s.level_id || 'sem_turma'
      if (!levelsMap.has(lvlId)) {
        levelsMap.set(lvlId, {
          name: s.level?.name || (lvlId === 'sem_turma' ? 'Sem Turma' : lvlId),
          color: s.level?.color || '#94a3b8',
          min_xp: s.level?.min_xp ?? 0,
        })
      }
    })

    // Ordena turmas por min_xp
    const sortedLevels = Array.from(levelsMap.entries()).sort(
      (a, b) => (a[1].min_xp ?? 0) - (b[1].min_xp ?? 0)
    )

    return sortedLevels.map(([lvlId, lvl]) => {
      const members = students
        .filter((s: any) => (s.level_id || 'sem_turma') === lvlId)
        .sort((a: any, b: any) => b.xp - a.xp)
        .map((s: any, idx: number): RankEntry => ({
          id: s.id,
          name: s.nickname || s.name || 'Aluno',
          avatar: AVATARS[s.avatar_id] || '🦊',
          xp: s.xp || 0,
          streak: s.streak || 0,
          posicao: idx + 1,
        }))

      return {
        levelId: lvlId,
        levelName: lvl.name,
        levelColor: lvl.color,
        entries: members,
      }
    })
  }, [isAdmin])

  // ── Dados de ranking para alunos normais ──────────────────────────────────
  const currentList = useMemo(() => {
    if (isAdmin) return []

    const students = getStudentsFromStorage()
    const filtered = tab === 'class'
      ? students.filter((s: any) => s.level_id === user?.level_id)
      : students

    const entries: RankEntry[] = filtered.map((s: any): RankEntry => ({
      id: s.id,
      name: s.nickname || s.name || 'Aluno',
      avatar: AVATARS[s.avatar_id] || '🦊',
      xp: s.id === user?.id ? Math.max(s.xp || 0, userXp) : (s.xp || 0),
      streak: s.id === user?.id ? Math.max(s.streak || 0, userStreak) : (s.streak || 0),
      posicao: 0,
      isCurrentUser: s.id === user?.id,
    }))

    // Se o aluno logado não estiver na lista, adiciona-o
    if (user && user.role !== 'admin' && !entries.some(e => e.id === user.id)) {
      entries.push({
        id: user.id,
        name: user.nickname || user.name || 'Você',
        avatar: AVATARS[user.avatar_id] || '🦊',
        xp: userXp,
        streak: userStreak,
        posicao: 0,
        isCurrentUser: true,
      })
    }

    return entries
      .sort((a, b) => b.xp - a.xp)
      .map((item, idx) => ({
        ...item,
        posicao: idx + 1,
      }))
  }, [tab, user, userXp, userStreak, isAdmin])

  const top3 = currentList.slice(0, 3)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [tab])

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-3.5 sm:py-8 flex-1 w-full">
      {/* Header */}
      <PageHeader
        icon={Trophy}
        title={<>Liga dos <span className="text-blue-600 dark:text-blue-400">Campeões</span></>}
        subtitle={
          isAdmin ? (
            <>Visualize o ranking separado por <strong className="text-blue-600 dark:text-blue-400">Turma</strong> ou o ranking <strong className="text-blue-600 dark:text-blue-400">Global</strong> de todos os alunos.</>
          ) : (
            <>Suba no ranking <strong className="text-slate-800 dark:text-white">estudando diariamente</strong> e acumulando <strong className="text-blue-600 dark:text-blue-400">XP</strong>! ✨</>
          )
        }
        actions={
          <div className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-2 gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setTab('global')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer ${
                tab === 'global'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Globe size={15} className="shrink-0" />
              <span>Ranking Global</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('class')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer ${
                tab === 'class'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Users size={15} className="shrink-0" />
              <span>{isAdmin ? 'Turmas' : 'Minha Turma'}</span>
            </button>
          </div>
        }
      />

      {/* Banner informativo para Admin */}
      {isAdmin && (
        <div className="mb-6 p-3 sm:p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="leading-snug">
            <strong className="font-bold">Modo Professor/Admin:</strong> Você pode estudar, criar cards e testar todas as funcionalidades livremente, mas seu perfil não pontua nesta lista para não competir com os estudantes.
          </p>
        </div>
      )}

      {/* ── Visão Admin: Turmas ────────────────────────────────────────────── */}
      {isAdmin && tab === 'class' && (
        <div className="flex flex-col gap-5">
          {turmaGroups.length === 0 ? (
            <div className="card-3d p-8 sm:p-12 rounded-xl flex flex-col items-center text-center gap-3">
              <Users size={40} className="text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhum aluno cadastrado ainda.</p>
            </div>
          ) : (
            turmaGroups.map(group => (
              <TurmaSection key={group.levelId} group={group} />
            ))
          )}
        </div>
      )}

      {/* ── Visão Admin: Global ────────────────────────────────────────────── */}
      {/* ── Visão Admin: Global ────────────────────────────────────────────── */}
      {isAdmin && tab === 'global' && (
        <>
          {(() => {
            const allStudents = getStudentsFromStorage()
              .sort((a: any, b: any) => b.xp - a.xp)

            if (allStudents.length === 0) {
              return (
                <div className="card-3d p-8 sm:p-12 rounded-xl flex flex-col items-center text-center gap-3">
                  <Users size={40} className="text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhum aluno cadastrado no ranking ainda.</p>
                </div>
              )
            }

            const top3Admin = allStudents.slice(0, 3).map((s: any, idx: number): RankEntry => ({
              id: s.id,
              name: s.nickname || s.name || 'Aluno',
              avatar: AVATARS[s.avatar_id] || '🦊',
              xp: s.xp || 0,
              streak: s.streak || 0,
              posicao: idx + 1,
            }))

            return (
              <>
                {/* Podium */}
                <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-8 items-end max-w-2xl mx-auto">
                  {top3Admin[1] ? <PodiumCard entry={top3Admin[1]} place={2} /> : <div />}
                  {top3Admin[0] ? <PodiumCard entry={top3Admin[0]} place={1} /> : <div />}
                  {top3Admin[2] ? <PodiumCard entry={top3Admin[2]} place={3} /> : <div />}
                </div>

                {/* Lista completa */}
                <div className="card-3d p-5 sm:p-6 rounded-xl">
                  <h2 className="text-base font-heading font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Medal size={17} className="text-blue-600 dark:text-blue-400" /> Tabela de Classificação — Global
                  </h2>
                  <div className="flex flex-col gap-2">
                    {allStudents.map((s: any, idx: number) => (
                      <LeaderboardRow
                        key={s.id}
                        item={{
                          id: s.id,
                          name: s.nickname || s.name || 'Aluno',
                          avatar: AVATARS[s.avatar_id] || '🦊',
                          xp: s.xp || 0,
                          streak: s.streak || 0,
                          posicao: idx + 1,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )
          })()}
        </>
      )}

      {/* ── Visão Aluno ────────────────────────────────────────────────────── */}
      {!isAdmin && (
        <>
          {currentList.length === 0 ? (
            <div className="card-3d p-8 sm:p-12 rounded-xl flex flex-col items-center text-center gap-3">
              <Trophy size={40} className="text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Nenhum aluno classificado neste ranking ainda.
              </p>
            </div>
          ) : (
            <>
              {/* Podium Top 3 */}
              {top3.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-8 items-end max-w-2xl mx-auto">
                  {top3[1] && <PodiumCard entry={top3[1] as RankEntry} place={2} />}
                  {top3[0] && <PodiumCard entry={top3[0] as RankEntry} place={1} />}
                  {top3[2] && <PodiumCard entry={top3[2] as RankEntry} place={3} />}
                </div>
              )}

              {/* Full Leaderboard List */}
              <div className="card-3d p-5 sm:p-6 rounded-xl">
                <h2 className="text-base font-heading font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Medal size={17} className="text-blue-600 dark:text-blue-400" /> Tabela de Classificação
                </h2>
                <div className="flex flex-col gap-2">
                  {currentList.map((item) => (
                    <LeaderboardRow key={item.id} item={item as RankEntry} />
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
