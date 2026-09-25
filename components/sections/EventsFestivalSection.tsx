"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCalendar } from 'react-icons/fi';
import { getUpcomingEvents } from '@/lib/services/events';
import { sortEventsByDate } from '@/lib/utils/dateFormatter';
import SectionHeader from './SectionHeader';
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PanelError, PanelLoading } from "@/components/ui/page-state";
import { FlyerLightbox } from '@/components/events/FlyerLightbox';
import { cn } from '@/lib/utils';

interface FlyerSelection {
  id: string;
  title: string;
  flyerUrl?: string;
}

interface EventsFestivalSectionProps {
  title?: string;
  subtitle?: string;
  className?: string;
  /** Cap how many events render. Omit or pass null to show all upcoming events. */
  maxEvents?: number | null;
  id?: string;
  /** Free-text filter over title and venue. Empty or omitted shows everything. */
  query?: string;
}

export default function EventsFestivalSection({
  title = "UPCOMING EVENTS",
  subtitle,
  className = "",
  maxEvents = null,
  id = "events",
  query = ""
}: EventsFestivalSectionProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [selectedFlyer, setSelectedFlyer] = useState<FlyerSelection | null>(null);
  const eventListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const fetchedEvents = await getUpcomingEvents();
        
        // Sort events by date - closest dates first
        const sortedEvents = sortEventsByDate(fetchedEvents);
        
        const capped =
          typeof maxEvents === 'number' && maxEvents > 0
            ? sortedEvents.slice(0, maxEvents)
            : sortedEvents;
        setEvents(capped);
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

  const trimmedQuery = query.trim().toLowerCase();
  const visibleEvents = trimmedQuery
    ? events.filter((event) =>
        [event.title, event.venue].some((field) =>
          String(field ?? '').toLowerCase().includes(trimmedQuery)
        )
      )
    : events;

  useEffect(() => {
    const list = eventListRef.current;
    if (!list || visibleEvents.length === 0) return;

    const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-event-card]'));
    const scrollRoot = document.getElementById('__scroll-root');
    if (!scrollRoot || cards.length === 0) return;

    let frame = 0;
    const updateCenteredCard = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rootRect = scrollRoot.getBoundingClientRect();
        const viewportCenter = rootRect.top + rootRect.height / 2;
        const closest = cards.reduce<{ id: string; distance: number } | null>((best, card) => {
          const cardRect = card.getBoundingClientRect();
          const id = card.dataset.eventId;
          if (!id) return best;

          const distance = Math.abs(cardRect.top + cardRect.height / 2 - viewportCenter);
          return !best || distance < best.distance ? { id, distance } : best;
        }, null);

        if (closest) setActiveEventId((current) => current === closest.id ? current : closest.id);
      });
    };

    updateCenteredCard();
    scrollRoot.addEventListener('scroll', updateCenteredCard, { passive: true });
    window.addEventListener('resize', updateCenteredCard);

    return () => {
      cancelAnimationFrame(frame);
      scrollRoot.removeEventListener('scroll', updateCenteredCard);
      window.removeEventListener('resize', updateCenteredCard);
    };
  }, [visibleEvents.length, trimmedQuery]);

  return (
    <section id={id} className={`py-12 ${className} bg-canvas relative overflow-hidden`}>
      {/* Background effects */}
      <div aria-hidden="true" className="noise pointer-events-none absolute inset-0 opacity-5" />
      <div aria-hidden="true" className="spotlight opacity-10" />
      
      <div className="container mx-auto px-4 relative z-10">
        {title && <SectionHeader title={title} subtitle={subtitle} />}

        {loading ? (
          <PanelLoading message="Loading events…" />
        ) : error ? (
          <PanelError
            title="We couldn't load the schedule"
            description="Something went wrong on our end. Try again, or reach us on Instagram for tonight's line-up."
            onRetry={() => window.location.reload()}
            retryLabel="Reload"
          />
        ) : visibleEvents.length === 0 ? (
          /* Was a square-cornered box in a rounded-corner system, holding a
             glowing headline, a shrug, and no way forward. An empty schedule is
             still a chance to keep someone. */
          trimmedQuery ? (
            <EmptyState
              icon={<FiCalendar size={36} aria-hidden="true" />}
              title={`No events match “${query.trim()}”`}
              description="Try a different name, or clear the search to see everything coming up."
            />
          ) : (
            <EmptyState
              icon={<FiCalendar size={36} aria-hidden="true" />}
              title="No events on sale right now"
              description="New dates go up regularly. Join the list below or follow us and you'll hear first."
              action={
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  Get in touch
                </Button>
              }
            />
          )
        ) : (
          <div ref={eventListRef} className="space-y-4">
            {visibleEvents.map((event, index) => (
              <motion.article
                key={event.id}
                data-event-card
                data-event-id={event.id}
                initial={{ opacity: 0.92, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px 0px' }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg border p-3 transition-[transform,filter,opacity,border-color,background-color] duration-slow ease-out-expo sm:gap-5 sm:p-4",
                  activeEventId === event.id
                    ? "z-10 scale-[1.02] border-fg/70 bg-fg/5 md:scale-100"
                    : "scale-[0.985] border-fg/20 opacity-55 blur-[1.25px] md:scale-100 md:opacity-100 md:blur-none"
                )}
              >
                {/* Row geometry was three hard fractions (1/4, 2/4, auto) with
                    the title `truncate`d, so a real title — "Sábado Sonoro con
                    DJ Renata Villalobos" — was cut mid-word on a phone. The
                    date block is a fixed column, the flyer a fixed thumbnail,
                    and the title takes the space that remains and wraps.
                    The three stacked absolutely-positioned border layers behind
                    the date are one bordered box. */}
                <Link
                  href={`/events/${event.id}`}
                  aria-label={`View details for ${event.title}`}
                  className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fg"
                ><span className="sr-only">View details for {event.title}</span></Link>
                  {/* Date */}
                  <div className="pointer-events-none relative z-[1] flex w-16 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-fg/40 bg-fg/5 py-2 transition-colors duration-base group-hover:border-fg/70 sm:w-24 sm:py-3">
                    <span className="tabular font-heading text-3xl leading-none text-fg sm:text-5xl">
                      {event.date ? getEventDay(event.date) : "--"}
                    </span>
                    <span className="mt-1 text-xs tracking-widest text-fg-muted sm:text-base">
                      {event.date ? getEventMonth(event.date) : "TBA"}
                    </span>
                  </div>

                  {/* Event name and details */}
                  <div className="pointer-events-none relative z-[1] min-w-0 flex-1">
                    <h3 className="font-heading text-base leading-tight tracking-wide text-fg sm:text-2xl md:text-3xl">
                      {event.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-fg-muted sm:text-sm">
                      {event.venue && <span className="truncate">{event.venue}</span>}
                      {event.time && <span className="tabular">{event.time}</span>}
                    </div>
                    <span className="mt-2 hidden items-center gap-2 text-sm text-fg-muted opacity-0 transition-opacity duration-base group-hover:opacity-100 md:flex">
                      <FiArrowRight aria-hidden="true" />
                      View details
                    </span>
                  </div>

                  {/* Event flyer thumbnail */}
                  <Button
                    unstyled
                    type="button"
                    aria-label={`View full flyer for ${event.title}`}
                    onClick={() => setSelectedFlyer({ id: event.id, title: event.title, flyerUrl: event.flyerUrl })}
                    className="relative z-20 aspect-square w-16 shrink-0 overflow-hidden rounded-md border border-fg/30 transition-[transform,border-color] duration-base hover:scale-105 hover:border-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg sm:w-28"
                  >
                    <Image
                      src={event.flyerUrl || '/placeholder-event.png'}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-slow hover:scale-105"
                      sizes="112px"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEggJ4YA0XfwAAAABJRU5ErkJggg=="
                      loading="lazy"
                      unoptimized={event.flyerUrl?.includes('firebasestorage.googleapis.com') || event.flyerUrl?.includes('storage.googleapis.com')}
                    />
                    <span className="sr-only">Open flyer</span>
                  </Button>
              </motion.article>
            ))}
          </div>
        )}
      </div>
      <FlyerLightbox
        open={selectedFlyer !== null}
        onOpenChange={(open) => { if (!open) setSelectedFlyer(null); }}
        title={selectedFlyer?.title || 'Event'}
        flyerUrl={selectedFlyer?.flyerUrl}
        detailsHref={selectedFlyer ? `/events/${selectedFlyer.id}` : undefined}
      />
    </section>
  );
}
