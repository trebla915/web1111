// File: src/utils/bottleService.ts

import { apiClient, handleApiError } from './api'; // Import centralized axios and error handler
import { BackendBottle } from './types'; // Assuming BackendBottle type is defined

// Add bottles to an event
export const addBottlesToEvent = async (
  eventId: string,
  bottles: BackendBottle[]
): Promise<void> => {
  if (!Array.isArray(bottles) || bottles.length === 0) {
    throw new Error('Bottles must be a non-empty array.');
  }

  try {
    const response = await apiClient.post(`/bottles/${eventId}`, bottles);
    console.log('Bottles added to event:', response.data);
  } catch (error) {
    handleApiError(error, 'add bottles to event');
    throw error;
  }
};

// Fetch all bottles for an event
export const fetchAllBottlesForEvent = async (eventId: string): Promise<BackendBottle[]> => {
  try {
    const response = await apiClient.get<BackendBottle[]>(`/bottles/${eventId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch all bottles for event');
    return []; // Return an empty array if error occurs
  }
};

// Fetch a single bottle for an event by bottle ID
export const fetchSingleBottle = async (
  eventId: string,
  bottleId: string
): Promise<BackendBottle> => {
  try {
    const response = await apiClient.get<BackendBottle>(`/bottles/${eventId}/${bottleId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch single bottle');
    throw error;
  }
};

// Update bottle details
export const updateBottleDetails = async (
  eventId: string,
  bottleId: string,
  updates: Partial<BackendBottle>
): Promise<void> => {
  try {
    const response = await apiClient.put(`/bottles/${eventId}/${bottleId}`, updates);
    console.log('Updated bottle details:', response.data);
  } catch (error) {
    handleApiError(error, 'update bottle details');
    throw error;
  }
};

// Delete a bottle from an event
export const deleteBottleFromEvent = async (
  eventId: string,
  bottleId: string
): Promise<void> => {
  try {
    await apiClient.delete(`/bottles/${eventId}/${bottleId}`);
    console.log('Bottle deleted from event');
  } catch (error) {
    handleApiError(error, 'delete bottle from event');
    throw error;
  }
};

// Delete all bottles from an event
export const deleteAllBottlesForEvent = async (eventId: string): Promise<void> => {
  try {
    await apiClient.delete(`/bottles/${eventId}`);
    console.log('All bottles deleted for event');
  } catch (error) {
    handleApiError(error, 'delete all bottles for event');
    throw error;
  }
};
