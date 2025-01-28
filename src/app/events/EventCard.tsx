import React from "react";

interface EventCardProps {
  title: string;
  date: string;
  flyerUrl: string;
  ticketLink: string;
  onTableReservation: () => void; // Callback for reserving a table
  onClick?: () => void; // Optional onClick for the card
}

const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  flyerUrl,
  ticketLink,
  onTableReservation,
  onClick,
}) => {
  const eventDate = new Date(date);
  const monthDay = eventDate.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div
      className="card-container group cursor-pointer"
      onClick={onClick}
    >
      {/* Event Flyer */}
      <div
        className="card-flyer"
        style={{ backgroundImage: `url(${flyerUrl})` }}
      ></div>

      {/* Event Content */}
      <div className="card-content flex items-center justify-center space-x-2 py-4">
        <span className="text-xl font-bold">{monthDay}</span>
        <span className="border-l border-gray-500 h-6"></span>
        <span className="font-semibold text-lg">{title}</span>
      </div>

      {/* Buttons */}
      <div className="card-buttons flex flex-col items-center space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <a
          href={ticketLink}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
        >
          Buy Tickets
        </a>
        <button
          onClick={onTableReservation}
          className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700"
        >
          Reserve Table
        </button>
      </div>
    </div>
  );
};

export default EventCard;