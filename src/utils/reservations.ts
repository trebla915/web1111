import { apiClient, handleApiError } from './api'; // Frontend: Axios instance and error handler
import { Reservation } from './types'; // Frontend: Type definition for Reservation

/**
 * Fetch reservations for a specific event.
 * @param eventId - The event ID to fetch reservations for.
 * @returns List of reservations for the event.
 */
export const fetchReservationsByEvent = async (eventId: string): Promise<Reservation[]> => {
  try {
    const response = await apiClient.get<Reservation[]>(`/reservations/event/${eventId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch reservations by event');
    return []; // Return an empty array if error occurs
  }
};

/**
 * Fetch a specific reservation by its ID.
 * @param reservationId - The ID of the reservation.
 * @returns Reservation details.
 */
export const fetchReservationById = async (reservationId: string): Promise<Reservation> => {
  try {
    const response = await apiClient.get<Reservation>(`/reservations/${reservationId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch reservation by ID');
    throw error;
  }
};

/**
 * Delete a reservation.
 * @param eventId - The ID of the event associated with the reservation.
 * @param reservationId - The ID of the reservation to delete.
 */
export const deleteReservation = async (eventId: string, reservationId: string): Promise<void> => {
  try {
    await apiClient.delete(`/reservations/${eventId}/${reservationId}`); // Matches backend route
  } catch (error) {
    handleApiError(error, 'delete reservation');
    throw error;
  }
};


/**
 * Fetch all reservations grouped by event.
 * @returns Object containing reservations grouped by event.
 */
export const fetchReservationsGroupedByEvent = async (): Promise<Record<string, Reservation[]>> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: Record<string, Reservation[]> }>('/reservations');
    if (!response.data.success) {
      throw new Error('Failed to fetch reservations grouped by event.');
    }
    return response.data.data;
  } catch (error) {
    handleApiError(error, 'fetch reservations grouped by event');
    return {}; // Return an empty object if error occurs
  }
};

/**
 * Get all reservations for a specific user.
 * @param userId - The ID of the user.
 * @returns List of reservations for the user.
 */
export const getUserReservations = async (userId: string): Promise<Reservation[]> => {
  try {
    console.log('Fetching reservations for user ID:', userId);
    const response = await apiClient.get<Reservation[]>(`/users/${userId}/reservations`);
    console.log('Fetched reservations:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching reservations for user:', error.response || error.message || error);
    handleApiError(error, 'get user reservations');
    return []; // Return an empty array in case of error
  }
};

/**
 * Fetch payment and reservation status by payment ID.
 * @param paymentId - The ID of the payment.
 * @returns Payment status and reservation flag.
 */
export const fetchPaymentStatus = async (
  paymentId: string
): Promise<{ status: string; reservationCreated: boolean }> => {
  try {
    const response = await apiClient.get<{ status: string; reservationCreated: boolean }>(`/payments/${paymentId}/status`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch payment status');
    throw error;
  }
};


/**
 * Create a new reservation.
 * @param reservationData - The data required to create a reservation.
 */
export const createReservation = async (reservationData: {
  paymentId: string;
  reservationDetails: {
    eventId: string;
    tableId: string;
    userId: string;
    tableNumber: number;
    guestCount: number;
    bottles: Array<{ id: string; name: string; price: number }>;
    mixers: Array<{ id: string; name: string; price: number }>;
    eventDate: string;
    eventName: string;
    userName: string;
    userEmail: string;
  };
}): Promise<Reservation> => {
  try {
    const response = await apiClient.post<Reservation>('/reservations', reservationData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'create reservation');
    throw error;
  }
};