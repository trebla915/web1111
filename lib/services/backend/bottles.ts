import { apiClient, handleApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Bottle } from '@/types/reservation';

export const BottleService = {
  /**
   * Fetch all bottles for a specific event
   */
  async getByEvent(eventId: string): Promise<Bottle[]> {
    try {
      console.log('Fetching bottles for event:', eventId);
      const endpoint = API_ENDPOINTS.bottles.getByEvent(eventId);
      console.log('Using endpoint:', endpoint);
      
      const response = await apiClient.get<Bottle[]>(endpoint);
      console.log('Bottles response:', {
        status: response.status,
        count: response.data.length
      });
      
      return response.data;
    } catch (error) {
      console.error('Error in getByEvent:', error);
      handleApiError(error, 'getByEvent');
      return [];
    }
  },

  /**
   * Add bottles to an event
   */
  async addToEvent(eventId: string, bottles: Bottle[]): Promise<void> {
    try {
      console.log('Adding bottles to event:', eventId);
      const endpoint = API_ENDPOINTS.bottles.addToEvent(eventId);
      
      await apiClient.post(endpoint, bottles);
      console.log('Successfully added bottles to event');
    } catch (error) {
      console.error('Error in addToEvent:', error);
      handleApiError(error, 'addToEvent');
      throw error;
    }
  },

  /**
   * Remove a bottle from an event
   */
  async removeFromEvent(eventId: string, bottleId: string): Promise<void> {
    try {
      console.log('Removing bottle from event:', eventId, bottleId);
      const endpoint = API_ENDPOINTS.bottles.removeFromEvent(eventId, bottleId);
      
      await apiClient.delete(endpoint);
      console.log('Successfully removed bottle from event');
    } catch (error) {
      console.error('Error in removeFromEvent:', error);
      handleApiError(error, 'removeFromEvent');
      throw error;
    }
  },

  /**
   * Get a single bottle by ID
   */
  async getById(bottleId: string): Promise<Bottle> {
    try {
      console.log('Fetching bottle by ID:', bottleId);
      const endpoint = API_ENDPOINTS.bottles.get(bottleId);
      
      const response = await apiClient.get<Bottle>(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error in getById:', error);
      handleApiError(error, 'getById');
      throw error;
    }
  },

  /**
   * Get all bottles
   */
  async getAll(): Promise<Bottle[]> {
    try {
      console.log('Fetching all bottles');
      const endpoint = API_ENDPOINTS.bottles.list;
      
      const response = await apiClient.get<Bottle[]>(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error in getAll:', error);
      handleApiError(error, 'getAll');
      return [];
    }
  }
}; 