import { apiClient, handleApiError } from './api';
import { Table } from './types';

/**
 * Fetch all tables for a specific event
 */
export const fetchTablesByEvent = async (eventId: string): Promise<Table[]> => {
  try {
    const response = await apiClient.get<Table[]>(`/tables/${eventId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch tables by event');
    // For development purposes only, in real app remove this and properly handle the error
    console.log('API error occurred, falling back to mock tables for development');
    return [];
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
    return [];
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
 * Add tables to an event
 */
export const addTablesToEvent = async (
  eventId: string,
  numberOfTables: number,
  seatsPerTable: number
): Promise<void> => {
  try {
    await apiClient.post(`/tables/${eventId}`, { numberOfTables, seatsPerTable });
  } catch (error) {
    handleApiError(error, 'add tables to event');
    throw error;
  }
};

/**
 * Remove a table from an event
 */
export const removeTable = async (eventId: string, tableId: string): Promise<void> => {
  try {
    await apiClient.delete(`/tables/${eventId}/${tableId}`);
  } catch (error) {
    handleApiError(error, 'remove table');
    throw error;
  }
}; 