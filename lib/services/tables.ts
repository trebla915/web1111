import { Table } from '@/types/reservation';

// Calls this app's own /api/events/[id]/tables routes (Firestore-backed).

async function fetchTablesApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const getEventTables = async (eventId: string): Promise<Table[]> => {
  if (!eventId) return [];
  return fetchTablesApi<Table[]>(`/api/events/${eventId}/tables`);
};

export const createEventTable = async (
  eventId: string,
  table: Omit<Table, 'id' | 'eventId' | 'reserved'>
): Promise<Table> => {
  return fetchTablesApi<Table>(`/api/events/${eventId}/tables`, {
    method: 'POST',
    body: JSON.stringify({ ...table, reserved: false }),
  });
};

export const updateEventTable = async (
  eventId: string,
  tableId: string,
  data: Partial<Table>
): Promise<void> => {
  await fetchTablesApi(`/api/events/${eventId}/tables/${tableId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteEventTable = async (eventId: string, tableId: string): Promise<void> => {
  await fetchTablesApi(`/api/events/${eventId}/tables/${tableId}`, { method: 'DELETE' });
};

export const releaseTable = async (eventId: string, tableId: string): Promise<void> => {
  try {
    const res = await fetch(`/api/events/${eventId}/tables/${tableId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reserved: false }),
    });
    if (!res.ok) {
      const status = res.status;
      // 404 = table not found or already released; don't block delete
      if (status === 404) {
        console.warn('Table release returned 404 (table may be already released or id invalid), continuing.');
        return;
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Failed to release table (${status})`);
    }
  } catch (error: any) {
    // Still handle 404 gracefully in case of network errors with status
    if (error?.message?.includes('404')) {
      console.warn('Table release returned 404, continuing.');
      return;
    }
    console.error('Error releasing table:', error);
    throw error;
  }
};
