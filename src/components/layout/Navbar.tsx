import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useEconomy } from '../../contexts/EconomyContext'
import { LayoutGrid, Shield, Trophy, ShoppingBag, Rocket, UserCheck, Compass, Sparkles, LogOut, Flame } from 'lucide-react'

const AVATARS: Record<string, string> = {
  avatar_1: '🦊', avatar_2: '🐨', avatar_3: '🦁',
  avatar_4: '🐼', avatar_5: '🦉', avatar_6: '🦖',
  admin: '👑',
}

/**
 * Retorna as informações de Missão Espacial / Nível do usuário
 */
function getUserSpaceLevel(user: any) {
  if (user?.role === 'admin') {
    return {
      title: 'Comandante Admin',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      badgeText: 'text-[#00A3FF]',
      border: 'border-indigo-200 dark:border-indigo-900',
      icon: Sparkles,
      iconColor: '#00A3FF',
    }
  }

  const levelName = (user?.level?.name || '').toLowerCase()

  if (levelName.includes('intermediário') || levelName.includes('intermediario') || levelName.includes('connections')) {
    return {
      title: 'Nível 2: Connections',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      badgeText: 'text-[#00E676]',
      border: 'border-emerald-200 dark:border-emerald-900',
      icon: UserCheck,
      iconColor: '#00E676',
    }
  }

  if (levelName.includes('avançado') || levelName.includes('avancado') || levelName.includes('discovery')) {
    return {
      title: 'Nível 3: Discovery',
      badgeBg: 'bg-sky-50 dark:bg-sky-950/60',
      badgeText: 'text-[#00A3FF]',
      border: 'border-sky-200 dark:border-sky-900',
      icon: Compass,
      iconColor: '#00A3FF',
    }
  }

  // Padrão: Nível 1 Hello (Iniciante)
  return {
    title: 'Nível 1: Hello',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/60',
    badgeText: 'text-[#FF8A00]',
    border: 'border-orange-200 dark:border-orange-900',
    icon: Rocket,
    iconColor: '#FF8A00',
  }
}

export function Navbar() {
  const { user, signOut } = useAuth()
  const { streak, coins } = useEconomy()
  const location = useLocation()
  const navigate = useNavigate()

  const isStudy = location.pathname.startsWith('/study')
  if (!user || location.pathname === '/login' || isStudy) return null

  const isAdmin = user?.role === 'admin'
  const userLevelInfo = getUserSpaceLevel(user)
  const LevelIcon = userLevelInfo.icon

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-900/5 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between relative gap-2 sm:gap-4">
        {/* Logo Sem Fundo AuraUP */}
        <div className={`flex items-center shrink-0 ${!user ? 'absolute left-1/2 -translate-x-1/2' : ''}`}>
          <Link 
            to="/" 
            className="flex items-center gap-2 group transition-transform active:scale-95"
            aria-label="AuraUP App"
          >
            <img 
              src="/logo.png" 
              alt="AuraUP" 
              className="h-8 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
            {user && (
              <span className="font-heading font-bold text-lg sm:text-xl text-blue-600 hidden sm:inline-block tracking-tight">
                Aura<span className="text-amber-500">UP</span>
              </span>
            )}
          </Link>
        </div>

        {/* Links de Navegação Desktop (Ocultos no Mobile) */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {isAdmin && (
              <NavLink to="/admin" icon={<Shield size={16} />} label="Admin" active={location.pathname === '/admin'} />
            )}
            <NavLink to="/" icon={<LayoutGrid size={16} />} label="Baralhos" active={location.pathname === '/'} />
            <NavLink to="/ranking" icon={<Trophy size={16} />} label="Ranking" active={location.pathname === '/ranking'} />
            <NavLink to="/store" icon={<ShoppingBag size={16} />} label="Loja" active={location.pathname === '/store'} />
          </nav>
        ) : (
          <div className="w-10" />
        )}

        {/* Ações & Perfil do Aluno */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {user && (
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Pílulas Rápidas no Mobile (Streak & Moedas) */}
              <div className="flex md:hidden items-center gap-1.5">
                <div className="badge-streak font-heading text-[11px] px-2 py-1 flex items-center gap-1">
                  <Flame size={12} className="animate-flame" />
                  <span className="font-bold">{streak}</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-heading font-bold px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] shadow-2xs">
                  <span>🟡</span>
                  <span>{coins}</span>
                </div>
              </div>

              {/* Profile Card & Level Indicator */}
              <Link 
                to="/profile" 
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-blue-300 shadow-2xs sm:shadow-xs transition-all active:scale-95"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-blue-50 dark:bg-slate-700 text-blue-600 flex items-center justify-center text-sm sm:text-base shrink-0">
                  {isAdmin ? '👑' : (AVATARS[user.avatar_id] || '🦊')}
                </div>
                
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-heading font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {isAdmin ? user.name : (user.nickname || user.name)}
                  </span>
                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${userLevelInfo.badgeText}`}>
                    <LevelIcon size={12} color={userLevelInfo.iconColor} />
                    {userLevelInfo.title}
                  </span>
                </div>
              </Link>

              {/* Botão de Logout (Apenas no desktop; no mobile fica em /profile) */}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden md:flex btn-3d-icon w-8 h-8 !rounded-lg text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-all items-center justify-center"
                title="Sair da Conta"
                aria-label="Sair da Conta"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function NavLink({ to, icon, label, active }: { to: string, icon: any, label: string, active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-heading font-semibold transition-all select-none ${
        active
          ? 'bg-blue-600 text-white shadow-xs'
          : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700'
      }`}
    >
      {icon}
      <span className="hidden sm:inline-block">{label}</span>
    </Link>
  )
}
