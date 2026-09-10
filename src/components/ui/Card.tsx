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
    base: 'card-3d p-6',
    interactive: 'card-3d-interactive p-6 cursor-pointer',
    active: 'card-3d-interactive p-6 cursor-pointer border-blue-500 shadow-sm',
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
