import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

/**
 * The one button in the system. Every clickable control routes through this —
 * a raw HTML button in a page means a style that nothing else can inherit.
 *
 * Variants map to intent, not colour: pick `danger` because the action
 * destroys something, not because you want red.
 *
 * `className` on a Button is for placement only — `flex-1`, `w-*`, margins,
 * `self-*`, responsive `hidden`. Colour, height, padding, radius and type come
 * from `variant` / `size` / `shape`; if none fits, add a variant here rather
 * than repainting one page. tests/design/theme.test.ts enforces this.
 */
/**
 * Behaviour every button shares regardless of look: one focus ring, one
 * disabled treatment, one transition. Carries no layout or colour, so it is
 * also safe to apply to `unstyled` buttons that bring their own geometry.
 */
const buttonBase =
  "transition-colors duration-fast ease-out-expo select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
  "disabled:pointer-events-none disabled:opacity-50"

const buttonVariants = cva(
  // Layout + 44px minimum touch target on top of the shared behaviour.
  buttonBase + " inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
  {
    variants: {
      variant: {
        /** Highest emphasis. White on black — the venue's primary CTA. */
        primary: "bg-fg text-fg-inverse hover:bg-fg-dim active:bg-fg-muted",
        /** Brand action — reservations, confirmations, saves. */
        accent: "bg-accent-dim text-fg hover:bg-accent-deep active:bg-accent-deeper",
        /** Destructive: cancel, delete, remove. */
        danger: "bg-danger text-fg hover:bg-danger/85 active:bg-danger/75",
        /** Destructive but secondary — sits beside a primary action (delete in
         *  an edit form, sign out) where a solid red block would out-shout it. */
        "danger-subtle":
          "border border-danger-line/40 bg-danger-deep/20 text-danger-bright hover:bg-danger-deep/40 active:bg-danger-deep/50",
        /** Positive confirmation: check-in, approve, mark paid. */
        success: "bg-success text-fg hover:bg-success/85 active:bg-success/75",
        /** Categorical admin actions. Three sit side by side in the reservation
         *  toolbar and are told apart by hue, not severity (see DESIGN.md). */
        confirm: "bg-confirm-600 text-fg hover:bg-confirm-700 active:bg-confirm-700/90",
        revoke: "bg-revoke-600 text-fg hover:bg-revoke-700 active:bg-revoke-700/90",
        attention:
          "border border-attention-600 bg-transparent text-attention-200 hover:bg-attention-900/40",
        /** Secondary action sitting on a card. */
        subtle: "bg-surface-raised text-fg hover:bg-surface-hover active:bg-surface-hover/80",
        /** Bordered, transparent — pairs beside a primary. */
        outline: "border border-line bg-transparent text-fg hover:bg-surface-raised hover:border-line-strong",
        /** Lowest emphasis — icon buttons, toolbar actions. */
        ghost: "text-fg-muted hover:bg-surface-raised hover:text-fg",
        /** Quiet until hovered — remove / delete icons in a list row. */
        "ghost-danger": "text-fg-muted hover:bg-danger-deep/20 hover:text-danger-bright",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11 shrink-0",
      },
      /** `pill` for chips and round icon buttons; everything else is `rounded-lg`. */
      shape: { default: "rounded-lg", pill: "rounded-full" },
      full: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", shape: "default", full: false },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Shows a spinner and blocks interaction. Width stays stable while busy. */
  loading?: boolean
  /**
   * Opts out of the variant/size look, keeping only the shared focus and
   * disabled behaviour. For controls that bring their own geometry — a
   * left-aligned full-width row, a 64px grid tile, a pill — where the
   * primitive's `inline-flex justify-center` would fight the layout.
   */
  unstyled?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, shape, full, asChild = false, loading = false, unstyled = false, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    // `asChild` forwards a single child, so a spinner can't be injected there.
    const content = asChild ? (
      children
    ) : (
      <>
        {loading && <Spinner size="sm" className="shrink-0" />}
        {children}
      </>
    )
    return (
      <Comp
        className={
          unstyled ? cn(buttonBase, className) : cn(buttonVariants({ variant, size, shape, full, className }))
        }
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {content}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
