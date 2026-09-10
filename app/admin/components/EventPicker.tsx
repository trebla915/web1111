"use client";

import { useEffect, useState } from "react";
import { FiCalendar, FiChevronDown } from "react-icons/fi";
import { getAllEvents } from "@/lib/services/events";
import { Event } from "@/types/event";
import { Select } from "@/components/ui/input";
import { Label } from "@/components/ui/field";

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
      <Label>{label}</Label>
      <div className="relative">
        <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-muted pointer-events-none" />
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="pl-10 pr-10 py-3 lg:py-2 bg-canvas/50 border border-accent-900/30 focus:ring-2 focus:ring-accent-500/50 text-base lg:text-sm appearance-none disabled:opacity-50"
        >
          <option value="">{loading ? "Loading events..." : "Select an event..."}</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </Select>
        <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fg-muted pointer-events-none" />
      </div>
    </div>
  );
}
