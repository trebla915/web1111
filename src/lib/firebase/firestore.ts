// lib/firebase/firestore.ts
/**
 * Firestore database operations
 * @file Firebase Firestore data fetching utilities
 * @requires firebase/firestore
 * @requires @/types - Global type definitions
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from './config';
import { Event } from '../../types'; // Path alias pointing to types/index.ts

/**
 * Fetches all events from Firestore
 * @async
 * @returns {Promise<Event[]>} Array of Event objects
 * @throws {Error} If Firestore query fails
 */
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const eventsCollection = collection(db, 'events');
    const querySnapshot = await getDocs(eventsCollection);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];
  } catch (error) {
    console.error('Firestore Error:', error);
    throw new Error('Failed to fetch events');
  }
};