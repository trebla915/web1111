import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Form label. The site previously had five spellings of this same element
 * (`text-fg-dim mb-2`, `text-accent-200 mb-2`, `text-fg-dim mb-1`, ...).
 */
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => (
    <label ref={ref} className={cn("block text-sm font-medium text-fg-dim", className)} {...props}>
      {children}
    </label>
  )
)
Label.displayName = "Label"

export { Label }
