import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Text input. Replaces the four hand-rolled input styles that were in use
 * (differing in padding, border colour, and whether they had a focus ring).
 *
 * `text-base` on mobile is deliberate: iOS Safari zooms the viewport when a
 * focused input renders below 16px.
 */
const inputClassName =
  "flex h-11 w-full rounded-lg border border-line bg-surface-raised px-3 py-2 " +
  "text-base sm:text-sm text-fg placeholder:text-fg-subtle " +
  "transition-colors duration-fast ease-out-expo " +
  "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/40 " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "aria-[invalid=true]:border-danger-line aria-[invalid=true]:focus-visible:ring-danger/40"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Renders an icon inside the leading edge; input padding adjusts to match. */
  leadingIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", leadingIcon, ...props }, ref) => {
    if (leadingIcon) {
      return (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-fg-muted">
            {leadingIcon}
          </span>
          <input type={type} ref={ref} className={cn(inputClassName, "pl-10", className)} {...props} />
        </div>
      )
    }
    return <input type={type} ref={ref} className={cn(inputClassName, className)} {...props} />
  }
)
Input.displayName = "Input"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn(inputClassName, "h-auto min-h-[6rem] resize-y", className)} {...props} />
  )
)
Textarea.displayName = "Textarea"

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        inputClassName,
        // Native arrow is replaced with a token-coloured chevron so the control
        // matches the inputs beside it on every platform.
        "cursor-pointer appearance-none bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = "Select"

export { Input, Textarea, Select }
