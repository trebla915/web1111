"use client";

import { useEffect, useState } from "react";
import { Event } from "@/types";
import { fetchEvents } from "@/lib/firebase/firestore";
import EventCard from "./EventCard";
import EventModal from "./EventModal";
import { motion } from "framer-motion";

const EventsSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await fetchEvents();
        setEvents(eventsData);
        setStatus("ready");
      } catch (error) {
        console.error("Error loading events:", error);
        setStatus("error");
      }
    };

    loadEvents();
  }, []);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        );

      case "error":
        return (
          <motion.div
            className="text-center py-12 text-red-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Failed to load events. Please refresh the page.
          </motion.div>
        );

      case "ready":
        return events.length === 0 ? (
          <motion.div
            className="text-center py-12 text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No upcoming events - check back soon!
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {events.map((event) => (
              <EventCard key={event.id} event={event} onSelect={() => setSelectedEvent(event)} />
            ))}
          </motion.div>
        );
    }
  };

  return (
    <section
      id="events"
      className="relative text-white overflow-hidden scroll-mt-24 -mt-20 py-16 px-4 md:px-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/events-bg.jpg')" }} // ✅ Background Image
      aria-labelledby="events-heading"
    >
      {/* Dark Overlay for Contrast */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.h2
          id="events-heading"
          className="text-4xl md:text-6xl font-bold mb-12 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Upcoming Events
        </motion.h2>

        {/* Transparent Container */}
        <div className="relative p-6 md:p-8 bg-black/50 backdrop-blur-lg rounded-xl border border-white/20">
          {renderContent()}
        </div>
      </div>

      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </section>
  );
};

export default EventsSection;