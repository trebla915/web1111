"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCookieConsent, setCookieConsent } from '@/lib/utils/cookieConsent';
import { Button } from "@/components/ui/button";

/**
 * Cookie notice.
 *
 * Previously a 512px-wide card floating in the middle of the lower viewport:
 * on a phone it landed squarely on top of the content — the events list, the
 * table floor plan — and on desktop its `items-center` row left a block of
 * empty card beneath the buttons. It also carried `animate-fade-in`, a class
 * that does not exist in this project (the keyframe is `animate-fadeIn`), so
 * the entrance it named never ran.
 *
 * It now docks to the bottom edge as a full-width bar, respects the home
 * indicator, and stacks its buttons above the text on a phone so the two
 * choices are the first thing a thumb reaches.
 */
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
    <div
      role="region"
      aria-label="Cookie notice"
      className="animate-fadeIn fixed inset-x-0 bottom-0 z-[9999] border-t border-line bg-canvas/95 backdrop-blur-md pb-safe"
    >
      <div className="mx-auto flex max-w-screen-xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6">
        <p className="max-w-prose text-sm text-fg-dim">
          We use cookies to improve your experience and analyse traffic. Choosing “Accept all”
          includes analytics cookies.{' '}
          <Link href="/privacy" className="text-fg underline hover:text-accent-bright">
            Privacy policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <Button onClick={handleAcceptEssential} variant="outline" size="md" className="flex-1 sm:flex-none">
            Essential only
          </Button>
          <Button onClick={handleAcceptAll} variant="primary" size="md" className="flex-1 sm:flex-none">
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
