/**
 * Bridge between the CSS design tokens and JavaScript APIs that cannot take a
 * class name — currently Stripe Elements, which is themed through a JS object.
 *
 * Tokens stay defined once, in styles/theme/tokens.css. This module reads them
 * back at runtime so a colour change there also restyles the payment form,
 * instead of the payment form carrying its own hardcoded hex palette.
 */

/** Fallback values, used during SSR where there is no computed style to read.
 *  Keep in sync with styles/theme/tokens.css. */
const FALLBACK: Record<string, string> = {
  "--canvas": "0 0 0",
  "--surface": "24 24 27",
  "--surface-raised": "39 39 42",
  "--fg": "255 255 255",
  "--fg-muted": "161 161 170",
  "--line-strong": "82 82 91",
  "--accent-600": "8 145 178",
  "--accent-700": "14 116 144",
  "--danger-500": "239 68 68",
  "--danger-600": "220 38 38",
  "--attention-600": "217 119 6",
}

/** Reads a token and returns it as a `#rrggbb` string. */
export function tokenHex(name: string): string {
  let channels = FALLBACK[name] ?? ""
  if (typeof window !== "undefined") {
    const live = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    if (live) channels = live
  }
  const [r, g, b] = channels.split(/[\s,]+/).map((n) => Number(n) || 0)
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")
}
