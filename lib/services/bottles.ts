import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Bottle, Mixer } from '@/types/reservation';
import { apiClient, handleApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { auth } from '@/lib/firebase/config';
import { getIdToken } from 'firebase/auth';
import Cookies from 'js-cookie';

// Helper function to refresh token if needed
const refreshTokenIfNeeded = async () => {
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

/**
 * Fetch a single bottle by ID
 */
export const fetchBottleById = async (bottleId: string): Promise<Bottle | null> => {
  try {
    const bottleDocRef = doc(db, 'bottles', bottleId);
    const bottleDoc = await getDoc(bottleDocRef);
    
    if (bottleDoc.exists()) {
      return {
        id: bottleDoc.id,
        ...bottleDoc.data()
      } as Bottle;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching bottle:', error);
    throw error;
  }
};

/**
 * Fetch all bottles for a specific event
 */
export const fetchBottlesByEvent = async (eventId: string): Promise<Bottle[]> => {
  try {
    const bottlesCollection = collection(db, 'bottles');
    const q = query(bottlesCollection, where('eventId', '==', eventId));
    
    const querySnapshot = await getDocs(q);
    const bottles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Bottle[];
    
    return bottles;
  } catch (error) {
    console.error(`Error fetching bottles for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Fetch all bottles (regardless of event)
 */
export const fetchAllBottles = async (): Promise<Bottle[]> => {
  try {
    const bottlesCollection = collection(db, 'bottles');
    const querySnapshot = await getDocs(bottlesCollection);
    
    const bottles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Bottle[];
    
    return bottles;
  } catch (error) {
    console.error('Error fetching all bottles:', error);
    throw error;
  }
};

/**
 * Fetch all mixers
 */
export const fetchAllMixers = async (): Promise<Mixer[]> => {
  try {
    const mixersCollection = collection(db, 'mixers');
    const querySnapshot = await getDocs(mixersCollection);
    
    const mixers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Mixer[];
    
    return mixers;
  } catch (error) {
    console.error('Error fetching all mixers:', error);
    throw error;
  }
};

// Fetch all bottles for an event
export const fetchAllBottlesForEvent = async (eventId: string): Promise<Bottle[]> => {
  try {
    console.log('Fetching bottles for event:', eventId);
    const endpoint = API_ENDPOINTS.bottles.getByEvent(eventId);
    console.log('Using endpoint:', endpoint);
    
    // Try to refresh token before making the request
    await refreshTokenIfNeeded();
    
    const response = await apiClient.get<Bottle[]>(endpoint);
    console.log('Bottles response:', {
      status: response.status,
      count: response.data.length
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error in fetchAllBottlesForEvent:', error);
    
    // If error is 401, try to refresh token and retry once
    if (error.response?.status === 401) {
      try {
        const token = await refreshTokenIfNeeded();
        if (token) {
          const response = await apiClient.get<Bottle[]>(API_ENDPOINTS.bottles.getByEvent(eventId));
          return response.data;
        }
      } catch (retryError) {
        console.error('Error retrying after token refresh:', retryError);
      }
    }
    
    handleApiError(error, 'fetchAllBottlesForEvent');
    return [];
  }
};

// Fetch a single bottle for an event by bottle ID
export const fetchSingleBottle = async (
  eventId: string,
  bottleId: string
): Promise<Bottle> => {
  try {
    await refreshTokenIfNeeded();
    const response = await apiClient.get<Bottle>(
      API_ENDPOINTS.bottles.removeFromEvent(eventId, bottleId)
    );
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetchSingleBottle');
    throw error;
  }
};

// Add bottles to an event
export const addBottlesToEvent = async (
  eventId: string,
  bottles: Bottle[]
): Promise<void> => {
  try {
    await refreshTokenIfNeeded();
    await apiClient.post(API_ENDPOINTS.bottles.addToEvent(eventId), bottles);
  } catch (error) {
    handleApiError(error, 'addBottlesToEvent');
    throw error;
  }
};

// Remove a bottle from an event
export const removeBottleFromEvent = async (
  eventId: string,
  bottleId: string
): Promise<void> => {
  try {
    await refreshTokenIfNeeded();
    await apiClient.delete(API_ENDPOINTS.bottles.removeFromEvent(eventId, bottleId));
  } catch (error) {
    handleApiError(error, 'removeBottleFromEvent');
    throw error;
  }
};
