import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Loading spinner. Previously hand-rolled in seven places with drifting sizes
 * and border weights.
 *
 * The rotating arc is drawn with transparent side borders, which is why this
 * carries an impeccable-ignore: the `border-accent-on-rounded` rule targets
 * accent bars on rounded *cards*, and does not apply to a spinner track.
 */
const spinnerVariants = cva(
  // impeccable-ignore-next-line border-accent-on-rounded
  "inline-block rounded-full border-current border-r-transparent border-l-transparent animate-spin motion-reduce:animate-[spin_1.6s_linear_infinite]",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-2",
        lg: "h-12 w-12 border-[3px]",
      },
    },
    defaultVariants: { size: "md" },
  }
)

interface SpinnerProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof spinnerVariants> {
  /** Announced to screen readers; set to null on purely decorative spinners. */
  label?: string | null
}

export function Spinner({ className, size, label = "Loading", ...props }: SpinnerProps) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label ?? undefined}
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  )
}

/** Full-bleed loading state for a page or panel that has nothing to show yet. */
export function LoadingScreen({ message, className }: { message?: string; className?: string }) {
  return (
    <div className={cn("flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas text-fg", className)}>
      <Spinner size="lg" className="text-accent" label={message ?? "Loading"} />
      {message && <p className="text-sm text-fg-muted">{message}</p>}
    </div>
  )
}
