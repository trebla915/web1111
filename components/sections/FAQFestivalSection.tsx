"use client";

import React from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';

interface FAQFestivalSectionProps {
  className?: string;
  id?: string;
}

export default function FAQFestivalSection({
  className = "",
  id = "faq"
}: FAQFestivalSectionProps) {
  return (
    <section id={id} className={`py-16 md:py-24 ${className} bg-black relative overflow-hidden border-t border-white/10`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,_#06b6d4_0,_transparent_8px)] bg-[length:24px_24px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          label="venue rules"
          lines={["THE", "FACTS"]}
        />

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
                className="bg-gray-900/50 border border-white/20 p-4 text-center flex items-center justify-center transition-colors hover:bg-white/10"
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
                href="#rules" 
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