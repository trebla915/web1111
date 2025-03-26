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
      
      {/* Starfield/Tunnel Effect */}
      <div className="absolute inset-0 overflow-hidden z-[60]">
        {/* Moving stars background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_70%)]"></div>
        
        {/* Animated stars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0,
                scale: 0,
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`
              }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [
                  `${Math.random() * 100}%`,
                  `${Math.random() * 100}%`,
                  `${Math.random() * 100}%`
                ],
                y: [
                  `${Math.random() * 100}%`,
                  `${Math.random() * 100}%`,
                  `${Math.random() * 100}%`
                ]
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 2
              }}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)"
              }}
            />
          ))}
        </motion.div>

        {/* Tunnel effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(6,182,212,0.1)_20%,_transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(255,255,255,0.05)_30%,_transparent_80%)]"></div>
        </motion.div>

        {/* Moving light beams */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0,
                rotate: Math.random() * 360,
                scale: 0
              }}
              animate={{ 
                opacity: [0, 0.3, 0],
                rotate: [0, 360],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "linear",
                delay: i * 2
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              style={{
                transformOrigin: "center"
              }}
            />
          ))}
        </motion.div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-[60] flex flex-col items-center justify-center flex-grow pb-12 md:pb-16">
        {/* Logo container */}
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-2xl mx-auto px-4">
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
              className="text-3xl sm:text-4xl md:text-7xl font-light -mt-8 md:-mt-12 tracking-[0.3em] text-white font-['Digital-7'] uppercase"
            >
              TIME:LESS
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative line */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
          className="w-32 h-[2px] bg-white/30 my-4 md:my-4"
        />

        {/* Navigation Grid - Removed per request */}
        
      </div>
      
      {/* Scroll indicator */}
      <div 
        className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-[60] cursor-pointer"
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