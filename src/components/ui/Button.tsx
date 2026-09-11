import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'orange' | 'reward' | 'gold' | 'ghost' | 'vibrant' | 'icon'
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
  const baseClasses = 'font-heading font-semibold select-none cursor-pointer inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none disabled:transform-none shrink-0'

  const sizeClasses = {
    sm: 'h-9 px-3.5 text-xs sm:text-sm rounded-lg',
    md: 'h-10 px-4 text-sm rounded-lg',
    lg: 'h-11 px-5 text-base rounded-lg',
  }[size]

  const variantClasses = {
    primary: 'btn-3d-blue',
    vibrant: 'btn-3d-blue',
    secondary: 'btn-3d-white',
    orange: 'btn-3d-orange',
    reward: 'btn-3d-orange',
    warning: 'btn-3d-orange',
    gold: 'btn-3d-orange',
    success: 'btn-3d-green',
    danger: 'btn-3d-red',
    icon: 'btn-3d-icon !p-0 w-9 h-9 !rounded-lg',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-slate-800 border-none active:scale-95 transition-all',
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
