interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card-3d p-10 sm:p-14 flex flex-col items-center justify-center text-center gap-3">
      <div className="text-5xl mb-1 leading-none">{icon}</div>
      <h3 className="text-xl font-heading font-black text-aura-text-primary">
        {title}
      </h3>
      <p className="text-sm font-sans font-bold text-aura-text-secondary max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
