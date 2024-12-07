// File: src/utils/tables.ts

import { apiClient, handleApiError } from './api'; // Import centralized axios and error handler
import { Table } from './types'; // Assuming Table type is defined

// Add tables to an event
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

// Fetch all tables for an event
export const fetchAllTablesForEvent = async (eventId: string): Promise<Table[]> => {
  try {
    const response = await apiClient.get<Table[]>(`/tables/${eventId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch all tables for event');
    return []; // Return an empty array if error occurs
  }
};

// Fetch a single table for an event by table ID
export const fetchSingleTable = async (eventId: string, tableId: string): Promise<Table> => {
  try {
    const response = await apiClient.get<Table>(`/tables/${eventId}/${tableId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetch single table');
    throw error;
  }
};

// Remove a table from an event
export const removeTable = async (eventId: string, tableId: string): Promise<void> => {
  try {
    await apiClient.delete(`/tables/${eventId}/${tableId}`);
    console.log('Table removed successfully');
  } catch (error) {
    handleApiError(error, 'remove table');
    throw error;
  }
};
