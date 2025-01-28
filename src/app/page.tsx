"use client";

import React from "react";
import HomeSection from "./home/HomeSection";
import EventsSection from "./events/EventSection";
import FAQSection from "./faq/FAQSection";

export default function HomePage() {
  return (
    <>
      {/* Video Background */}
      <video
        className="video-background"
        src="/background-video.mp4"
        autoPlay
        loop
        muted
      ></video>

      {/* Sections */}
      <div className="relative z-10">
        <HomeSection />
        <EventsSection />
        <FAQSection />
      </div>
    </>
  );
}