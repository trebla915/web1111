"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiMapPin, FiArrowLeft, FiTag, FiUsers, FiShare2 } from 'react-icons/fi';
import { FaWhatsapp, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import AgeVerificationModal from '../ui/AgeVerificationModal';
import { Button } from '@/components/ui/button';

// Proper timezone handling for Mountain Time
function adjustToMountainTime(dateStr: string): Date {
  const utcDate = new Date(dateStr);
  return new Date(utcDate.toLocaleString('en-US', {
    timeZone: 'America/Denver'
  }));
}

// Date formatting utilities
function formatToMMDDYYYY(dateStr: string): string {
  if (!dateStr) return 'Date TBA';
  
  try {
    // Parse the ISO string directly
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Create date object using the parsed components
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBA';
  
  try {
    // Parse the ISO string directly
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Create date object using the parsed components
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return 'TBA';
  
  try {
    // Parse the ISO string directly
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Create date object using the parsed components
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleString('en-US', {
      weekday: 'long'
    });
  } catch (error) {
    console.error('Error getting day of week:', error);
    return 'Invalid date';
  }
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  flyerUrl?: string;
  ticketLink?: string;
  created?: string;
  reservationsEnabled?: boolean;
}

interface EventDetailsProps {
  event: Event;
}

export default function EventDetails({ event }: EventDetailsProps) {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const [showFullImage, setShowFullImage] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);

  // Add JSON-LD structured data for SEO
  useEffect(() => {
    if (event) {
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": event.title,
        "description": event.description || `Event at 11:11 EPTX: ${event.title}`,
        "image": event.flyerUrl || "https://www.1111eptx.com/og-image.jpg",
        "startDate": event.date,
        "endDate": event.date,
        "location": {
          "@type": "Place",
          "name": "11:11 EPTX",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "9740 DYER STREET",
            "addressLocality": "El Paso",
            "addressRegion": "TX",
            "postalCode": "79924",
            "addressCountry": "US"
          }
        },
        "organizer": {
          "@type": "Organization",
          "name": "11:11 EPTX",
          "url": "https://www.1111eptx.com"
        },
        "offers": {
          "@type": "Offer",
          "url": event.ticketLink || "https://www.1111eptx.com/events/" + event.id,
          "availability": "https://schema.org/InStock",
          "priceCurrency": "USD",
          "validFrom": event.created || new Date().toISOString()
        },
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
      };

      // Add the JSON-LD script to the document head
      const script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);

      // Cleanup on unmount
      return () => {
        if (script.parentNode) {
          document.head.removeChild(script);
        }
      };
    }
  }, [event]);

  // Handle table reservation button press
  const handleTablePress = () => {
    if (!event || !event.id) {
      toast.error('Event details are missing. Please try again.');
      return;
    }

    if (!event.reservationsEnabled) {
      toast.error('Table reservations are not available for this event.');
      return;
    }

    setShowAgeVerification(true);
  };

  const handleAgeVerified = () => {
    setShowAgeVerification(false);
    router.push(`/reserve/${event.id}`);
  };

  const handleAgeDenied = () => {
    setShowAgeVerification(false);
    router.push('/');
  };

  // Handle ticket purchase link press
  const handleTicketPress = (ticketLink?: string) => {
    if (ticketLink) {
      window.open(ticketLink, '_blank');
    } else {
      toast.error('This event does not have a ticket link.');
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-fg">
      <div className="container mx-auto py-6 md:py-8 px-4 pb-24 md:pb-8">
        <Link href="/events" className="inline-flex items-center text-fg hover:text-fg/80 mb-6 md:mb-8 py-2 touch-target">
          <FiArrowLeft className="mr-2" /> BACK TO EVENTS
        </Link>
        
        <div className="border border-fg/20 overflow-hidden rounded-sm">
          {/* Event Header */}
          <div className="flex flex-col md:flex-row">
            {/* Event image */}
            <div className="w-full md:w-2/5 relative">
              <div className="aspect-square w-full cursor-pointer pt-2 p-1 md:p-2 relative" onClick={() => setShowFullImage(true)}>
                <Image
                  src={event.flyerUrl || '/placeholder-event.png'}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                  unoptimized={event.flyerUrl?.includes('firebasestorage.googleapis.com') || event.flyerUrl?.includes('storage.googleapis.com')}
                />
                <div className="absolute inset-0 bg-canvas/30 md:bg-transparent md:hover:bg-canvas/30 flex items-center justify-center opacity-0 md:hover:opacity-100 transition-opacity touch-target">
                  <FiShare2 className="text-fg text-2xl" />
                </div>
              </div>
            </div>

            {/* Event title and info */}
            <div className="w-full md:w-3/5 p-5 md:p-8 flex flex-col justify-center border-t md:border-t-0 md:border-l border-fg/20">
              <div className="relative z-10">
                {/* Date and Title */}
                <div className="mb-4">
                  <div className="text-sm sm:text-base text-fg/60 mb-0">
                    {formatDate(event.date || '')}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-fg digital-glow-soft">
                    {event.title}
                  </h1>
                </div>

                {/* Location - only show if exists */}
                {event.location && (
                  <div className="flex items-center gap-2 text-fg/60 text-sm sm:text-base mb-4">
                    <FiMapPin className="w-4 h-4 md:w-5 md:h-5" />
                    <span>{event.location}</span>
                  </div>
                )}

                {/* Description */}
                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-fg/80 text-sm sm:text-base leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
              
              {/* Action buttons — hidden below md; the sticky bottom bar covers mobile so
                  there's only ever one set of these actions on screen at a time. */}
              <div className="hidden md:flex md:flex-row gap-4 w-full">
                <Button onClick={handleTablePress} size="lg" className="font-bold">
                  <FiUsers className="mr-2" />
                  RESERVE A TABLE
                </Button>

                <Button
                  onClick={() => handleTicketPress(event.ticketLink)}
                  variant="outline"
                  size="lg"
                  disabled={!event.ticketLink}
                  className="font-bold"
                >
                  <FiTag className="mr-2" />
                  {event.ticketLink ? 'BUY TICKETS' : 'NO TICKETS AVAILABLE'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Event Details */}
          <div className="p-5 md:p-8 border-t border-fg/20">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="w-full md:w-2/3">
                <h2 className="font-heading text-xl sm:text-2xl mb-4 md:mb-6 tracking-wider">EVENT DETAILS</h2>
                {event.description ? (
                  <p className="text-fg mb-6 md:mb-8 whitespace-pre-line leading-relaxed text-sm sm:text-base">
                    {event.description}
                  </p>
                ) : (
                  <p className="text-fg/60 italic mb-6 md:mb-8 text-sm sm:text-base">No description available for this event.</p>
                )}
              </div>
              
              <div className="w-full md:w-1/3 bg-fg/5 p-4 md:p-6 border border-fg/20">
                <h3 className="font-heading text-lg sm:text-xl mb-4 md:mb-6">EVENT INFORMATION</h3>
                
                <div className="mb-4 md:mb-6">
                  <h4 className="font-semibold mb-1 md:mb-2 text-fg uppercase text-sm sm:text-base">When</h4>
                  <p className="text-fg text-base sm:text-lg">
                    {event.date ? formatToMMDDYYYY(event.date) : 'Date TBA'}
                  </p>
                  
                  {event.date && (
                    <p className="text-fg/60 text-xs sm:text-sm mt-1">
                      {getDayOfWeek(event.date).toUpperCase()}
                    </p>
                  )}
                </div>
                
                {event.location && (
                  <div className="mb-4 md:mb-6">
                    <h4 className="font-semibold mb-1 md:mb-2 text-fg uppercase text-sm sm:text-base">Where</h4>
                    <p className="text-fg text-base sm:text-lg">{event.location}</p>
                  </div>
                )}
                
                <div className="pt-3 md:pt-4 border-t border-fg/20">
                  <p className="text-fg/60 text-xs sm:text-sm uppercase tracking-wide mb-3">
                    Share this event with your friends!
                  </p>
                  <div className="flex gap-3 mt-2">
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.1111eptx.com/events/${event.id}`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center bg-social-facebook hover:bg-social-facebook-hover rounded-full transition-colors"
                      aria-label="Share on Facebook"
                    >
                      <FaFacebook className="text-fg text-xl" />
                    </a>
                    <a 
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${event.title} at 11:11 EPTX!`)}&url=${encodeURIComponent(`https://www.1111eptx.com/events/${event.id}`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center bg-social-twitter hover:bg-social-twitter-hover rounded-full transition-colors"
                      aria-label="Share on Twitter"
                    >
                      <FaTwitter className="text-fg text-xl" />
                    </a>
                    <a 
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out ${event.title} at 11:11 EPTX! https://www.1111eptx.com/events/${event.id}`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center bg-social-whatsapp hover:bg-social-whatsapp-hover rounded-full transition-colors sm:hidden"
                      aria-label="Share on WhatsApp"
                    >
                      <FaWhatsapp className="text-fg text-xl" />
                    </a>
                    <Button 
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: event.title,
                            text: `Check out ${event.title} at 11:11 EPTX!`,
                            url: `https://www.1111eptx.com/events/${event.id}`
                          }).catch(err => console.log('Error sharing', err));
                        } else {
                          // Fallback - copy to clipboard
                          navigator.clipboard.writeText(`${event.title} at 11:11 EPTX: https://www.1111eptx.com/events/${event.id}`);
                          toast.success('Link copied to clipboard!');
                        }
                      }}
                      variant="ghost" size="md" className="w-10 h-10 flex items-center justify-center bg-fg/20 hover:bg-fg/30 rounded-full"
                      aria-label="Share"
                    >
                      <FiShare2 className="text-fg text-xl" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile-only sticky action bar — two equal-priority CTAs, properly sized touch
          targets. (Title/date and share are already visible in the page above; keeping
          this bar to just the two actions avoids cramming it full on a narrow screen.) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-canvas/95 backdrop-blur-md border-t border-fg/20 px-4 py-3 z-50 safe-area-bottom">
        <div className="flex items-center gap-3">
          <Button onClick={handleTablePress} size="lg" className="flex-1 font-bold">
            <FiUsers className="mr-2" />
            Reserve
          </Button>
          <Button
            onClick={() => handleTicketPress(event.ticketLink)}
            variant="outline"
            size="lg"
            disabled={!event.ticketLink}
            className="flex-1 font-bold"
          >
            <FiTag className="mr-2" />
            Tickets
          </Button>
        </div>
      </div>

      {/* Full screen image modal for mobile */}
      {showFullImage && (
        <div className="fixed inset-0 bg-canvas/95 z-[999] flex items-center justify-center" onClick={() => setShowFullImage(false)}>
          <Button 
            variant="ghost" size="md" className="absolute top-4 right-4 p-3 bg-canvas/50 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullImage(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
          <div className="w-full h-full p-8 relative flex items-center justify-center">
            <Image
              src={event.flyerUrl || '/placeholder-event.png'}
              alt={event.title}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              unoptimized={event.flyerUrl?.includes('firebasestorage.googleapis.com') || event.flyerUrl?.includes('storage.googleapis.com')}
            />
          </div>
        </div>
      )}
      <AgeVerificationModal
        isOpen={showAgeVerification}
        onClose={() => setShowAgeVerification(false)}
        onVerify={handleAgeVerified}
        onDeny={handleAgeDenied}
      />
    </div>
  );
} 