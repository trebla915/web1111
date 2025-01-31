"use client";

import { Event } from "@/types/events"; // ✅ Ensure correct import path
import Image from "next/image";
import { motion } from "framer-motion";

interface Props {
  event: Event;
  onSelect: () => void;
}

export default function EventCard({ event, onSelect }: Props) {
  const eventDate = new Date(event.date).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.article
      className="relative group cursor-pointer p-2"
      onClick={onSelect}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
      aria-label={`View details for ${event.title}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-white/20 hover:border-white/50 transition-all duration-300">
        <Image
          src={event.flyerUrl}
          alt={event.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 90vw, 400px"
          priority
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Date Display */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold">
          {eventDate}
        </div>

        {/* Event Title */}
        <h3 className="absolute bottom-4 left-4 right-4 text-xl font-bold truncate">
          {event.title}
        </h3>
      </div>
    </motion.article>
  );
}