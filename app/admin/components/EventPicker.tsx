"use client";

import { useEffect, useState } from "react";
import { FiCalendar, FiChevronDown } from "react-icons/fi";
import { getAllEvents } from "@/lib/services/events";
import { Event } from "@/types/event";

interface EventPickerProps {
  value: string;
  onChange: (eventId: string) => void;
  label?: string;
}

export default function EventPicker({ value, onChange, label = "Event" }: EventPickerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fetchedEvents = await getAllEvents();
        if (!cancelled) setEvents(fetchedEvents);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-200">{label}</label>
      <div className="relative">
        <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="w-full pl-10 pr-10 py-3 lg:py-2 bg-black/50 border border-cyan-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white text-base lg:text-sm appearance-none disabled:opacity-50"
        >
          <option value="">{loading ? "Loading events..." : "Select an event..."}</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
        <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
