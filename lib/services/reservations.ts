import { Reservation } from '@/types/reservation';
import { apiClient } from '@/lib/api/client';

interface CreateReservationRequest {
  paymentId: string;
  reservationDetails: Omit<Reservation, 'id'>;
}

export const createReservation = async (reservationData: Omit<Reservation, 'id'>, paymentId: string): Promise<Reservation> => {
  try {
    const response = await apiClient.post('/reservations', {
      paymentId,
      reservationDetails: reservationData
    });
    return response.data;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

export const updateReservation = async (id: string, reservationData: Partial<Reservation>): Promise<void> => {
  try {
    await apiClient.put(`/reservations/${id}`, reservationData);
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
};

export const deleteReservation = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/reservations/${id}`);
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
};

export const getReservation = async (id: string): Promise<Reservation | null> => {
  try {
    const response = await apiClient.get(`/reservations/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting reservation:', error);
    throw error;
  }
};

export const getAllReservations = async (): Promise<Reservation[]> => {
  try {
    const response = await apiClient.get('/reservations');
    return response.data;
  } catch (error) {
    console.error('Error getting all reservations:', error);
    throw error;
  }
};

export const getReservationsByEvent = async (eventId: string): Promise<Reservation[]> => {
  try {
    const response = await apiClient.get(`/reservations/event/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting reservations by event:', error);
    throw error;
  }
};

export const getReservationsByUser = async (userId: string): Promise<Reservation[]> => {
  try {
    const response = await apiClient.get(`/reservations/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting reservations by user:', error);
    throw error;
  }
};

export const getGroupedByEvent = async (): Promise<{ [eventId: string]: Reservation[] }> => {
  try {
    const response = await apiClient.get('/reservations');
    return response.data.data;
  } catch (error) {
    console.error('Error getting reservations grouped by event:', error);
    throw error;
  }
}; 