"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BottleService = void 0;
class BottleService {
    static async getByEvent(eventId) {
        try {
            const response = await fetch(`${this.baseUrl}?eventId=${eventId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch bottles');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error getting bottles:', error);
            throw error;
        }
    }
    static async addToEvent(eventId, bottles) {
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
        }
        catch (error) {
            console.error('Error adding bottles to event:', error);
            throw error;
        }
    }
    static async getAll() {
        try {
            const response = await fetch(this.baseUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch bottles');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error getting all bottles:', error);
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
                throw new Error('Failed to fetch bottle');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error getting bottle:', error);
            throw error;
        }
    }
    static async search(query) {
        try {
            const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Failed to search bottles');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error searching bottles:', error);
            throw error;
        }
    }
}
exports.BottleService = BottleService;
BottleService.baseUrl = '/api/bottles';
