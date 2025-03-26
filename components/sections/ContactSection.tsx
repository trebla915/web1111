// ContactSection.tsx
"use client"

import React from 'react';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function ContactSection() {
  return (
    <section 
      id="contact"
      className="py-16 bg-black text-white relative overflow-hidden border-t border-cyan-900/30"
    >
      {/* Background effects */}
      <div className="absolute inset-0 noise opacity-5"></div>
      <div className="absolute inset-0 spotlight opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Festival-style header */}
        <div className="mb-8">
          <div className="w-full py-2 bg-cyan-400 relative mb-1">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(0,0,0,0.05)_25%,_rgba(0,0,0,0.05)_50%,_transparent_50%,_transparent_75%,_rgba(0,0,0,0.05)_75%)] bg-[length:10px_10px]"></div>
            <h1 className="text-3xl md:text-5xl font-bold text-black text-center tracking-wider relative z-10" style={{ fontFamily: 'Impact, sans-serif' }}>
              CONTACT US
            </h1>
          </div>
          <p className="text-center max-w-2xl mx-auto text-cyan-300 tracking-wide">
            REACH OUT FOR RESERVATIONS OR INQUIRIES
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="space-y-6">
            <div className="border border-cyan-900/50 p-6 bg-black">
              <h3 className="text-2xl font-bold mb-6 text-cyan-400" style={{ fontFamily: 'Impact, sans-serif' }}>CLUB INFORMATION</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <FiMapPin className="text-cyan-400 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-cyan-300">LOCATION</h4>
                    <p className="text-white">9740 DYER STREET</p>
                    <p className="text-white">EL PASO, TX 79924</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FiPhone className="text-cyan-400 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-cyan-300">PHONE</h4>
                    <p className="text-white">(915)999-9999</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FiMail className="text-cyan-400 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-cyan-300">EMAIL</h4>
                    <p className="text-white">INFO@1111EPTX.COM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border border-cyan-900/50 p-6 bg-black">
            <h3 className="text-2xl font-bold mb-6 text-cyan-400" style={{ fontFamily: 'Impact, sans-serif' }}>SEND MESSAGE</h3>
            
            <form className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="YOUR NAME"
                  className="w-full px-4 py-3 bg-transparent border border-cyan-900 focus:border-cyan-400 text-white placeholder-cyan-700 outline-none"
                />
              </div>
              
              <div>
                <input
                  type="email"
                  placeholder="YOUR EMAIL"
                  className="w-full px-4 py-3 bg-transparent border border-cyan-900 focus:border-cyan-400 text-white placeholder-cyan-700 outline-none"
                />
              </div>
              
              <div>
                <textarea
                  placeholder="YOUR MESSAGE"
                  rows={5}
                  className="w-full px-4 py-3 bg-transparent border border-cyan-900 focus:border-cyan-400 text-white placeholder-cyan-700 outline-none resize-none"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-cyan-400 hover:bg-cyan-500 text-black font-bold py-3 transition-colors"
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