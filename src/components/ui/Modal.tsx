import { type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = '520px' }: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ maxWidth }}
        className="glass-panel w-full max-h-[calc(100vh-60px)] flex flex-col shadow-glass border border-slate-900/10 rounded-[2rem] overflow-hidden animate-pop"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:px-8 sm:py-6 shrink-0 border-b border-slate-900/5">
          <h2 className="text-xl font-heading text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:px-8 sm:py-6 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
