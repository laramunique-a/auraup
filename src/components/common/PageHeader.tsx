import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  icon: LucideIcon
  title: ReactNode
  subtitle: ReactNode
  badge?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`card-3d p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs mb-5 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${className}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
              {badge}
            </div>
          </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-normal leading-relaxed">
          {subtitle}
        </p>
      </div>

      {actions && (
        <div className="w-full sm:w-auto shrink-0">
          {actions}
        </div>
      )}
    </header>
  )
}
