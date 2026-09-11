import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useEconomy } from '../../contexts/EconomyContext'
import { LayoutGrid, Shield, Trophy, ShoppingBag, Rocket, UserCheck, Compass, Sparkles, LogOut, Flame, Coins } from 'lucide-react'

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
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-[0_1px_4px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-colors pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Logo e Nome AuraUP */}
        <div className="flex items-center shrink-0">
          <Link 
            to="/" 
            className="flex items-center gap-2 group transition-transform active:scale-95"
            aria-label="AuraUP Início"
          >
            <img 
              src="/logo.png" 
              alt="AuraUP" 
              className="h-8 sm:h-9 w-auto object-contain drop-shadow-2xs group-hover:scale-105 transition-transform" 
            />
            {user && (
              <span className="font-heading font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white flex items-center">
                Aura<span className="text-blue-600 dark:text-blue-400">UP</span>
              </span>
            )}
          </Link>
        </div>

        {/* Links de Navegação Desktop (Ocultos no Mobile) */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
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

        {/* Gamificação & Perfil do Aluno */}
        <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
          {user && (
            <>
              {/* Pílula de Ofensiva (Streak) */}
              <Link
                to="/ranking"
                title="Ofensiva diária"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 border border-orange-200/80 dark:border-orange-800/60 shadow-2xs hover:bg-orange-100/70 transition-all active:scale-95 cursor-pointer"
              >
                <Flame size={14} className="fill-orange-500 text-orange-500 shrink-0" />
                <span className="font-heading font-black text-xs text-orange-600 dark:text-orange-400 leading-none">
                  {streak}
                </span>
              </Link>

              {/* Pílula de Moedas */}
              <Link
                to="/store"
                title="Moedas AuraUP"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs hover:bg-amber-100/70 transition-all active:scale-95 cursor-pointer"
              >
                <Coins size={14} className="fill-amber-400 text-amber-500 shrink-0" />
                <span className="font-heading font-black text-xs text-amber-700 dark:text-amber-300 leading-none">
                  {coins}
                </span>
              </Link>

              {/* Avatar do Usuário */}
              <Link 
                to="/profile" 
                title="Meu Perfil"
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-blue-400/40 transition-all active:scale-95 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-sm shadow-2xs">
                  {isAdmin ? '👑' : (AVATARS[user.avatar_id] || '🦊')}
                </div>
                
                <div className="hidden md:flex flex-col text-left pr-1">
                  <span className="text-xs font-heading font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {isAdmin ? user.name : (user.nickname || user.name)}
                  </span>
                  <span className={`text-[10px] font-semibold flex items-center gap-1 ${userLevelInfo.badgeText}`}>
                    <LevelIcon size={11} color={userLevelInfo.iconColor} />
                    {userLevelInfo.title}
                  </span>
                </div>
              </Link>

              {/* Botão de Logout Desktop */}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden md:flex btn-3d-icon w-8 h-8 !rounded-lg text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-all items-center justify-center"
                title="Sair da Conta"
                aria-label="Sair da Conta"
              >
                <LogOut size={15} />
              </button>
            </>
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
