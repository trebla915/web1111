import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface DashboardStats {
  upcomingEvents: number;
  totalUsers: number;
  pendingReservations: number;
}

export const AdminService = {
  /**
   * Fetch dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      // Get all events to calculate upcoming events
      const eventsResponse = await apiClient.get(API_ENDPOINTS.events.list);
      const events = eventsResponse.data || [];
      const now = new Date();
      const currentDateStr = now.toISOString().split('T')[0];
      
      const upcomingEvents = events.filter((event: any) => {
        try {
          let rawEventDateStr = event.date;
          if (!rawEventDateStr.includes('T')) {
            rawEventDateStr = `${rawEventDateStr}T00:00:00.000Z`;
          }
          const eventDate = new Date(rawEventDateStr);
          const normalizedEventDateStr = eventDate.toISOString().split('T')[0];
          return normalizedEventDateStr >= currentDateStr;
        } catch (err) {
          console.warn(`Error processing event date:`, err);
          return false;
        }
      }).length;

      // Get all users
      const usersResponse = await apiClient.get(API_ENDPOINTS.users.profile);
      const totalUsers = usersResponse.data?.total || 0;

      // Get all reservations to count pending ones
      const reservationsResponse = await apiClient.get(API_ENDPOINTS.reservations.list);
      const reservations = reservationsResponse.data || [];
      const pendingReservations = Array.isArray(reservations) 
        ? reservations.filter((res: any) => res.status === 'pending' || !res.status).length
        : 0;

      return {
        upcomingEvents,
        totalUsers,
        pendingReservations
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}; 