"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
class EventService {
    static async create(event) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });
            if (!response.ok) {
                throw new Error('Failed to create event');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }
    static async getAll() {
        try {
            const response = await fetch(this.baseUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error getting events:', error);
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
                throw new Error('Failed to fetch event');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error getting event:', error);
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
                throw new Error('Failed to update event');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    }
    static async delete(id) {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete event');
            }
        }
        catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }
    static async search(query) {
        try {
            const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Failed to search events');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error searching events:', error);
            throw error;
        }
    }
}
exports.EventService = EventService;
EventService.baseUrl = '/api/events';
