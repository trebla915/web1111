"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getAllEvents, updateEvent, deleteEvent } from '@/lib/services/events';
import { toast } from 'react-hot-toast';
import { FiSearch, FiEdit, FiTrash2, FiCalendar, FiLink, FiCheck, FiAlertTriangle, FiRefreshCw, FiEdit2 } from 'react-icons/fi';
import { BiTable } from 'react-icons/bi';
import { Event } from '@/types/event';
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";

interface EditEventsTabProps {
  onManageTables?: (eventId: string) => void;
}

export default function EditEventsTab({ onManageTables }: EditEventsTabProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [ticketLink, setTicketLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [description, setDescription] = useState('');
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
      setSelectedEventId(eventId);
      setEventTitle(selectedEvent.title || '');
      setEventDate(selectedEvent.date ? selectedEvent.date.split('T')[0] : '');
      setDescription(selectedEvent.description || '');
      setTicketLink(selectedEvent.ticketLink || '');
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
      const updatedEvent = {
        title: eventTitle,
        date: eventDate ? new Date(eventDate).toISOString() : undefined,
        description: description.trim() || '',
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
      setDescription('');
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
        <div className="lg:col-span-1 bg-surface/50 rounded-lg border border-accent-900/30">
          <div className="p-4 border-b border-accent-900/30">
            <div className="relative">
              <Input
                type="text"
                className="px-4 py-2 pl-10 bg-canvas/50 border border-accent-900/30 focus:ring-2 focus:ring-accent-500/50 placeholder-fg-subtle"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-muted" />
            </div>
          </div>

          <div className="h-[calc(100%-4rem)] overflow-y-auto">
            {loading && !events.length ? (
              <div className="flex items-center justify-center p-6">
                <Spinner size="sm" className="text-accent-500 h-5 w-5 mr-3" />
                <span className="text-accent-400">Loading events...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-6 text-center text-fg-muted">
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
                        ? 'bg-accent-900/20 border-l-2 border-l-accent' 
                        : 'hover:bg-accent-900/10'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-fg font-medium truncate">{event.title}</h4>
                        <div className="flex items-center mt-1 text-sm text-fg-muted">
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
        <div className="lg:col-span-3 bg-surface/50 rounded-lg border border-accent-900/30">
          <div className="p-6">
            {selectedEventId ? (
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Title */}
                  <div className="space-y-2">
                    <Label>
                      Event Title
                    </Label>
                    <Input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="px-4 py-2 bg-canvas/50 border border-accent-900/30 focus:ring-2 focus:ring-accent-500/50"
                    />
                  </div>

                  {/* Event Date */}
                  <div className="space-y-2">
                    <Label>
                      Event Date
                    </Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="px-4 py-2 bg-canvas/50 border border-accent-900/30 focus:ring-2 focus:ring-accent-500/50"
                      />
                      <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fg-muted" />
                    </div>
                  </div>

                  {/* Ticket Link */}
                  <div className="space-y-2">
                    <Label>
                      Ticket Link
                    </Label>
                    <div className="relative">
                      <Input
                        type="url"
                        value={ticketLink}
                        onChange={(e) => setTicketLink(e.target.value)}
                        className="px-4 py-2 bg-canvas/50 border border-accent-900/30 focus:ring-2 focus:ring-accent-500/50"
                        placeholder="https://"
                      />
                      <FiLink className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fg-muted" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      Description (Optional)
                    </Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="px-4 py-2 bg-canvas/50 border border-accent-900/30 focus:ring-2 focus:ring-accent-500/50 placeholder-fg-subtle resize-none"
                      placeholder="Notes about the event..."
                    />
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
                      <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-fg after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-fg after:border-fg-dim after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
                      <span className="ml-3 text-sm font-medium text-fg-dim">Enable Reservations</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-6">
                  {onManageTables && (
                    <Button
                      type="button"
                      onClick={() => onManageTables(selectedEventId)}
                      variant="subtle" size="lg"
                    >
                      <BiTable className="w-5 h-5" />
                      <span>Manage Tables</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleUpdateEvent}
                    disabled={loading}
                    variant="accent" size="lg" className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="text-fg h-5 w-5" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-5 h-5" />
                        <span>Update Event</span>
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleDeleteEvent}
                    disabled={loading}
                    variant={confirmDelete === selectedEventId ? "danger" : "danger-subtle"}
                    size="lg"
                    className="flex-1"
                  >
                    <FiTrash2 className="w-5 h-5" />
                    <span>
                      {confirmDelete === selectedEventId ? 'Confirm Delete' : 'Delete Event'}
                    </span>
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-fg-muted">
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