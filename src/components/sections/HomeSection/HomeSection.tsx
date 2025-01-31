"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function HomeSection() {
  return (
    <section
      className="relative w-full h-[43vh] px-9 md:px-[35px] pb-[50px] flex items-center justify-center text-center overflow-hidden"
      id="home"
      aria-labelledby="home-heading"
    >
      {/* Video Background - Height Adjusted */}
      <div className="absolute inset-0 -z-20 w-full h-full">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/background-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Overlay to Darken the Video */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-4xl text-white space-y-6"
      >
        {/* Title */}
        <h1 id="home-heading" className="text-4xl md:text-5xl font-bold">
          Welcome to Club 1111
        </h1>
        <p className="text-lg md:text-xl">
          Experience the best nightlife, events, and exclusive experiences.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/events"
            className="px-6 py-3 bg-white text-black font-bold rounded-md hover:bg-gray-200 transition"
          >
            Explore Events
          </Link>
          <Link
            href="/reserve"
            className="px-6 py-3 border border-white text-white font-bold rounded-md hover:bg-white hover:text-black transition"
          >
            Reserve a Table
          </Link>
        </div>
      </motion.div>
    </section>
  );
}