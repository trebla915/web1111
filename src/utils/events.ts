// File: src/utils/events.ts

import { apiClient, handleApiError } from './api'; // Import centralized axios and error handler
import { Event } from './types';  // Assuming Event type is defined

// Fetch all events
export const fetchAllEvents = async (): Promise<Event[]> => {
  try {
    const response = await apiClient.get<Event[]>('/events');
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch all events');
    return [];  // Return empty array if error occurs
  }
};

// Fetch a specific event by ID
export const fetchEventById = async (eventId: string): Promise<Event> => {
  try {
    const response = await apiClient.get<Event>(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch event by ID');
    throw error;
  }
};

// Create a new event
export const createEvent = async (eventData: Partial<Event>): Promise<Event> => {
  try {
    const response = await apiClient.post<Event>('/events', eventData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'create event');
    throw error;
  }
};

// Update an existing event
export const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<Event> => {
  try {
    const response = await apiClient.put<Event>(`/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'update event');
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    await apiClient.delete(`/events/${eventId}`);
  } catch (error) {
    handleApiError(error, 'delete event');
    throw error;
  }
};
