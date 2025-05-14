"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getAllEvents, updateEvent, deleteEvent } from '@/lib/services/events';
import { toast } from 'react-hot-toast';
import { FiSearch, FiEdit, FiTrash2, FiCalendar, FiLink, FiCheck, FiAlertTriangle, FiRefreshCw, FiEdit2 } from 'react-icons/fi';
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
  const [reservationsEnabled, setReservationsEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedEvents = await getAllEvents();
      if (!Array.isArray(fetchedEvents)) {
        console.error('Fetched events is not an array:', fetchedEvents);
        throw new Error('Invalid events data received');
      }
      setEvents(fetchedEvents);
      setFilteredEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!Array.isArray(events)) {
      console.warn('Events is not an array during search');
      return;
    }
    
    if (query.trim() === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter((event) => {
        if (!event || typeof event.title !== 'string') {
          console.warn('Invalid event or missing title:', event);
          return false;
        }
        return event.title.toLowerCase().includes(query.toLowerCase());
      });
      setFilteredEvents(filtered);
    }
  };

  const handleEventSelection = (eventId: string) => {
    const selectedEvent = events.find((event) => event.id === eventId);
    if (selectedEvent) {
      console.log('Selected event:', selectedEvent);
      setSelectedEventId(eventId);
      setEventTitle(selectedEvent.title || '');
      setEventDate(selectedEvent.date ? selectedEvent.date.split('T')[0] : '');
      setTicketLink(selectedEvent.ticketLink || '');
      console.log('Event reservationsEnabled:', selectedEvent.reservationsEnabled);
      setReservationsEnabled(selectedEvent.reservationsEnabled !== false);
      setConfirmDelete(null);
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEventId) {
      toast.error('No event selected.');
      return;
    }

    setLoading(true);
    try {
      console.log('Updating event with data:', {
        title: eventTitle,
        date: eventDate,
        ticketLink,
        reservationsEnabled
      });
      
      const updatedEvent = {
        title: eventTitle,
        date: eventDate ? new Date(eventDate).toISOString() : undefined,
        ticketLink,
        reservationsEnabled: reservationsEnabled
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
      setReservationsEnabled(true);
      setConfirmDelete(null);
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event.');
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString?: string): string => {
    if (!dateString) return 'No date set';
    
    try {
      // Parse the ISO string directly
      const [datePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      
      // Create date object using the parsed components
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Events List */}
        <div className="lg:col-span-1 bg-zinc-900/50 rounded-lg border border-cyan-900/30">
          <div className="p-4 border-b border-cyan-900/30">
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-2 pl-10 bg-black/50 border border-cyan-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-gray-500"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="overflow-y-auto" style={{ height: 'calc(100% - 4rem)' }}>
            {loading && !events.length ? (
              <div className="flex items-center justify-center p-6">
                <div className="w-5 h-5 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin mr-3"></div>
                <span className="text-cyan-400">Loading events...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <FiAlertTriangle className="mx-auto h-8 w-8 mb-2" />
                <p>No events found</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventSelection(event.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all
                      ${selectedEventId === event.id 
                        ? 'bg-cyan-900/20 border-l-2 border-l-cyan-500' 
                        : 'hover:bg-cyan-900/10'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{event.title}</h4>
                        <div className="flex items-center mt-1 text-sm text-gray-400">
                          <FiCalendar className="mr-1 flex-shrink-0" size={12} />
                          <span className="truncate">{formatEventDate(event.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-3 bg-zinc-900/50 rounded-lg border border-cyan-900/30">
          <div className="p-6">
            {selectedEventId ? (
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Title */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-200">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-black/50 border border-cyan-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white"
                    />
                  </div>

                  {/* Event Date */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-200">
                      Event Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white"
                      />
                      <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Ticket Link */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-200">
                      Ticket Link
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={ticketLink}
                        onChange={(e) => setTicketLink(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white"
                        placeholder="https://"
                      />
                      <FiLink className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Reservations Toggle */}
                  <div className="space-y-2 flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reservationsEnabled}
                        onChange={(e) => setReservationsEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-200">Enable Reservations</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={handleUpdateEvent}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg font-medium
                      hover:from-cyan-500 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 
                      disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-5 h-5" />
                        <span>Update Event</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    disabled={loading}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2
                      ${confirmDelete === selectedEventId
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-red-900/10 text-red-400 hover:bg-red-900/20'
                      } transition-colors`}
                  >
                    <FiTrash2 className="w-5 h-5" />
                    <span>
                      {confirmDelete === selectedEventId ? 'Confirm Delete' : 'Delete Event'}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FiEdit className="mx-auto mb-4 text-4xl" />
                <p>Select an event from the list to edit its details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 