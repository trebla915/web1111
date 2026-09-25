"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * The site's menu glyph: three parallel diagonal strokes that fold into an ×
 * when their menu is open. Purely visual — it is always `aria-hidden`, and the
 * control wrapping it owns the accessible name and `aria-expanded`.
 *
 * Hover and keyboard focus run a staggered lift along the strokes. The
 * wrapping control needs Tailwind's `group` class for that. The morph is a
 * transform transition; the global `prefers-reduced-motion` rule in
 * globals.css collapses it to an instant state change.
 */

/** Centred in the 24px box; each stroke adds its own offset and delay. */
const STROKE =
  "absolute left-1/2 top-1/2 -ml-2.5 -mt-px h-0.5 w-5 rounded-full bg-current " +
  "transition-[transform,opacity] duration-slow ease-out-expo " +
  "group-hover:group-data-[state=closed]/icon:-translate-y-0.5 " +
  "group-focus-visible:group-data-[state=closed]/icon:-translate-y-0.5"

const STROKES = [
  // Leading stroke: settles into the × with a short turn.
  "-translate-x-1.5 -rotate-[60deg] delay-0 " +
    "group-data-[state=open]/icon:translate-x-0 group-data-[state=open]/icon:-rotate-45",
  // Middle stroke: drops out of the ×.
  "-rotate-[60deg] delay-[50ms] " +
    "group-data-[state=open]/icon:scale-x-0 group-data-[state=open]/icon:opacity-0",
  // Trailing stroke: swings across to cross the leading one.
  "translate-x-1.5 -rotate-[60deg] delay-100 " +
    "group-data-[state=open]/icon:translate-x-0 group-data-[state=open]/icon:rotate-45",
] as const

interface DiagonalMenuIconProps {
  /** Show the × (menu open) instead of the three strokes. */
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
        "group/icon relative block size-6 shrink-0 text-fg transition-colors duration-base",
        "data-[state=open]:text-accent-bright",
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
