"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getAllEvents, updateEvent, deleteEvent } from '@/lib/services/events';
import { toast } from 'react-hot-toast';
import { FiSearch, FiEdit, FiTrash2, FiCalendar, FiLink, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { Event } from '@/types/event';

export default function EditEventsTab() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [ticketLink, setTicketLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const fetchedEvents = await getAllEvents();
      setEvents(fetchedEvents);
      setFilteredEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter((event) =>
        event.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  };

  const handleEventSelection = (eventId: string) => {
    const selectedEvent = events.find((event) => event.id === eventId);
    if (selectedEvent) {
      setSelectedEventId(eventId);
      setEventTitle(selectedEvent.title || '');
      setEventDate(selectedEvent.date ? selectedEvent.date.split('T')[0] : '');
      setTicketLink(selectedEvent.ticketLink || '');
      setConfirmDelete(null); // Reset the confirm delete state
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEventId) {
      toast.error('No event selected.');
      return;
    }

    setLoading(true);
    try {
      const updatedEvent = {
        title: eventTitle,
        date: eventDate ? new Date(eventDate).toISOString() : undefined,
        ticketLink,
      };
      await updateEvent(selectedEventId, updatedEvent);
      toast.success('Event updated successfully.');
      await loadEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEventId) {
      toast.error('No event selected.');
      return;
    }

    // If not confirmed yet, request confirmation
    if (confirmDelete !== selectedEventId) {
      setConfirmDelete(selectedEventId);
      return;
    }

    setLoading(true);
    try {
      await deleteEvent(selectedEventId);
      toast.success('Event deleted successfully.');
      setSelectedEventId(null);
      setEventTitle('');
      setEventDate('');
      setTicketLink('');
      setConfirmDelete(null);
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event.');
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-cyan-300 digital-glow-soft">Edit Events</h2>
      
      {loading && !events.length ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin mb-4"></div>
          <p className="text-cyan-400 ml-3">Loading events...</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="text-cyan-500/70" />
            </div>
            <input
              type="text"
              className="w-full p-3 pl-10 bg-zinc-900 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-1">
              <div className="relative">
                <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
                <div className="relative z-10 bg-zinc-900/80 border border-cyan-900/30 rounded-lg overflow-hidden">
                  <div className="border-b border-cyan-900/30 p-3 bg-zinc-900 flex items-center">
                    <h3 className="text-lg font-medium text-white">Events</h3>
                    <button 
                      onClick={loadEvents} 
                      className="ml-auto text-cyan-400 hover:text-cyan-300 p-1"
                      title="Refresh events"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto">
                    {filteredEvents.length === 0 ? (
                      <div className="p-6 text-gray-400 text-center">
                        <FiAlertTriangle className="mx-auto mb-2 text-2xl" />
                        <p>No events found</p>
                      </div>
                    ) : (
                      filteredEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`p-4 border-b border-cyan-900/20 cursor-pointer transition-all ${
                            selectedEventId === event.id 
                              ? 'bg-cyan-900/20 border-l-2 border-l-cyan-500' 
                              : 'hover:bg-zinc-800/70'
                          }`}
                          onClick={() => handleEventSelection(event.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-white font-medium">{event.title}</h4>
                              <div className="flex items-center mt-1 text-sm text-gray-400">
                                <FiCalendar className="mr-1" size={12} />
                                <span>{formatEventDate(event.date)}</span>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventSelection(event.id);
                                }}
                                className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20 rounded-full transition-colors"
                                title="Edit event"
                              >
                                <FiEdit size={16} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEventId(event.id);
                                  handleDeleteEvent();
                                }}
                                className={`p-2 rounded-full transition-colors ${
                                  confirmDelete === event.id
                                    ? 'bg-red-900/30 text-red-300'
                                    : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                                }`}
                                title="Delete event"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              {selectedEventId ? (
                <div className="relative">
                  <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
                  <div className="relative z-10 bg-zinc-900/80 border border-cyan-900/30 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4 text-cyan-300">Edit Event</h3>
                    
                    <div className="mb-4">
                      <label htmlFor="eventTitle" className="block text-sm font-medium mb-2 text-white">
                        Event Title <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        id="eventTitle"
                        type="text"
                        className="w-full p-3 bg-zinc-800 border border-cyan-900/50 rounded-lg text-white focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="Enter Event Title"
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="eventDate" className="block text-sm font-medium mb-2 text-white">
                        Event Date <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <FiCalendar className="text-cyan-400" />
                        </div>
                        <input
                          id="eventDate"
                          type="date"
                          className="w-full p-3 pl-10 bg-zinc-800 border border-cyan-900/50 rounded-lg text-white focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label htmlFor="ticketLink" className="block text-sm font-medium mb-2 text-white">
                        Ticket Link <span className="text-gray-400">(Optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <FiLink className="text-cyan-400" />
                        </div>
                        <input
                          id="ticketLink"
                          type="url"
                          className="w-full p-3 pl-10 bg-zinc-800 border border-cyan-900/50 rounded-lg text-white focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                          value={ticketLink}
                          onChange={(e) => setTicketLink(e.target.value)}
                          placeholder="Enter Ticket Link"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={handleUpdateEvent}
                        disabled={loading}
                        className="flex-1 p-3 bg-gradient-to-r from-cyan-800 to-cyan-600 hover:from-cyan-700 hover:to-cyan-500 border border-cyan-500/50 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 flex justify-center items-center bg-gradient-to-r from-cyan-600/0 via-cyan-600/30 to-cyan-600/0 opacity-0 group-hover:opacity-100 transform translate-y-full group-hover:translate-y-0 transition-all duration-500"></div>
                        <span className="relative z-10 flex items-center justify-center">
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </>
                          ) : (
                            <>
                              <FiCheck className="mr-2" />
                              Update Event
                            </>
                          )}
                        </span>
                      </button>
                      <button
                        onClick={handleDeleteEvent}
                        disabled={loading}
                        className={`flex-1 p-3 border rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                          confirmDelete === selectedEventId
                            ? 'bg-red-900/30 text-white border-red-500'
                            : 'bg-transparent border-red-600/50 text-red-400 hover:bg-red-900/20'
                        }`}
                      >
                        <FiTrash2 />
                        <span>
                          {confirmDelete === selectedEventId ? 'Confirm Delete' : 'Delete Event'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/80 border border-cyan-900/30 rounded-lg p-8 text-center h-full flex flex-col items-center justify-center">
                  <FiEdit size={48} className="text-cyan-900/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-white">No Event Selected</h3>
                  <p className="text-gray-400">Select an event from the list to edit its details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 