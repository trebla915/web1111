import { apiClient, handleApiError } from './api';
import { Event } from './types';

/**
 * Fetch all events
 */
export const fetchAllEvents = async (): Promise<Event[]> => {
  try {
    const response = await apiClient.get<Event[]>('/events');
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch all events');
    return [];
  }
};

/**
 * Fetch a specific event by ID
 */
export const fetchEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const response = await apiClient.get<Event>(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch event by ID');
    return null;
  }
};

/**
 * Fetch future events (events with dates after today)
 */
export const fetchFutureEvents = async (): Promise<Event[]> => {
  try {
    const response = await apiClient.get<Event[]>('/events/future');
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch future events');
    return [];
  }
};

/**
 * Create a new event
 */
export const createEvent = async (eventData: Partial<Event>): Promise<Event | null> => {
  try {
    const response = await apiClient.post<Event>('/events', eventData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'create event');
    throw error;
  }
};

/**
 * Update an existing event
 */
export const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<Event | null> => {
  try {
    const response = await apiClient.put<Event>(`/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'update event');
    throw error;
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    await apiClient.delete(`/events/${eventId}`);
  } catch (error) {
    handleApiError(error, 'delete event');
    throw error;
  }
};

/**
 * Fetch events created by a specific user
 */
export const fetchUserEvents = async (userId: string): Promise<Event[]> => {
  try {
    const response = await apiClient.get<Event[]>(`/events/user/${userId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch user events');
    return [];
  }
};

/**
 * Fetch upcoming events with a limit
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