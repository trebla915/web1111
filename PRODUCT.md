# Product

<!-- impeccable:product-schema 1 -->

> Written from the owner's standing brief and from the repository, without a
> fresh interview (explicitly requested). Facts not confirmed by the owner in
> conversation are marked *(inferred from code)* so later work can challenge
> them rather than inherit them.

## Platform

web

## Users

- **Guests booking a night out.** El Paso locals and visitors, 21+, choosing an
  event and reserving a VIP table. Most arrive on a phone, often late at night,
  frequently deciding as a group and splitting the cost. They need the date,
  the price, what a table includes, and the bottle minimum before they commit.
- **Venue managers and promoters.** Run the club from the admin dashboard:
  create and edit events, lay out tables, manage reservations, resend
  confirmations, move a guest to another table, cancel, and schedule staff.
  They work fast, often on a laptop backstage or a phone on the floor.
- **Door and floor staff.** Use the staff hub, QR scanner and check-in screen
  at the door, on a phone, in the dark, one-handed, with a queue waiting.

## Product Purpose

11:11 EPTX is a nightclub in northeast El Paso, Texas. The site is the venue's
public face and its operational spine: it publishes the event schedule, sells
and manages VIP table reservations with bottle service through Stripe, and
gives staff the tools to run the door. Success is a guest completing a table
reservation on their phone without calling the venue, and a manager resolving a
reservation problem without leaving the dashboard.

## Positioning

A single venue's own booking system rather than a third-party ticketing
listing: the floor plan is this club's actual floor plan, table pricing and
bottle minimums are the venue's own rules, and staff check guests in against
the same records the guest booked from.

## Operating Context

- **Reservation flow (5 steps):** select table → details (guests, bottles,
  cost) → contact → payment → confirmation. State is held client-side in
  `ReservationProvider` between steps, so a refresh mid-flow loses it.
- **Table change flow:** an existing reservation can be moved to another table
  from `/reservation/[id]/change-table`, charging or refunding the difference.
- **Door flow:** staff hub → QR scanner → check-in screen for one reservation.
- **Money:** Stripe. Cost is table price + bottles + mixers, plus 8.25% sales
  tax, 18% gratuity on bottles, and a 2.9% + $0.30 processing fee.
- **Identity:** Firebase Auth. Roles are `user`, `promoter`, `staff`, `admin`,
  resolved from a cryptographically verified Firebase ID token.

## Capabilities and Constraints

- Next.js 14 App Router, React 18, TypeScript, Tailwind, shadcn/ui primitives,
  Firebase (Auth/Firestore/Storage), Stripe, Resend, deployed on Vercel.
- The whole app scrolls inside a fixed `#__scroll-root` container; `html` and
  `body` are locked. Any full-height or sticky work must respect this.
- **Security posture that must be preserved**: verified ID tokens in
  middleware, per-handler re-verification with the Admin SDK, an approved admin
  UID allowlist, custom-claims checks, disabled web refunds, login gating, and
  the 21+ age gate on bottle selection.
- **Missing business functionality, not styling** (do not disguise as design):
  - Admin → *Manage Users* is a placeholder panel with no user management.
  - Refunds are deliberately disabled on the web surface.
- Terminology used throughout: *event*, *table* (VIP booth or circle), *bottle*,
  *mixer*, *reservation*, *check-in*, *table change*.

## Brand Commitments

- Name **11:11 EPTX**; wordmark and logo at `/public/1111logo.png`; tagline
  "Music is Timeless"; the `TIME:LESS` hero lockup.
- Black canvas, white foreground, cyan accent. Condensed uppercase display face
  (Anton) for headings, Inter for text, monospace for numerals and codes.
- The glow, film-grain and spotlight treatments are the venue's signature
  texture and stay.
- Colours, logo, imagery and identity are **fixed**: design work changes
  structure, spacing, hierarchy and behaviour, never the palette or the marks.

## Evidence on Hand

- Real venue facts: 9740 Dyer Street, El Paso, TX 79924; +1 (915) 246-3945;
  INFO@1111EPTX.COM; Facebook and Instagram at `1111eptx`.
- Real venue rules copy (search policy, prohibited-items list) on the homepage.
- Real fee structure (8.25% tax, 18% gratuity, 2.9% + $0.30) in the checkout.
- **No** testimonials, capacity claims, press, awards or ratings exist. Nothing
  of that kind may be invented. The Twitter/X link points at `twitter.com`
  with no venue handle *(inferred from code)*.
- Event photography beyond the logo and one venue image is not in the repo;
  event flyers come from Firebase Storage at runtime.

## Product Principles

1. **The guest decides on a phone, in the dark, quickly.** Price, date, table
   capacity and the bottle minimum belong where the decision is made, not two
   steps later.
2. **Staff surfaces are tools, not showcases.** Scanability, consistent
   controls and unambiguous state beat expression on admin and door screens.
3. **Money and destructive actions are never ambiguous.** Totals, fees, refunds,
   cancellations and table changes must read exactly once and correctly.
4. **Security behaviour is load-bearing.** Gates, allowlists and claims checks
   are product features; design never routes around them.
5. **Say what is true.** No invented proof, capacity, or availability.

## Accessibility & Inclusion

- Adult venue: 21+ gate on bottle selection must stay.
- Real usage is one-handed, on a phone, in a dark room: 44px minimum touch
  targets, 16px minimum input text (iOS zoom), and `prefers-reduced-motion`
  support are already project conventions and must hold.
- Every control needs an accessible name; the floor plan and admin actions must
  be operable by keyboard, not pointer only.
- Spanish-language event titles appear in real content; layouts must survive
  long, accented, multi-word strings.
