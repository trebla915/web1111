import * as React from "react"

import { cn } from "@/lib/utils"

/** Zero-state for a list that loaded successfully but has nothing to show. */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-line-accent/30 bg-surface/50 px-6 py-12 text-center",
        className
      )}
    >
      {icon && <div className="text-fg-subtle opacity-50">{icon}</div>}
      <h3 className="font-heading text-xl tracking-wide text-fg">{title}</h3>
      {description && <p className="max-w-md text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
