"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useScrollParallax } from "@/lib/hooks/useScrollParallax"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  const { ref: parallaxRef } = useScrollParallax({ speed: 0.5, direction: "content" })

  return (
    <section className="relative w-full min-h-dvh flex items-center justify-center text-center overflow-hidden bg-canvas border-t border-fg safe-area-insets">
      {/* Main Content — parallax: moves slower on scroll (mobile-first) */}
      <div
        ref={parallaxRef}
        className="parallax-layer relative z-[60] flex flex-col items-center justify-center flex-grow pb-12 md:pb-16"
      >
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
              className="text-3xl sm:text-4xl md:text-7xl font-light -mt-8 md:-mt-12 tracking-[0.3em] text-fg font-display uppercase"
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
          className="my-5 h-[2px] w-32 bg-fg/30"
        />

        {/* The hero filled a whole viewport with a logo, a wordmark and a rule,
            and offered nothing to do. On the venue's front door, the two things
            a visitor came for — what's on, and a table — are the page's job. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 px-4 sm:flex-row"
        >
          <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
            <Link href="/events">See upcoming events</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => document.getElementById('venue')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            About the venue
          </Button>
        </motion.div>
      </div>
      
      {/* Scroll indicator — respect safe area on iPhone */}
      {/* Was a `<div onClick>`: it looked like a control, but a keyboard could
          not reach it and a screen reader announced nothing. */}
      <Button
        unstyled
        type="button"
        className="pb-safe pl-safe pr-safe absolute bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center rounded-full md:bottom-8"
        onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      >
        <span className="mb-2 rounded-full border border-fg/30 bg-canvas/30 px-4 py-2 text-xs backdrop-blur-sm transition-colors hover:bg-fg/10 sm:py-1 sm:text-sm">
          Scroll down
        </span>
        <span aria-hidden="true" className="relative mt-1 h-6 w-0.5 overflow-hidden bg-fg/50 md:h-8">
          <span className="animate-drift absolute top-0 h-1/2 w-full bg-fg" />
        </span>
      </Button>
    </section>
  )
}