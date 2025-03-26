// API Endpoints configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    resetPassword: '/auth/reset-password',
  },
  
  // Event endpoints
  events: {
    list: '/events',
    get: (id: string) => `/events/${id}`,
    create: '/events',
    update: (id: string) => `/events/${id}`,
    delete: (id: string) => `/events/${id}`,
  },
  
  // Table endpoints
  tables: {
    list: '/tables',
    get: (id: string) => `/tables/${id}`,
    getByEvent: (eventId: string) => `/tables/event/${eventId}`,
  },
  
  // Bottle endpoints
  bottles: {
    list: '/bottles',
    get: (id: string) => `/bottles/${id}`,
    getByEvent: (eventId: string) => `/bottles/event/${eventId}`,
    addToEvent: (eventId: string) => `/bottles/${eventId}`,
    removeFromEvent: (eventId: string, bottleId: string) => `/bottles/${eventId}/${bottleId}`,
  },
  
  // Reservation endpoints
  reservations: {
    list: '/reservations',
    get: (id: string) => `/reservations/${id}`,
    create: '/reservations',
    update: (id: string) => `/reservations/${id}`,
    cancel: (id: string) => `/reservations/${id}/cancel`,
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