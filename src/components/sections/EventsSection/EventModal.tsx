"use client";

import { Event } from "@/types/events";
import { X } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthProvider";
import { useRouter } from "next/navigation";

interface Props {
  event: Event | null;
  onClose: () => void;
}

export default function EventModal({ event, onClose }: Props) {
  const { user } = useAuth();
  const router = useRouter();

  if (!event) return null;

  const handleReserveClick = () => {
    onClose(); // ✅ Close modal before redirecting
    if (!user) {
      router.push(`/login?redirect=/reserve/${event.id}`);
    } else {
      router.push(`/reserve/${event.id}`);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-black text-white rounded-2xl w-full max-w-2xl md:max-w-3xl lg:max-w-4xl mx-4 border-2 border-white/20 overflow-hidden"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        {/* Modal Header */}
        <div className="p-4 flex justify-between items-center border-b border-white/20">
          <h2 className="text-xl md:text-2xl font-bold truncate">{event.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Image Section */}
        <div className="relative aspect-square w-full max-h-[80vh]">
          <Image
            src={event.flyerUrl}
            alt={event.title}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 70vw, 800px"
            priority
          />
        </div>

        {/* Actions Section */}
        <div className="p-4 md:p-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* ✅ "Buy Tickets" button now white with black text */}
            {event.ticketLink && (
              <a
                href={event.ticketLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-6 bg-white text-black rounded-lg hover:bg-gray-200 transition-opacity text-center font-bold text-sm md:text-base"
              >
                Buy Tickets
              </a>
            )}

            {/* ✅ Reserve Table Button with Login Check */}
            <button
              onClick={handleReserveClick}
              className="flex-1 py-3 px-6 border-2 border-white/30 rounded-lg hover:border-white/60 transition-colors text-center font-bold text-sm md:text-base"
            >
              Reserve Table
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}