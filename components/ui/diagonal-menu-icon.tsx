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

/**
 * Each bar is broken through its centre, borrowing the cut-glass construction
 * of the 11:11 numerals. The closed mark reads as three deliberate slashes,
 * rather than a stock hamburger rotated on its side.
 */
const STROKE =
  "segmented-menu-stroke absolute left-1/2 top-1/2 -ml-3.5 -mt-px h-0.5 w-7 origin-center " +
  "transition-[transform,opacity] duration-slow ease-out-expo " +
  "group-hover:group-data-[state=closed]/icon:-translate-y-0.5 " +
  "group-focus-visible:group-data-[state=closed]/icon:-translate-y-0.5"

const STROKES = [
  // Leading stroke: settles into the × with a short turn.
  "-translate-x-2 -rotate-[55deg] delay-0 " +
    "group-data-[state=open]/icon:translate-x-0 group-data-[state=open]/icon:-rotate-45",
  // Middle stroke: drops out of the ×.
  "-rotate-[55deg] delay-50 " +
    "group-data-[state=open]/icon:scale-x-0 group-data-[state=open]/icon:opacity-0",
  // Trailing stroke: swings across to cross the leading one.
  "translate-x-2 -rotate-[55deg] delay-100 " +
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
