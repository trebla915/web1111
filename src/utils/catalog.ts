// File: src/utils/catalog.ts

import { apiClient, handleApiError } from './api'; // Import centralized axios and error handler
import { BottleCatalog } from './types'; // Assuming BottleCatalog type is defined

// Add a new bottle to the catalog
export const addBottleToCatalog = async (bottle: Omit<BottleCatalog, 'id' | 'size'>): Promise<void> => {
  try {
    const response = await apiClient.post('/catalog', bottle);
    console.log('Bottle added to catalog:', response.data);
  } catch (error) {
    handleApiError(error, 'add bottle to catalog');
    throw error;
  }
};

// Fetch all bottles from the catalog
export const fetchAllBottlesFromCatalog = async (): Promise<BottleCatalog[]> => {
  try {
    const response = await apiClient.get<BottleCatalog[]>('/catalog');
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch all bottles from catalog');
    return []; // Return an empty array if error occurs
  }
};

// Update a bottle in the catalog
export const updateBottleInCatalog = async (
  bottleId: string,
  updates: Partial<BottleCatalog>
): Promise<void> => {
  try {
    const response = await apiClient.put(`/catalog/${bottleId}`, updates);
    console.log('Updated bottle in catalog:', response.data);
  } catch (error) {
    handleApiError(error, 'update bottle in catalog');
    throw error;
  }
};

// Delete a bottle from the catalog
export const deleteBottleFromCatalog = async (bottleId: string): Promise<void> => {
    try {
      await apiClient.delete(`/catalog/${bottleId}`);
      console.log('Bottle deleted from catalog');
    } catch (error) {
      handleApiError(error, 'delete bottle from catalog');
      throw error;
    }
  };
