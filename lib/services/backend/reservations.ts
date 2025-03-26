import { Reservation } from '@/types/reservation';

export class ReservationService {
  private static baseUrl = '/api/reservations';

  static async getAll(): Promise<Reservation[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting reservations:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<Reservation | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch reservation');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting reservation:', error);
      throw error;
    }
  }

  static async getByEvent(eventId: string): Promise<Reservation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/event/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reservations for event');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting reservations by event:', error);
      throw error;
    }
  }

  static async getGroupedByEvent(): Promise<{ [eventId: string]: Reservation[] }> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch grouped reservations');
      }
      const data = await response.json();
      
      // Transform the response into the expected format
      return data.reduce((acc: { [eventId: string]: Reservation[] }, item: any) => {
        acc[item.event.id] = item.reservations;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting grouped reservations:', error);
      throw error;
    }
  }

  static async create(reservation: Omit<Reservation, 'id'>): Promise<Reservation> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservation),
      });

      if (!response.ok) {
        throw new Error('Failed to create reservation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  static async update(id: string, updates: Partial<Reservation>): Promise<Reservation> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update reservation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete reservation');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      throw error;
    }
  }
} 