interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-panel p-10 sm:p-14 flex flex-col items-center justify-center text-center gap-3">
      <div className="text-5xl mb-1 leading-none">{icon}</div>
      <h3 className="text-xl font-heading text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="text-sm font-label text-slate-500 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-2 font-label">{action}</div>}
    </div>
  )
}
