import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'interactive' | 'active'
  children: ReactNode
  className?: string
}

export function Card({
  variant = 'base',
  children,
  className = '',
  ...props
}: CardProps) {
  const variantClasses = {
    base: 'glass-panel p-6',
    interactive: 'glass-panel-interactive p-6 cursor-pointer',
    active: 'glass-panel-interactive p-6 cursor-pointer border-blue-500/50 shadow-glass-hover',
  }[variant]

  return (
    <div
      {...props}
      className={`${variantClasses} ${className}`}
    >
      {children}
    </div>
  )
}
