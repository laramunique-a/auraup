interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
}

const colors = {
  success: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', icon: '✨', color: '#10b981' },
  error:   { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: '❌', color: '#ef4444' },
  info:    { bg: 'rgba(99, 102, 241, 0.1)', border: '#6366f1', icon: 'ℹ️', color: '#6366f1' },
}

export function Toast({ message, type = 'info' }: ToastProps) {
  const c = colors[type]
  return (
    <div style={{
      position: 'fixed', top: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10000,
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '1.25rem 2rem',
      background: 'white', border: `2px solid ${c.border}`,
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      maxWidth: '90vw', minWidth: '320px'
    }}>
      <span style={{ fontSize: '1.25rem' }}>{c.icon}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>{message}</span>
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
