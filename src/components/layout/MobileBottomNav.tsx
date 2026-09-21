import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutGrid, Trophy, ShoppingBag, User, Shield } from 'lucide-react'

export function MobileBottomNav() {
  const { user } = useAuth()
  const location = useLocation()

  // Não exibe se não estiver autenticado, na tela de login ou na sessão de estudos ativa
  if (!user || location.pathname === '/login' || location.pathname.startsWith('/study')) {
    return null
  }

  const isAdmin = user?.role === 'admin'

  const navItems = [
    {
      to: '/profile',
      label: 'Perfil',
      icon: User,
      isActive: location.pathname === '/profile',
    },
    ...(isAdmin
      ? [
          {
            to: '/admin',
            label: 'Admin',
            icon: Shield,
            isActive: location.pathname === '/admin',
          },
        ]
      : []),
    {
      to: '/',
      label: 'Estudos',
      icon: LayoutGrid,
      isActive: location.pathname === '/',
    },
    {
      to: '/ranking',
      label: 'Ranking',
      icon: Trophy,
      isActive: location.pathname === '/ranking',
    },
    {
      to: '/store',
      label: 'Loja',
      icon: ShoppingBag,
      isActive: location.pathname === '/store',
    },
  ]

  return (
    <nav 
      aria-label="Navegação Inferior Mobile"
      className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-all"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => {
                window.scrollTo(0, 0)
                document.documentElement.scrollTop = 0
                document.body.scrollTop = 0
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all select-none active:scale-90 ${
                item.isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon 
                  size={20} 
                  strokeWidth={item.isActive ? 2.5 : 2}
                  className="transition-transform"
                />
                {item.isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:text-blue-400" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight leading-none ${
                item.isActive ? 'font-bold' : 'font-medium'
              }`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
