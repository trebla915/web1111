import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Debug: Log your API base URL right at the top
console.log('🟦 [apiClient] EXPO_PUBLIC_API_BASE_URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
console.log('🟦 [apiClient] Constants.expoConfig.extra.API_BASE_URL:', Constants.expoConfig?.extra?.API_BASE_URL);

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || Constants.expoConfig?.extra?.API_BASE_URL;

if (!API_BASE_URL) {
  // Immediately tell you if your env is busted
  console.error('🟥 [apiClient] API Base URL is missing. Did you prefix it with EXPO_PUBLIC_ in your .env?');
  throw new Error('Missing API Base URL.');
}

console.log('🟩 [apiClient] Using API Base URL:', API_BASE_URL);

/**
 * Centralized Axios instance for API calls
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor to attach Authorization token dynamically to each request
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('🟥 [apiClient] Error attaching token to request:', error);
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

/**
 * Utility function to handle API errors
 * @param error - The error object from Axios
 * @param action - Description of the action being performed
 */
const handleApiError = (error: any, action: string) => {
  if (error.response) {
    console.error(`🟥 [apiClient] Error during ${action}:`, error.response.status, error.response.data);
    throw new Error(error.response.data?.message || `Failed to ${action}.`);
  }
  console.error(`🟥 [apiClient] Unhandled error during ${action}:`, error.message || error);
  throw error;
};

/**
 * Function to set or remove Authorization token
 */
const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers['Authorization'];
  }
};

export { apiClient, handleApiError, setAuthToken };