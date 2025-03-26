// MapSection.tsx
"use client"

import React from 'react';

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
        {/* Festival-style header */}
        <div className="mb-8">
          <div className="w-full py-2 bg-white relative mb-1">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(0,0,0,0.05)_25%,_rgba(0,0,0,0.05)_50%,_transparent_50%,_transparent_75%,_rgba(0,0,0,0.05)_75%)] bg-[length:10px_10px]"></div>
            <h1 className="text-3xl md:text-5xl font-bold text-black text-center tracking-wider relative z-10" style={{ fontFamily: 'Impact, sans-serif' }}>
              FIND US
            </h1>
          </div>
          <p className="text-center max-w-2xl mx-auto text-white/60 tracking-wide">
            LOCATED IN NORTHEAST EL PASO
          </p>
        </div>

        <div className="w-full max-w-5xl mx-auto border border-white/50 overflow-hidden">
          <div className="w-full h-96 bg-gray-900 flex items-center justify-center relative">
            {/* This would be replaced with an actual map integration */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#06b6d4_0,_transparent_8px)] bg-[length:30px_30px] opacity-5"></div>
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
    </section>
  );
}