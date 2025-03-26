"use client";

import React from 'react';
import Link from 'next/link';

interface FAQFestivalSectionProps {
  title?: string;
  className?: string;
  showYear?: boolean;
  id?: string;
}

export default function FAQFestivalSection({
  title = "CLUB RULES",
  className = "",
  showYear = false,
  id = "faq"
}: FAQFestivalSectionProps) {
  return (
    <section id={id} className={`py-12 ${className} bg-black relative overflow-hidden`}>
      {/* Background pattern using CSS only */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,_#06b6d4_0,_transparent_8px)] bg-[length:24px_24px]"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Festival-style header */}
        <div className="mb-8">
          <div className="w-full py-2 bg-cyan-400 relative mb-1">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(0,0,0,0.05)_25%,_rgba(0,0,0,0.05)_50%,_transparent_50%,_transparent_75%,_rgba(0,0,0,0.05)_75%)] bg-[length:10px_10px]"></div>
            <h1 className="text-3xl md:text-5xl font-bold text-black text-center tracking-wider relative z-10" style={{ fontFamily: 'Impact, sans-serif' }}>
              {title}
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Rules Header */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>
              ALL PERSONS, BAGS, AND PERSONAL ITEMS ARE SUBJECT TO SEARCH
            </h3>
          </div>
          
          {/* Prohibited Items Header */}
          <div className="text-center mb-8">
            <div className="text-3xl font-bold text-white mb-2 tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>
              THE FOLLOWING ITEMS ARE PROHIBITED:
            </div>
            <div className="text-xl font-bold text-white/80 mb-6">
              (CLEAR BAGS OF ANY SIZE ARE PERMITTED)
            </div>
          </div>
          
          {/* Prohibited Items List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {[
              "PURSES/BAGS LARGER THAN 8\"X6\"X2\"",
              "WEAPONS (ANY ITEMS THAT MAY BE USED TO CAUSE BODILY HARM)",
              "CONTROLLED SUBSTANCES",
              "EYE DROPS / NASAL SPRAY",
              "OUTSIDE FOOD, DRINK, OR LIQUOR (THIS INCLUDES WATER)",
              "VITAMINS / SUPPLEMENTS",
              "OVER THE COUNTER MEDICATIONS",
              "CAMERAS / GO PROS",
              "SELFIE STICKS",
              "COLOGNES / PERFUMES",
              "MARIJUANA PRODUCTS",
              "CHEWING TOBACCO",
              "WHISTLES"
            ].map((item, index) => (
              <div 
                key={index} 
                className="bg-gray-900/50 border border-cyan-900/50 p-4 text-center flex items-center justify-center transition-colors hover:bg-cyan-900/20"
              >
                <p className="text-white font-bold tracking-wide" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-center pb-8">
            <p className="text-white text-lg mb-4">
              FOR ANY QUESTIONS REGARDING PERMITTED ITEMS, PLEASE CONTACT US
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link 
                href="/venue-rules" 
                className="inline-block border-2 border-white text-white hover:bg-white hover:text-black px-8 py-3 transition-colors text-lg font-bold tracking-widest"
              >
                FULL RULES
              </Link>
              <Link 
                href="/contact" 
                className="inline-block border-2 border-white text-white hover:bg-white hover:text-black px-8 py-3 transition-colors text-lg font-bold tracking-widest"
              >
                CONTACT US
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 