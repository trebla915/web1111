"use client";

import Link from "next/link";
import Image from "next/image";
import { FiInstagram, FiFacebook, FiTwitter } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="w-full bg-black text-white py-12 border-t border-cyan-500/30 mt-auto relative pb-safe">
      {/* Background effects */}
      <div className="absolute inset-0 noise opacity-5"></div>
      <div className="absolute inset-0 spotlight opacity-10"></div>
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="relative w-24 h-24">
              <div className="text-3xl font-bold tracking-wider text-cyan-400 digital-glow-soft hover:digital-glow transition-all duration-300" style={{ fontFamily: 'Digital Dismay, sans-serif' }}>
                11:11
                <div className="text-sm font-normal tracking-widest text-white mt-2">
                  CLUB & LOUNGE
                </div>
              </div>
            </div>
            <p className="text-sm text-neutral-400 text-center md:text-left tracking-wide">
              © 2025 11:11 CLUB. <span>ALL RIGHTS RESERVED.</span>
            </p>
          </div>

          {/* Center Column: Newsletter Signup */}
          <div className="flex flex-col items-center text-center space-y-4">
            <h3 className="text-cyan-400 text-lg font-bold tracking-wider uppercase digital-glow-soft">JOIN OUR LIST</h3>
            <p className="text-sm text-neutral-300 max-w-sm tracking-wide">
              STAY UPDATED WITH EXCLUSIVE EVENTS AND VIP OFFERS
            </p>
            <form className="w-full max-w-sm">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  required
                  className="w-full p-3 rounded-none border border-cyan-500/50 bg-black/50 text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-400 text-sm tracking-wider focus:border-cyan-400 transition-all duration-300"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-none transition-all duration-300 tracking-wider hover:shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                >
                  SUBMIT
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Social Links & Navigation */}
          <div className="flex flex-col items-center md:items-end space-y-4">
            {/* Social Media Links */}
            <h3 className="text-cyan-400 text-lg font-bold tracking-wider uppercase digital-glow-soft">FOLLOW US</h3>
            <div className="flex space-x-6">
              <a
                href="https://www.instagram.com/1111eptx/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-cyan-400 transition-all duration-300 hover:shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                aria-label="Instagram"
              >
                <FiInstagram size={24} />
              </a>
              <a
                href="https://www.facebook.com/1111eptx/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-cyan-400 transition-all duration-300 hover:shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                aria-label="Facebook"
              >
                <FiFacebook size={24} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-cyan-400 transition-all duration-300 hover:shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                aria-label="Twitter"
              >
                <FiTwitter size={24} />
              </a>
            </div>

            {/* Footer Menu */}
            <nav className="text-sm flex flex-col md:items-end space-y-3 mt-4">
              <Link href="/about" className="text-neutral-300 hover:text-cyan-400 transition-all duration-300 tracking-wider group relative">
                ABOUT US
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/privacy" className="text-neutral-300 hover:text-cyan-400 transition-all duration-300 tracking-wider group relative">
                PRIVACY POLICY
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/terms" className="text-neutral-300 hover:text-cyan-400 transition-all duration-300 tracking-wider group relative">
                TERMS & CONDITIONS
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>
          </div>
        </div>
        
        {/* Spacer to ensure footer is visible */}
        <div className="h-6 md:h-0"></div>
      </div>
    </footer>
  );
}