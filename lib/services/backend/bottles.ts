import { Bottle } from '@/types/reservation';

export class BottleService {
  private static baseUrl = '/api/bottles';

  static async getByEvent(eventId: string): Promise<Bottle[]> {
    try {
      const response = await fetch(`${this.baseUrl}?eventId=${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bottles');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting bottles:', error);
      throw error;
    }
  }

  static async addToEvent(eventId: string, bottles: Bottle[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/event/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bottles }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add bottles to event');
      }
    } catch (error) {
      console.error('Error adding bottles to event:', error);
      throw error;
    }
  }

  static async getAll(): Promise<Bottle[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch bottles');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting all bottles:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<Bottle | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch bottle');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting bottle:', error);
      throw error;
    }
  }

  static async search(query: string): Promise<Bottle[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search bottles');
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching bottles:', error);
      throw error;
    }
  }
} 