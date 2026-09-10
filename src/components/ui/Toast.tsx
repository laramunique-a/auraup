interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
}

const toastThemes = {
  success: { border: 'border-aura-green', icon: '✨', text: 'text-aura-green' },
  error:   { border: 'border-aura-red', icon: '❌', text: 'text-aura-red' },
  info:    { border: 'border-aura-blue', icon: 'ℹ️', text: 'text-aura-blue' },
}

export function Toast({ message, type = 'info' }: ToastProps) {
  const t = toastThemes[type]
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-800 rounded-xl animate-pop-in shadow-lg border ${t.border} max-w-[92vw] min-w-[280px]`}>
      <span className="text-xl shrink-0">{t.icon}</span>
      <span className="font-sans font-bold text-sm text-slate-800 dark:text-white">{message}</span>
    </div>
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
