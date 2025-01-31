"use client";

import HomeSection from "@/components/sections/HomeSection/HomeSection";
import FAQSection from "@/components/sections/FAQSection";
import EventsSection from "@/components/sections/EventsSection/EventsSection"; // ✅ Correct path
import DownloadApp from "@/components/sections/DownloadApp";

export default function HomePage() {
  return (
    <main className="relative flex-1">
      <div className="relative z-10 space-y-32">
        {/* ✅ Fix: Ensure correct section order */}
        <HomeSection />
        <EventsSection />
        <FAQSection />
        <DownloadApp />

        {/* ✅ Fix: Prevent footer overlap */}
        <div className="h-20 lg:h-32" aria-hidden="true"></div>
      </div>
    </main>
  );
}