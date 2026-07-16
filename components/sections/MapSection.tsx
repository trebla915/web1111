// MapSection.tsx
"use client"

import React from 'react';
import SectionHeader from './SectionHeader';

export default function MapSection() {
  return (
    <section
      id="location"
      className="py-16 bg-black text-white relative overflow-hidden border-t border-white/20"
    >
      {/* Background effects */}
      <div className="absolute inset-0 noise opacity-5"></div>
      <div className="absolute inset-0 spotlight opacity-10"></div>

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader title="FIND US" subtitle="LOCATED IN NORTHEAST EL PASO" />

        <div className="w-full max-w-5xl mx-auto border border-white/20 overflow-hidden">
          <iframe
            title="11:11 EPTX location"
            src="https://maps.google.com/maps?q=9740+Dyer+St,+El+Paso,+TX+79924&z=15&output=embed"
            className="w-full h-96 grayscale invert-[0.9] contrast-[1.1]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="text-center mt-6">
          <h3 className="text-2xl font-bold text-white font-display">11:11 EPTX</h3>
          <p className="text-white mt-1">9740 DYER STREET</p>
          <p className="text-white/60">EL PASO, TEXAS 79924</p>
          <a
            href="https://maps.google.com/?q=9740+Dyer+St,+El+Paso,+TX+79924"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 bg-white hover:bg-white/90 text-black px-6 py-3 transition-colors font-bold tracking-widest"
          >
            GET DIRECTIONS
          </a>
        </div>
      </div>
    </section>
  );
}
