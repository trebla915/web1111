// VenueSection.tsx
"use client"

import React from 'react';
import Image from 'next/image';
import { useScrollParallax } from '@/lib/hooks/useScrollParallax';
import SectionHeader from './SectionHeader';

export default function VenueSection() {
  const { style: imageParallaxStyle, ref: imageParallaxRef } = useScrollParallax({
    speed: 0.6,
    direction: 'background',
    whenInView: true,
  });

  return (
    <section
      id="venue"
      className="py-16 bg-canvas text-fg relative overflow-hidden border-t border-fg/20"
    >
      {/* Background effects */}
      <div aria-hidden="true" className="noise pointer-events-none absolute inset-0 opacity-5" />
      <div aria-hidden="true" className="spotlight opacity-10" />

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader title="OUR VENUE" subtitle="EXPERIENCE THE UNIQUE ATMOSPHERE OF 11:11" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* `public/images/venue.jpg` is currently a zero-byte file, so this
              rendered as a black rectangle with a caption floating on nothing.
              The grain and spotlight sit behind the photo: when the file is
              supplied it covers them, and until then the block still reads as a
              deliberate panel rather than a hole. */}
          <div
            ref={imageParallaxRef}
            className="relative h-72 overflow-hidden rounded-lg border border-fg/20 bg-surface sm:h-80 md:h-auto md:min-h-[22rem]"
          >
            <div aria-hidden="true" className="noise absolute inset-0 opacity-10" />
            <div aria-hidden="true" className="spotlight opacity-20" />
            <div className="absolute inset-0 scale-110" style={imageParallaxStyle}>
              <Image
                src="/images/venue.jpg"
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5">
              <h3 className="font-heading text-2xl tracking-wide text-fg">Main floor</h3>
              <p className="mt-1 text-sm text-fg-dim">State-of-the-art sound system</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* The image column carries `rounded-lg`; these two panels were
                square, so one side of the row had corners and the other did
                not. */}
            <div className="rounded-lg border border-fg/20 bg-canvas p-6">
              <h3 className="mb-4 font-heading text-2xl tracking-wide text-fg">Venue features</h3>
              {/* `items-center` centred each square marker against the whole
                  line box, so a wrapped feature pushed its marker to the middle
                  of the block instead of the first line. */}
              <ul className="space-y-3 text-fg-dim">
                {[
                  'Premium sound & lighting',
                  'Multiple bar areas',
                  'VIP bottle service',
                  'Spacious dance floor',
                  'Professional security',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span aria-hidden="true" className="mt-[0.45rem] block h-1.5 w-1.5 shrink-0 bg-fg" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="rounded-lg border border-fg/20 bg-canvas p-6">
              <h3 className="mb-2 font-heading text-2xl tracking-wide text-fg">Opening hours</h3>
              <p className="text-fg-dim">Special events only — check the schedule on each event flyer.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}