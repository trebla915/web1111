import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Event } from '@/types/event';

const COLLECTION_NAME = 'events';

export const createEvent = async (eventData: Omit<Event, 'id'>): Promise<Event> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return {
      id: docRef.id,
      ...eventData,
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, eventData: Partial<Event>): Promise<void> => {
  try {
    const eventRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    const eventRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    const eventRef = doc(db, COLLECTION_NAME, id);
    const eventDoc = await getDoc(eventRef);
    
    if (eventDoc.exists()) {
      return {
        id: eventDoc.id,
        ...eventDoc.data(),
      } as Event;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting event:', error);
    throw error;
  }
};

export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const eventsQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(eventsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];
  } catch (error) {
    console.error('Error getting all events:', error);
    throw error;
  }
};

export const getUpcomingEvents = async (): Promise<Event[]> => {
  try {
    const now = new Date().toISOString();
    const eventsQuery = query(
      collection(db, COLLECTION_NAME),
      where('date', '>=', now),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(eventsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    throw error;
  }
}; 