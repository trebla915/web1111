"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-black text-white py-12 border-t-4 border-neutral-900 mt-auto">
      <div className="max-w-6xl mx-auto px-6">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="relative w-24 h-24">
              <Image
                src="/logo.png"
                alt="11:11 EPTX Logo"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100px, 150px"
              />
            </div>
            <p className="text-sm text-neutral-400 text-center md:text-left">
              © 2025 11:11 EPTX. <span>All rights reserved.</span>
            </p>
          </div>

          {/* Center Column: Newsletter Signup */}
          <div className="flex flex-col items-center text-center space-y-4">
            <p className="text-sm text-neutral-300 max-w-sm">
              Stay updated with exclusive events, offers, and news. Sign up for our newsletter today!
            </p>
            <form className="w-full max-w-sm">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Social Links & Navigation */}
          <div className="flex flex-col items-center md:items-end space-y-4">
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/1111eptx/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-blue-500 transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://www.facebook.com/1111eptx/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-blue-500 transition-colors"
              >
                Facebook
              </a>
            </div>

            {/* Footer Menu */}
            <nav className="text-sm flex flex-col md:items-end space-y-2">
              <Link href="/about" className="text-neutral-300 hover:text-blue-500 transition-colors">
                About Us
              </Link>
              <Link href="/privacy" className="text-neutral-300 hover:text-blue-500 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-neutral-300 hover:text-blue-500 transition-colors">
                Terms & Conditions
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}