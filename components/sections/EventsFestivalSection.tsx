"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight } from 'react-icons/fi';
import { getUpcomingEvents } from '@/lib/services/events';
import { getDayOfWeek, formatToMMDDYYYY, sortEventsByDate } from '@/lib/utils/dateFormatter';

interface EventsFestivalSectionProps {
  title?: string;
  subtitle?: string;
  className?: string;
  maxEvents?: number;
  showYear?: boolean;
  id?: string;
}

export default function EventsFestivalSection({
  title = "UPCOMING EVENTS",
  subtitle,
  className = "",
  maxEvents = 8,
  showYear = true,
  id = "events"
}: EventsFestivalSectionProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const fetchedEvents = await getUpcomingEvents();
        
        // Sort events by date - closest dates first
        const sortedEvents = sortEventsByDate(fetchedEvents);
        
        setEvents(maxEvents ? sortedEvents.slice(0, maxEvents) : sortedEvents);
      } catch (err: any) {
        console.error('Error loading events:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [maxEvents]);

  // Format date for festival style display
  const getEventMonth = (dateStr: string): string => {
    try {
      if (!dateStr) return 'TBA';
      
      // Parse the ISO string directly
      const [datePart] = dateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      
      // Create date object using the parsed components
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return 'TBA';
      
      return date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    } catch {
      return 'TBA';
    }
  };

  const getEventDay = (dateStr: string): string => {
    try {
      if (!dateStr) return '--';
      
      // Parse the ISO string directly
      const [datePart] = dateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      
      // Create date object using the parsed components
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return '--';
      
      return date.getDate().toString();
    } catch {
      return '--';
    }
  };

  return (
    <section id={id} className={`py-12 ${className} bg-black relative overflow-hidden`}>
      {/* Background effects */}
      <div className="absolute inset-0 noise opacity-5"></div>
      <div className="absolute inset-0 spotlight opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Festival-style header */}
        <div className="mb-8">
          {showYear && (
            <div className="text-right">
              <h2 className="text-5xl md:text-7xl font-bold text-white digital-glow-soft" style={{ fontFamily: 'Impact, sans-serif' }}>
                {new Date().getFullYear()}
              </h2>
            </div>
          )}
          <div className="w-full py-2 bg-white relative mb-1">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(0,0,0,0.05)_25%,_rgba(0,0,0,0.05)_50%,_transparent_50%,_transparent_75%,_rgba(0,0,0,0.05)_75%)] bg-[length:10px_10px]"></div>
            <h1 className="text-3xl md:text-5xl font-bold text-black text-center tracking-wider relative z-10" style={{ fontFamily: 'Digital-7, sans-serif' }}>
              {title}
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-t-4 border-white border-solid rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-10">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-2 digital-glow-soft">NO UPCOMING EVENTS</h3>
            <p className="text-white/60">Check back soon for our upcoming schedule.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <Link href={`/events/${event.id}`} key={event.id}>
                <div className="group flex flex-row items-center border border-white/20 rounded-lg py-4 px-3 hover:bg-white/5 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 spotlight transition-opacity duration-300"></div>
                  
                  {/* Date column with stylized border */}
                  <div className="w-1/4 md:w-1/6 flex flex-col items-center justify-center p-2 relative">
                    <div className="absolute inset-0 border-2 border-white/50 rounded-lg group-hover:border-white/80 transition-all duration-300"></div>
                    <div className="absolute inset-0 bg-white/5 rounded-lg group-hover:bg-white/10 transition-all duration-300"></div>
                    <div className="absolute -inset-px bg-gradient-to-tr from-white/0 via-white/0 to-white/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    
                    <div className="text-5xl md:text-7xl font-bold text-white group-hover:digital-glow-soft transition-all duration-300 relative z-10" style={{ fontFamily: 'Impact, sans-serif' }}>
                      {event.date ? getEventDay(event.date) : "--"}
                    </div>
                    <div className="text-lg md:text-xl text-white/60 relative z-10">
                      {event.date ? getEventMonth(event.date) : "TBA"}
                    </div>
                  </div>
                  
                  {/* Event name and details */}
                  <div className="w-2/4 md:w-4/6 flex flex-col pl-2 md:pl-4">
                    <h3 className="text-xl md:text-4xl font-bold text-white tracking-wider group-hover:text-white/90 transition-all duration-300 truncate" style={{ fontFamily: 'Impact, sans-serif' }}>
                      {event.title.toUpperCase()}
                    </h3>
                    {event.venue && (
                      <p className="text-white/60 text-xs md:text-base mt-1 truncate">{event.venue}</p>
                    )}
                    {event.time && (
                      <p className="text-white/40 text-xs md:text-sm mt-1">{event.time}</p>
                    )}
                    <div className="hidden md:flex items-center mt-2">
                      <FiArrowRight className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      <span className="ml-2 text-white/60 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300">
                        View Details
                      </span>
                    </div>
                  </div>
                  
                  {/* Event flyer thumbnail */}
                  <div className="w-20 md:w-32 relative aspect-square ml-auto">
                    <div className="absolute inset-0 rounded-md overflow-hidden border border-white/20 shadow-lg">
                      <Image
                        src={event.flyerUrl || '/placeholder-event.png'}
                        alt={event.title}
                        fill
                        className="object-contain group-hover:scale-110 transition-transform duration-500"
                        sizes="128px"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEggJ4YA0XfwAAAABJRU5ErkJggg=="
                        loading="lazy"
                        unoptimized={event.flyerUrl?.includes('firebasestorage.googleapis.com') || event.flyerUrl?.includes('storage.googleapis.com')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70"></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
} 