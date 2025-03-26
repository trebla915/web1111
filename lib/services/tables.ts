import { Table } from '@/types/reservation';
import axios from 'axios';

// Create API client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-23psv7suga-uc.a.run.app';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler utility
const handleApiError = (error: any, context: string) => {
  console.error(`API Error (${context}):`, error.response?.data || error.message || error);
};

/**
 * Add tables to an event
 */
export const addTablesToEvent = async (
  eventId: string,
  numberOfTables: number,
  seatsPerTable: number
): Promise<void> => {
  try {
    const response = await apiClient.post(`/tables/${eventId}`, { numberOfTables, seatsPerTable });
    console.log('Tables added successfully:', response.data);
  } catch (error) {
    handleApiError(error, 'add tables to event');
    throw error;
  }
};

/**
 * Fetch all tables for a specific event
 */
export const fetchTablesByEvent = async (eventId: string): Promise<Table[]> => {
  try {
    console.log(`Fetching tables for event ${eventId} from API: ${apiClient.defaults.baseURL}`);
    const response = await apiClient.get<Table[]>(`/tables/${eventId}`);
    console.log(`API returned ${response.data.length} tables`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch tables by event');
    console.log('API error occurred, falling back to mock tables for development');
    
    // For development: Return mock tables when API fails
    const mockTables: Table[] = [
      { id: 'mock1', number: 1, price: 500, capacity: 4, location: 'left', reserved: false },
      { id: 'mock2', number: 2, price: 550, capacity: 6, location: 'left', reserved: false },
      { id: 'mock3', number: 3, price: 600, capacity: 4, location: 'left', reserved: false },
      { id: 'mock4', number: 4, price: 650, capacity: 8, location: 'left', reserved: false },
      { id: 'mock5', number: 5, price: 800, capacity: 8, location: 'center', reserved: false },
      { id: 'mock6', number: 6, price: 900, capacity: 10, location: 'center', reserved: false },
      { id: 'mock7', number: 7, price: 850, capacity: 8, location: 'center', reserved: false },
      { id: 'mock8', number: 8, price: 500, capacity: 4, location: 'right', reserved: false },
      { id: 'mock9', number: 9, price: 550, capacity: 6, location: 'right', reserved: false },
      { id: 'mock10', number: 10, price: 600, capacity: 4, location: 'right', reserved: false },
      { id: 'mock11', number: 11, price: 650, capacity: 8, location: 'right', reserved: true }
    ];
    
    return mockTables;
  }
};

/**
 * Fetch available tables for a specific event
 */
export const fetchAvailableTablesByEvent = async (eventId: string): Promise<Table[]> => {
  try {
    const response = await apiClient.get<Table[]>(`/tables/${eventId}/available`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch available tables by event');
    return []; // Return an empty array if error occurs
  }
};

/**
 * Fetch a single table for an event by table ID
 */
export const fetchTableById = async (eventId: string, tableId: string): Promise<Table | null> => {
  try {
    const response = await apiClient.get<Table>(`/tables/${eventId}/${tableId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch single table');
    return null;
  }
};

/**
 * Remove a table from an event
 */
export const removeTable = async (eventId: string, tableId: string): Promise<void> => {
  try {
    await apiClient.delete(`/tables/${eventId}/${tableId}`);
    console.log('Table removed successfully');
  } catch (error) {
    handleApiError(error, 'remove table');
    throw error;
  }
};
