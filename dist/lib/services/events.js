"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllEvents = exports.getUpcomingEvents = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEvent = exports.getAllEvents = void 0;
const client_1 = require("@/lib/api/client");
const getAllEvents = async () => {
    try {
        const response = await client_1.apiClient.get('/events');
        return response.data;
    }
    catch (error) {
        console.error('Error getting all events:', error);
        throw error;
    }
};
exports.getAllEvents = getAllEvents;
const getEvent = async (id) => {
    try {
        const response = await client_1.apiClient.get(`/events/${id}`);
        return response.data;
    }
    catch (error) {
        if (error?.response?.status === 404) {
            console.log(`Event with ID ${id} not found`);
            return null;
        }
        console.error('Error getting event:', error);
        throw error;
    }
};
exports.getEvent = getEvent;
const createEvent = async (eventData) => {
    try {
        const response = await client_1.apiClient.post('/events', eventData);
        return response.data;
    }
    catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
};
exports.createEvent = createEvent;
const updateEvent = async (id, eventData) => {
    try {
        await client_1.apiClient.put(`/events/${id}`, eventData);
    }
    catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (id) => {
    try {
        await client_1.apiClient.delete(`/events/${id}`);
    }
    catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};
exports.deleteEvent = deleteEvent;
const getUpcomingEvents = async () => {
    try {
        const response = await client_1.apiClient.get('/events');
        const now = new Date();
        // Get current date in YYYY-MM-DD format
        const currentDateStr = now.toISOString().split('T')[0];
        // Check the response structure and access the events array properly
        const events = Array.isArray(response.data) ? response.data :
            (response.data && response.data.events ? response.data.events : []);
        console.log('Current date for comparison:', currentDateStr);
        console.log('All events:', events.map((e) => ({ title: e.title, date: e.date })));
        const filteredEvents = events.filter((event) => {
            try {
                // Handle incomplete date formats
                let rawEventDateStr = event.date;
                if (!rawEventDateStr.includes('T')) {
                    // If no time is specified, assume midnight UTC
                    rawEventDateStr = `${rawEventDateStr}T00:00:00.000Z`;
                }
                const eventDate = new Date(rawEventDateStr);
                // Check if the date is valid
                if (isNaN(eventDate.getTime())) {
                    console.warn(`Invalid date format for event "${event.title}": ${event.date}`);
                    return false;
                }
                // Get event date in YYYY-MM-DD format
                const normalizedEventDateStr = eventDate.toISOString().split('T')[0];
                // Compare dates as strings
                const isIncluded = normalizedEventDateStr >= currentDateStr;
                console.log(`Event "${event.title}" (${event.date} -> ${normalizedEventDateStr}): ${isIncluded ? 'INCLUDED' : 'EXCLUDED'}`);
                return isIncluded;
            }
            catch (err) {
                console.warn(`Error processing event "${event.title}":`, err);
                return false;
            }
        });
        console.log('Filtered events:', filteredEvents.map((e) => ({ title: e.title, date: e.date })));
        return filteredEvents;
    }
    catch (error) {
        console.error('Error getting upcoming events:', error);
        // Return empty array instead of throwing to prevent UI errors
        return [];
    }
};
exports.getUpcomingEvents = getUpcomingEvents;
// Alias for getAllEvents for the sitemap generator
exports.fetchAllEvents = exports.getAllEvents;
