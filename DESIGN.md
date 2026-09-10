---
name: 11:11 EPTX
description: A black-room nightclub site where the venue's glow is the only light, and every task screen gets out of the way.
colors:
  canvas: "rgb(0 0 0)"
  surface: "rgb(24 24 27)"
  surface-raised: "rgb(39 39 42)"
  surface-hover: "rgb(63 63 70)"
  surface-lifted: "rgb(82 82 91)"
  surface-sunken: "rgb(9 9 11)"
  fg: "rgb(255 255 255)"
  fg-dim: "rgb(212 212 216)"
  fg-muted: "rgb(161 161 170)"
  fg-subtle: "rgb(113 113 122)"
  fg-faint: "rgb(82 82 91)"
  fg-inverse: "rgb(0 0 0)"
  line: "rgb(63 63 70)"
  line-subtle: "rgb(39 39 42)"
  line-strong: "rgb(82 82 91)"
  line-accent: "rgb(22 78 99)"
  accent: "rgb(6 182 212)"
  accent-bright: "rgb(34 211 238)"
  accent-dim: "rgb(8 145 178)"
  accent-deep: "rgb(14 116 144)"
  accent-deeper: "rgb(22 78 99)"
  danger: "rgb(220 38 38)"
  danger-bright: "rgb(248 113 113)"
  success: "rgb(22 163 74)"
  success-bright: "rgb(74 222 128)"
  warning: "rgb(202 138 4)"
  warning-bright: "rgb(250 204 21)"
  info: "rgb(37 99 235)"
  attention-400: "rgb(251 191 36)"
  confirm-400: "rgb(52 211 153)"
  revoke-400: "rgb(251 146 60)"
typography:
  display:
    fontFamily: "Anton, Anta, 'Arial Narrow', sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "0.05em"
  headline:
    fontFamily: "Anton, Anta, 'Arial Narrow', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "0.05em"
  title:
    fontFamily: "Anton, Anta, 'Arial Narrow', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.05em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.05em"
  numeric:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tnum"
  micro:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.05em"
  micro-sm:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.fg-inverse}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.fg-dim}"
    textColor: "{colors.fg-inverse}"
  button-accent:
    backgroundColor: "{colors.accent-dim}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    height: "44px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fg-muted}"
    rounded: "{rounded.lg}"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "0 12px"
  badge-status:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.fg-dim}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: 11:11 EPTX

## Overview

**Creative North Star: The Dark Room.** The venue is a black room where the only
light is the one the club makes. The site works the same way: a true-black
canvas, a single white voice, and cyan used the way a laser is — pointed at one
thing at a time.

Two registers share one system:

- **The front of house** (homepage, events, event detail) is expressive. Grain,
  a slow spotlight sweep, a condensed uppercase display face, and glow are the
  venue's signature and are allowed to be loud.
- **The back of house** (admin, staff hub, door check-in, and every step of the
  reservation flow) is a tool. Same palette, same components, but the
  expression drops away: no glow on headings, no ambient sweep behind a data
  table, and information density over atmosphere. A manager fixing a booking at
  1 a.m. and a door host with a queue are not an audience to impress.

Anti-reference: the generic dark SaaS dashboard, and the nightclub site that is
one full-bleed hero photo with a phone number.

## Colors

One neutral ramp only — **zinc**. The site previously mixed blue-tinted `gray-*`
with neutral `zinc-*` for identical roles, which read as a colour cast drifting
screen to screen.

**Ink Black** (`canvas`) is the page. Surfaces climb a four-step elevation
ladder — `surface` (cards) → `surface-raised` (inputs, chips) → `surface-hover`
→ `surface-lifted` — with `surface-sunken` below the card for wells and for the
admin sidebar.

Foreground has four steps of emphasis. `fg-subtle` is the dimmest that still
clears 4.5:1 on `surface`; `fg-faint` is below that line and is decorative only
— never body copy, never anything actionable.

**Laser Cyan** (`accent`) is the brand's one colour. It marks interactive
default, focus rings, the active item in navigation, money in a breakdown, and
the selected table on the floor plan. It is never decoration.

