"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupedByEvent = exports.getReservationsByUser = exports.getReservationsByEvent = exports.getAllReservations = exports.getReservation = exports.deleteReservation = exports.updateReservation = exports.createReservation = void 0;
const client_1 = require("@/lib/api/client");
const createReservation = async (reservationData) => {
    try {
        const response = await client_1.apiClient.post('/reservations', reservationData);
        return response.data;
    }
    catch (error) {
        console.error('Error creating reservation:', error);
        throw error;
    }
};
exports.createReservation = createReservation;
const updateReservation = async (id, reservationData) => {
    try {
        await client_1.apiClient.put(`/reservations/${id}`, reservationData);
    }
    catch (error) {
        console.error('Error updating reservation:', error);
        throw error;
    }
};
exports.updateReservation = updateReservation;
const deleteReservation = async (id) => {
    try {
        await client_1.apiClient.delete(`/reservations/${id}`);
    }
    catch (error) {
        console.error('Error deleting reservation:', error);
        throw error;
    }
};
exports.deleteReservation = deleteReservation;
const getReservation = async (id) => {
    try {
        const response = await client_1.apiClient.get(`/reservations/${id}`);
        return response.data;
    }
    catch (error) {
        console.error('Error getting reservation:', error);
        throw error;
    }
};
exports.getReservation = getReservation;
const getAllReservations = async () => {
    try {
        const response = await client_1.apiClient.get('/reservations');
        return response.data;
    }
    catch (error) {
        console.error('Error getting all reservations:', error);
        throw error;
    }
};
exports.getAllReservations = getAllReservations;
const getReservationsByEvent = async (eventId) => {
    try {
        const response = await client_1.apiClient.get(`/reservations/event/${eventId}`);
        return response.data;
    }
    catch (error) {
        console.error('Error getting reservations by event:', error);
        throw error;
    }
};
exports.getReservationsByEvent = getReservationsByEvent;
const getReservationsByUser = async (userId) => {
    try {
        const response = await client_1.apiClient.get(`/reservations/user/${userId}`);
        return response.data;
    }
    catch (error) {
        console.error('Error getting reservations by user:', error);
        throw error;
    }
};
exports.getReservationsByUser = getReservationsByUser;
const getGroupedByEvent = async () => {
    try {
        const response = await client_1.apiClient.get('/reservations');
        return response.data.data;
    }
    catch (error) {
        console.error('Error getting reservations grouped by event:', error);
        throw error;
    }
};
exports.getGroupedByEvent = getGroupedByEvent;
