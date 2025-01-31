// src/lib/utils/apiClient.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';



interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_API_BASE_URL environment variable');
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const errorData = error.response?.data || {};
    const errorMessage = [
      errorData.message,
      errorData.error,
      error.message,
      error.response?.statusText,
      'An unknown error occurred'
    ].find(Boolean) as string;

    // Enhanced logging
    console.error('API Error:', {
      message: errorMessage,
      status: error.response?.status,
      url: error.config?.url,
      requestBody: error.config?.data ? JSON.parse(error.config.data) : null,
      responseData: error.response?.data
    });

    return Promise.reject(errorMessage);
  }
);

export { apiClient };