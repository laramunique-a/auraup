import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, footer, maxWidth = '520px' }: ModalProps) {
  useEffect(() => {
    if (!open) return

    document.body.classList.add('modal-open')
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.classList.remove('modal-open')
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ maxWidth }}
        className="w-full max-h-[92dvh] sm:max-h-[85vh] my-0 sm:my-auto flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-pop-in border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
      >
        {/* Header Fixo */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 shrink-0 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white truncate pr-2">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body com Rolagem Touch Suave */}
        <div 
          className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain custom-scrollbar text-slate-700 dark:text-slate-300"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>

        {/* Footer Fixo Aderente (Ações Cancelar / Salvar) */}
        {footer && (
          <div 
            className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/95 backdrop-blur-xs flex items-center justify-end gap-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

