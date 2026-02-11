import { Reservation } from '@/types/reservation';
import { apiClient } from '@/lib/api/client';

interface CreateReservationRequest {
  paymentId: string;
  reservationDetails: Omit<Reservation, 'id'>;
}

interface CancelReservationRequest {
  reason?: string;
  refundAmount?: number;
  staffName: string;
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

export const deleteReservation = async (eventId: string, id: string): Promise<void> => {
  try {
    // Backend route: DELETE /reservations/:eventId/:id
    // This also releases the table and cleans up user sub-collection in a transaction
    await apiClient.delete(`/reservations/${eventId}/${id}`);
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
};

export const cancelReservation = async (id: string, cancelData: CancelReservationRequest): Promise<any> => {
  try {
    const response = await apiClient.post(`/reservations/${id}/cancel`, cancelData);
    return response.data;
  } catch (error) {
    console.error('Error cancelling reservation:', error);
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

/** GET available tables for changing (same event, unreserved + current). Uses Next.js API. */
export const getAvailableTablesForReservation = async (reservationId: string) => {
  const response = await fetch(`/api/reservations/${reservationId}/available-tables`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load tables');
  }
  return response.json();
};

export interface ChangeTableInitResponse {
  needsPayment: true;
  clientSecret: string;
  paymentIntentId: string;
  amountDue: number;
  newTableId: string;
  newTableNumber: number;
  currentTableNumber: number;
}

export interface ChangeTableSuccessResponse {
  success: true;
  message: string;
  reservation: Reservation;
  refund?: { id: string; amount: number };
}

/** Initiate or complete a table change. For upgrades, call once (get clientSecret), collect payment, then call again with paymentIntentId. */
export const changeReservationTable = async (
  reservationId: string,
  newTableId: string,
  paymentIntentId?: string
): Promise<ChangeTableInitResponse | ChangeTableSuccessResponse> => {
  const body: { newTableId: string; paymentIntentId?: string } = { newTableId };
  if (paymentIntentId) body.paymentIntentId = paymentIntentId;
  const response = await fetch(`/api/reservations/${reservationId}/change-table`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to change table');
  }
  return data;
};

/** Admin: change table with no charge/refund (override). */
export const changeReservationTableAdmin = async (
  reservationId: string,
  newTableId: string
): Promise<ChangeTableSuccessResponse> => {
  const response = await fetch(`/api/reservations/${reservationId}/change-table`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newTableId, adminOverride: true }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to change table');
  }
  return data as ChangeTableSuccessResponse;
};

/** Resend confirmation email. Set forceResend true to send even if already sent (e.g. admin). */
export const resendConfirmationEmail = async (
  reservationId: string,
  forceResend = false
): Promise<{ success: boolean; message?: string; alreadySent?: boolean }> => {
  const response = await fetch(`/api/reservations/${reservationId}/send-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ forceResend }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send confirmation email');
  }
  return data;
};

/** Update reservation contact info (userEmail, userName, userPhone). Uses Next.js API. */
export const updateReservationContact = async (
  reservationId: string,
  updates: { userEmail?: string; userName?: string; userPhone?: string }
): Promise<Reservation> => {
  const response = await fetch(`/api/reservations/${reservationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update reservation');
  }
  return data as Reservation;
}; 