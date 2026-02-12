# Parallax + Mobile-First + Full-Screen Plan (for tomorrow)

**Context:** Keep the [CODE_AUDIT_REPORT.md](./CODE_AUDIT_REPORT.md) in mind for later. This doc is for:
- Adding parallax effects and where to use them
- Mobile-first experience (iPhone + Android)
- iPhone full-screen experience (status bar, notch, immersive)

---

## 1. Parallax opportunities

### High impact (do first)

| Section | Current | Parallax idea |
|--------|---------|----------------|
| **HeroSection** | Full viewport, logo, CTA | Scroll-based: logo/content moves slower than “viewport” so background (or a subtle gradient layer) feels deeper. If you reintroduce video/bg image, move it at ~0.5x scroll speed. |
| **VenueSection** | Image + text grid | **Image parallax:** Venue image moves at ~0.6x scroll speed; text at 1x. Use `transform: translateY()` driven by scroll. |
| **EventsFestivalSection** | Event cards | **Card stagger:** Slight Y offset per card based on scroll (or entrance). Optional: subtle scale (e.g. 0.98 → 1) as cards enter view. |
| **MapSection** | Map embed | **Depth:** Map container or overlay moves at ~0.7x scroll; keeps section from feeling flat. |

### Medium impact

| Section | Parallax idea |
|--------|----------------|
| **FAQFestivalSection** | Accordion rows: very subtle Y movement (2–4px) on scroll-in per item. |
| **ContactSection** | Background pattern or gradient layer at ~0.8x scroll for depth. |
| **Header / Nav** | On scroll down: header can shrink or shift; optional subtle parallax on a bg layer. |

### Implementation approach

- **Mobile-first:** Use `requestAnimationFrame` or Intersection Observer; prefer CSS `transform` and `will-change` for performance (avoid animating `top`/`height`).
- **Reduce motion:** Respect `prefers-reduced-motion: media (prefers-reduced-motion: reduce)` — disable or greatly reduce parallax when set.
- **Libraries (optional):** Consider a small scroll-driven hook (e.g. `useScrollPosition` + `transform`) or a lightweight lib (e.g. `react-scroll-parallax`) only if you want reusable sections; vanilla scroll + refs is enough for 5–6 sections.

---

## 2. Mobile-first experience (iPhone + Android)

### Layout & breakpoints

- **Base styles = mobile** (single column, touch-friendly tap targets 44px+).
- **Progressive enhancement:** `sm:` / `md:` / `lg:` for tablet and desktop.
- **Home page:** Hero already `h-screen`; ensure sections stack with consistent vertical rhythm (e.g. `gap-16` or `py-12`/`py-16`) and no horizontal overflow.

### Touch & performance

- Use `touch-action` where needed (e.g. `touch-action: pan-y` on scroll containers if you add horizontal carousels).
- Parallax: throttle scroll handler (e.g. 1–2 frames) and use `passive: true` for scroll listeners where possible.
- Lazy-load below-the-fold images (Next.js `Image` with `loading="lazy"` or `priority` only on hero).

### Android

- **theme-color** in layout is already `#000000` — matches black theme.
- **Web manifest:** `display: "standalone"` is set; consider `"display_override": ["window-controls-overlay", "standalone"]` later if you want more control.
- Test Chrome Android: address bar show/hide can change `100vh`; prefer `100dvh` (dynamic viewport) for full-height hero on mobile where supported, with fallback `100vh`.

---

## 3. iPhone full-screen experience (status bar + notch)

Goal: app feels full-screen — status bar and safe areas are part of the design, not browser chrome.

### Meta tags (in `app/layout.tsx`)

Add or confirm in `<head>`:

```html
<!-- Already have -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<meta name="theme-color" content="#000000" />

<!-- Add for iOS full-screen / PWA -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="11:11" />
```

- **`black-translucent`:** Content draws under the status bar; you handle safe areas with padding. Use this for true edge-to-edge.
- **`black`:** Status bar is black, content starts below it (no notch overlap).
- **`default`:** System default (often gray).

Recommendation: **`black-translucent`** + safe-area insets so hero and nav use full screen including status bar area.

### Viewport for notch (iOS 11+)

Update viewport so iOS uses the full screen including notch:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

**`viewport-fit=cover`** makes the layout rect include the safe areas (notch, home indicator); you then add padding so content isn’t hidden.

### Safe-area CSS

You already have:

```css
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}
```

Add and use:

```css
/* Safe area insets for full-screen mobile (notch, home indicator) */
.pt-safe {
  padding-top: env(safe-area-inset-top, 0px);
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}
.pl-safe {
  padding-left: env(safe-area-inset-left, 0px);
}
.pr-safe {
  padding-right: env(safe-area-inset-right, 0px);
}

/* One class for all insets (e.g. main wrapper or hero) */
.safe-area-insets {
  padding-top: env(safe-area-inset-top, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
}
```

### Where to apply

- **Hero:** Add `safe-area-insets` (or `pt-safe` + `pl-safe` + `pr-safe`) to the hero container so the logo and CTA sit below the status bar and clear the notch. Keep `pb-safe` on bottom CTAs.
- **Fixed header / nav:** If you have a sticky header, give it `padding-top: env(safe-area-inset-top)` and `padding-left/right: env(safe-area-inset-*)` so it doesn’t sit under the notch.
- **Bottom nav / footer / primary CTAs:** Use `pb-safe` so they sit above the home indicator.

### PWA / standalone

- **Manifest:** `display: "standalone"` is already set; when added to home screen, iOS will use the status bar style from the meta tag.
- **Splash:** Optional: add `apple-touch-startup-image` for a custom splash (multiple sizes for different devices) for a polished full-screen launch.

### Height on mobile (status bar + URL bar)

- Use **`100dvh`** (dynamic viewport height) for the hero so it fills the visible area even when the browser UI shows/hides. Fallback: `100vh`.
- In Tailwind you can add a utility, e.g. `min-h-[100dvh]` and use it on the hero.

---

## 4. Suggested file changes (checklist for tomorrow)

- [ ] **Layout:** Add `viewport-fit=cover`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`.
- [ ] **Globals:** Add `.pt-safe`, `.pl-safe`, `.pr-safe`, `.safe-area-insets` and use `100dvh` for hero height on mobile.
- [ ] **HeroSection:** Add safe-area classes to outer section; optional scroll-based parallax for content vs background.
- [ ] **VenueSection:** Add scroll-driven parallax to the venue image (e.g. `useRef` + scroll listener → `transform: translateY(...)`).
- [ ] **Events / FAQ / Contact / Map:** Pick 1–2 sections for subtle parallax (stagger or layer speed).
- [ ] **Respect `prefers-reduced-motion`** in JS and CSS for all parallax.
- [ ] **Test on iPhone (Safari + “Add to Home Screen”)** for status bar, notch, and home indicator; test on Android Chrome for theme and standalone.

---

## 5. Quick reference: status bar styles (iOS)

| Value | Effect |
|-------|--------|
| `black-translucent` | Content under status bar; use safe-area insets. Best for full-screen. |
| `black` | Black status bar; content below it. |
| `default` | System default. |

Use **`black-translucent`** + **`viewport-fit=cover`** + **safe-area padding** for the full-screen iPhone experience you described.
