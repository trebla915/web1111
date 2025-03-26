import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { filterFutureEvents, sortEventsByDate } from '@/lib/utils/dateFormatter';

// Create API client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler utility
const handleApiError = (error: any, context: string) => {
  console.error(`API Error (${context}):`, error.response?.data || error.message || error);
  throw error;
};

interface EventData {
  title: string;
  date: string | undefined;
  ticketLink: string;
  flyerUrl: string;
  userId: string;
  imageUrl: string;
}

interface UpdateEventData {
  title?: string;
  date?: string;
  ticketLink?: string;
  flyerUrl?: string;
}

export interface Event {
  id: string;
  title: string;
  date?: string;
  description?: string;
  flyerUrl?: string;
  ticketLink?: string;
  location?: string;
  created?: any;
  updated?: any;
  userId?: string;
  imageUrl?: string;
}

/**
 * Create a new event via API
 */
export const createEvent = async (eventData: EventData): Promise<string> => {
  try {
    const response = await apiClient.post<{id: string}>('/events', eventData);
    console.log('Event created with ID: ', response.data.id);
    return response.data.id;
  } catch (error) {
    handleApiError(error, 'create event');
    throw error;
  }
};

/**
 * Get upcoming events with a limit via API
 */
export const getUpcomingEvents = async (limitCount = 10): Promise<Event[]> => {
  try {
    const response = await apiClient.get<Event[]>(`/events/upcoming?limit=${limitCount}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'get upcoming events');
    return [];
  }
};

/**
 * Get events for a specific user via API
 */
export const getUserEvents = async (userId: string): Promise<Event[]> => {
  try {
    const response = await apiClient.get<Event[]>(`/events/user/${userId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'get user events');
    return [];
  }
};

/**
 * Fetch all events via API
 */
export const fetchAllEvents = async (): Promise<Event[]> => {
  try {
    const response = await apiClient.get<Event[]>('/events');
    
    if (!response.data.length) {
      console.log('No events found');
      return [];
    }
    
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch all events');
    return [];
  }
};

/**
 * Fetch a single event by ID via API
 */
export const fetchEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const response = await apiClient.get<Event>(`/events/${eventId}`);
    
    if (!response.data) {
      console.log(`Event with ID ${eventId} not found`);
      return null;
    }
    
    return response.data;
  } catch (error) {
    handleApiError(error, `fetch event by ID ${eventId}`);
    return null;
  }
};

/**
 * Fetch future events (events with dates after today)
 * First attempts to use the API endpoint, falls back to client-side filtering if needed
 */
export const fetchFutureEvents = async (): Promise<Event[]> => {
  try {
    console.log('Fetching future events...');
    
    // First try: Use dedicated future events endpoint
    try {
      const response = await apiClient.get<Event[]>('/events/future');
      console.log(`Found ${response.data.length} future events from API endpoint`);
      
      // Sort events by date (closest dates first)
      return sortEventsByDate(response.data);
    } catch (apiError) {
      console.warn('API endpoint for future events failed, falling back to client-side filtering', apiError);
      
      // Fall back to client-side filtering
      const allEvents = await fetchAllEvents();
      const filteredEvents = filterFutureEvents(allEvents);
      console.log(`Found ${allEvents.length} total events, filtered to ${filteredEvents.length} future events`);
      
      // Sort events by date (closest dates first)
      return sortEventsByDate(filteredEvents);
    }
  } catch (error) {
    console.error('Error fetching future events:', error);
    return []; // Return empty array in case of complete failure
  }
};

/**
 * Update an event via API
 */
export const updateEvent = async (eventId: string, updateData: UpdateEventData): Promise<void> => {
  try {
    await apiClient.put(`/events/${eventId}`, updateData);
    console.log(`Event ${eventId} updated successfully`);
  } catch (error) {
    handleApiError(error, `update event ${eventId}`);
    throw error;
  }
};

/**
 * Delete an event via API
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    await apiClient.delete(`/events/${eventId}`);
    console.log(`Event ${eventId} deleted successfully`);
  } catch (error) {
    handleApiError(error, `delete event ${eventId}`);
    throw error;
  }
};