Status colours carry fixed meanings and are not interchangeable with the accent:
`danger` destroys, `success` confirms, `warning` blocks, `info` informs.

A separate **categorical action set** — `attention` (settle a price
difference), `confirm` (move a booking), `revoke` (cancel and refund) — exists
because three admin actions sit side by side and are told apart by hue rather
than by severity. They are deliberately not folded into the status ramps.

Two rules that are load-bearing:

- **Red means destruction, nothing else.** Not a role badge, not a "create
  account" button, not a link to the admin dashboard.
- **Colour never carries a state alone.** Availability on the floor plan is fill
  *and* border *and* a word; a blocked bottle minimum is a tint *and* an icon.

## Typography

Two faces, three jobs.

- **Anton** (`--font-heading`) is the display voice: uppercase, condensed,
  `0.05em` tracking, applied globally to `h1`–`h3`. It carries the venue's
  character and is the reason the marketing pages read as a club and not a
  template.
- **Inter** (`--font-sans`) carries everything else — body, labels, buttons,
  form text, admin tables.
- **A monospace stack** (`--font-display`) is reserved for numerals, codes and
  timestamps, where fixed-width digits matter.

Product surfaces use a **fixed rem scale, not fluid clamps**: a heading that
shrinks inside a sidebar looks worse, not better. Scale steps are tight
(≈1.125–1.2) because there are more type elements on an admin screen than on a
landing page, and exaggerated contrast there is noise.

**Money, counts, times and table numbers take `.tabular`** (`font-variant-
numeric: tabular-nums`). A column of totals that drifts with glyph widths is
unreadable, and this app is full of columns of totals.

Below `body` there are exactly two micro steps, and they exist for dense
operator marks only — a role badge, a step label, the capacity on a table tile,
a stat-pill caption:

- **`micro`** — 11px / `0.6875rem`
- **`micro-sm`** — 10px / `0.625rem`

**10px is the floor.** Nothing on any surface renders smaller. The floor plan
previously ran down to `text-[5px]` and the staff hub to `text-[8px]`, on
screens read one-handed in a dark room.

Prose measure stays at 65–75ch (`max-w-prose`). Data and compact UI may run
denser.

## Layout

The whole app scrolls inside a fixed `#__scroll-root`; `html` and `body` are
locked so iOS never shows a double scrollbar and the fixed header stays put.
Any sticky or full-height work must account for this.

