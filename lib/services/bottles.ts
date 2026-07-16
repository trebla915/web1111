import { Bottle } from '@/types/reservation';

export const BottleService = {
  /**
   * Fetch all bottles for a specific event.
   */
  getByEvent: async (eventId: string): Promise<Bottle[]> => {
    try {
      const response = await fetch(`/api/events/${eventId}/bottles`);
      if (!response.ok) return [];
      return (await response.json()) || [];
    } catch (error) {
      console.error('Error fetching bottles:', error);
      return [];
    }
  },

  /**
   * Add bottles to an event
   */
  addToEvent: async (eventId: string, bottles: Omit<Bottle, 'id'>[]): Promise<Bottle[]> => {
    try {
      const response = await fetch(`/api/events/${eventId}/bottles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bottles),
      });
      if (!response.ok) throw new Error('Failed to add bottles');
      return await response.json();
    } catch (error) {
      console.error('Error adding bottles:', error);
      throw error;
    }
  },
};
