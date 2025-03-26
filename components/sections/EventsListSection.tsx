"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiClock, FiMapPin, FiMusic, FiArrowRight, FiTag } from 'react-icons/fi';
import { fetchFutureEvents } from '@/lib/services/events';
import { formatToMMDDYYYY, formatDateWithTime, getDayOfWeek, sortEventsByDate } from '@/lib/utils/dateFormatter';

interface EventsListSectionProps {
  title?: string;
  subtitle?: string;
  className?: string;
  maxEvents?: number;
}

export default function EventsListSection({
  title = "Upcoming Events",
  subtitle = "Don't miss out on our exclusive nights",
  className = "",
  maxEvents = 6
}: EventsListSectionProps) {
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

  // Get random accent color for each event
  const getAccentColor = (index: number) => {
    const colors = [
      'from-purple-500 to-indigo-500',
      'from-pink-500 to-rose-500',
      'from-cyan-500 to-blue-500',
      'from-emerald-500 to-teal-500',
      'from-amber-500 to-orange-500',
      'from-fuchsia-500 to-purple-500'
    ];
    return colors[index % colors.length];
  };

  // Add staggered animation delay for card entrance
  const getAnimationDelay = (index: number) => {
    return `${index * 0.1}s`;
  };

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">{title}</h2>
          {subtitle && <p className="text-gray-400 max-w-2xl mx-auto">{subtitle}</p>}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative w-20 h-20">
              <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-purple-500 border-b-pink-500 border-l-indigo-500 animate-spin"></div>
              <div className="absolute top-2 left-2 w-16 h-16 rounded-full border-4 border-t-transparent border-r-transparent border-b-transparent border-l-blue-500 animate-spin-slow"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-500/30 text-red-200 p-6 rounded-xl text-center max-w-2xl mx-auto">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-2">No Upcoming Events</h3>
            <p className="text-gray-400 mb-4">Check back soon for our upcoming party schedule.</p>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((event, index) => (
              <div 
                key={event.id}
                className="group relative overflow-hidden backdrop-blur-sm bg-gray-900/40 border border-gray-800 hover:border-gray-700 rounded-xl transition-all duration-300 transform hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(139,92,246,0.15)]"
                style={{ 
                  animation: `fadeIn 0.5s ease-out ${getAnimationDelay(index)} backwards`
                }}
              >
                {/* Pulsing background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${getAccentColor(index)} opacity-5 group-hover:opacity-15 transition-opacity blur-xl animate-pulse-slow`}></div>
                
                {/* Animated "glow" border effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 -m-0.5 rounded-xl bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-pulse-slow"></div>
                </div>
                
                {/* Event card content */}
                <div className="relative flex flex-col md:flex-row">
                  {/* Mobile layout: Image and date side by side in a row */}
                  <div className="md:hidden flex flex-row">
                    {/* Image for mobile */}
                    <div className="w-1/2 relative overflow-hidden">
                      <div className="aspect-square w-full">
                        <Image
                          src={event.flyerUrl || 'https://via.placeholder.com/400x400?text=Club+Event'}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-transparent opacity-50"></div>
                      </div>
                    </div>

                    {/* Date for mobile */}
                    <div className="w-1/2 p-4 flex flex-col items-center justify-center text-center border-l border-gray-800 relative overflow-hidden">
                      {/* Subtle light effect */}
                      <div className="absolute -top-10 -left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                      
                      {event.date ? (
                        <>
                          <div className="text-sm text-gray-400 mb-1">{getDayOfWeek(event.date)}</div>
                          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                            {new Date(event.date).getDate()}
                          </div>
                          <div className="text-xl font-medium text-gray-300">
                            {new Date(event.date).toLocaleString('default', { month: 'short' })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(event.date).getFullYear()}
                          </div>
                        </>
                      ) : (
                        <div className="text-xl font-semibold text-gray-300">TBA</div>
                      )}
                    </div>
                  </div>

                  {/* Desktop layout components */}
                  {/* Date column - desktop only */}
                  <div className="hidden md:flex md:w-1/6 p-4 flex-col items-center justify-center text-center border-r border-gray-800 relative overflow-hidden">
                    {/* Subtle light effect */}
                    <div className="absolute -top-10 -left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    
                    {event.date ? (
                      <>
                        <div className="text-sm text-gray-400 mb-1">{getDayOfWeek(event.date)}</div>
                        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                          {new Date(event.date).getDate()}
                        </div>
                        <div className="text-xl font-medium text-gray-300">
                          {new Date(event.date).toLocaleString('default', { month: 'short' })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(event.date).getFullYear()}
                        </div>
                      </>
                    ) : (
                      <div className="text-xl font-semibold text-gray-300">TBA</div>
                    )}
                  </div>
                  
                  {/* Image column - desktop only */}
                  <div className="hidden md:block md:w-1/4 md:h-auto relative overflow-hidden">
                    <div className="aspect-square w-full">
                      <Image
                        src={event.flyerUrl || 'https://via.placeholder.com/400x400?text=Club+Event'}
                        alt={event.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-transparent opacity-50"></div>
                      
                      {/* Animated overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-blue-900/40 opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                    </div>
                  </div>
                  
                  {/* Content column */}
                  <div className="md:w-7/12 p-5 flex flex-col">
                    <Link href={`/events/${event.id}`}>
                      <h3 className="text-2xl font-bold mb-2 hover:text-cyan-100 transition-colors group-hover:text-cyan-100 text-white">
                        {event.title}
                      </h3>
                    </Link>
                    
                    <div className="flex flex-wrap gap-4 my-2 text-sm">
                      <div className="flex items-center text-gray-300">
                        <FiClock className="mr-2 text-purple-400 group-hover:animate-pulse" />
                        <span>{event.date ? formatDateWithTime(event.date).split(' at ')[1] : 'Time TBA'}</span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-gray-300">
                          <FiMapPin className="mr-2 text-purple-400 group-hover:animate-pulse" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-gray-300">
                        <FiMusic className="mr-2 text-purple-400 group-hover:animate-pulse" />
                        <span>Live DJ</span>
                      </div>
                    </div>
                    
                    {event.description && (
                      <p className="text-gray-400 mb-4 line-clamp-2">{event.description}</p>
                    )}
                    
                    <div className="mt-auto pt-3 flex flex-wrap gap-3">
                      <Link 
                        href={`/events/${event.id}`}
                        className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center group"
                      >
                        {/* Button shine effect */}
                        <span className="absolute top-0 left-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                        <span className="relative">View Details</span>
                        <FiArrowRight className="relative ml-2 transform group-hover:translate-x-1 transition-transform" />
                      </Link>
                      
                      {event.ticketLink && (
                        <Link 
                          href={event.ticketLink}
                          target="_blank"
                          className="relative overflow-hidden bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                        >
                          {/* Button shine effect */}
                          <span className="absolute top-0 left-0 w-full h-full bg-white/5 transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700"></span>
                          <span className="relative flex items-center">
                            <FiTag className="mr-2" /> Get Tickets
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Animated accent line at the bottom */}
                <div className={`h-1 w-full bg-gradient-to-r ${getAccentColor(index)} group-hover:opacity-100 opacity-80 transition-opacity`}></div>
              </div>
            ))}
            
            {events.length > 0 && (
              <div className="text-center mt-10">
                <Link 
                  href="/events"
                  className="relative overflow-hidden inline-flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm text-white px-6 py-3 rounded-full transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  {/* Button shine effect */}
                  <span className="absolute top-0 left-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700"></span>
                  <span className="relative flex items-center">
                    View All Events <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
} 