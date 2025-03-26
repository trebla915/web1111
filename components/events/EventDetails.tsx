"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiMapPin, FiArrowLeft, FiTag, FiUsers } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/hooks/useAuth';

// Date formatting utilities
function formatToMMDDYYYY(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
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
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Format options
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
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
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
}

interface EventDetailsProps {
  event: Event;
}

export default function EventDetails({ event }: EventDetailsProps) {
  const router = useRouter();
  const { user, isGuest } = useAuth();

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
    <div className="min-h-screen bg-black text-cyan-400">
      <div className="container mx-auto py-8 px-4">
        <Link href="/events" className="flex items-center text-cyan-400 hover:text-cyan-300 mb-8">
          <FiArrowLeft className="mr-2" /> BACK TO EVENTS
        </Link>
        
        <div className="border border-cyan-900 overflow-hidden">
          {/* Event Header */}
          <div className="flex flex-col md:flex-row">
            {/* Event image */}
            <div className="md:w-2/5 relative">
              <div className="aspect-square w-full">
                <Image
                  src={event.flyerUrl || 'https://via.placeholder.com/800x800?text=Event+Flyer'}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                />
              </div>
            </div>

            {/* Event title and info */}
            <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-center border-l border-cyan-900">
              <div className="">
                <div className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-wide" style={{ fontFamily: 'Impact, sans-serif' }}>
                  {event.title.toUpperCase()}
                </div>
                
                {event.date && (
                  <div className="flex items-center text-cyan-300 text-2xl mb-6">
                    <FiCalendar className="mr-2" />
                    <span>{getDayOfWeek(event.date).toUpperCase()}, {formatDateWithTime(event.date).toUpperCase()}</span>
                  </div>
                )}
                
                {event.location && (
                  <div className="flex items-center text-cyan-300 mb-8 text-xl">
                    <FiMapPin className="mr-2" />
                    <span>{event.location.toUpperCase()}</span>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={handleTablePress}
                    className="bg-cyan-400 hover:bg-cyan-500 text-black px-5 py-3 transition-colors flex items-center font-bold"
                  >
                    <FiUsers className="mr-2" />
                    RESERVE A TABLE
                  </button>
                  
                  <button
                    onClick={() => handleTicketPress(event.ticketLink)}
                    className={`${event.ticketLink 
                      ? 'bg-cyan-900 hover:bg-cyan-800' 
                      : 'bg-gray-900 cursor-not-allowed'} text-cyan-400 px-5 py-3 transition-colors flex items-center font-bold border border-cyan-400`}
                    disabled={!event.ticketLink}
                  >
                    <FiTag className="mr-2" />
                    {event.ticketLink ? 'BUY TICKETS' : 'NO TICKETS AVAILABLE'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Event Details */}
          <div className="p-6 md:p-8 border-t border-cyan-900">
            <div className="flex flex-wrap gap-8 md:flex-nowrap">
              <div className="w-full md:w-2/3">
                <h2 className="text-2xl font-bold mb-6 tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>EVENT DETAILS</h2>
                {event.description ? (
                  <p className="text-cyan-200 mb-8 whitespace-pre-line leading-relaxed">
                    {event.description}
                  </p>
                ) : (
                  <p className="text-cyan-500 italic mb-8">No description available for this event.</p>
                )}
              </div>
              
              <div className="w-full md:w-1/3 bg-cyan-900/10 p-6 border border-cyan-900">
                <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'Impact, sans-serif' }}>EVENT INFORMATION</h3>
                
                <div className="mb-6">
                  <h4 className="font-semibold mb-2 text-cyan-300 uppercase">When</h4>
                  <p className="text-cyan-100 text-lg">
                    {event.date ? formatToMMDDYYYY(event.date) : 'Date TBA'}
                  </p>
                  
                  {event.date && (
                    <p className="text-cyan-400 text-sm mt-1">
                      {getDayOfWeek(event.date).toUpperCase()}
                    </p>
                  )}
                </div>
                
                {event.location && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2 text-cyan-300 uppercase">Where</h4>
                    <p className="text-cyan-100 text-lg">{event.location}</p>
                  </div>
                )}
                
                <div className="pt-4 border-t border-cyan-900/50">
                  <p className="text-cyan-400 text-sm uppercase tracking-wide">
                    Share this event with your friends!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 