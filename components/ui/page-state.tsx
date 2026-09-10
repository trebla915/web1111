import * as React from "react"
import { FiAlertTriangle } from "react-icons/fi"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

/**
 * The three states every fetched surface has, written once.
 *
 * Thirteen files hand-rolled these blocks with drifting container widths
 * (`max-w-2xl` on one step of the reservation flow, `max-w-7xl` on the next),
 * drifting top padding, and — worse — a loading state and a failure state that
 * rendered the same thing, so "still loading" and "this never loaded" were
 * indistinguishable.
 */

/** Panel-sized busy state. Sits inside whatever container the caller owns. */
export function PanelLoading({
  message = "Loading…",
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4 py-16 text-center", className)}
    >
      <Spinner size="lg" className="text-accent-bright" label={message} />
      <p className="text-sm text-fg-muted">{message}</p>
    </div>
  )
}

/**
 * Failure state. Always names what failed and offers the recovery, because the
 * previous version printed a bare red sentence in the middle of an empty page
 * with nothing to press.
 */
export function PanelError({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  action,
  className,
}: {
  title?: string
  description?: React.ReactNode
  onRetry?: () => void
  retryLabel?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-danger-line/40 bg-danger-950/40 px-6 py-12 text-center",
        className
      )}
    >
      <FiAlertTriangle aria-hidden="true" size={28} className="text-danger-bright" />
      <h3 className="font-heading text-xl tracking-wide text-fg">{title}</h3>
      {description && <p className="max-w-md text-sm text-danger-200">{description}</p>}
      {(onRetry || action) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <Button variant="outline" size="md" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  )
}

/**
 * Full-route busy state for a page that has nothing to show yet. `pt-24 sm:pt-28`
 * clears the fixed header, matching the loaded page so the content does not
 * jump when it arrives.
 */
export function RouteLoading({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex min-h-dvh flex-col pt-24 pb-12 sm:pt-28">
      <div className="mx-auto w-full max-w-2xl px-4">
        <PanelLoading message={message} />
      </div>
    </div>
  )
}

/** Full-route failure state, same container geometry as `RouteLoading`. */
export function RouteError(props: React.ComponentProps<typeof PanelError>) {
  return (
    <div className="flex min-h-dvh flex-col pt-24 pb-12 sm:pt-28">
      <div className="mx-auto w-full max-w-2xl px-4">
        <PanelError {...props} />
      </div>
    </div>
  )
}
