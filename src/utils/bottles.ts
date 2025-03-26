import { apiClient, handleApiError } from './api';
import { Bottle, Mixer } from './types';

/**
 * Fetch all bottles (regardless of event)
 */
export const fetchAllBottles = async (): Promise<Bottle[]> => {
  try {
    const response = await apiClient.get<Bottle[]>('/bottles');
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch all bottles');
    return [];
  }
};

/**
 * Fetch a single bottle by ID
 */
export const fetchBottleById = async (bottleId: string): Promise<Bottle | null> => {
  try {
    const response = await apiClient.get<Bottle>(`/bottles/${bottleId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch bottle by ID');
    return null;
  }
};

/**
 * Fetch all bottles for a specific event
 */
export const fetchBottlesByEvent = async (eventId: string): Promise<Bottle[]> => {
  try {
    const response = await apiClient.get<Bottle[]>(`/bottles/event/${eventId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch bottles by event');
    return [];
  }
};

/**
 * Fetch all mixers
 */
export const fetchAllMixers = async (): Promise<Mixer[]> => {
  try {
    const response = await apiClient.get<Mixer[]>('/mixers');
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch all mixers');
    return [];
  }
};

/**
 * Add bottles to an event
 */
export const addBottlesToEvent = async (eventId: string, bottles: Bottle[]): Promise<void> => {
  try {
    await apiClient.post(`/bottles/event/${eventId}`, bottles);
  } catch (error) {
    handleApiError(error, 'add bottles to event');
    throw error;
  }
};

/**
 * Delete a bottle from an event
 */
export const deleteBottleFromEvent = async (eventId: string, bottleId: string): Promise<void> => {
  try {
    await apiClient.delete(`/bottles/event/${eventId}/${bottleId}`);
  } catch (error) {
    handleApiError(error, 'delete bottle from event');
    throw error;
  }
};

/**
 * Fetch all bottles from catalog
 */
export const fetchAllBottlesFromCatalog = async (): Promise<Bottle[]> => {
  try {
    const response = await apiClient.get<Bottle[]>('/bottles/catalog');
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch all bottles from catalog');
    return [];
  }
}; 