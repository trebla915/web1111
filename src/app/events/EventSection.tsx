"use client";

import React, { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import EventCard from "./EventCard";
import EventModal from "./EventModal";
import { db } from "../../lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

interface Event {
  id: string;
  title: string;
  date: string;
  flyerUrl: string;
  ticketLink: string;
}

const EventsSection: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [emblaRef] = useEmblaCarousel({ align: "center", loop: true, dragFree: false });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, "events");
        const snapshot = await getDocs(eventsRef);
        const eventsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[];
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const openReservationModal = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <section className="py-16 relative bg-black text-white transition-opacity duration-700">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-6 tracking-wider">Upcoming Events</h1>
      </div>
      {loading ? (
        <p className="text-center">Loading events...</p>
      ) : (
        <div className="embla w-full" ref={emblaRef}>
          <div className="embla__container">
            {events.map((event) => (
              <div key={event.id} className="embla__slide">
                <EventCard
                  title={event.title}
                  date={event.date}
                  flyerUrl={event.flyerUrl}
                  ticketLink={event.ticketLink}
                  onTableReservation={() => openReservationModal(event)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedEvent && (
        <EventModal
          isOpen={isModalOpen}
          closeModal={closeModal}
          event={selectedEvent}
        />
      )}
    </section>
  );
};

export default EventsSection;