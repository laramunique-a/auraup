import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'gold' | 'purple' | 'ghost' | 'vibrant'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-label font-semibold tracking-wide transition-all duration-200 select-none cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none'

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 rounded-xl',
    md: 'text-sm px-5 py-2.5 rounded-xl',
    lg: 'text-base px-7 py-3.5 rounded-xl',
  }[size]

  const variantClasses = {
    primary: 'btn-primary-glass',
    secondary: 'btn-secondary-glass',
    danger: 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100/80 hover:scale-[1.02] active:scale-95',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 shadow-sm',
    warning: 'bg-orange-500 text-white hover:bg-orange-600 hover:scale-[1.02] active:scale-95 shadow-sm',
    gold: 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100/80 hover:scale-[1.02] active:scale-95',
    purple: 'btn-primary-glass',
    vibrant: 'btn-primary-glass',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border-none active:scale-95',
  }[variant]

  const widthClass = fullWidth ? 'w-full' : 'w-auto'

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Carregando...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
