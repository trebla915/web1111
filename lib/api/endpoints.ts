export const API_ENDPOINTS = {
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
    getById: (id: string) => `/events/${id}`,
    create: '/events',
    update: (id: string) => `/events/${id}`,
    delete: (id: string) => `/events/${id}`,
    getByDate: (date: string) => `/events/date/${date}`
  },

  // Table endpoints
  tables: {
    getByEvent: (eventId: string) => `/tables/${eventId}`,
    getById: (eventId: string, tableId: string) => `/tables/${eventId}/${tableId}`,
    addToEvent: (eventId: string) => `/tables/${eventId}`,
    removeFromEvent: (eventId: string, tableId: string) => `/tables/${eventId}/${tableId}`,
    reserve: (eventId: string, tableId: string) => `/tables/${eventId}/${tableId}/reserve`,
    release: (eventId: string, tableId: string) => `/tables/${eventId}/${tableId}/release`
  },

  // Bottle endpoints
  bottles: {
    getByEvent: (eventId: string) => `/bottles/${eventId}`,
    getById: (eventId: string, bottleId: string) => `/bottles/${eventId}/${bottleId}`,
    addToEvent: (eventId: string) => `/bottles/${eventId}`,
    updateBottle: (eventId: string, bottleId: string) => `/bottles/${eventId}/${bottleId}`,
    removeFromEvent: (eventId: string, bottleId: string) => `/bottles/${eventId}/${bottleId}`,
    removeAllFromEvent: (eventId: string) => `/bottles/${eventId}`
  },

  // Reservation endpoints
  reservations: {
    list: '/reservations',
    getById: (id: string) => `/reservations/${id}`,
    create: '/reservations',
    update: (id: string) => `/reservations/${id}`,
    cancel: (id: string) => `/reservations/${id}/cancel`,
    getByUser: (userId: string) => `/users/${userId}/reservations`,
    getByEvent: (eventId: string) => `/reservations/event/${eventId}`
  },

  // Payment endpoints
  payments: {
    createIntent: '/payments/create-payment-intent',
    confirm: (paymentId: string) => `/payments/${paymentId}/confirm`,
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
    update: (bottleId: string) => `/catalog/${bottleId}`,
    delete: (bottleId: string) => `/catalog/${bottleId}`
  }
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS; 