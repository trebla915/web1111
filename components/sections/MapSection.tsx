// MapSection.tsx
"use client"

import React from 'react';
import { useScrollParallax } from '@/lib/hooks/useScrollParallax';
import SectionHeader from '@/components/ui/SectionHeader';

export default function MapSection() {
  const { style: mapParallaxStyle, ref: mapParallaxRef } = useScrollParallax({
    speed: 0.7,
    direction: 'background',
    whenInView: true,
  });

  return (
    <section
      id="location"
      className="py-16 md:py-24 bg-black text-white relative overflow-hidden border-t border-white/10"
    >
      <div className="absolute inset-0 noise opacity-5" />
      <div className="absolute inset-0 spotlight opacity-10" />

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          label="location"
          lines={["FIND", "US"]}
          subtitle="9740 Dyer Street, El Paso, Texas 79924."
        />

        <div ref={mapParallaxRef} className="w-full max-w-5xl mx-auto border border-white/20 overflow-hidden mt-10">
          <div className="w-full h-96 bg-gray-900 flex items-center justify-center relative" style={mapParallaxStyle}>
            {/* This would be replaced with an actual map integration */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#06b6d4_0,_transparent_8px)] bg-[length:30px_30px] opacity-5" />
            <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative z-10 text-center">
              <h3 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Impact, sans-serif' }}>11:11 EPTX</h3>
              <p className="text-white text-xl">9740 DYER STREET</p>
              <p className="text-gray-400">EL PASO, TEXAS 79924</p>
              <div className="mt-6">
                <a 
                  href="https://maps.google.com/?q=9740+Dyer+St,+El+Paso,+TX+79924" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-gray-200 text-black px-6 py-3 inline-block transition-colors font-bold"
                >
                  GET DIRECTIONS
                </a>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}