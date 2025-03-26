"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCookieConsent, setCookieConsent } from '@/lib/utils/cookieConsent';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = getCookieConsent();
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAcceptAll = () => {
    setCookieConsent('all');
    setShowConsent(false);
  };

  const handleAcceptEssential = () => {
    setCookieConsent('essential');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 text-white p-4 z-50 border-t border-white/10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm">
          <p>
            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
            By clicking "Accept All", you consent to our use of cookies. 
            <Link href="/privacy" className="underline ml-1 hover:text-gray-300">
              Learn more
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAcceptEssential}
            className="px-4 py-2 text-sm border border-white/30 hover:bg-white/10 transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 text-sm bg-white text-black hover:bg-white/90 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
} 