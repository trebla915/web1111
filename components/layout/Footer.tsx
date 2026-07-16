"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiInstagram, FiFacebook, FiTwitter } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to subscribe');
      }
      toast.success("You're on the list!");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || 'Failed to subscribe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="w-full bg-black text-white py-12 border-t border-white/30 relative safe-area-bottom">
      {/* Background effects */}
      <div className="absolute inset-0 noise opacity-5"></div>
      <div className="absolute inset-0 spotlight opacity-10"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="relative w-32 h-32">
              <Image
                src="/1111logo.png"
                alt="1111 Logo"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100px, 150px"
              />
            </div>
            <div className="text-sm font-light tracking-widest text-white font-display">
              Music is Timeless
            </div>
            <p className="text-sm text-neutral-400 text-center md:text-left tracking-wide">
              © {new Date().getFullYear()} 11:11. <span>ALL RIGHTS RESERVED.</span>
            </p>
          </div>

          {/* Center Column: Newsletter Signup */}
          <div className="flex flex-col items-center text-center space-y-4">
            <h3 className="text-white text-lg font-bold tracking-wider uppercase font-display digital-glow-soft">JOIN OUR LIST</h3>
            <p className="text-sm text-neutral-300 max-w-sm tracking-wide">
              STAY UPDATED WITH EXCLUSIVE EVENTS AND VIP OFFERS
            </p>
            <form className="w-full max-w-sm" onSubmit={handleSubscribe}>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="w-full p-3 rounded-none border border-white/50 bg-black/50 text-white placeholder-gray-500 focus:ring-1 focus:ring-white text-sm tracking-wider focus:border-white transition-all duration-300 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-white hover:bg-white/90 text-black font-bold rounded-none transition-all duration-300 tracking-wider hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] disabled:opacity-50"
                >
                  {submitting ? '...' : 'SUBMIT'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Social Links & Navigation */}
          <div className="flex flex-col items-center md:items-end space-y-4">
            {/* Social Media Links */}
            <h3 className="text-white text-lg font-bold tracking-wider uppercase font-display digital-glow-soft">FOLLOW US</h3>
            <div className="flex space-x-6">
              <a
                href="https://www.instagram.com/1111eptx/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                aria-label="Instagram"
              >
                <FiInstagram size={24} />
              </a>
              <a
                href="https://www.facebook.com/1111eptx/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                aria-label="Facebook"
              >
                <FiFacebook size={24} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                aria-label="Twitter"
              >
                <FiTwitter size={24} />
              </a>
            </div>

            {/* Footer Menu */}
            <nav className="text-sm flex flex-col md:items-end space-y-3 mt-4">
              <Link href="/privacy" className="text-neutral-300 hover:text-white transition-all duration-300 tracking-wider group relative">
                PRIVACY POLICY
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
