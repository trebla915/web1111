"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiMapPin, FiArrowLeft, FiTag, FiUsers, FiShare2 } from 'react-icons/fi';
import { FaWhatsapp, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/hooks/useAuth';

// Manual date adjustment for Mountain Time - directly adds a day to fix timezone issues
function adjustToMountainTime(dateStr: string): Date {
  // Parse the original date string
  const originalDate = new Date(dateStr);
  
  // Add one day to compensate for timezone conversion issues
  const adjustedDate = new Date(originalDate);
  adjustedDate.setDate(originalDate.getDate() + 1);
  
  return adjustedDate;
}

// Date formatting utilities
function formatToMMDDYYYY(dateStr: string): string {
  try {
    if (!dateStr) return 'Date TBA';
    
    // Use the adjusted date
    const date = adjustToMountainTime(dateStr);
    
    // Format as MM/DD/YYYY
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

function formatDateWithTime(dateStr: string): string {
  try {
    if (!dateStr) return 'Date TBA';
    
    // Use the adjusted date 
    const date = adjustToMountainTime(dateStr);
    
    // Format with time
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleString('en-US', options);
  } catch (error) {
    console.error('Error formatting date with time:', error);
    return 'Invalid date';
  }
}

function getDayOfWeek(dateStr: string): string {
  try {
    if (!dateStr) return 'TBA';
    
    // Use the adjusted date
    const date = adjustToMountainTime(dateStr);
    
    // Get day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  } catch (error) {
    console.error('Error getting day of week:', error);
    return 'Invalid date';
  }
}

// Add a debug function to help diagnose the issue
function debugDateInfo(dateStr: string): string {
  if (!dateStr) return 'No date provided';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return `
      Original string: ${dateStr}
      UTC Date: ${date.toUTCString()}
      Local Date: ${date.toString()}
      Mountain Time: ${new Intl.DateTimeFormat('en-US', {
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZone: 'America/Denver'
      }).format(date)}
    `;
  } catch (error) {
    return `Error: ${error}`;
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
}

interface EventDetailsProps {
  event: Event;
}

export default function EventDetails({ event }: EventDetailsProps) {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const [showFullImage, setShowFullImage] = useState(false);

  // Add a debug console log to understand what date we're working with
  useEffect(() => {
    if (event?.date) {
      console.log('Debug date info:', debugDateInfo(event.date));
    }
  }, [event]);

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

    if (isGuest) {
      toast.error('You need an account to reserve a table.');
      
      // Ask if they want to sign up
      if (confirm('You need an account to reserve a table. Would you like to sign up?')) {
        router.push('/auth/register');
      }
      return;
    }

    // Navigate to the reserve route with the event ID
    router.push(`/reserve/${event.id}`);
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
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-6 md:py-8 px-4 pb-24 md:pb-8">
        <Link href="/events" className="inline-flex items-center text-white hover:text-white/80 mb-6 md:mb-8 py-2 touch-target">
          <FiArrowLeft className="mr-2" /> BACK TO EVENTS
        </Link>
        
        <div className="border border-white/20 overflow-hidden rounded-sm">
          {/* Event Header */}
          <div className="flex flex-col md:flex-row">
            {/* Event image */}
            <div className="w-full md:w-2/5 relative">
              <div className="aspect-square w-full cursor-pointer pt-2 p-1 md:p-2" onClick={() => setShowFullImage(true)}>
                <Image
                  src={event.flyerUrl || 'https://via.placeholder.com/800x800?text=Event+Flyer'}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                />
                <div className="absolute inset-0 bg-black/30 md:bg-transparent md:hover:bg-black/30 flex items-center justify-center opacity-0 md:hover:opacity-100 transition-opacity touch-target">
                  <FiShare2 className="text-white text-2xl" />
                </div>
              </div>
            </div>

            {/* Event title and info */}
            <div className="w-full md:w-3/5 p-5 md:p-8 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/20">
              <div className="relative z-10">
                {/* Date and Title */}
                <div className="mb-4">
                  <div className="text-responsive-sm text-white/60 mb-0">
                    {formatDateWithTime(event.date)}
                  </div>
                  <h1 className="text-responsive-2xl font-bold text-white digital-glow-soft">
                    {event.title}
                  </h1>
                </div>

                {/* Location - only show if exists */}
                {event.location && (
                  <div className="flex items-center gap-2 text-white/60 text-responsive-sm mb-4">
                    <FiMapPin className="w-4 h-4 md:w-5 md:h-5" />
                    <span>{event.location}</span>
                  </div>
                )}

                {/* Description */}
                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-white/80 text-responsive-sm leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full">
                <button
                  onClick={handleTablePress}
                  className="bg-white hover:bg-white/90 text-black px-5 py-3 transition-colors flex items-center justify-center font-bold touch-target w-full sm:w-auto"
                >
                  <FiUsers className="mr-2" />
                  RESERVE A TABLE
                </button>
                
                <button
                  onClick={() => handleTicketPress(event.ticketLink)}
                  className={`${event.ticketLink 
                    ? 'bg-white/10 hover:bg-white/20' 
                    : 'bg-gray-900 cursor-not-allowed'} text-white px-5 py-3 transition-colors flex items-center justify-center font-bold border border-white/20 touch-target w-full sm:w-auto`}
                  disabled={!event.ticketLink}
                >
                  <FiTag className="mr-2" />
                  {event.ticketLink ? 'BUY TICKETS' : 'NO TICKETS AVAILABLE'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Event Details */}
          <div className="p-5 md:p-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="w-full md:w-2/3">
                <h2 className="text-responsive-xl font-bold mb-4 md:mb-6 tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>EVENT DETAILS</h2>
                {event.description ? (
                  <p className="text-white mb-6 md:mb-8 whitespace-pre-line leading-relaxed text-responsive-sm">
                    {event.description}
                  </p>
                ) : (
                  <p className="text-white/60 italic mb-6 md:mb-8 text-responsive-sm">No description available for this event.</p>
                )}
              </div>
              
              <div className="w-full md:w-1/3 bg-white/5 p-4 md:p-6 border border-white/20">
                <h3 className="text-responsive-lg font-bold mb-4 md:mb-6" style={{ fontFamily: 'Impact, sans-serif' }}>EVENT INFORMATION</h3>
                
                <div className="mb-4 md:mb-6">
                  <h4 className="font-semibold mb-1 md:mb-2 text-white uppercase text-responsive-sm">When</h4>
                  <p className="text-white text-responsive-base">
                    {event.date ? formatToMMDDYYYY(event.date) : 'Date TBA'}
                  </p>
                  
                  {event.date && (
                    <p className="text-white/60 text-responsive-xs mt-1">
                      {getDayOfWeek(event.date).toUpperCase()}
                    </p>
                  )}
                </div>
                
                {event.location && (
                  <div className="mb-4 md:mb-6">
                    <h4 className="font-semibold mb-1 md:mb-2 text-white uppercase text-responsive-sm">Where</h4>
                    <p className="text-white text-responsive-base">{event.location}</p>
                  </div>
                )}
                
                <div className="pt-3 md:pt-4 border-t border-white/20">
                  <p className="text-white/60 text-responsive-xs uppercase tracking-wide mb-3">
                    Share this event with your friends!
                  </p>
                  <div className="flex gap-3 mt-2">
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.1111eptx.com/events/${event.id}`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors touch-target"
                      aria-label="Share on Facebook"
                    >
                      <FaFacebook size={18} />
                    </a>
                    <a 
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${event.title} at 11:11 EPTX!`)}&url=${encodeURIComponent(`https://www.1111eptx.com/events/${event.id}`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-sky-500 hover:bg-sky-600 rounded-full transition-colors touch-target"
                      aria-label="Share on Twitter"
                    >
                      <FaTwitter size={18} />
                    </a>
                    <a 
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out ${event.title} at 11:11 EPTX! https://www.1111eptx.com/events/${event.id}`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors touch-target sm:hidden"
                      aria-label="Share on WhatsApp"
                    >
                      <FaWhatsapp size={18} />
                    </a>
                    <button 
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
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors touch-target"
                      aria-label="Share"
                    >
                      <FiShare2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile-only sticky action bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-white/20 flex items-center justify-between py-4 px-4 z-50 safe-area-bottom">
        <div className="flex items-start flex-col">
          <h3 className="text-white font-bold text-responsive-sm truncate max-w-[150px]">
            {event.title}
          </h3>
          <span className="text-white/60 text-responsive-xs">
            {event.date ? formatToMMDDYYYY(event.date) : 'Date TBA'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: event.title,
                  text: `Check out ${event.title} at 11:11 EPTX!`,
                  url: `https://www.1111eptx.com/events/${event.id}`
                }).catch(err => console.log('Error sharing', err));
              }
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full touch-target"
            aria-label="Share"
          >
            <FiShare2 size={18} />
          </button>
          <button
            onClick={() => handleTicketPress(event.ticketLink)}
            className={`${event.ticketLink 
              ? 'bg-white hover:bg-white/90' 
              : 'bg-gray-800 cursor-not-allowed'} text-black px-2 py-1.5 rounded-full flex items-center touch-target`}
            disabled={!event.ticketLink}
          >
            <FiTag className="mr-1" size={14} />
            <span className="font-bold text-xs whitespace-nowrap">BUY TICKETS</span>
          </button>
        </div>
      </div>
      
      {/* Full screen image modal for mobile */}
      {showFullImage && (
        <div className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center" onClick={() => setShowFullImage(false)}>
          <button 
            className="absolute top-4 right-4 p-3 bg-black/50 rounded-full text-white"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullImage(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-full h-full p-8 relative flex items-center justify-center">
            <Image
              src={event.flyerUrl || 'https://via.placeholder.com/800x800?text=Event+Flyer'}
              alt={event.title}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
} 