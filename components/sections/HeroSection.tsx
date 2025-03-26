"use client"
import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

export default function HeroSection() {
  // Only keep the glitch/vibrate effect, remove the flashing/pulsing effect
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
    <section className="relative w-full h-screen flex items-center justify-center text-center overflow-hidden bg-transparent">
      {/* Background Video or Fallback */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {!videoError ? (
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            loop 
            playsInline
            preload="auto"
            className="absolute w-full h-full object-cover"
            style={{ zIndex: 1 }}
          >
            <source src="/videos/background-video.mp4" type="video/mp4" />
          </video>
        ) : (
          // Static fallback background when video fails to play
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" style={{ zIndex: 1 }}></div>
        )}
        
        {/* Video Overlays - Multiple layers for a rich blending effect */}
        {/* Dark gradient overlay - reduced opacity */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60 z-10"></div>
        
        {/* Center vignette effect - reduced opacity */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_black_90%)] z-20"></div>
        
        {/* Subtle blue accent for brand consistency */}
        <div className="absolute inset-0 bg-cyan-900/5 mix-blend-overlay z-30"></div>
      </div>
      
      {/* Noise overlay - reduced opacity */}
      <div className="absolute inset-0 opacity-20 mix-blend-overlay z-40">
        <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,_#06b6d4_0,_transparent_8px)] bg-[length:24px_24px]"></div>
      </div>
      
      {/* Spotlight effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl opacity-10 bg-gradient-radial from-cyan-500 via-transparent to-transparent"></div>
      
      {/* Diagonal lines - reduced opacity */}
      <div className="absolute inset-0 opacity-3 bg-[linear-gradient(45deg,_transparent_25%,_#06b6d4_25%,_#06b6d4_50%,_transparent_50%,_transparent_75%,_#06b6d4_75%)] bg-[length:40px_40px]"></div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-grow pb-24 md:pb-16">
        {/* Logo container */}
        <div className="relative w-full max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <Image
              src="/1111logo.png"
              alt="1111 Logo"
              width={800}
              height={400}
              className="w-full h-auto"
              priority
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="text-2xl md:text-4xl font-light mt-4 md:mt-2 tracking-widest text-white font-['Impact']"
            >
              Music is Timeless
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative line */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
          className="w-32 h-[2px] bg-white/30 my-6 md:my-4"
        />

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
          className="flex flex-col md:flex-row gap-4 md:gap-6"
        >
          <Link 
            href="#events" 
            className="px-8 py-4 bg-cyan-400 hover:bg-cyan-500 text-black font-bold text-lg transition-all transform hover:scale-105"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            VIEW EVENTS
          </Link>
          <Link 
            href="/reserve" 
            className="px-8 py-4 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-bold text-lg transition-all transform hover:scale-105"
          >
            RESERVE TABLE
          </Link>
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-50">
        <span className="text-cyan-400 text-sm mb-2">SCROLL DOWN</span>
        <div className="w-0.5 h-6 md:h-8 bg-cyan-400/50 relative overflow-hidden">
          <div className="absolute top-0 w-full h-1/2 bg-cyan-400 animate-bounce"></div>
        </div>
      </div>
    </section>
  )
}