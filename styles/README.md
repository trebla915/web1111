# Styling — Single Source of Truth

All site styling is controlled from one place.

## File structure

```
styles/
├── README.md           ← This file (conventions)
├── theme/
│   └── tokens.css      ← Single source of truth: colors, typography, effects
└── globals.css         ← Entry point: imports tokens, Tailwind, base + component styles
```

## Where to change what

| What to change      | File / place |
|---------------------|--------------|
| Colors, fonts, shadows, layout tokens | `theme/tokens.css` only |
| Tailwind theme (screens, animations, spacing) | `tailwind.config.js` (extends tokens where possible) |
| Base layout (html, body, scroll root), utilities, keyframes | `globals.css` (use `var(--*)` from tokens) |
| Component-level Tailwind classes     | Components; prefer token-based classes: `bg-brand`, `text-fg`, `text-accent`, `border-border`, `font-heading` |

## Token-based Tailwind classes

Use these so styles stay consistent and one place controls them:

- **Colors:** `bg-brand`, `bg-surface`, `bg-surface-overlay`, `text-fg`, `text-fg-muted`, `text-accent`, `border-border`, `border-border-subtle`
- **Fonts:** `font-sans`, `font-heading`, `font-display`, `font-impact`

Raw Tailwind (e.g. `bg-black`, `text-cyan-400`) still works but new code should prefer the token classes above so future theme changes only touch `theme/tokens.css`.

## Convention

1. **Add or change design values** (e.g. a new accent shade) in `theme/tokens.css`.
2. **Use those values** in `globals.css` via `var(--color-*)`, `var(--font-*)`, `var(--shadow-*)`.
3. **Use token-backed utilities** in components: `bg-brand`, `text-accent`, etc., or `var(--*)` in rare custom CSS.

Do not define colors or typography in component files; reference tokens or token-based Tailwind classes.