- **Breakpoints**: `xs` 475, `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- **Containers**: marketing sections use the fluid `container`; task surfaces
  cap at `max-w-2xl` (a single form column), `max-w-4xl` (a dashboard), or
  `max-w-5xl` (the floor plan). The admin content area caps at `max-w-6xl` so a
  label and its value never sit half a metre apart on a wide display.
- **Responsive behaviour is structural, not fluid.** The admin sidebar collapses
  into a Sheet drawer; the floor plan keeps its spatial arrangement and rescales
  its tiles; multi-column definition lists reflow to two columns. Type sizes
  step at breakpoints rather than interpolating.
- **Rhythm**: related lines sit tight (4–8px), groups separate generously
  (24–40px), and a heading always has more space above it than below it.
- **Every touch target is ≥44px**, including small marks: an icon link is a
  20px glyph centred in a 44px box.
- Safe-area insets are honoured at the header, the footer, the scroll cue and
  every fixed bar.

## Elevation & Depth

The system is **tonally layered, not shadowed**. Depth comes from the surface
ladder and from hairline borders, not from drop shadows; a card is a lighter
fill with a cyan-tinted edge (`line-accent/30`).

Shadow is reserved for two jobs:

- **Glow** — the venue's signature, in exactly three intensities
  (`--shadow-glow-white`, `--shadow-glow-soft`, `--shadow-glow-accent`). Front
  of house only. It never appears on an admin heading, where a white text halo
  reads as a rendering fault.
- **Lift** — `--shadow-card-hover`, a soft offset blur under an interactive
  tile.

Two ambient textures belong to the world and are always `aria-hidden` and
pointer-transparent:

- `.noise` — a fractal-noise film grain at 5–10% opacity.
- `.spotlight` — a slow rotating radial sweep. It is drawn on a pseudo-element
  inside a clipped box; rotating the layer directly made it a rotating
  *rectangle* whose corners swung outside its parent.

## Shapes

**One radius.** `--radius: 0.5rem` backs `rounded-lg`, the site's dominant
corner; `md` and `sm` step down from it proportionally. `rounded-full` is for
pills, avatars, icon buttons and legend swatches only.

Square corners are not part of the vocabulary. Where a panel sat square beside a
rounded sibling — the venue cards, the map frame, the events empty state — that
was drift, not a decision.

Borders are hairlines. `line-subtle` divides inside a panel, `line` is the
default edge, `line-strong` emphasises, and `line-accent/30` is the cyan-tinted
card edge that ties a panel to the brand.

Form controls share one geometry: 44px tall, `rounded-lg`, `surface-raised`
fill, hairline border, cyan focus ring. Inputs render at 16px on mobile so iOS
Safari does not zoom the viewport on focus.

## Components

Every interactive component ships default, hover, focus, active, disabled and —
where it does work — loading.

- **Button** is the only clickable control. Variants map to *intent*, not
  colour: `primary` (white, highest emphasis), `accent` (brand actions),
  `danger` (destructive), `success` (confirm), `subtle`, `outline`, `ghost`.
  `unstyled` is the documented escape hatch for controls that bring their own
  geometry — a stacked icon tile, a full-width list row — because the sized
  variants clamp height and centre their content, which silently crops rich
  children.
- **Card** is the brand-tinted panel, with an optional clipped grain overlay.
  **Cards never nest.**
- **Input / Textarea / Select** share one recipe, including a `leadingIcon`
  slot. Every field has a real `<Label htmlFor>`; a placeholder is not a name,
  and it disappears the moment someone types. Errors use `aria-invalid` plus
  `aria-describedby` on the field itself, never a loose red sentence beneath it.
- **EmptyState** teaches the surface and offers a next step — never "nothing
  here."
- **PanelLoading / PanelError / RouteLoading / RouteError** are the three states
  every fetched surface has. Loading and failure must never render the same
  thing; an em dash that means both "still fetching" and "this broke" is a lie.
- **Sheet** owns every drawer, because it brings a focus trap, Escape, a
  backdrop and scroll lock that a hand-rolled overlay does not.
- **DropdownMenu** owns overflow actions. More than about three icon buttons in
  a row is a wall of options: keep the one or two an operator reaches for, and
  move the rest into a labelled menu with destructive items below a separator.
- **ReservationSteps** shows where the guest is in the five-step booking flow.
- Icons come from `react-icons` (Feather `Fi*`, BoxIcons `Bi*`) at one stroke
  weight. **Emoji are never icons.** Decorative icons are `aria-hidden`;
  icon-only controls carry a real `aria-label`, not a hover-only `title`.

## Do's and Don'ts

**Do**

- Put the facts behind a decision where the decision is made — price, capacity
  and bottle minimum belong on the table tile, not two steps later.
- Show the full cost breakdown on every screen that names a total, grouped as
  charges → subtotal → taxes and fees → total, with the total the largest figure
  in the panel.
- Give money and counts `.tabular` and align them right in a column.
- Reach for the shared primitive before writing a new recipe; four spellings of
  one input is how a system dies.
- Theme the surfaces you didn't draw: selection, caret, scrollbar, focus ring,
  underline offset.
- Respect `prefers-reduced-motion`; keep meaning, drop movement.

**Don't**

- Don't use `danger` red for anything that isn't destructive.
- Don't put `digital-glow-*` on a task surface.
- Don't give a fixed-height button block content — use `unstyled`.
- Don't let colour alone carry a state.
- Don't nest cards, or reach for a modal before exhausting inline disclosure.
- Don't ship a heading that repeats the heading above it: the sticky admin bar
  already names the open section.
- Don't invent proof. There are no testimonials, ratings, capacity claims or
  press for this venue; if an asset is missing, degrade gracefully and say so.
