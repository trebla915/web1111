import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Reservation } from '@/types/reservation';

const COLLECTION_NAME = 'reservations';

export const createReservation = async (reservationData: Omit<Reservation, 'id'>): Promise<Reservation> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...reservationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return {
      id: docRef.id,
      ...reservationData,
    };
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

export const updateReservation = async (id: string, reservationData: Partial<Reservation>): Promise<void> => {
  try {
    const reservationRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(reservationRef, {
      ...reservationData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
};

export const deleteReservation = async (id: string): Promise<void> => {
  try {
    const reservationRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(reservationRef);
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
};

export const getReservation = async (id: string): Promise<Reservation | null> => {
  try {
    const reservationRef = doc(db, COLLECTION_NAME, id);
    const reservationDoc = await getDoc(reservationRef);
    
    if (reservationDoc.exists()) {
      return {
        id: reservationDoc.id,
        ...reservationDoc.data(),
      } as Reservation;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting reservation:', error);
    throw error;
  }
};

export const getAllReservations = async (): Promise<Reservation[]> => {
  try {
    const reservationsQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(reservationsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Reservation[];
  } catch (error) {
    console.error('Error getting all reservations:', error);
    throw error;
  }
};

export const getReservationsByEvent = async (eventId: string): Promise<Reservation[]> => {
  try {
    const reservationsQuery = query(
      collection(db, COLLECTION_NAME),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(reservationsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Reservation[];
  } catch (error) {
    console.error('Error getting reservations by event:', error);
    throw error;
  }
};

export const getReservationsByUser = async (userId: string): Promise<Reservation[]> => {
  try {
    const reservationsQuery = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(reservationsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Reservation[];
  } catch (error) {
    console.error('Error getting reservations by user:', error);
    throw error;
  }
}; 