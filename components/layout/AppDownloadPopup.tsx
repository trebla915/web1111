"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import Image from 'next/image';

export default function AppDownloadPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem('hasSeenAppPopup');
    if (!hasSeenPopup) {
      setIsVisible(true);
      localStorage.setItem('hasSeenAppPopup', 'true');
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-[1000] bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-sm shadow-lg"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white">Download the 11:11 App</h3>
            <button
              onClick={handleClose}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Close popup"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <p className="text-white/80 mb-4">
            Get exclusive access to events, make reservations, and stay updated with the latest happenings at 11:11.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://apps.apple.com/us/app/11-11-eptx/id6739264535"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Image
                src="/app-store-badge.svg"
                alt="Download on the App Store"
                width={120}
                height={40}
                className="w-full h-auto"
              />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.your.club1111"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Image
                src="/google-play-badge.svg"
                alt="Get it on Google Play"
                width={120}
                height={40}
                className="w-full h-auto"
              />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 