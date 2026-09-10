// MapSection.tsx
"use client"

import React from 'react';
import SectionHeader from './SectionHeader';
import { Button } from '@/components/ui/button';

export default function MapSection() {
  return (
    <section
      id="location"
      className="py-16 bg-canvas text-fg relative overflow-hidden border-t border-fg/20"
    >
      {/* Background effects */}
      <div aria-hidden="true" className="noise pointer-events-none absolute inset-0 opacity-5" />
      <div aria-hidden="true" className="spotlight opacity-10" />

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader title="FIND US" subtitle="LOCATED IN NORTHEAST EL PASO" />

        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-lg border border-fg/20">
          <iframe
            title="11:11 EPTX location"
            src="https://maps.google.com/maps?q=9740+Dyer+St,+El+Paso,+TX+79924&z=15&output=embed"
            className="w-full h-96 grayscale invert-[0.9] contrast-[1.1]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* The address was three lines of near-equal weight above a
            square-cornered bespoke button; the address is one block now and the
            action uses the site's button. */}
        <div className="mt-6 flex flex-col items-center gap-4 text-center">
          <address className="not-italic">
            <span className="block font-heading text-2xl tracking-wide text-fg">11:11 EPTX</span>
            <span className="mt-1 block text-fg-dim">9740 Dyer Street</span>
            <span className="block text-fg-muted">El Paso, Texas 79924</span>
          </address>
          <Button asChild variant="primary" size="lg">
            <a
              href="https://maps.google.com/?q=9740+Dyer+St,+El+Paso,+TX+79924"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
