import { createPortal } from 'react-dom'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
}

const toastThemes = {
  success: { border: 'border-emerald-500/60 dark:border-emerald-500/50', icon: '✨', text: 'text-emerald-700 dark:text-emerald-300' },
  error:   { border: 'border-rose-500/60 dark:border-rose-500/50', icon: '❌', text: 'text-rose-700 dark:text-rose-300' },
  info:    { border: 'border-blue-500/60 dark:border-blue-500/50', icon: 'ℹ️', text: 'text-blue-700 dark:text-blue-300' },
}

export function Toast({ message, type = 'info' }: ToastProps) {
  const t = toastThemes[type]
  return createPortal(
    <div 
      className={`fixed bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] sm:bottom-8 sm:top-auto left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 px-5 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl animate-pop-in shadow-2xl border ${t.border} max-w-[92vw] min-w-[260px] pointer-events-none select-none`}
    >
      <span className="text-xl shrink-0">{t.icon}</span>
      <span className="font-heading font-bold text-sm text-slate-900 dark:text-white leading-snug">{message}</span>
    </div>,
    document.body
  )
}

import { useState, useCallback } from 'react'

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const show = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  return { toast, show }
}
