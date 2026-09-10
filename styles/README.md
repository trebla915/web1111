# Styling — single source of truth

Every colour, radius, font and easing value on this site is defined once, in
`styles/theme/tokens.css`. Nothing else declares a colour.

## Layout

```
styles/
├── README.md          ← this file (the rules)
├── theme/tokens.css   ← THE source of truth: colour, type, radius, motion
└── globals.css        ← imports tokens + Tailwind, then base/utility CSS
lib/theme/
├── index.ts           ← reads tokens back out for JS-only APIs
└── stripe.ts          ← the one Stripe Elements theme, built from tokens
components/ui/         ← the primitives every screen is assembled from
```

## The rule

**Never write a raw Tailwind palette class.** `bg-zinc-900`, `text-gray-400`,
`border-cyan-900` and friends are banned in `app/` and `components/`. Use the
semantic utilities backed by tokens:

| Role | Use | Not |
|---|---|---|
| Page background | `bg-canvas` | `bg-black` |
| Card / panel | `bg-surface` | `bg-zinc-900`, `bg-gray-900` |
| Input, chip | `bg-surface-raised` | `bg-zinc-800` |
| Hover fill | `bg-surface-hover` | `bg-zinc-700` |
| Primary text | `text-fg` | `text-white` |
| Secondary text | `text-fg-dim` | `text-gray-300` |
| Labels, metadata | `text-fg-muted` | `text-gray-400` |
| Placeholders | `text-fg-subtle` | `text-gray-500` |
| Borders | `border-line`, `border-line-subtle` | `border-gray-700` |
| Brand | `text-accent-bright`, `bg-accent-dim` | `text-cyan-400` |
| Status | `danger` `success` `warning` `info` | `red-*` `green-*` … |

Brand and status colours also expose their full numeric ramp
(`accent-100`…`accent-950`, `danger-200`…`danger-950`) for the cases a semantic
alias does not cover — gradients, hairlines, tinted washes.

### One neutral ramp

The site previously mixed Tailwind `gray-*` (blue-tinted) and `zinc-*`
(neutral) for the same roles, often in the same file. Everything neutral is now
zinc. If you need a neutral, it is a `surface-*`, `fg-*` or `line-*` token.

### Why tokens are RGB channels

Tokens are stored as `24 24 27`, not `#18181b`, and consumed as
`rgb(var(--surface) / <alpha-value>)`. That is what makes `bg-surface/50` work.
A hex-valued token silently breaks every `/opacity` suffix.

## Build screens from primitives

Do not hand-roll a control that already exists. Every one of these is adopted
across the site — there are no unused primitives:

| Primitive | File | Replaced |
|---|---|---|
| `Button` | `ui/button.tsx` | 135 hand-styled `<button>` elements |
| `Input` / `Textarea` / `Select` | `ui/input.tsx` | 66 hand-styled form controls |
| `Label` | `ui/field.tsx` | 54 labels written 6 different ways |
| `Spinner` / `LoadingScreen` | `ui/spinner.tsx` | 28 spinner divs + 5 duplicate loading screens |
| `Card` | `ui/card.tsx` | 15 cards across 4 competing recipes, plus 7 pasted grain overlays |
| `EmptyState` | `ui/empty-state.tsx` | 3 ad-hoc zero-states |

`Button` picks its look from **intent**, not colour: `danger` because the action
destroys something, not because you want red. `cn()` runs `twMerge`, so a
`className` you pass still wins over the variant — use that for genuine
one-offs, not to rebuild a variant that already exists.

For a control that brings its own geometry — a left-aligned full-width row, a
64px grid tile, a pill — pass `unstyled`. It keeps the shared focus ring and
disabled behaviour and adds no layout, so the primitive cannot fight the
caller's design.

Only `<input type="checkbox">` and `<input type="file">` stay raw: the text
field styling does not apply to them.

## Inline styles

There is exactly one `style={{…}}` left in the codebase, in
`app/staff/hub/page.tsx`: a dropdown positioned from the trigger's measured
viewport rect. That is the bar — if a value can be a class, it is a class.

## JS that needs a colour

Stripe Elements is themed through a JS object, not CSS. It reads tokens via
`lib/theme/stripe.ts`, so it tracks the rest of the site automatically. Any
future JS-themed widget should do the same rather than hardcoding hex.

## Design detector

`npx impeccable detect app components lib` runs 60 UI anti-pattern rules and
should report **zero** findings. Three documented false positives are recorded
in `.impeccable/config.json` with reasons; add to that file rather than
silencing a rule globally.

## Changing the look

1. Change the value in `theme/tokens.css`.
2. That is the whole procedure.
