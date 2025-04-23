import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

if (!API_BASE_URL) {
  console.error('API Base URL is missing. Ensure it is set in your environment.');
  throw new Error('Missing API Base URL.');
}

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
      console.error('Error attaching token to request:', error);
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
const handleApiError = (error, action) => {
  if (error.response) {
    console.error(`Error during ${action}:`, error.response.status, error.response.data);
    throw new Error(error.response.data?.message || `Failed to ${action}.`);
  }
  console.error(`Unhandled error during ${action}:`, error.message || error);
  throw error;
};

/**
 * Function to set or remove Authorization token
 */
const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers['Authorization'];
  }
};

export { apiClient, handleApiError, setAuthToken };