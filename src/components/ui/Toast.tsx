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
    <div className="fixed top-[calc(env(safe-area-inset-top,0px)+68px)] sm:top-20 inset-x-0 flex justify-center items-center z-[10000] pointer-events-none px-4">
      <div 
        className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl animate-pop-in shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border ${t.border} max-w-[92vw] sm:max-w-md w-auto select-none pointer-events-auto`}
      >
        <span className="text-base sm:text-lg shrink-0">{t.icon}</span>
        <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">{message}</span>
      </div>
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
