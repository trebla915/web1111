"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiArrowRight, FiClock, FiMapPin } from 'react-icons/fi';
import { fetchFutureEvents } from '@/lib/services/events';
import { toast } from 'react-hot-toast';
import { sortEventsByDate } from '@/lib/utils/dateFormatter';

// Format date for display
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

interface FeaturedEventsSectionProps {
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  maxEvents?: number;
  className?: string;
  layout?: 'grid' | 'carousel' | 'featured';
}

export default function FeaturedEventsSection({
  title = "Upcoming Events",
  subtitle,
  showViewAll = true,
  maxEvents = 3,
  className = "",
  layout = 'featured',
}: FeaturedEventsSectionProps) {
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

  // Featured layout (1 large event, 2 smaller)
  const renderFeaturedLayout = () => {
    if (events.length === 0) return null;
    
    const mainEvent = events[0];
    const sideEvents = events.slice(1);
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main featured event (larger) */}
        <div className="lg:col-span-2">
          <div 
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col h-full transition-transform hover:scale-[1.01]"
          >
            <div 
              className="relative h-72 cursor-pointer" 
              onClick={() => handleViewEvent(mainEvent.id)}
            >
              <Image
                src={mainEvent.flyerUrl || 'https://via.placeholder.com/800x400?text=Featured+Event'}
                alt={mainEvent.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">Featured</span>
              </div>
            </div>
            
            <div className="p-6 flex-grow flex flex-col">
              <Link href={`/events/${mainEvent.id}`}>
                <h3 className="text-2xl font-bold mb-3 hover:text-cyan-100 transition-colors text-white">{mainEvent.title}</h3>
              </Link>
              
              <div className="flex items-center text-gray-300 mb-4">
                <FiCalendar className="mr-2" />
                <span>{mainEvent.date ? formatDate(mainEvent.date) : 'Date TBA'}</span>
              </div>
              
              {mainEvent.description && (
                <p className="text-gray-400 mb-4 line-clamp-3">{mainEvent.description}</p>
              )}
              
              <div className="mt-auto pt-4 flex gap-3">
                <Link 
                  href={`/events/${mainEvent.id}`}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  View Details <FiArrowRight className="ml-2" />
                </Link>
                
                {mainEvent.ticketLink && (
                  <Link 
                    href={mainEvent.ticketLink}
                    target="_blank"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Get Tickets
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Side events (smaller) */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {sideEvents.map((event) => (
              <div 
                key={event.id} 
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col h-full transition-transform hover:scale-[1.01]"
              >
                <div className="flex flex-row h-32">
                  <div 
                    className="relative w-1/3 cursor-pointer" 
                    onClick={() => handleViewEvent(event.id)}
                  >
                    <Image
                      src={event.flyerUrl || 'https://via.placeholder.com/300x300?text=Event'}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="w-2/3 p-4 flex flex-col">
                    <Link href={`/events/${event.id}`}>
                      <h3 className="text-lg font-bold mb-2 hover:text-cyan-100 transition-colors line-clamp-1 text-white">{event.title}</h3>
                    </Link>
                    
                    <div className="flex items-center text-gray-400 text-sm mb-2">
                      <FiCalendar className="mr-1" />
                      <span>{event.date ? formatDate(event.date) : 'Date TBA'}</span>
                    </div>
                    
                    <Link 
                      href={`/events/${event.id}`}
                      className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center mt-auto"
                    >
                      Details <FiArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            
            {sideEvents.length < 2 && (
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <p className="text-gray-400">More events coming soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">{title}</h2>
            {subtitle && <p className="text-gray-400">{subtitle}</p>}
          </div>
          
          {showViewAll && events.length > 0 && (
            <Link 
              href="/events" 
              className="text-cyan-400 hover:text-cyan-300 flex items-center group"
            >
              View All <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
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
          <div className="text-center py-16 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-bold mb-2">No Upcoming Events</h3>
            <p className="text-gray-400 mb-6">Check back soon for our upcoming events schedule.</p>
          </div>
        ) : (
          renderFeaturedLayout()
        )}
      </div>
    </section>
  );
} 