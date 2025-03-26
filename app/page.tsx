"use client"
import HeroSection from "@/components/sections/HeroSection"
import EventsFestivalSection from "@/components/sections/EventsFestivalSection"
import VenueSection from "@/components/sections/VenueSection"
import FAQFestivalSection from "@/components/sections/FAQFestivalSection"
import ContactSection from "@/components/sections/ContactSection"
import MapSection from "@/components/sections/MapSection"
import { useEffect } from "react"

export default function Home() {
  // Add JSON-LD structured data for better SEO
  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "NightClub",
      "name": "11:11 EPTX",
      "url": "https://www.1111eptx.com",
      "logo": "https://www.1111eptx.com/logo.png",
      "image": "https://www.1111eptx.com/og-image.jpg",
      "description": "Premium nightclub experience in El Paso, Texas featuring world-class DJs, VIP bottle service, and unforgettable events.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "9740 DYER STREET",
        "addressLocality": "El Paso",
        "addressRegion": "TX",
        "postalCode": "79924",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "31.8982",
        "longitude": "-106.4245"
      },
      "telephone": "(212) 555-1111",
      "email": "INFO@1111EPTX.COM",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Thursday", "Friday", "Saturday"],
          "opens": "22:00",
          "closes": "04:00"
        }
      ],
      "priceRange": "$$",
      "paymentAccepted": "Cash, Credit Card",
      "servesCuisine": "Cocktails, Drinks"
    };

    // Add the JSON-LD script to the document head
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <main className="flex flex-col">
      {/* Hero section with full-screen experience */}
      <HeroSection />
      
      {/* Festival-style events section */}
      <EventsFestivalSection maxEvents={8} className="py-16" />
      
      {/* Venue section with images and details */}
      <VenueSection />
      
      {/* FAQ section with club rules */}
      <FAQFestivalSection />
      
      {/* Contact section for reservations */}
      <ContactSection />
      
      {/* Map section to find the venue */}
      <MapSection />
    </main>
  )
}