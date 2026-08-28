import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutGrid, LogOut, Sun, Moon, Shield, Trophy, ShoppingBag, Rocket, UserCheck, Compass, Sparkles } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

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
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const isStudy = location.pathname.startsWith('/study')
  const isAuthPage = location.pathname === '/login' || location.pathname === '/auth' || !user
  if (isStudy || isAuthPage) return null

  const isAdmin = user?.role === 'admin'
  const userLevelInfo = getUserSpaceLevel(user)
  const LevelIcon = userLevelInfo.icon

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-900/5 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative gap-4">
        {/* Logo Sem Fundo Aura English */}
        <div className={`flex items-center ${!user ? 'absolute left-1/2 -translate-x-1/2' : ''}`}>
          <Link 
            to="/" 
            className="flex items-center gap-2 group transition-transform active:scale-95"
            aria-label="Aura English App"
          >
            <img 
              src="/logo.png" 
              alt="Aura English App" 
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
            {user && (
              <span className="font-heading text-lg text-slate-900 dark:text-white hidden sm:inline-block">
                Aura <span className="text-[#2563eb]">English</span>
              </span>
            )}
          </Link>
        </div>

        {/* Links de Navegação */}
        {user ? (
          <nav className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-full border border-slate-900/5">
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

        {/* Ações & Perfil do Aluno com Nível de Missão Espacial */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <button
            onClick={toggleTheme}
            aria-label="Alternar Tema"
            className="w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800 border border-slate-900/5 shadow-soft-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white active:scale-95 transition-all cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
          </button>

          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Profile Card & Level Indicator */}
              <Link 
                to="/profile" 
                className="flex items-center gap-2.5 bg-white/80 dark:bg-slate-800 border border-slate-900/5 shadow-soft-sm px-3.5 py-1.5 rounded-full hover:bg-white active:scale-95 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm">
                  {isAdmin ? '👑' : (AVATARS[user.avatar_id] || '🦊')}
                </div>
                
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight font-label">
                    {isAdmin ? user.name : (user.nickname || user.name)}
                  </span>
                  <span className={`text-[10px] font-medium tracking-wider uppercase flex items-center gap-1 font-label ${userLevelInfo.badgeText}`}>
                    <LevelIcon size={11} color={userLevelInfo.iconColor} />
                    {userLevelInfo.title}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleSignOut}
                aria-label="Sair"
                className="w-9 h-9 rounded-full bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/50 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100/80 active:scale-95 transition-all cursor-pointer"
              >
                <LogOut size={16} />
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
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide font-label transition-all select-none ${
        active
          ? 'bg-blue-600 text-white shadow-glow-primary active:scale-95'
          : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
      }`}
    >
      {icon}
      <span className="hidden sm:inline-block">{label}</span>
    </Link>
  )
}
