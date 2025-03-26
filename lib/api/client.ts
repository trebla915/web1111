import axios, { AxiosError, AxiosInstance } from 'axios';
import Cookies from 'js-cookie';
import { auth } from '@/lib/firebase/config';
import { getIdToken } from 'firebase/auth';

// API Error types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  data?: any;
}

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-23psv7suga-uc.a.run.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to refresh token
const refreshToken = async (): Promise<string | null> => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await getIdToken(currentUser, true);
      Cookies.set('authToken', token, { 
        expires: 7,
        path: '/',
        secure: true,
        sameSite: 'lax'
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = Cookies.get('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && originalRequest && !originalRequest.headers['X-Retry']) {
      try {
        const token = await refreshToken();
        if (token) {
          // Mark this request as retried
          originalRequest.headers['X-Retry'] = 'true';
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
      }
    }

    // Handle other errors
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An unknown error occurred',
      code: error.response?.data?.code,
      status: error.response?.status,
      data: error.response?.data
    };

    console.error('API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      data: error.response?.data
    });

    return Promise.reject(apiError);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: any, context: string): never => {
  const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
  console.error(`[${context}] Error:`, {
    message: errorMessage,
    status: error.response?.status,
    data: error.response?.data
  });
  throw new Error(errorMessage);
};