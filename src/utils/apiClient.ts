import axios from 'axios';

// API base URL, fetched from environment variables in Next.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // This can be set in .env.local

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

// Interceptor for attaching token (assuming token is stored in cookies or localStorage)
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Get token from localStorage (for client-side only)
      const token = localStorage.getItem('authToken') || ''; // Use token stored in localStorage
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle API response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export { apiClient };