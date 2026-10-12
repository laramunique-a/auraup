import { useState, useMemo, useEffect } from 'react'
import { Trophy, Flame, Users, Globe, Crown, Medal, Sparkles, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import { useEconomy } from '../contexts/EconomyContext'
import { supabase, isLocalMode } from '../services/storage'
import { getAcademicLevel, getAcademicLevelTheme, getCustomAcademicLevels } from '../lib/academicLevels'

const AVATARS: Record<string, string> = {
  avatar_1: '🦊', avatar_2: '🐨', avatar_3: '🦁',
  avatar_4: '🐼', avatar_5: '🦉', avatar_6: '🦖',
  admin: '👑',
}

// ─── Lê todos os usuários alunos do localStorage (modo local) ────────────────
function getStudentsFromStorage(): any[] {
  try {
    const raw = localStorage.getItem('uply_accounts_db')
    if (raw) {
      const accounts: any[] = JSON.parse(raw)
      return accounts.filter(a => a.role === 'user' && a.is_active !== false)
    }
    // fallback: admin_users
    const raw2 = localStorage.getItem('uply_admin_users')
    if (raw2) {
      return (JSON.parse(raw2) as any[]).filter(u => u.role !== 'admin' && u.is_active !== false)
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
  levelName?: string
  academicLevel?: string
  isCurrentUser?: boolean
}

interface GroupSection {
  id: string
  title: string
  subtitle?: string
  color?: string
  badgeBg?: string
  badgeText?: string
  badgeBorder?: string
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
    <div className={`card-3d p-3.5 sm:p-5 flex flex-col items-center text-center rounded-xl border shadow-xs transition-transform ${border}`}>
      <div className="text-2xl mb-1">{medal}</div>
      <div className={`${avatarSize} rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-2 shadow-xs`}>
        {entry.avatar}
      </div>
      <h3 className="font-heading font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate w-full">{entry.name}</h3>
      <span className={`font-heading font-semibold text-[11px] sm:text-xs mt-1 px-2 py-0.5 rounded-md border ${xpStyle}`}>
        <span className="font-bold">{entry.xp}</span> XP
      </span>
    </div>
  )
}

// ─── Componente auxiliar: LeaderboardRow ─────────────────────────────────────
function LeaderboardRow({ item }: { item: RankEntry }) {
  const theme = item.academicLevel ? getAcademicLevelTheme(item.academicLevel) : null

  return (
    <div
      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
        item.isCurrentUser
          ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 shadow-xs'
          : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-200/80 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <span className={`w-5 sm:w-6 text-center font-heading font-bold text-xs sm:text-sm shrink-0 ${item.posicao <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
          #{item.posicao}
        </span>

        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-base shrink-0 border border-slate-200 dark:border-slate-600 shadow-xs">
          {item.avatar}
        </div>

        <div className="min-w-0">
          <h4 className="font-heading font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5">
            <span className="truncate">{item.name}</span>
            {item.isCurrentUser && (
              <span className="text-[10px] font-heading font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white shrink-0">Você</span>
            )}
          </h4>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1">
              <Flame size={12} className="text-amber-500 fill-amber-500" /> <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.streak}d</span> ofensiva
            </span>
            {item.levelName && (
              <span className="hidden sm:inline-block text-slate-400">• {item.levelName}</span>
            )}
            {item.academicLevel && theme && (
              <span className={`inline-flex items-center text-[10px] font-heading font-semibold px-1.5 py-0.2 rounded ${theme.bg} ${theme.text}`}>
                {item.academicLevel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0 pl-2">
        <span className="text-xs sm:text-sm font-heading font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 px-2 sm:px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-800">
          <Sparkles size={13} className="text-amber-500 fill-amber-500 shrink-0" /> <span className="font-bold">{item.xp}</span> XP
        </span>
      </div>
    </div>
  )
}

// ─── Componente auxiliar: AccordionGroupSection (para Admin) ─────────────────
function AccordionGroupSection({ group, defaultOpen = false }: { group: GroupSection; defaultOpen?: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen)
  const top3 = group.entries.slice(0, 3)

  return (
    <div className="card-3d rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {group.color && (
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: group.color }}
            />
          )}
          <div className="min-w-0">
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
              {group.title}
            </h3>
            {group.subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
                {group.subtitle}
              </p>
            )}
          </div>
          <span className="text-xs font-heading font-semibold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
            {group.entries.length} {group.entries.length === 1 ? 'aluno' : 'alunos'}
          </span>
        </div>
        {expanded
          ? <ChevronUp size={17} className="text-slate-400 shrink-0 ml-2" />
          : <ChevronDown size={17} className="text-slate-400 shrink-0 ml-2" />}
      </button>

      {expanded && (
        <div className="p-3.5 sm:p-5">
          {group.entries.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              Nenhum aluno classificado neste grupo ainda.
            </p>
          ) : (
            <>
              {top3.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 items-end max-w-sm mx-auto">
                  {top3[1] ? <PodiumCard entry={top3[1]} place={2} /> : <div />}
                  {top3[0] ? <PodiumCard entry={top3[0]} place={1} /> : <div />}
                  {top3[2] ? <PodiumCard entry={top3[2]} place={3} /> : <div />}
                </div>
              )}

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
  const [tab, setTab] = useState<'global' | 'level' | 'class'>('global')
  const [liveStudents, setLiveStudents] = useState<any[]>([])
  const { user } = useAuth()
  const { xp: userXp, streak: userStreak } = useEconomy()
  const isAdmin = user?.role === 'admin'

  // Carrega lista atualizada do Supabase ou localStorage
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        if (supabase && !isLocalMode) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*, level:levels(*)')
            .eq('role', 'user')
            .eq('is_active', true)
            .order('xp', { ascending: false })

          if (!error && data && data.length > 0) {
            if (isMounted) {
              const mapped = data.map((p: any) => ({
                ...p,
                name: p.full_name || p.name || p.nickname || p.email?.split('@')[0],
              }))
              setLiveStudents(mapped)
              return
            }
          }
        }
      } catch {
        // fallback
      }

      if (isMounted) {
        setLiveStudents(getStudentsFromStorage())
      }
    }

    loadData()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadData()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      isMounted = false
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // Lista base de alunos
  const allStudents = useMemo(() => {
    if (liveStudents.length > 0) return liveStudents
    return getStudentsFromStorage()
  }, [liveStudents])

  // Identificadores do aluno atual
  const currentUserAcademicLevel = useMemo(() => {
    return getAcademicLevel(user?.level || user?.level_id)
  }, [user?.level, user?.level_id])

  const currentUserClassId = useMemo(() => {
    return user?.level_id || user?.level?.id || 'sem_turma'
  }, [user?.level_id, user?.level])

  // ── 1. GRUPOS POR NÍVEL PEDAGÓGICO (para Admin) ─────────────────────────────
  const levelGroups = useMemo<GroupSection[]>(() => {
    if (!isAdmin) return []

    const allAcademicNames = Array.from(new Set([
      ...getCustomAcademicLevels(),
      ...allStudents.map((s: any) => getAcademicLevel(s.level || s.level_id))
    ]))

    return allAcademicNames.map(acadLvl => {
      const theme = getAcademicLevelTheme(acadLvl)
      const matching = allStudents
        .filter((s: any) => getAcademicLevel(s.level || s.level_id) === acadLvl)
        .sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0))
        .map((s: any, idx: number): RankEntry => ({
          id: s.id,
          name: s.nickname || s.name || s.full_name || 'Aluno',
          avatar: AVATARS[s.avatar_id] || '🦊',
          xp: s.xp || 0,
          streak: s.streak || 0,
          posicao: idx + 1,
          levelName: s.level?.name,
          academicLevel: acadLvl,
        }))

      return {
        id: acadLvl,
        title: `Nível ${acadLvl}`,
        subtitle: `Alunos de todas as turmas no nível ${acadLvl}`,
        color: theme.dot,
        badgeBg: theme.bg,
        badgeText: theme.text,
        badgeBorder: theme.border,
        entries: matching,
      }
    })
  }, [isAdmin, allStudents])

  // ── 2. GRUPOS POR TURMA (para Admin) ────────────────────────────────────────
  const turmaGroups = useMemo<GroupSection[]>(() => {
    if (!isAdmin) return []

    const levelsMap = new Map<string, { name: string; color: string; min_xp: number; academicLevel: string }>()
    allStudents.forEach((s: any) => {
      const lvlId = s.level_id || s.level?.id || 'sem_turma'
      if (!levelsMap.has(lvlId)) {
        levelsMap.set(lvlId, {
          name: s.level?.name || (lvlId === 'sem_turma' ? 'Sem Turma Definida' : lvlId),
          color: s.level?.color || '#3b82f6',
          min_xp: s.level?.min_xp ?? 0,
          academicLevel: getAcademicLevel(s.level || lvlId),
        })
      }
    })

    const sortedLevels = Array.from(levelsMap.entries()).sort(
      (a, b) => (a[1].min_xp ?? 0) - (b[1].min_xp ?? 0)
    )

    return sortedLevels.map(([lvlId, lvl]) => {
      const members = allStudents
        .filter((s: any) => (s.level_id || s.level?.id || 'sem_turma') === lvlId)
        .sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0))
        .map((s: any, idx: number): RankEntry => ({
          id: s.id,
          name: s.nickname || s.name || s.full_name || 'Aluno',
          avatar: AVATARS[s.avatar_id] || '🦊',
          xp: s.xp || 0,
          streak: s.streak || 0,
          posicao: idx + 1,
          levelName: lvl.name,
          academicLevel: lvl.academicLevel,
        }))

      return {
        id: lvlId,
        title: lvl.name,
        subtitle: `Nível pedagógico: ${lvl.academicLevel} • Ingresso: ${lvl.min_xp} XP`,
        color: lvl.color,
        entries: members,
      }
    })
  }, [isAdmin, allStudents])

  // ── 3. LISTA DE ALUNOS (visão do Aluno nos 3 modos) ─────────────────────────
  const studentList = useMemo(() => {
    if (isAdmin) return []

    let filtered = allStudents

    if (tab === 'level') {
      // Todos os alunos com o MESMO Nível Pedagógico do usuário logado
      filtered = allStudents.filter((s: any) => {
        const studentAcadLevel = getAcademicLevel(s.level || s.level_id)
        return studentAcadLevel === currentUserAcademicLevel
      })
    } else if (tab === 'class') {
      // Apenas alunos cadastrados na MESMA Turma do usuário logado
      filtered = allStudents.filter((s: any) => {
        const studentClassId = s.level_id || s.level?.id || 'sem_turma'
        return studentClassId === currentUserClassId
      })
    }

    const entries: RankEntry[] = filtered.map((s: any): RankEntry => {
      const isMe = s.id === user?.id
      return {
        id: s.id,
        name: s.nickname || s.name || s.full_name || 'Aluno',
        avatar: AVATARS[s.avatar_id] || '🦊',
        xp: isMe ? Math.max(s.xp || 0, userXp) : (s.xp || 0),
        streak: isMe ? Math.max(s.streak || 0, userStreak) : (s.streak || 0),
        posicao: 0,
        levelName: s.level?.name,
        academicLevel: getAcademicLevel(s.level || s.level_id),
        isCurrentUser: isMe,
      }
    })

    // Garante que o aluno logado apareça na lista de sua turma e nível
    if (user && user.role !== 'admin' && !entries.some(e => e.id === user.id)) {
      entries.push({
        id: user.id,
        name: user.nickname || user.name || 'Você',
        avatar: AVATARS[user.avatar_id] || '🦊',
        xp: userXp,
        streak: userStreak,
        posicao: 0,
        levelName: user.level?.name || 'Sua Turma',
        academicLevel: currentUserAcademicLevel,
        isCurrentUser: true,
      })
    }

    return entries
      .sort((a, b) => b.xp - a.xp)
      .map((item, idx) => ({
        ...item,
        posicao: idx + 1,
      }))
  }, [tab, user, userXp, userStreak, isAdmin, allStudents, currentUserAcademicLevel, currentUserClassId])

  const top3Student = studentList.slice(0, 3)

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
            <>Visualize os 3 rankings escolares: <strong className="text-blue-600 dark:text-blue-400">Global</strong>, por <strong className="text-amber-600 dark:text-amber-400">Nível</strong> ou por <strong className="text-emerald-600 dark:text-emerald-400">Turma</strong>.</>
          ) : (
            <>Dispute o pódio estudando diariamente! Ranking <strong className="text-blue-600 dark:text-blue-400">Global</strong>, do seu <strong className="text-amber-600 dark:text-amber-400">Nível</strong> e da sua <strong className="text-emerald-600 dark:text-emerald-400">Turma</strong>. ✨</>
          )
        }
        actions={
          <div className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-3 gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setTab('global')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer ${
                tab === 'global'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Globe size={14} className="shrink-0" />
              <span className="truncate">Global</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('level')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer ${
                tab === 'level'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Medal size={14} className="shrink-0" />
              <span className="truncate">{isAdmin ? 'Nível' : 'Meu Nível'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('class')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer ${
                tab === 'class'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Users size={14} className="shrink-0" />
              <span className="truncate">{isAdmin ? 'Turma' : 'Minha Turma'}</span>
            </button>
          </div>
        }
      />

      {/* Banner informativo para Admin */}
      {isAdmin && (
        <div className="mb-6 p-3 sm:p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="leading-snug">
            <strong className="font-bold">Modo Professor/Admin:</strong> Você pode navegar entre os rankings Global, por Nível Pedagógico e por Turma para acompanhar o progresso dos alunos.
          </p>
        </div>
      )}

      {/* ── VISÃO ADMIN: NÍVEL ─────────────────────────────────────────────── */}
      {isAdmin && tab === 'level' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-1 text-xs text-slate-500 dark:text-slate-400">
            <Medal size={15} className="text-amber-500" />
            <span>Alunos agrupados pelo seu nível pedagógico (independente da turma):</span>
          </div>
          {levelGroups.map((group, idx) => (
            <AccordionGroupSection key={group.id} group={group} defaultOpen={idx === 0} />
          ))}
        </div>
      )}

      {/* ── VISÃO ADMIN: TURMA ─────────────────────────────────────────────── */}
      {isAdmin && tab === 'class' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-1 text-xs text-slate-500 dark:text-slate-400">
            <Users size={15} className="text-blue-500" />
            <span>Alunos separados por cada turma cadastrada na escola:</span>
          </div>
          {turmaGroups.length === 0 ? (
            <div className="card-3d p-8 sm:p-12 rounded-xl flex flex-col items-center text-center gap-3">
              <Users size={40} className="text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhuma turma com alunos encontrada.</p>
            </div>
          ) : (
            turmaGroups.map((group, idx) => (
              <AccordionGroupSection key={group.id} group={group} defaultOpen={idx === 0} />
            ))
          )}
        </div>
      )}

      {/* ── VISÃO ADMIN: GLOBAL ────────────────────────────────────────────── */}
      {isAdmin && tab === 'global' && (
        <>
          {(() => {
            const allSorted = [...allStudents].sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0))

            if (allSorted.length === 0) {
              return (
                <div className="card-3d p-8 sm:p-12 rounded-xl flex flex-col items-center text-center gap-3">
                  <Users size={40} className="text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhum aluno cadastrado no ranking ainda.</p>
                </div>
              )
            }

            const top3Admin = allSorted.slice(0, 3).map((s: any, idx: number): RankEntry => ({
              id: s.id,
              name: s.nickname || s.name || s.full_name || 'Aluno',
              avatar: AVATARS[s.avatar_id] || '🦊',
              xp: s.xp || 0,
              streak: s.streak || 0,
              posicao: idx + 1,
              levelName: s.level?.name,
              academicLevel: getAcademicLevel(s.level || s.level_id),
            }))

            return (
              <>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-5 mb-6 sm:mb-8 items-end max-w-2xl mx-auto">
                  {top3Admin[1] ? <PodiumCard entry={top3Admin[1]} place={2} /> : <div />}
                  {top3Admin[0] ? <PodiumCard entry={top3Admin[0]} place={1} /> : <div />}
                  {top3Admin[2] ? <PodiumCard entry={top3Admin[2]} place={3} /> : <div />}
                </div>

                <div className="card-3d p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-700/60">
                    <h2 className="text-sm sm:text-base font-heading font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Medal size={17} className="text-blue-600 dark:text-blue-400" /> Ranking Global de Alunos
                    </h2>
                    <span className="text-xs font-semibold text-slate-400">
                      {allSorted.length} {allSorted.length === 1 ? 'estudante' : 'estudantes'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {allSorted.map((s: any, idx: number) => (
                      <LeaderboardRow
                        key={s.id}
                        item={{
                          id: s.id,
                          name: s.nickname || s.name || s.full_name || 'Aluno',
                          avatar: AVATARS[s.avatar_id] || '🦊',
                          xp: s.xp || 0,
                          streak: s.streak || 0,
                          posicao: idx + 1,
                          levelName: s.level?.name,
                          academicLevel: getAcademicLevel(s.level || s.level_id),
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

      {/* ── VISÃO DO ALUNO (GLOBAL, NÍVEL OU TURMA) ─────────────────────────── */}
      {!isAdmin && (
        <>
          {studentList.length === 0 ? (
            <div className="card-3d p-8 sm:p-12 rounded-xl flex flex-col items-center text-center gap-3">
              <Trophy size={40} className="text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Nenhum aluno classificado neste ranking ainda.
              </p>
            </div>
          ) : (
            <>
              {/* Podium Top 3 */}
              {top3Student.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5 sm:gap-5 mb-6 sm:mb-8 items-end max-w-2xl mx-auto">
                  {top3Student[1] && <PodiumCard entry={top3Student[1]} place={2} />}
                  {top3Student[0] && <PodiumCard entry={top3Student[0]} place={1} />}
                  {top3Student[2] && <PodiumCard entry={top3Student[2]} place={3} />}
                </div>
              )}

              {/* Tabela de Classificação */}
              <div className="card-3d p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Medal size={17} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-sm sm:text-base font-heading font-semibold text-slate-800 dark:text-white">
                      {tab === 'global' ? 'Ranking Global da Escola' : tab === 'level' ? `Ranking do Nível ${currentUserAcademicLevel}` : `Ranking da Turma`}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {tab === 'level' && (
                      <span className="text-xs font-heading font-semibold px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
                        Nível: {currentUserAcademicLevel}
                      </span>
                    )}
                    {tab === 'class' && (
                      <span className="text-xs font-heading font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                        {user?.level?.name || 'Sua Turma'}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-400">
                      {studentList.length} {studentList.length === 1 ? 'aluno' : 'alunos'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {studentList.map((item) => (
                    <LeaderboardRow key={item.id} item={item} />
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
