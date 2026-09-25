"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Standard menu glyph: three horizontal bars that fold into an × when open.
 * Purely visual — it is always `aria-hidden`, and the
 * control wrapping it owns the accessible name and `aria-expanded`.
 *
 * The wrapping control uses the `group` class. The morph is a transform
 * transition; the global reduced-motion rule collapses it when requested.
 */

const STROKE =
  "absolute left-1/2 top-1/2 -ml-3 -mt-px h-0.5 w-6 origin-center rounded-full bg-current " +
  "transition-[transform,opacity] duration-base ease-out-expo"

const STROKES = [
  "-translate-y-2 group-data-[state=open]/icon:translate-y-0 group-data-[state=open]/icon:rotate-45",
  "group-data-[state=open]/icon:scale-x-0 group-data-[state=open]/icon:opacity-0",
  "translate-y-2 group-data-[state=open]/icon:translate-y-0 group-data-[state=open]/icon:-rotate-45",
] as const

interface DiagonalMenuIconProps {
  /** Show the × instead of the three bars. */
  open?: boolean
  className?: string
}

export function DiagonalMenuIcon({ open = false, className }: DiagonalMenuIconProps) {
  const settled = useAfterFirstPaint()
  // An icon that mounts already open (the drawer's close button) paints its
  // strokes first and folds on the next frame, so the × is seen forming.
  const state = open && settled ? "open" : "closed"

  return (
    <span
      aria-hidden="true"
      data-state={state}
      className={cn(
        "group/icon relative block size-8 shrink-0 text-fg transition-colors duration-base",
        className
      )}
    >
      {STROKES.map((stroke) => (
        <span key={stroke} className={cn(STROKE, stroke)} />
      ))}
    </span>
  )
}

function useAfterFirstPaint() {
  const [painted, setPainted] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPainted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return painted
}
