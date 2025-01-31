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
      {/* Video Background - Height Reduced by Half */}
      <div className="absolute inset-0 -z-20 w-full h-full">
        <video
          className="absolute top-0 left-0 w-full h-[43vh] object-cover"
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
        className="relative z-10 max-w-4xl"
      >
       
      </motion.div>
    </section>
  );
}