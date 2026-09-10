import type { Bottle } from '@/types/reservation';

export const BottleService = {
  /**
   * Fetch all bottles for a specific event.
   *
   * Throws on failure. It used to swallow both a non-OK response and a network
   * error into `[]`, which made "this event has no bottles" and "the request
   * failed" the same result on screen — an empty menu, no error, no retry. The
   * caller's own catch block could never fire because nothing was ever thrown.
   *
   * Both callers already wrap this in try/catch, so throwing is what they were
   * written to expect.
   *
   * @param signal Optional AbortSignal. An aborted request rejects with an
   *   AbortError, which callers should ignore rather than surface.
   */
  getByEvent: async (eventId: string, signal?: AbortSignal): Promise<Bottle[]> => {
    const response = await fetch(`/api/events/${eventId}/bottles`, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load bottles (${response.status})`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
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
