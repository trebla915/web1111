import HeroSection from "@/components/sections/HeroSection"
import EventsFestivalSection from "@/components/sections/EventsFestivalSection"
import VenueSection from "@/components/sections/VenueSection"
import FAQFestivalSection from "@/components/sections/FAQFestivalSection"
import ContactSection from "@/components/sections/ContactSection"
import MapSection from "@/components/sections/MapSection"

// Structured data for SEO (nightclub rich results) — rendered server-side
// so crawlers see it in the initial HTML instead of after client hydration.
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
  "telephone": "+1 (915) 246-3945",
  "email": "INFO@1111EPTX.COM",
  "openingHoursSpecification": [],
  "priceRange": "$$",
  "paymentAccepted": "Cash, Credit Card",
  "servesCuisine": "Cocktails, Drinks"
};

export default function Home() {
  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <div className="flex flex-col gap-16">
        <EventsFestivalSection />
        <VenueSection />
        <FAQFestivalSection />
        <ContactSection />
        <MapSection />
      </div>
    </div>
  )
}