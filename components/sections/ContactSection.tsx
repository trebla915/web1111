// ContactSection.tsx
"use client"

import React from 'react';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { useScrollParallax } from '@/lib/hooks/useScrollParallax';

export default function ContactSection() {
  const { style: bgParallaxStyle, ref: bgParallaxRef } = useScrollParallax({
    speed: 0.8,
    direction: 'background',
    whenInView: true,
  });

  return (
    <section
      id="contact"
      className="py-16 bg-black text-white relative overflow-hidden border-t border-white/20"
    >
      {/* Background effects — parallax depth */}
      <div className="absolute inset-0 noise opacity-5" />
      <div ref={bgParallaxRef} className="absolute inset-0 spotlight opacity-10" style={bgParallaxStyle} />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Festival-style header */}
        <div className="mb-8">
          <div className="w-full py-2 bg-white relative mb-1">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(0,0,0,0.05)_25%,_rgba(0,0,0,0.05)_50%,_transparent_50%,_transparent_75%,_rgba(0,0,0,0.05)_75%)] bg-[length:10px_10px]"></div>
            <h1 className="text-3xl md:text-5xl font-bold text-black text-center tracking-wider relative z-10" style={{ fontFamily: 'Digital-7, sans-serif' }}>
              CONTACT US
            </h1>
          </div>
          <p className="text-center max-w-2xl mx-auto text-white/60 tracking-wide">
            REACH OUT FOR RESERVATIONS OR INQUIRIES
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="space-y-6">
            <div className="border border-white/20 p-6 bg-black">
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
          
          <div className="border border-white/20 p-6 bg-black">
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