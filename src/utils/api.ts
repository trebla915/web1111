import axios from 'axios'; // Frontend: HTTP client for making API requests
import AsyncStorage from '@react-native-async-storage/async-storage'; // Frontend: Storage for authentication tokens

/**
 * Centralized Axios instance for API calls
 * Base URL points to the backend API
 */
const apiClient = axios.create({
  baseURL: 'https://api-23psv7suga-uc.a.run.app', // Base URL for all API calls
  headers: {
    'Content-Type': 'application/json', // Set default content type
  },
});

/**
 * Interceptor to attach Authorization token dynamically to each request
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken'); // Retrieve token from storage
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`; // Attach token to Authorization header
      }
      return config; // Return updated config with Authorization token
    } catch (error) {
      console.error('Error attaching token to request:', error); // Log errors
      return Promise.reject(error); // Reject promise if error occurs
    }
  },
  (error) => Promise.reject(error) // Handle errors during request interception
);

/**
 * Utility function to handle API errors
 * @param error - The error object from Axios
 * @param action - Description of the action being performed
 */
const handleApiError = (error: any, action: string) => {
  if (error.response) {
    // Log specific HTTP response error details
    console.error(`Error during ${action}:`, error.response.status, error.response.data);
    throw new Error(error.response.data?.message || `Failed to ${action}.`); // Throw descriptive error
  }
  // Log and throw unhandled errors
  console.error(`Unhandled error during ${action}:`, error.message || error);
  throw error;
};

/**
 * Function to set or remove Authorization token
 * @param token - The token to set or null to remove the Authorization header
 */
const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers['Authorization'] = `Bearer ${token}`; // Set Authorization header
  } else {
    delete apiClient.defaults.headers['Authorization']; // Remove Authorization header
  }
};

// Export all utilities and the Axios instance
export { apiClient, handleApiError, setAuthToken };