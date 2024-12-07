/**
 * @file UserContext.tsx
 * @description Provides context and state management for user-related data and reservation information.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { auth, db } from '../config/firebase.native'; // Firestore and Auth configuration
import { onAuthStateChanged } from 'firebase/auth';
import { Reservation } from '../utils/types';

// Interface for user data stored in Firestore
interface UserData {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar?: string;
  reservations?: Reservation[];
  role?: string;
}

// Updated interface for reservation details
interface ReservationDetails extends Partial<Reservation> {
  eventDate?: string; // Optional event date
  eventName?: string; // Add eventName to align with backend
  name?: string; // Optional user name
  email?: string; // Optional user email
  tableId?: string; // Optional table ID
  tableNumber?: number; // Optional table number
  guestCount?: number; // Optional guest count
  bottles?: { id: string; name: string; price: number }[]; // List of selected bottles
  mixers?: { id: string; name: string; price: number }[]; // List of selected mixers
}

// Interface for the UserContext
interface UserContextType {
  userData: UserData | null;
  isLoading: boolean;
  reservationDetails: ReservationDetails | null;
  setReservationDetails: (details: ReservationDetails) => void;
  updateReservationDetails: (updates: Partial<ReservationDetails>) => void;
}

// Create UserContext
const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * @component UserProvider
 * @description Wraps the application with user-related state management.
 */
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reservationDetails, setReservationDetails] = useState<ReservationDetails | null>(null);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    let unsubscribeReservations: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeUser = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setUserData({
              id: firebaseUser.uid,
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '', // Include phone if it exists
              avatar: data.avatar || '', // Include avatar field
              role: data.role || '', // Include role field
            });
          } else {
            setUserData(null);
          }
          setIsLoading(false);
        });

        // Listen for reservations
        const reservationsRef = collection(db, 'users', firebaseUser.uid, 'reservations');
        unsubscribeReservations = onSnapshot(reservationsRef, (snapshot) => {
          const reservations = snapshot.docs.map((doc) => doc.data() as Reservation);
          setUserData((prevUserData) => {
            if (!prevUserData) return prevUserData;
            return {
              ...prevUserData,
              reservations,
            };
          });
        });
      } else {
        if (unsubscribeUser) unsubscribeUser();
        if (unsubscribeReservations) unsubscribeReservations();
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeReservations) unsubscribeReservations();
      authUnsubscribe();
    };
  }, []);

  // Update reservation details with added validation for required fields
  const updateReservationDetails = (updates: Partial<ReservationDetails>) => {
    setReservationDetails((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        isLoading,
        reservationDetails,
        setReservationDetails,
        updateReservationDetails,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

/**
 * @hook useUser
 * @description Custom hook to access UserContext.
 */
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
