import { db } from '@/lib/firebase/config';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ReservationDetails } from '@/types/reservation';

interface CreateReservationPayload {
  paymentId: string;
  reservationDetails: Omit<ReservationDetails, 'id' | 'createdAt' | 'reservationTime' | 'status'>;
}

/**
 * Create a new reservation
 */
export const createReservation = async (
  payload: CreateReservationPayload
): Promise<string> => {
  try {
    const { paymentId, reservationDetails } = payload;
    
    const reservationData = {
      ...reservationDetails,
      paymentId,
      status: 'confirmed',
      reservationTime: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    
    const reservationsCollection = collection(db, 'reservations');
    const docRef = await addDoc(reservationsCollection, reservationData);
    
    // Update the table to mark it as reserved
    const tableDocRef = doc(db, 'tables', reservationDetails.tableId);
    await updateDoc(tableDocRef, {
      reserved: true
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

/**
 * Fetch reservation by ID
 */
export const fetchReservationById = async (
  reservationId: string
): Promise<ReservationDetails | null> => {
  try {
    const reservationDocRef = doc(db, 'reservations', reservationId);
    const reservationDoc = await getDoc(reservationDocRef);
    
    if (reservationDoc.exists()) {
      const data = reservationDoc.data();
      return {
        id: reservationDoc.id,
        ...data,
        createdAt: data.createdAt 
          ? (data.createdAt as Timestamp).toDate().toISOString() 
          : new Date().toISOString()
      } as ReservationDetails;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching reservation ${reservationId}:`, error);
    throw error;
  }
};

/**
 * Fetch reservations for a specific user
 */
export const fetchReservationsByUser = async (
  userId: string
): Promise<ReservationDetails[]> => {
  try {
    const reservationsCollection = collection(db, 'reservations');
    const q = query(
      reservationsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt 
          ? (data.createdAt as Timestamp).toDate().toISOString() 
          : new Date().toISOString()
      } as ReservationDetails;
    });
  } catch (error) {
    console.error(`Error fetching reservations for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Fetch all reservations for a specific event
 */
export const fetchReservationsByEvent = async (
  eventId: string
): Promise<ReservationDetails[]> => {
  try {
    const reservationsCollection = collection(db, 'reservations');
    const q = query(
      reservationsCollection,
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt 
          ? (data.createdAt as Timestamp).toDate().toISOString() 
          : new Date().toISOString()
      } as ReservationDetails;
    });
  } catch (error) {
    console.error(`Error fetching reservations for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Update reservation status
 */
export const updateReservationStatus = async (
  reservationId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
): Promise<void> => {
  try {
    const reservationDocRef = doc(db, 'reservations', reservationId);
    await updateDoc(reservationDocRef, { status });
  } catch (error) {
    console.error(`Error updating reservation ${reservationId} status:`, error);
    throw error;
  }
};

/**
 * Fetch all reservations grouped by event
 */
export const fetchReservationsGroupedByEvent = async () => {
  try {
    const reservationsCollection = collection(db, 'reservations');
    const q = query(
      reservationsCollection,
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const reservations = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt 
          ? (data.createdAt as Timestamp).toDate().toISOString() 
          : new Date().toISOString()
      } as ReservationDetails;
    });

    // Group by eventId
    const reservationsByEvent: { [eventId: string]: ReservationDetails[] } = {};
    
    reservations.forEach(reservation => {
      if (!reservationsByEvent[reservation.eventId]) {
        reservationsByEvent[reservation.eventId] = [];
      }
      reservationsByEvent[reservation.eventId].push(reservation);
    });
    
    return reservationsByEvent;
  } catch (error) {
    console.error('Error fetching reservations grouped by event:', error);
    throw error;
  }
};
