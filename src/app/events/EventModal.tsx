import React from "react";
import Link from "next/link";

interface EventModalProps {
  isOpen: boolean;
  closeModal: () => void;
  event: {
    id: string;
    title: string;
    date: string;
    flyerUrl: string;
    ticketLink: string;
  } | null;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, closeModal, event }) => {
  if (!event) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center transition-all duration-300 ${
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={closeModal}
      ></div>

      {/* Modal Content */}
      <div className="bg-white text-black rounded-2xl max-w-3xl w-full mx-4 p-6 md:p-8 relative z-50 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold"
        >
          &times;
        </button>

        {/* Flyer Image */}
        <div className="w-full flex justify-center mb-6">
          <img
            src={event.flyerUrl}
            alt={event.title}
            className="w-full max-h-[300px] md:max-h-[500px] object-cover rounded-xl transition-all duration-300"
          />
        </div>

        {/* Event Details */}
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">{event.title}</h2>
        <p className="text-center text-gray-500 mb-4">
          {new Date(event.date).toLocaleDateString()}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
          <Link
            href={event.ticketLink}
            className="bg-blue-600 text-white py-2 px-6 rounded-full hover:bg-blue-700 transition-all duration-300 text-center"
          >
            Buy Tickets
          </Link>

          {/* Link to Reserve Table page */}
          <Link
            href={`/reserve/${event.id}`}
            className="bg-green-600 text-white py-2 px-6 rounded-full hover:bg-green-700 transition-all duration-300 text-center"
          >
            Reserve Table
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventModal;