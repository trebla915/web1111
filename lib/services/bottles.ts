import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Bottle } from '@/types/reservation';

export const BottleService = {
  /**
   * Fetch all bottles for a specific event
   */
  getByEvent: async (eventId: string): Promise<Bottle[]> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.bottles.getByEvent(eventId));
      return response.data || [];
    } catch (error) {
      console.error('Error fetching bottles:', error);
      return [];
    }
  },

  /**
   * Fetch a single bottle by ID
   */
  getById: async (eventId: string, bottleId: string): Promise<Bottle | null> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.bottles.getById(eventId, bottleId));
      return response.data;
    } catch (error) {
      console.error('Error fetching bottle:', error);
      return null;
    }
  },

  /**
   * Add bottles to an event
   */
  addToEvent: async (eventId: string, bottles: Omit<Bottle, 'id'>[]): Promise<Bottle[]> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.bottles.addToEvent(eventId), bottles);
      return response.data;
    } catch (error) {
      console.error('Error adding bottles:', error);
      throw error;
    }
  },

  /**
   * Update a bottle in an event
   */
  updateBottle: async (eventId: string, bottleId: string, updates: Partial<Bottle>): Promise<Bottle | null> => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.bottles.updateBottle(eventId, bottleId), updates);
      return response.data;
    } catch (error) {
      console.error('Error updating bottle:', error);
      throw error;
    }
  },

  /**
   * Remove a bottle from an event
   */
  removeFromEvent: async (eventId: string, bottleId: string): Promise<void> => {
    try {
      await apiClient.delete(API_ENDPOINTS.bottles.removeFromEvent(eventId, bottleId));
    } catch (error) {
      console.error('Error removing bottle:', error);
      throw error;
    }
  },

  /**
   * Remove all bottles from an event
   */
  removeAllFromEvent: async (eventId: string): Promise<void> => {
    try {
      await apiClient.delete(API_ENDPOINTS.bottles.removeAllFromEvent(eventId));
    } catch (error) {
      console.error('Error removing all bottles:', error);
      throw error;
    }
  },

  /**
   * Get all bottles from catalog
   */
  getAllFromCatalog: async (): Promise<Bottle[]> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.catalog.list);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching catalog bottles:', error);
      return [];
    }
  },

  /**
   * Add a bottle to catalog
   */
  addToCatalog: async (bottle: Omit<Bottle, 'id'>): Promise<Bottle> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.catalog.add, bottle);
      return response.data;
    } catch (error) {
      console.error('Error adding bottle to catalog:', error);
      throw error;
    }
  },

  /**
   * Update a bottle in catalog
   */
  updateInCatalog: async (bottleId: string, updates: Partial<Bottle>): Promise<Bottle> => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.catalog.update(bottleId), updates);
      return response.data;
    } catch (error) {
      console.error('Error updating bottle in catalog:', error);
      throw error;
    }
  },

  /**
   * Delete a bottle from catalog
   */
  deleteFromCatalog: async (bottleId: string): Promise<void> => {
    try {
      await apiClient.delete(API_ENDPOINTS.catalog.delete(bottleId));
    } catch (error) {
      console.error('Error deleting bottle from catalog:', error);
      throw error;
    }
  }
}; 