"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseTable = exports.getTablesByEvent = exports.getTablesByCapacity = exports.getAllTables = exports.getTable = exports.deleteTable = exports.updateTable = exports.createTable = exports.getTableBottleRequirements = void 0;
const client_1 = require("@/lib/api/client");
const endpoints_1 = require("@/lib/api/endpoints");
const getTableBottleRequirements = async (eventId, tableId) => {
    if (!eventId || !tableId) {
        console.error('Event ID and Table ID are required for getting bottle requirements');
        return { minimumBottles: 1 }; // Safe fallback
    }
    try {
        const table = await (0, exports.getTable)(eventId, tableId);
        if (!table) {
            console.warn('Table not found, using default bottle requirements');
            return { minimumBottles: 1 };
        }
        // Ensure minimumBottles is a valid number
        const minimumBottles = typeof table.minimumBottles === 'number' && table.minimumBottles > 0
            ? table.minimumBottles
            : 1;
        return { minimumBottles };
    }
    catch (error) {
        console.error('Error getting table bottle requirements:', error);
        return { minimumBottles: 1 }; // Safe fallback
    }
};
exports.getTableBottleRequirements = getTableBottleRequirements;
// Update mock data to match expected API response format
const MOCK_TABLES = [
    {
        id: 'table1',
        number: 1,
        capacity: 4,
        price: 500,
        reserved: false,
        location: 'center',
        eventId: undefined,
        minimumBottles: 2 // This should come from the database in real API responses
    },
    {
        id: 'table2',
        number: 2,
        capacity: 6,
        price: 1000,
        reserved: false,
        location: 'center',
        eventId: undefined,
        minimumBottles: 2 // This should come from the database in real API responses
    },
    {
        id: 'vip1',
        number: 3,
        capacity: 8,
        price: 2000,
        reserved: false,
        location: 'center',
        eventId: undefined,
        minimumBottles: 1 // This should come from the database in real API responses
    }
];
// Enable mock data in development for testing
const USE_MOCK_DATA = false;
const createTable = async (tableData, eventId) => {
    try {
        const response = await client_1.apiClient.post(endpoints_1.API_ENDPOINTS.tables.addToEvent(eventId), tableData);
        return response.data;
    }
    catch (error) {
        console.error('Error creating table:', error);
        throw error;
    }
};
exports.createTable = createTable;
const updateTable = async (eventId, tableId, tableData) => {
    try {
        await client_1.apiClient.put(endpoints_1.API_ENDPOINTS.tables.getById(eventId, tableId), tableData);
    }
    catch (error) {
        console.error('Error updating table:', error);
        throw error;
    }
};
exports.updateTable = updateTable;
const deleteTable = async (eventId, tableId) => {
    try {
        await client_1.apiClient.delete(endpoints_1.API_ENDPOINTS.tables.removeFromEvent(eventId, tableId));
    }
    catch (error) {
        console.error('Error deleting table:', error);
        throw error;
    }
};
exports.deleteTable = deleteTable;
const getTable = async (eventId, tableId) => {
    try {
        const response = await client_1.apiClient.get(endpoints_1.API_ENDPOINTS.tables.getById(eventId, tableId));
        return response.data;
    }
    catch (error) {
        console.error('Error getting table:', error);
        throw error;
    }
};
exports.getTable = getTable;
const getAllTables = async () => {
    try {
        // This route may not exist - use with caution
        const response = await client_1.apiClient.get('/tables');
        return response.data;
    }
    catch (error) {
        console.error('Error getting all tables:', error);
        return [];
    }
};
exports.getAllTables = getAllTables;
const getTablesByCapacity = async (eventId, minCapacity) => {
    try {
        // This specific route may not exist, consider modifying based on backend API
        const tables = await (0, exports.getTablesByEvent)(eventId);
        return tables.filter(table => table.capacity >= minCapacity);
    }
    catch (error) {
        console.error('Error getting tables by capacity:', error);
        return [];
    }
};
exports.getTablesByCapacity = getTablesByCapacity;
const getTablesByEvent = async (eventId) => {
    if (!eventId) {
        console.warn('getTablesByEvent called without a valid eventId');
        return [];
    }
    // Use mock data when enabled - useful for development/testing
    if (USE_MOCK_DATA) {
        console.log('Using mock table data');
        return MOCK_TABLES;
    }
    console.log(`Attempting to fetch tables for event ${eventId}`);
    try {
        const url = endpoints_1.API_ENDPOINTS.tables.getByEvent(eventId);
        console.log(`Fetching tables from: ${url}`);
        const response = await client_1.apiClient.get(url);
        console.log('Successfully fetched tables:', response.data?.length || 0, 'tables');
        return response.data || [];
    }
    catch (error) {
        console.warn(`Error fetching tables for event ${eventId}:`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.response?.data?.error || error.message,
            url: error.config?.url
        });
        // Return empty array as a fallback
        console.log('Returning empty tables array as fallback');
        return [];
    }
};
exports.getTablesByEvent = getTablesByEvent;
const releaseTable = async (eventId, tableId) => {
    try {
        await client_1.apiClient.put(endpoints_1.API_ENDPOINTS.tables.release(eventId, tableId), {});
    }
    catch (error) {
        console.error('Error releasing table:', error);
        throw error;
    }
};
exports.releaseTable = releaseTable;
