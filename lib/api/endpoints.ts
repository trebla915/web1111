// API Endpoints configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    resetPassword: '/auth/reset-password',
    me: '/auth/me',
  },
  
  // Event endpoints
  events: {
    list: '/events',
    get: (id: string) => `/events/${id}`,
    create: '/events',
    update: (id: string) => `/events/${id}`,
    delete: (id: string) => `/events/${id}`,
    getByDate: (date: string) => `/events/date/${date}`,
  },
  
  // Table endpoints
  tables: {
    list: '/tables',
    get: (id: string) => `/tables/${id}`,
    getByEvent: (eventId: string) => `/tables/event/${eventId}`,
    reserve: (id: string) => `/tables/${id}/reserve`,
    release: (id: string) => `/tables/${id}/release`,
  },
  
  // Bottle endpoints
  bottles: {
    list: '/bottles',
    get: (id: string) => `/bottles/${id}`,
    getByEvent: (eventId: string) => `/bottles/event/${eventId}`,
    addToEvent: (eventId: string) => `/bottles/event/${eventId}`,
    removeFromEvent: (eventId: string, bottleId: string) => `/bottles/event/${eventId}/${bottleId}`,
  },
  
  // Reservation endpoints
  reservations: {
    list: '/reservations',
    get: (id: string) => `/reservations/${id}`,
    create: '/reservations',
    update: (id: string) => `/reservations/${id}`,
    cancel: (id: string) => `/reservations/${id}/cancel`,
    getByUser: '/reservations/user',
  },
  
  // Payment endpoints
  payments: {
    createIntent: '/payments/create-intent',
    confirm: '/payments/confirm',
    webhook: '/payments/webhook',
  },
  
  // User endpoints
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
    reservations: '/users/reservations',
  },
} as const;

// Type for API endpoints
export type ApiEndpoint = typeof API_ENDPOINTS; 