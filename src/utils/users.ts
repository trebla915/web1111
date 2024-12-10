// src/utils/users.ts

import { apiClient, handleApiError } from './api'; // Import centralized axios and error handler
import { User } from './types'; // Assuming User type is defined

// Create a new user.

export const createUser = async (userData: User): Promise<User> => {
  try {
    const response = await apiClient.post<User>("/users", userData); // Pass 'id' in userData
    return response.data;
  } catch (error) {
    handleApiError(error, "create user");
    throw error; // Ensure the error is propagated for logging/debugging
  }
};

// Get user by ID.
export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'get user by ID');
    throw error;
  }
};

// Update user by ID.
export const updateUserById = async (userId: string, updates: Partial<User>): Promise<User> => {
  try {
    const response = await apiClient.patch<User>(`/users/${userId}`, updates);
    return response.data;
  } catch (error) {
    handleApiError(error, 'update user by ID');
    throw error;
  }
};
