import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Bottle, Mixer } from '@/types/reservation';

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
