import { apiClient, handleApiError } from './api';
import { ReservationDetails } from './types';

interface CreateReservationPayload {
  paymentId: string;
  reservationDetails: Omit<ReservationDetails, 'id' | 'createdAt' | 'reservationTime' | 'status'>;
}

/**
 * Create a new reservation
 */
export const createReservation = async (
  payload: CreateReservationPayload
): Promise<string | null> => {
  try {
    const response = await apiClient.post<{ id: string }>('/reservations', payload);
    return response.data.id;
  } catch (error) {
    handleApiError(error, 'create reservation');
    throw error;
  }
};

/**
 * Fetch reservation by ID
 */
export const fetchReservationById = async (
  reservationId: string
): Promise<ReservationDetails | null> => {
  try {
    const response = await apiClient.get<ReservationDetails>(`/reservations/${reservationId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch reservation by ID');
    return null;
  }
};

/**
 * Fetch reservations for a specific user
 */
export const fetchReservationsByUser = async (
  userId: string
): Promise<ReservationDetails[]> => {
  try {
    const response = await apiClient.get<ReservationDetails[]>(`/reservations/user/${userId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch reservations by user');
    return [];
  }
};

/**
 * Fetch all reservations for a specific event
 */
export const fetchReservationsByEvent = async (
  eventId: string
): Promise<ReservationDetails[]> => {
  try {
    const response = await apiClient.get<ReservationDetails[]>(`/reservations/event/${eventId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch reservations by event');
    return [];
  }
};

/**
 * Update reservation status
 */
export const updateReservationStatus = async (
  reservationId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
): Promise<void> => {
  try {
    await apiClient.patch(`/reservations/${reservationId}/status`, { status });
  } catch (error) {
    handleApiError(error, 'update reservation status');
    throw error;
  }
};

/**
 * Fetch all reservations grouped by event
 */
export const fetchReservationsGroupedByEvent = async (): Promise<Record<string, ReservationDetails[]>> => {
  try {
    const response = await apiClient.get<Record<string, ReservationDetails[]>>('/reservations/grouped-by-event');
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch reservations grouped by event');
    return {};
  }
}; 