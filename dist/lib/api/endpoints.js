"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ENDPOINTS = void 0;
exports.API_ENDPOINTS = {
    // Auth endpoints
    auth: {
        login: '/auth/login',
        register: '/auth/register',
        logout: '/auth/logout',
        resetPassword: '/auth/reset-password',
        me: '/auth/me'
    },
    // Event endpoints
    events: {
        list: '/events',
        getById: (id) => `/events/${id}`,
        create: '/events',
        update: (id) => `/events/${id}`,
        delete: (id) => `/events/${id}`,
        getByDate: (date) => `/events/date/${date}`
    },
    // Table endpoints
    tables: {
        getByEvent: (eventId) => `/tables/${eventId}`,
        getById: (eventId, tableId) => `/tables/${eventId}/${tableId}`,
        addToEvent: (eventId) => `/tables/${eventId}`,
        removeFromEvent: (eventId, tableId) => `/tables/${eventId}/${tableId}`,
        reserve: (eventId, tableId) => `/tables/${eventId}/${tableId}/reserve`,
        release: (eventId, tableId) => `/tables/${eventId}/${tableId}/release`
    },
    // Bottle endpoints
    bottles: {
        getByEvent: (eventId) => `/bottles/${eventId}`,
        getById: (eventId, bottleId) => `/bottles/${eventId}/${bottleId}`,
        addToEvent: (eventId) => `/bottles/${eventId}`,
        updateBottle: (eventId, bottleId) => `/bottles/${eventId}/${bottleId}`,
        removeFromEvent: (eventId, bottleId) => `/bottles/${eventId}/${bottleId}`,
        removeAllFromEvent: (eventId) => `/bottles/${eventId}`
    },
    // Reservation endpoints
    reservations: {
        list: '/reservations',
        getById: (id) => `/reservations/${id}`,
        create: '/reservations',
        update: (id) => `/reservations/${id}`,
        cancel: (id) => `/reservations/${id}/cancel`,
        getByUser: (userId) => `/users/${userId}/reservations`,
        getByEvent: (eventId) => `/reservations/event/${eventId}`
    },
    // Payment endpoints
    payments: {
        createIntent: '/payments/create-payment-intent',
        confirm: (paymentId) => `/payments/${paymentId}/confirm`,
        webhook: '/payments/webhook'
    },
    // User endpoints
    users: {
        profile: '/users/profile',
        updateProfile: '/users/profile',
        reservations: '/users/reservations'
    },
    // Notification endpoints
    notifications: {
        saveToken: '/notifications/save-push-token',
        send: '/notifications/send-notification'
    },
    // Catalog endpoints
    catalog: {
        list: '/catalog',
        add: '/catalog',
        update: (bottleId) => `/catalog/${bottleId}`,
        delete: (bottleId) => `/catalog/${bottleId}`
    }
};
