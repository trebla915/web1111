/**
 * Hex mirror of styles/theme/tokens.css, for the places CSS variables cannot
 * reach: HTML email (clients strip <style> and ignore var()), the QR-code
 * canvas, and the browser's <meta name="theme-color">.
 *
 * This is not a second palette. Every entry names the token it mirrors, and
 * tests/design/theme.test.ts fails if a value here drifts from tokens.css.
 * Change the token first, then this file.
 */
export const palette = {
  // --canvas
  canvas: "#000000",
  // --surface
  surface: "#18181b",
  // --surface-raised
  surfaceRaised: "#27272a",
  // --surface-sunken
  surfaceSunken: "#09090b",
  // --fg
  fg: "#ffffff",
  // --fg-dim
  fgDim: "#d4d4d8",
  // --fg-muted
  fgMuted: "#a1a1aa",
  // --fg-subtle
  fgSubtle: "#71717a",
  // --line
  line: "#3f3f46",
  // --line-subtle
  lineSubtle: "#27272a",
  // --accent-400
  accentBright: "#d4d4d4",
  // --accent-600
  accentDim: "#717171",
} as const;

export type PaletteColor = keyof typeof palette;
