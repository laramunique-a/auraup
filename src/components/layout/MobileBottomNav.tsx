import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutGrid, Trophy, ShoppingBag, User, Shield, HelpCircle, LogOut, ChevronUp } from 'lucide-react'
import { HelpModal } from '../ui/HelpModal'

export function MobileBottomNav() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // Não exibe se não estiver autenticado, na tela de login ou na sessão de estudos ativa
  if (!user || location.pathname === '/login' || location.pathname.startsWith('/study')) {
    return null
  }

  const isAdmin = user?.role === 'admin'
  const isProfileActive = location.pathname === '/profile'

  async function handleLogout() {
    setProfileSheetOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  const navItems = [
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
    <>
      <nav
        aria-label="Navegação Inferior Mobile"
        className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-all"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {/* Botão Perfil — abre mini-sheet com opções */}
          <button
            type="button"
            aria-label="Menu de Perfil"
            onClick={() => setProfileSheetOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all select-none active:scale-90 ${
              isProfileActive || profileSheetOpen
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <User
                size={20}
                strokeWidth={isProfileActive || profileSheetOpen ? 2.5 : 2}
                className="transition-transform"
              />
              {(isProfileActive || profileSheetOpen) && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-600" />
              )}
            </div>
            <span className={`text-[10px] mt-1 tracking-tight leading-none ${isProfileActive || profileSheetOpen ? 'font-bold' : 'font-medium'}`}>
              Perfil
            </span>
          </button>

          {/* Demais itens de navegação */}
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
                <span className={`text-[10px] mt-1 tracking-tight leading-none ${item.isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Profile Mini-Sheet (PWA) ───────────────────────────────────────── */}
      {profileSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-[9998] flex items-end bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setProfileSheetOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 animate-pop-in"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* User Info */}
            <div className="px-5 pt-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <p className="font-heading font-extrabold text-slate-900 dark:text-white text-sm truncate">
                {user.nickname || user.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-1">
              <Link
                to="/profile"
                onClick={() => setProfileSheetOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-heading font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                  <User size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span>Meu Perfil</span>
              </Link>

              <button
                type="button"
                id="mobile-help-btn"
                onClick={() => {
                  setProfileSheetOpen(false)
                  setTimeout(() => setHelpOpen(true), 150)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-heading font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center shrink-0">
                  <HelpCircle size={16} className="text-violet-600 dark:text-violet-400" />
                </div>
                <span>Ajuda &amp; Feedback</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800 mx-1 my-1" />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-heading font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                  <LogOut size={16} className="text-rose-600 dark:text-rose-400" />
                </div>
                <span>Sair da Conta</span>
              </button>
            </div>

            {/* Dismiss hint */}
            <div className="flex items-center justify-center gap-1 pb-1 text-[11px] text-slate-400 dark:text-slate-600">
              <ChevronUp size={12} /> Deslize para fechar
            </div>
          </div>
        </div>
      )}

      {/* ── HelpModal ──────────────────────────────────────────────────────── */}
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  )
}
