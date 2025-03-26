import axios from 'axios';
import { Platform } from 'react-native';

// Determine the base URL based on the environment
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  } else {
    // For mobile use the appropriate API URL
    return process.env.EXPO_PUBLIC_API_URL || 'https://api.yourserver.com/api';
  }
};

// Create API client
export const apiClient = axios.create({
  baseURL: getBaseUrl(),
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