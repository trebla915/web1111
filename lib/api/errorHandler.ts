import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

interface ErrorResponse {
  message: string;
  code?: string;
  status?: number;
}

export const handleApiError = (error: unknown, defaultMessage = 'An error occurred'): ErrorResponse => {
  // Log for debugging
  console.error('API Error:', error);
  
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    // Handle specific status codes
    if (status === 401) {
      toast.error('You must be logged in to perform this action');
      return { message: 'Authentication required', status, code: 'UNAUTHENTICATED' };
    }
    
    if (status === 403) {
      toast.error('You do not have permission to perform this action');
      return { message: 'Permission denied', status, code: 'FORBIDDEN' };
    }
    
    if (status === 404) {
      return { message: 'Resource not found', status, code: 'NOT_FOUND' };
    }
    
    if (status === 429) {
      toast.error('Too many requests. Please try again later.');
      return { message: 'Rate limit exceeded', status, code: 'RATE_LIMITED' };
    }
    
    if (status && status >= 500) {
      toast.error('Server error. Please try again later.');
      return { message: 'Server error', status, code: 'SERVER_ERROR' };
    }
    
    toast.error(message || defaultMessage);
    return { message, status, code: 'API_ERROR' };
  }
  
  // Handle Firebase errors
  if (error instanceof Error) {
    const message = error.message;
    
    // Check for Firebase auth errors
    if (message.includes('auth/')) {
      const errorCode = message.split(':')[0].trim();
      
      if (errorCode.includes('wrong-password')) {
        toast.error('Invalid email or password');
        return { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' };
      }
      
      if (errorCode.includes('user-not-found')) {
        toast.error('User not found');
        return { message: 'User not found', code: 'USER_NOT_FOUND' };
      }
      
      if (errorCode.includes('email-already-in-use')) {
        toast.error('Email already in use');
        return { message: 'Email already in use', code: 'EMAIL_IN_USE' };
      }
    }
    
    toast.error(message || defaultMessage);
    return { message, code: 'GENERIC_ERROR' };
  }
  
  // Fallback for unknown errors
  toast.error(defaultMessage);
  return { message: defaultMessage, code: 'UNKNOWN_ERROR' };
};
