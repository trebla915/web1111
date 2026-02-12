"use client"
import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useScrollParallax } from "@/lib/hooks/useScrollParallax"

export default function HeroSection() {
  const { style: parallaxStyle } = useScrollParallax({ speed: 0.5, direction: "content" })
  const [glitchActive, setGlitchActive] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Random glitch effect
    const glitchInterval = setInterval(() => {
      // Randomly activate glitch effect
      if (Math.random() > 0.85) {
        setGlitchActive(true)
        
        // Deactivate after a short duration
        setTimeout(() => {
          setGlitchActive(false)
        }, 200)
      }
    }, 2000)
    
    // Handle video playback with more robust error handling
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7; // Slow down the video slightly
      
      // Add event listeners
      videoRef.current.addEventListener('loadeddata', () => {
        setVideoLoaded(true);
        console.log("Video loaded successfully");
      });
      
      // Try to play the video with proper error handling
      const playVideo = async () => {
        try {
          // Set muted attribute programmatically to further ensure autoplay works
          videoRef.current!.muted = true;
          await videoRef.current!.play();
          console.log("Video playing successfully");
        } catch (error) {
          console.error("Video play failed:", error);
          setVideoError(true);
        }
      };
      
      playVideo();
      
      // Setup a backup attempt to play video on user interaction
      const attemptPlayOnInteraction = () => {
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(e => console.log("Still couldn't play video", e));
        }
      };
      
      window.addEventListener('click', attemptPlayOnInteraction);
      window.addEventListener('touchstart', attemptPlayOnInteraction);
      
      return () => {
        clearInterval(glitchInterval);
        window.removeEventListener('click', attemptPlayOnInteraction);
        window.removeEventListener('touchstart', attemptPlayOnInteraction);
      };
    }
    
    return () => {
      clearInterval(glitchInterval)
    }
  }, [])

  return (
    <section className="relative w-full min-h-dvh flex items-center justify-center text-center overflow-hidden bg-black border-t border-white safe-area-insets">
      {/* Main Content — parallax: moves slower on scroll (mobile-first) */}
      <div
        className="relative z-[60] flex flex-col items-center justify-center flex-grow pb-12 md:pb-16"
        style={parallaxStyle}
      >
        {/* Logo + tagline — minimal, editorial */}
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative"
          >
            <Image
              src="/1111logo.png"
              alt="11:11"
              width={800}
              height={400}
              className="w-full h-auto"
              priority
              unoptimized
            />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-white/60 text-sm md:text-base tracking-[0.2em] uppercase mt-6"
          >
            El Paso, Texas
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8"
          >
            <a
              href="#events"
              className="inline-block border border-white px-8 py-3 text-white text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors"
            >
              View events
            </a>
          </motion.div>
        </div>
      </div>
      
      {/* Scroll indicator — respect safe area on iPhone */}
      <div
        className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-[60] cursor-pointer pb-safe pl-safe pr-safe"
        onClick={() => {
          const eventsSection = document.getElementById('events');
          if (eventsSection) {
            eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      >
        <span className="text-white text-xs sm:text-sm mb-2 px-4 py-2 sm:py-1 border border-white/30 rounded-full bg-black/30 backdrop-blur-sm hover:bg-white/10 transition-colors">SCROLL DOWN</span>
        <div className="w-0.5 h-6 md:h-8 bg-white/50 relative overflow-hidden mt-1">
          <div className="absolute top-0 w-full h-1/2 bg-white animate-bounce"></div>
        </div>
      </div>
    </section>
  )
}