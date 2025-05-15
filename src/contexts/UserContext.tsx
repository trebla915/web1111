import React, { createContext, useContext, useState, useEffect } from 'react';
import { Reservation } from '../utils/types';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

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
  eventDate?: string;
  eventName?: string;
  name?: string;
  email?: string;
  tableId?: string;
  tableNumber?: number;
  tablePrice?: number;
  capacity?: number; // Add the capacity field here
  guestCount?: number;
  bottles?: { id: string; name: string; price: number }[];
  mixers?: { id: string; name: string; price: number }[];
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

    const authUnsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // Set up listener for user data
        const userDocRef = firestore().collection('users').doc(firebaseUser.uid);
        unsubscribeUser = userDocRef.onSnapshot((docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setUserData((prevData) => ({
              ...prevData,
              id: firebaseUser.uid,
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              avatar: data.avatar || '',
              role: data.role || '',
            }));
          } else {
            setUserData(null);
          }
          setIsLoading(false);
        });

        // Listen for reservations
        const reservationsRef = firestore().collection('users').doc(firebaseUser.uid).collection('reservations');
        unsubscribeReservations = reservationsRef.onSnapshot((snapshot) => {
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
