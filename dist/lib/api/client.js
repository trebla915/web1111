"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleApiError = exports.apiClient = void 0;
const axios_1 = __importDefault(require("axios"));
// Create an axios instance with default config
// Always use the configured API URL 
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
console.log('API Base URL:', apiBaseUrl);
exports.apiClient = axios_1.default.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add a request interceptor to add auth token
exports.apiClient.interceptors.request.use((config) => {
    // Check if we're running in a browser environment before accessing localStorage
    if (typeof window !== 'undefined') {
        // Get the token from localStorage
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// Add a response interceptor to handle errors
exports.apiClient.interceptors.response.use((response) => response, (error) => {
    // Check if we're running in a browser environment
    if (typeof window !== 'undefined') {
        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401) {
            // Clear the token and redirect to login
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});
// Helper function to handle API errors
const handleApiError = (error) => {
    console.error('API Error:', error);
    const message = error.response?.data?.error || error.message || 'An error occurred';
    throw new Error(message);
};
exports.handleApiError = handleApiError;
