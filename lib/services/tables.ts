import { Table } from '@/types/reservation';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface TableBottleRequirements {
  minimumBottles: number;
}

export const getTableBottleRequirements = async (eventId: string, tableId: string): Promise<TableBottleRequirements> => {
  if (!eventId || !tableId) {
    console.error('Event ID and Table ID are required for getting bottle requirements');
    return { minimumBottles: 1 }; // Safe fallback
  }

  try {
    const table = await getTable(eventId, tableId);
    if (!table) {
      console.warn('Table not found, using default bottle requirements');
      return { minimumBottles: 1 };
    }
    
    // Use the minimumBottles property from the table document (matches backend)
    const minimumBottles = typeof table.minimumBottles === 'number' && table.minimumBottles > 0 
      ? table.minimumBottles 
      : 1;

    return { minimumBottles };
  } catch (error) {
    console.error('Error getting table bottle requirements:', error);
    return { minimumBottles: 1 }; // Safe fallback
  }
};

// Update mock data to match expected API response format
const MOCK_TABLES: Table[] = [
  {
    id: 'table1',
    number: 1,
    capacity: 4,
    price: 500,
    reserved: false,
    location: 'center',
    eventId: undefined,
    minimumBottles: 2  // Fixed to match backend field name
  },
  {
    id: 'table2',
    number: 2,
    capacity: 6,
    price: 1000,
    reserved: false,
    location: 'center',
    eventId: undefined,
    minimumBottles: 2  // Fixed to match backend field name
  },
  {
    id: 'vip1',
    number: 3,
    capacity: 8,
    price: 2000,
    reserved: false,
    location: 'center',
    eventId: undefined,
    minimumBottles: 1  // Fixed to match backend field name
  }
];

// Enable mock data in development for testing
const USE_MOCK_DATA = false;

export const createTable = async (tableData: Omit<Table, 'id'>, eventId: string): Promise<Table> => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.tables.addToEvent(eventId), tableData);
    return response.data;
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
};

export const updateTable = async (eventId: string, tableId: string, tableData: Partial<Table>): Promise<void> => {
  try {
    await apiClient.put(API_ENDPOINTS.tables.getById(eventId, tableId), tableData);
  } catch (error) {
    console.error('Error updating table:', error);
    throw error;
  }
};

export const deleteTable = async (eventId: string, tableId: string): Promise<void> => {
  try {
    await apiClient.delete(API_ENDPOINTS.tables.removeFromEvent(eventId, tableId));
  } catch (error) {
    console.error('Error deleting table:', error);
    throw error;
  }
};

export const getTable = async (eventId: string, tableId: string): Promise<Table | null> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.tables.getById(eventId, tableId));
    return response.data;
  } catch (error) {
    console.error('Error getting table:', error);
    throw error;
  }
};

export const getAllTables = async (): Promise<Table[]> => {
  try {
    // This route may not exist - use with caution
    const response = await apiClient.get('/tables');
    return response.data;
  } catch (error) {
    console.error('Error getting all tables:', error);
    return [];
  }
};

export const getTablesByCapacity = async (eventId: string, minCapacity: number): Promise<Table[]> => {
  try {
    // This specific route may not exist, consider modifying based on backend API
    const tables = await getTablesByEvent(eventId);
    return tables.filter(table => table.capacity >= minCapacity);
  } catch (error) {
    console.error('Error getting tables by capacity:', error);
    return [];
  }
};

export const getTablesByEvent = async (eventId: string): Promise<Table[]> => {
  if (!eventId) {
    console.warn('getTablesByEvent called without a valid eventId');
    return [];
  }

  // Use mock data when enabled - useful for development/testing
  if (USE_MOCK_DATA) {
    console.log('Using mock table data');
    return MOCK_TABLES;
  }

  console.log(`Attempting to fetch tables for event ${eventId}`);
  
  try {
    const url = API_ENDPOINTS.tables.getByEvent(eventId);
    console.log(`Fetching tables from: ${url}`);
    console.log(`Full URL: ${apiClient.defaults.baseURL}${url}`);
    
    const response = await apiClient.get(url);
    console.log('Successfully fetched tables:', response.data?.length || 0, 'tables');
    console.log('First table data:', response.data?.[0]);
    return response.data || [];
  } catch (error: any) {
    console.warn(`Error fetching tables for event ${eventId}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.error || error.message,
      url: error.config?.url
    });
    
    // Return empty array as a fallback
    console.log('Returning empty tables array as fallback');
    return [];
  }
};

export const releaseTable = async (eventId: string, tableId: string): Promise<void> => {
  try {
    await apiClient.put(API_ENDPOINTS.tables.release(eventId, tableId), {});
  } catch (error: any) {
    const status = error?.response?.status;
    // 404 = table not found or already released; don't block delete
    if (status === 404) {
      console.warn('Table release returned 404 (table may be already released or id invalid), continuing.');
      return;
    }
    console.error('Error releasing table:', error);
    throw error;
  }
}; 