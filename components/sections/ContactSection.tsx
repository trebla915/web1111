// ContactSection.tsx
"use client"

import React from 'react';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { useScrollParallax } from '@/lib/hooks/useScrollParallax';
import SectionHeader from '@/components/ui/SectionHeader';

export default function ContactSection() {
  const { style: bgParallaxStyle, ref: bgParallaxRef } = useScrollParallax({
    speed: 0.8,
    direction: 'background',
    whenInView: true,
  });

  return (
    <section
      id="contact"
      className="py-16 md:py-24 bg-black text-white relative overflow-hidden border-t border-white/10"
    >
      <div className="absolute inset-0 noise opacity-5" />
      <div ref={bgParallaxRef} className="absolute inset-0 spotlight opacity-10" style={bgParallaxStyle} />

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          label="contact"
          lines={["GET", "IN TOUCH"]}
          subtitle="Reservations and inquiries."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-10">
          <div className="space-y-6">
            <div className="p-6 bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold mb-6 text-white" style={{ fontFamily: 'Impact, sans-serif' }}>VENUE INFORMATION</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <FiMapPin className="text-white mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-white/60">LOCATION</h4>
                    <p className="text-white">9740 DYER STREET</p>
                    <p className="text-white">EL PASO, TX 79924</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FiPhone className="text-white mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-white/60">PHONE</h4>
                    <p className="text-white">+1 (915) 246-3945</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FiMail className="text-white mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-white/60">EMAIL</h4>
                    <p className="text-white">INFO@1111EPTX.COM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white/5 border border-white/10">
            <h3 className="text-2xl font-bold mb-6 text-white" style={{ fontFamily: 'Impact, sans-serif' }}>SEND MESSAGE</h3>
            
            <form className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="YOUR NAME"
                  className="w-full px-4 py-3 bg-transparent border border-white focus:border-white text-white placeholder-white outline-none"
                />
              </div>
              
              <div>
                <input
                  type="email"
                  placeholder="YOUR EMAIL"
                  className="w-full px-4 py-3 bg-transparent border border-white focus:border-white text-white placeholder-white outline-none"
                />
              </div>
              
              <div>
                <textarea
                  placeholder="YOUR MESSAGE"
                  rows={5}
                  className="w-full px-4 py-3 bg-transparent border border-white focus:border-white text-white placeholder-white outline-none resize-none"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-white text-black font-bold py-3 transition-colors"
              >
                SEND MESSAGE
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}