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
          className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-4 z-[1000] bg-black/95 backdrop-blur-sm border-t sm:border border-white/20 sm:rounded-lg p-4 w-full sm:w-auto sm:max-w-sm shadow-lg"
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-white">Download the 11:11 App</h3>
            <button
              onClick={handleClose}
              className="text-white/60 hover:text-white transition-colors p-1"
              aria-label="Close popup"
            >
              <FiX size={20} />
            </button>
          </div>
          
          <p className="text-sm sm:text-base text-white/80 mb-4">
            Get exclusive access to events, make reservations, and stay updated with the latest happenings at 11:11.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
                priority
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
                priority
              />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 