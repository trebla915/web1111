"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationService = void 0;
class ReservationService {
    static async getAll() {
        try {
            const response = await fetch(this.baseUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch reservations');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error getting reservations:', error);
            throw error;
        }
    }
    static async getById(id) {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error('Failed to fetch reservation');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error getting reservation:', error);
            throw error;
        }
    }
    static async getByEvent(eventId) {
        try {
            const response = await fetch(`${this.baseUrl}/event/${eventId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch reservations for event');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error getting reservations by event:', error);
            throw error;
        }
    }
    static async getGroupedByEvent() {
        try {
            const response = await fetch(this.baseUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch grouped reservations');
            }
            const data = await response.json();
            // Transform the response into the expected format
            return data.reduce((acc, item) => {
                acc[item.event.id] = item.reservations;
                return acc;
            }, {});
        }
        catch (error) {
            console.error('Error getting grouped reservations:', error);
            throw error;
        }
    }
    static async create(reservation) {
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
        }
        catch (error) {
            console.error('Error creating reservation:', error);
            throw error;
        }
    }
    static async update(id, updates) {
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
        }
        catch (error) {
            console.error('Error updating reservation:', error);
            throw error;
        }
    }
    static async delete(id) {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete reservation');
            }
        }
        catch (error) {
            console.error('Error deleting reservation:', error);
            throw error;
        }
    }
}
exports.ReservationService = ReservationService;
ReservationService.baseUrl = '/api/reservations';
