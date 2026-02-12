"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { getUpcomingEvents } from "@/lib/services/events";
import { sortEventsByDate } from "@/lib/utils/dateFormatter";
import SectionHeader from "@/components/ui/SectionHeader";

interface EventsFestivalSectionProps {
  className?: string;
  maxEvents?: number;
  id?: string;
}

export default function EventsFestivalSection({
  className = "",
  maxEvents = 8,
  id = "events",
}: EventsFestivalSectionProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <section id={id} className={`py-16 md:py-24 ${className} bg-black relative overflow-hidden`}>
      <div className="absolute inset-0 noise opacity-5" />
      <div className="absolute inset-0 spotlight opacity-10" />

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          label="events"
          lines={["LIVE", "AT 11:11"]}
          subtitle="Reserve your table for the night."
        />

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
          <div className="overflow-x-auto overflow-y-hidden -mx-4 px-4 md:-mx-6 md:px-6 touch-pan-x snap-x snap-mandatory scrollbar-hide">
            <div className="flex gap-4 md:gap-6 pb-4 min-w-0">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex-shrink-0 w-[280px] sm:w-[320px] snap-center"
                >
                  <Link href={`/events/${event.id}`} className="block group">
                    <div className="aspect-[3/4] relative overflow-hidden bg-white/5">
                      <Image
                        src={event.flyerUrl || "/placeholder-event.png"}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="320px"
                        loading="lazy"
                        unoptimized={event.flyerUrl?.includes("firebasestorage.googleapis.com") || event.flyerUrl?.includes("storage.googleapis.com")}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="text-white/70 text-sm">
                          {event.date ? getEventMonth(event.date) : "TBA"} {event.date ? getEventDay(event.date) : ""}
                        </span>
                        <h3 className="text-xl font-bold text-white mt-1 truncate" style={{ fontFamily: "Impact, sans-serif" }}>
                          {event.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
} 