// VenueSection.tsx
"use client"

import React from 'react';
import Image from 'next/image';
import { useScrollParallax } from '@/lib/hooks/useScrollParallax';
import SectionHeader from '@/components/ui/SectionHeader';

export default function VenueSection() {
  const { style: imageParallaxStyle, ref: imageParallaxRef } = useScrollParallax({
    speed: 0.6,
    direction: 'background',
    whenInView: true,
  });

  return (
    <section
      id="venue"
      className="py-16 md:py-24 bg-black text-white relative overflow-hidden border-t border-white/10"
    >
      <div className="absolute inset-0 noise opacity-5" />
      <div className="absolute inset-0 spotlight opacity-10" />

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          label="venue"
          lines={["OUR", "SPACE"]}
          subtitle="Premium sound, lighting, and bottle service in El Paso."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-10">
          <div ref={imageParallaxRef} className="relative h-80 md:h-[420px] overflow-hidden">
            <div className="absolute inset-0 scale-110" style={imageParallaxStyle}>
              <Image
                src="/images/venue.jpg"
                alt="11:11 Venue"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            <div className="absolute bottom-0 left-0 p-5">
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Impact, sans-serif' }}>MAIN FLOOR</h3>
              <p className="text-white/80 text-sm">State of the art sound system</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold mb-4 text-white" style={{ fontFamily: 'Impact, sans-serif' }}>VENUE FEATURES</h3>
              <ul className="space-y-3 text-white">
                <li className="flex items-center">
                  <span className="block w-2 h-2 bg-white mr-2"></span>
                  PREMIUM SOUND & LIGHTING
                </li>
                <li className="flex items-center">
                  <span className="block w-2 h-2 bg-white mr-2"></span>
                  MULTIPLE BAR AREAS
                </li>
                <li className="flex items-center">
                  <span className="block w-2 h-2 bg-white mr-2"></span>
                  VIP BOTTLE SERVICE
                </li>
                <li className="flex items-center">
                  <span className="block w-2 h-2 bg-white mr-2"></span>
                  SPACIOUS DANCE FLOOR
                </li>
                <li className="flex items-center">
                  <span className="block w-2 h-2 bg-white mr-2"></span>
                  PROFESSIONAL SECURITY
                </li>
              </ul>
            </div>
            
            <div className="p-6 bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold mb-2 text-white" style={{ fontFamily: 'Impact, sans-serif' }}>OPENING HOURS</h3>
              <p className="text-white">SPECIAL EVENTS: CHECK SCHEDULE ON FLYER</p>
            </div>
          </div>
        </div>
      </div>    </section>
  );
}