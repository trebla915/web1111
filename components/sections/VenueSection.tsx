// VenueSection.tsx
"use client"

import React from 'react';
import Image from 'next/image';

export default function VenueSection() {
  return (
    <section 
      id="venue"
      className="py-16 bg-black text-white relative overflow-hidden border-t border-white/20"
    >
      {/* Background effects */}
      <div className="absolute inset-0 noise opacity-5"></div>
      <div className="absolute inset-0 spotlight opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Festival-style header */}
        <div className="mb-8">
          <div className="w-full py-2 bg-white relative mb-1">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(0,0,0,0.05)_25%,_rgba(0,0,0,0.05)_50%,_transparent_50%,_transparent_75%,_rgba(0,0,0,0.05)_75%)] bg-[length:10px_10px]"></div>
            <h1 className="text-3xl md:text-5xl font-bold text-black text-center tracking-wider relative z-10" style={{ fontFamily: 'Digital-7, sans-serif' }}>
              OUR VENUE
            </h1>
          </div>
          <p className="text-center max-w-2xl mx-auto text-white tracking-wide">
            EXPERIENCE THE UNIQUE ATMOSPHERE OF 11:11
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="relative h-80 md:h-auto overflow-hidden rounded-lg border border-white/20">
            <Image 
              src="/images/venue.jpg" 
              alt="11:11 Venue" 
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-4">
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Impact, sans-serif' }}>MAIN FLOOR</h3>
              <p className="text-white">STATE OF THE ART SOUND SYSTEM</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="border border-white/20 p-6 bg-black">
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
            
            <div className="border border-white/20 p-6 bg-black">
              <h3 className="text-2xl font-bold mb-2 text-white" style={{ fontFamily: 'Impact, sans-serif' }}>OPENING HOURS</h3>
              <p className="text-white mb-4">THURSDAY - SATURDAY: 8PM -2AM </p>
              <p className="text-white">SPECIAL EVENTS: CHECK SCHEDULE</p>
            </div>
          </div>
        </div>
      </div>    </section>
  );
}