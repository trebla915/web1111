// EventSection.tsx
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiArrowRight } from 'react-icons/fi';
import { fetchFutureEvents } from '@/lib/services/events';
import { formatToMMDDYYYY, sortEventsByDate } from '@/lib/utils/dateFormatter';
import { toast } from 'react-hot-toast';

interface EventSectionProps {
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  maxEvents?: number;
  className?: string;
}

export default function EventSection({
  title = "Upcoming Events",
  subtitle,
  showViewAll = true,
  maxEvents = 3,
  className = "",
}: EventSectionProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const fetchedEvents = await fetchFutureEvents();
        
        // Sort events by date - closest dates first
        const sortedEvents = sortEventsByDate(fetchedEvents);
        
        setEvents(sortedEvents.slice(0, maxEvents));
      } catch (err: any) {
        console.error('Error loading events:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [maxEvents]);

  const handleViewEvent = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  return (
    <section className={`py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold">{title}</h2>
            {subtitle && <p className="text-gray-400 mt-2">{subtitle}</p>}
          </div>
          
          {showViewAll && (
            <Link 
              href="/events" 
              className="text-blue-400 hover:text-blue-300 flex items-center"
            >
              View All <FiArrowRight className="ml-1" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 text-red-200 p-4 rounded-lg text-center">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            No upcoming events scheduled.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col h-full transition-transform hover:scale-[1.02]"
              >
                <div 
                  className="relative h-48 cursor-pointer" 
                  onClick={() => handleViewEvent(event.id)}
                >
                  <Image
                    src={event.flyerUrl || 'https://via.placeholder.com/400x200?text=Event+Flyer'}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="p-5 flex-grow flex flex-col">
                  <Link href={`/events/${event.id}`}>
                    <h3 className="text-xl font-bold mb-2 hover:text-cyan-100 transition-colors text-white">{event.title}</h3>
                  </Link>
                  
                  {event.date && (
                    <div className="flex items-center text-gray-300 mb-4">
                      <FiCalendar className="mr-2" />
                      <span>{formatToMMDDYYYY(event.date)}</span>
                    </div>
                  )}
                  
                  {event.description && (
                    <p className="text-gray-400 mb-4 line-clamp-2">{event.description}</p>
                  )}
                  
                  <div className="mt-auto pt-4">
                    <Link 
                      href={`/events/${event.id}`}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center"
                    >
                      View Details <FiArrowRight className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}