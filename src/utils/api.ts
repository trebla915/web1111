import axios from 'axios';
import { Platform } from 'react-native';

// Determine the base URL based on the environment
export const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'https://api-23psv7suga-uc.a.run.app';
};

// Create API client
export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests when available
export const configureAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Error handler utility
export const handleApiError = (error: any, context: string) => {
  // Log error details
  console.error(`API Error (${context}):`, error.response?.data || error.message || error);
  
  // Return a formatted error message that can be displayed to the user
  return error.response?.data?.message || 'An unexpected error occurred. Please try again.';
}; 