# SEO opportunities – 11:11 EPTX

Quick reference of what’s in place and what to improve.

## Already in place

- **Root metadata** (layout): title, description, keywords, `metadataBase`, Open Graph, Twitter card, robots, verification placeholder, canonical (homepage only).
- **Event pages**: `generateMetadata` with title, description, OG title/description/images (flyer).
- **Structured data**: Homepage JSON-LD (NightClub), event page JSON-LD (Event) in `EventDetails`.
- **Sitemap**: API route at `/api/sitemap` (dynamic events); static `public/sitemap.xml` (stale, no events).
- **robots.txt**: Allows crawlers; disallows `/admin/`, `/api/`, `/dashboard/`; points to sitemaps.

---

## High impact / quick wins

1. **Canonical URLs**
   - Root layout forces one canonical for the whole site; event and list pages need their own.
   - **Event page**: Set `alternates.canonical` to `https://www.1111eptx.com/events/{id}` in `generateMetadata`.
   - **/events**: Set canonical to `https://www.1111eptx.com/events` (e.g. in `app/events/layout.tsx`).

2. **Title template**
   - In root layout, set `title.template: "%s | 11:11 EPTX"` and `title.default: "11:11 | El Paso Texas Music and Concert Venue"` so event titles become “Event Name | 11:11 EPTX”.

3. **Event page metadata**
   - Add `openGraph.url` and `twitter` (card, title, description, image) for event URLs.
   - Add `alternates.canonical` for the event URL.

4. **/events page**
   - No metadata today (client component). Add `app/events/layout.tsx` with:
     - title: “Events | 11:11 EPTX” (or similar)
     - description for the events listing
     - canonical: `/events`

5. **Privacy page**
   - Add metadata: title “Privacy Policy | 11:11 EPTX”, short description.

6. **Sitemap at /sitemap.xml**
   - Crawlers expect `https://www.1111eptx.com/sitemap.xml`. Use Next.js `app/sitemap.ts` to generate the same content as the API (including dynamic event URLs) and serve it at `/sitemap.xml`. Optionally keep or remove `/api/sitemap` and point robots only to `/sitemap.xml`.

7. **robots.txt**
   - Use a single Sitemap line: `Sitemap: https://www.1111eptx.com/sitemap.xml` (remove or keep `/api/sitemap` once app sitemap is live).

8. **Homepage JSON-LD**
   - Replace placeholder `"telephone": "(212) 555-1111"` with real venue number (e.g. +1 (915) 246-3945) or remove if you prefer not to expose it.

9. **Google Search verification**
   - Replace `verification.google: "YOUR_GOOGLE_VERIFICATION_ID"` with the real meta tag value from Search Console, or use an env var and remove the placeholder.

10. **OG image**
    - Layout and schema reference `/og-image.jpg`. Ensure `public/og-image.jpg` exists (1200×630) for social previews; otherwise add it or switch to an existing image (e.g. `venue.jpg` or logo) and update references.

---

## Medium impact

- **Reserve/[id]** (table selection): Client-only, no per-event metadata. Harder without a server wrapper; consider a layout that fetches event and sets title/description for “Reserve table for {Event Name}”.
- **BreadcrumbList** JSON-LD on event page: e.g. Home → Events → Event Name.
- **Event JSON-LD**: Currently injected client-side in `EventDetails`; consider outputting it server-side on the event page so crawlers that don’t run JS still see it (optional; many crawlers execute JS).

---

## Low priority

- **Reserve flow pages** (details, contact, payment, confirmation): Add minimal metadata (e.g. “Reserve | 11:11 EPTX”) if you want them indexable; often these are noindex in practice.
- **Auth pages**: Already in sitemap; consider noindex if you don’t want login/register in search results.
- **FAQ schema**: If the venue rules/FAQ section is structured Q&A, add FAQPage JSON-LD.

---

## Checklist after changes

- [ ] Google Search Console: Verify domain, submit sitemap `https://www.1111eptx.com/sitemap.xml`, check coverage.
- [ ] Test OG/Twitter: Facebook Sharing Debugger, Twitter Card Validator, LinkedIn Post Inspector.
- [ ] Test structured data: Google Rich Results Test.
- [ ] Confirm `og-image.jpg` exists and displays correctly in sharing previews.
