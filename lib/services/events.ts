import { Event } from '@/types/event';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const response = await apiClient.get('/events');
    return response.data;
  } catch (error) {
    console.error('Error getting all events:', error);
    throw error;
  }
};

export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      console.log(`Event with ID ${id} not found`);
      return null;
    }
    console.error('Error getting event:', error);
    throw error;
  }
};

export const createEvent = async (eventData: Omit<Event, 'id'>): Promise<Event> => {
  try {
    const response = await apiClient.post('/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, eventData: Partial<Event>): Promise<void> => {
  try {
    await apiClient.put(`/events/${id}`, eventData);
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/events/${id}`);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

export const getUpcomingEvents = async (): Promise<Event[]> => {
  try {
    const response = await apiClient.get('/events');
    const now = new Date();
    // Get current date in YYYY-MM-DD format
    const currentDateStr = now.toISOString().split('T')[0];
    
    // Check the response structure and access the events array properly
    const events = Array.isArray(response.data) ? response.data : 
                  (response.data && response.data.events ? response.data.events : []);
    
    console.log('Current date for comparison:', currentDateStr);
    console.log('All events:', events.map((e: Event) => ({ title: e.title, date: e.date })));
    
    const filteredEvents = events.filter((event: Event) => {
      try {
        // Handle incomplete date formats
        let rawEventDateStr = event.date;
        if (!rawEventDateStr.includes('T')) {
          // If no time is specified, assume midnight UTC
          rawEventDateStr = `${rawEventDateStr}T00:00:00.000Z`;
        }
        
        const eventDate = new Date(rawEventDateStr);
        
        // Check if the date is valid
        if (isNaN(eventDate.getTime())) {
          console.warn(`Invalid date format for event "${event.title}": ${event.date}`);
          return false;
        }
        
        // Get event date in YYYY-MM-DD format
        const normalizedEventDateStr = eventDate.toISOString().split('T')[0];
        
        // Compare dates as strings
        const isIncluded = normalizedEventDateStr >= currentDateStr;
        console.log(`Event "${event.title}" (${event.date} -> ${normalizedEventDateStr}): ${isIncluded ? 'INCLUDED' : 'EXCLUDED'}`);
        return isIncluded;
      } catch (err) {
        console.warn(`Error processing event "${event.title}":`, err);
        return false;
      }
    });
    
    console.log('Filtered events:', filteredEvents.map((e: Event) => ({ title: e.title, date: e.date })));
    return filteredEvents;
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

// Alias for getAllEvents for the sitemap generator
export const fetchAllEvents = getAllEvents; 