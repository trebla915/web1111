"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BottleService = void 0;
const client_1 = require("@/lib/api/client");
const endpoints_1 = require("@/lib/api/endpoints");
exports.BottleService = {
    /**
     * Fetch all bottles for a specific event
     */
    getByEvent: async (eventId) => {
        try {
            const response = await client_1.apiClient.get(endpoints_1.API_ENDPOINTS.bottles.getByEvent(eventId));
            return response.data || [];
        }
        catch (error) {
            console.error('Error fetching bottles:', error);
            return [];
        }
    },
    /**
     * Fetch a single bottle by ID
     */
    getById: async (eventId, bottleId) => {
        try {
            const response = await client_1.apiClient.get(endpoints_1.API_ENDPOINTS.bottles.getById(eventId, bottleId));
            return response.data;
        }
        catch (error) {
            console.error('Error fetching bottle:', error);
            return null;
        }
    },
    /**
     * Add bottles to an event
     */
    addToEvent: async (eventId, bottles) => {
        try {
            const response = await client_1.apiClient.post(endpoints_1.API_ENDPOINTS.bottles.addToEvent(eventId), bottles);
            return response.data;
        }
        catch (error) {
            console.error('Error adding bottles:', error);
            throw error;
        }
    },
    /**
     * Update a bottle in an event
     */
    updateBottle: async (eventId, bottleId, updates) => {
        try {
            const response = await client_1.apiClient.put(endpoints_1.API_ENDPOINTS.bottles.updateBottle(eventId, bottleId), updates);
            return response.data;
        }
        catch (error) {
            console.error('Error updating bottle:', error);
            throw error;
        }
    },
    /**
     * Remove a bottle from an event
     */
    removeFromEvent: async (eventId, bottleId) => {
        try {
            await client_1.apiClient.delete(endpoints_1.API_ENDPOINTS.bottles.removeFromEvent(eventId, bottleId));
        }
        catch (error) {
            console.error('Error removing bottle:', error);
            throw error;
        }
    },
    /**
     * Remove all bottles from an event
     */
    removeAllFromEvent: async (eventId) => {
        try {
            await client_1.apiClient.delete(endpoints_1.API_ENDPOINTS.bottles.removeAllFromEvent(eventId));
        }
        catch (error) {
            console.error('Error removing all bottles:', error);
            throw error;
        }
    },
    /**
     * Get all bottles from catalog
     */
    getAllFromCatalog: async () => {
        try {
            const response = await client_1.apiClient.get(endpoints_1.API_ENDPOINTS.catalog.list);
            return response.data || [];
        }
        catch (error) {
            console.error('Error fetching catalog bottles:', error);
            return [];
        }
    },
    /**
     * Add a bottle to catalog
     */
    addToCatalog: async (bottle) => {
        try {
            const response = await client_1.apiClient.post(endpoints_1.API_ENDPOINTS.catalog.add, bottle);
            return response.data;
        }
        catch (error) {
            console.error('Error adding bottle to catalog:', error);
            throw error;
        }
    },
    /**
     * Update a bottle in catalog
     */
    updateInCatalog: async (bottleId, updates) => {
        try {
            const response = await client_1.apiClient.put(endpoints_1.API_ENDPOINTS.catalog.update(bottleId), updates);
            return response.data;
        }
        catch (error) {
            console.error('Error updating bottle in catalog:', error);
            throw error;
        }
    },
    /**
     * Delete a bottle from catalog
     */
    deleteFromCatalog: async (bottleId) => {
        try {
            await client_1.apiClient.delete(endpoints_1.API_ENDPOINTS.catalog.delete(bottleId));
        }
        catch (error) {
            console.error('Error deleting bottle from catalog:', error);
            throw error;
        }
    }
};
