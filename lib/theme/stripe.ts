import type { Appearance } from "@stripe/stripe-js"

import { tokenHex } from "@/lib/theme"

/**
 * The one Stripe Elements theme.
 *
 * This was previously two separate inline `appearance` objects — a fully
 * themed one on the payment step and a four-variable one on the change-table
 * step — so the same card form rendered differently depending on which route
 * the customer reached it from. Both now call this.
 *
 * Every colour resolves from a design token, so Stripe's iframe tracks the
 * rest of the site automatically.
 */
export function stripeAppearance(): Appearance {
  const canvasRaised = tokenHex("--surface-raised")
  const surface = tokenHex("--surface")
  const fg = tokenHex("--fg")
  const fgMuted = tokenHex("--fg-muted")
  const line = tokenHex("--line-strong")
  const accent = tokenHex("--accent-600")
  const accentDeep = tokenHex("--accent-700")
  const danger = tokenHex("--danger-600")
  const attention = tokenHex("--attention-600")

  return {
    theme: "night",
    variables: {
      colorPrimary: accent,
      colorBackground: surface,
      colorText: fg,
      colorDanger: tokenHex("--danger-500"),
      fontFamily: "system-ui, sans-serif",
      spacingUnit: "4px",
      borderRadius: "8px",
    },
    rules: {
      ".Tab": {
        border: `1px solid ${line}`,
        boxShadow: "none",
        backgroundColor: canvasRaised,
        color: fg,
      },
      ".Tab:hover": { color: accent, borderColor: accent },
      ".Tab--selected": { backgroundColor: accent, color: fg, borderColor: accent },
      ".Tab--selected:hover": { backgroundColor: accentDeep, color: fg },
      ".TabLabel": { color: fg },
      ".TabLabel--selected": { color: fg },
      ".Input": {
        backgroundColor: canvasRaised,
        border: `1px solid ${line}`,
        color: fg,
      },
      ".Input:focus": { borderColor: accent, boxShadow: `0 0 0 1px ${accent}` },
      ".Input::placeholder": { color: fgMuted },
      ".Label": { color: fg },
      ".Text": { color: fg },
      ".Text--secondary": { color: fgMuted },
      ".Text--small": { color: fgMuted },
      ".Icon": { color: fgMuted },
      ".Icon--selected": { color: accent },
      ".Divider": { backgroundColor: line },
      ".Spinner": { color: accent },
      ".Alert": { backgroundColor: danger, color: fg },
      ".Alert--error": { backgroundColor: danger, color: fg },
      ".Alert--warning": { backgroundColor: attention, color: fg },
      ".Alert--info": { backgroundColor: accent, color: fg },
    },
  }
}
