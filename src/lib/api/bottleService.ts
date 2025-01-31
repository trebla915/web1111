import { apiClient } from '@/lib/utils/apiClient';
import type { BackendBottle } from '@/types/bottle';

export const fetchAllBottlesForEvent = async (eventId: string): Promise<BackendBottle[]> => {
  try {
    const response = await apiClient.get<BackendBottle[]>(`/bottles/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch bottles:', error);
    throw new Error('Failed to load bottle selection');
  }
};

// Add other service functions as needed