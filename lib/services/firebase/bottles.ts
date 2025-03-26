import { db } from '@/lib/firebase/config';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import type { Bottle } from '@/types/reservation';

export const FirebaseBottleService = {
  /**
   * Fetch all bottles for a specific event from Firestore
   */
  async getByEvent(eventId: string): Promise<Bottle[]> {
    try {
      console.log('Fetching bottles from Firestore for event:', eventId);
      const bottlesCollection = collection(db, 'bottles');
      const q = query(bottlesCollection, where('eventId', '==', eventId));
      
      const querySnapshot = await getDocs(q);
      const bottles = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bottle[];
      
      console.log('Found bottles in Firestore:', bottles.length);
      return bottles;
    } catch (error) {
      console.error('Error fetching bottles from Firestore:', error);
      throw error;
    }
  },

  /**
   * Add a bottle to Firestore
   */
  async add(bottle: Omit<Bottle, 'id'>): Promise<Bottle> {
    try {
      console.log('Adding bottle to Firestore:', bottle);
      const bottlesCollection = collection(db, 'bottles');
      const docRef = await addDoc(bottlesCollection, bottle);
      
      return {
        id: docRef.id,
        ...bottle
      };
    } catch (error) {
      console.error('Error adding bottle to Firestore:', error);
      throw error;
    }
  },

  /**
   * Update a bottle in Firestore
   */
  async update(bottleId: string, updates: Partial<Bottle>): Promise<void> {
    try {
      console.log('Updating bottle in Firestore:', bottleId, updates);
      const bottleRef = doc(db, 'bottles', bottleId);
      await updateDoc(bottleRef, updates);
    } catch (error) {
      console.error('Error updating bottle in Firestore:', error);
      throw error;
    }
  },

  /**
   * Delete a bottle from Firestore
   */
  async delete(bottleId: string): Promise<void> {
    try {
      console.log('Deleting bottle from Firestore:', bottleId);
      const bottleRef = doc(db, 'bottles', bottleId);
      await deleteDoc(bottleRef);
    } catch (error) {
      console.error('Error deleting bottle from Firestore:', error);
      throw error;
    }
  },

  /**
   * Get a single bottle by ID from Firestore
   */
  async getById(bottleId: string): Promise<Bottle | null> {
    try {
      console.log('Fetching bottle from Firestore by ID:', bottleId);
      const bottleRef = doc(db, 'bottles', bottleId);
      const bottleDoc = await getDoc(bottleRef);
      
      if (bottleDoc.exists()) {
        return {
          id: bottleDoc.id,
          ...bottleDoc.data()
        } as Bottle;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching bottle from Firestore:', error);
      throw error;
    }
  },

  /**
   * Get all bottles from Firestore
   */
  async getAll(): Promise<Bottle[]> {
    try {
      console.log('Fetching all bottles from Firestore');
      const bottlesCollection = collection(db, 'bottles');
      const querySnapshot = await getDocs(bottlesCollection);
      
      const bottles = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bottle[];
      
      console.log('Found bottles in Firestore:', bottles.length);
      return bottles;
    } catch (error) {
      console.error('Error fetching bottles from Firestore:', error);
      throw error;
    }
  }
}; 