import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Panel surface. Replaces four near-identical hand-rolled card recipes that
 * differed in fill opacity, border tint and padding.
 *
 * There is deliberately no `variant` prop: every card in this app is the
 * brand-tinted panel below, so a variant axis with one member would be noise.
 *
 * `texture` owns the film-grain overlay, which was previously pasted as a bare
 * `<div className="absolute inset-0 noise opacity-5 rounded-lg" />` as the first
 * child of seven different cards — where its radius could drift out of sync
 * with the card it sat on.
 */
const cardVariants = cva(
  "relative rounded-lg border border-line-accent/30 bg-surface transition-colors duration-base ease-out-expo",
  {
    variants: {
      /** `none` means the caller supplies its own padding. */
      padding: {
        none: "",
        lg: "p-4 lg:p-6",
      },
      /** Clickable card: matches the hover treatment used on list tiles. */
      interactive: {
        true: "cursor-pointer hover:border-accent-deep/50",
        false: "",
      },
    },
    defaultVariants: { padding: "lg", interactive: false },
  }
)

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Overlays the film-grain texture, clipped to the card's radius. */
  texture?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, interactive, texture = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ padding, interactive }), texture && "overflow-hidden", className)}
      {...props}
    >
      {texture && (
        <div aria-hidden="true" className="noise pointer-events-none absolute inset-0 rounded-lg opacity-5" />
      )}
      {texture ? <div className="relative z-10">{children}</div> : children}
    </div>
  )
)
Card.displayName = "Card"

export { Card }
