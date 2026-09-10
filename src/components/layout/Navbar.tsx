import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutGrid, Sun, Moon, Shield, Trophy, ShoppingBag, Rocket, UserCheck, Compass, Sparkles } from 'lucide-react'
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
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const isStudy = location.pathname.startsWith('/study')
  if (isStudy) return null

  const isAdmin = user?.role === 'admin'
  const userLevelInfo = getUserSpaceLevel(user)
  const LevelIcon = userLevelInfo.icon

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-900/5 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative gap-4">
        {/* Logo Sem Fundo AuraUP */}
        <div className={`flex items-center ${!user ? 'absolute left-1/2 -translate-x-1/2' : ''}`}>
          <Link 
            to="/" 
            className="flex items-center gap-2 group transition-transform active:scale-95"
            aria-label="AuraUP App"
          >
            <img 
              src="/logo.png" 
              alt="AuraUP" 
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
            {user && (
              <span className="font-heading font-bold text-2xl text-blue-600 hidden sm:inline-block tracking-tight">
                Aura<span className="text-amber-500">UP</span>
              </span>
            )}
          </Link>
        </div>

        {/* Links de Navegação */}
        {user ? (
          <nav className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
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
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
          </button>

          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Profile Card & Level Indicator */}
              <Link 
                to="/profile" 
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-blue-300 shadow-xs transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-700 text-blue-600 flex items-center justify-center text-base shrink-0">
                  {isAdmin ? '👑' : (AVATARS[user.avatar_id] || '🦊')}
                </div>
                
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-heading font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {isAdmin ? user.name : (user.nickname || user.name)}
                  </span>
                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${userLevelInfo.badgeText}`}>
                    <LevelIcon size={12} color={userLevelInfo.iconColor} />
                    {userLevelInfo.title}
                  </span>
                </div>
              </Link>
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
      className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all select-none ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700'
      }`}
    >
      {icon}
      <span className="hidden sm:inline-block">{label}</span>
    </Link>
  )
}
