import { Reservation } from '@/types/reservation';

interface CancelReservationRequest {
  reason?: string;
  refundAmount?: number;
  staffName: string;
}

export const deleteReservation = async (eventId: string, id: string): Promise<void> => {
  try {
    // Releases the table and cleans up the user sub-collection mirror in one batch
    // (see app/api/reservations/[reservationId]/route.ts DELETE)
    const response = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete reservation');
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
};

export const cancelReservation = async (id: string, cancelData: CancelReservationRequest): Promise<any> => {
  try {
    const response = await fetch(`/api/reservations/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cancelData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to cancel reservation');
    return data;
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    throw error;
  }
};

export const getGroupedByEvent = async (): Promise<{ [eventId: string]: Reservation[] }> => {
  try {
    const response = await fetch('/api/reservations');
    if (!response.ok) throw new Error('Failed to fetch reservations');
    return await response.json();
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

/** Initiate or complete a table change. For upgrades, call once (get clientSecret), collect payment, then call again with paymentIntentId. Use deferPaymentIntent: true from admin so customer pays on their page. */
export const changeReservationTable = async (
  reservationId: string,
  newTableId: string,
  paymentIntentId?: string,
  options?: { deferPaymentIntent?: boolean }
): Promise<ChangeTableInitResponse | ChangeTableSuccessResponse> => {
  const body: { newTableId: string; paymentIntentId?: string; deferPaymentIntent?: boolean } = { newTableId };
  if (paymentIntentId) body.paymentIntentId = paymentIntentId;
  if (options?.deferPaymentIntent) body.deferPaymentIntent = true;
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

/** Fix table-change price difference for a reservation already moved (e.g. old admin override). Refunds or charges and sends email. */
export const fixTableChangePriceDifference = async (
  reservationId: string
): Promise<
  | { success: true; message: string; refund?: { id: string; amount: number } }
  | { needsPayment: true; clientSecret: string; paymentIntentId: string; amountDue: number; message: string }
> => {
  const response = await fetch(`/api/reservations/${reservationId}/fix-table-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fix table change');
  }
  return data;
};

/** Get pending table-change payment (for fix upgrade). Returns clientSecret so customer can pay. */
export const getPendingTableChangePayment = async (reservationId: string) => {
  const response = await fetch(`/api/reservations/${reservationId}/pending-table-change-payment`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'No pending payment');
  }
  return response.json() as Promise<{ clientSecret: string; paymentIntentId: string; amountDue: number }>;
};

/** Complete a pending table-change payment (after customer pays the fix upgrade). */
export const completeTableChangePayment = async (
  reservationId: string,
  paymentIntentId: string
): Promise<void> => {
  const response = await fetch(`/api/reservations/${reservationId}/complete-table-change-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentIntentId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to complete payment');
  }
};

/** Resend confirmation email. Set forceResend true to send even if already sent (e.g. admin). */
/** Uses same-origin so the Next.js API route (Vercel) runs it; that route needs RESEND_* and Firebase Admin env vars on Vercel. */
export const resendConfirmationEmail = async (
  reservationId: string,
  forceResend = false
): Promise<{ success: boolean; message?: string; alreadySent?: boolean }> => {
  const url = `/api/reservations/${reservationId}/send-confirmation`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ forceResend }),
  });
  const data = await res.json().catch(() => ({})) as {
    success?: boolean;
    message?: string;
    alreadySent?: boolean;
    error?: string;
    details?: string;
  };
  if (!res.ok) {
    const message = data?.details
      ? `${data.error ?? 'Failed to send confirmation email'}: ${data.details}`
      : (data?.error || 'Failed to send confirmation email');
    throw new Error(message);
  }
  return {
    success: data.success ?? true,
    message: data.message,
    alreadySent: data.alreadySent,
  };
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