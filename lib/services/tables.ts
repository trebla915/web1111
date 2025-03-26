import { Table } from '@/types/reservation';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

// Mock data for local testing when API is down
const MOCK_TABLES: Table[] = [
  {
    id: 'table1',
    number: '1',
    capacity: 4,
    status: 'available',
    position: { x: 100, y: 100 },
    price: 500,
    minimumSpend: 500,
    description: 'Standard table for 4 people'
  },
  {
    id: 'table2',
    number: '2',
    capacity: 6,
    status: 'available',
    position: { x: 200, y: 100 },
    price: 1000,
    minimumSpend: 1000,
    description: 'Premium table for 6 people'
  },
  {
    id: 'vip1',
    number: 'VIP-1',
    capacity: 8,
    status: 'available',
    position: { x: 300, y: 100 },
    price: 2000,
    minimumSpend: 2000,
    description: 'VIP table for 8 people'
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
    
    const response = await apiClient.get(url);
    console.log('Successfully fetched tables:', response.data?.length || 0, 'tables');
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
  } catch (error) {
    console.error('Error releasing table:', error);
    throw error;
  }
}; 