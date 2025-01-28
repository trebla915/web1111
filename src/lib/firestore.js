// lib/firestore.js
import { db } from './firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

// Fetch events data from Firebase Firestore
export const fetchEvents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'events'));
    const events = querySnapshot.docs.map((doc) => doc.data());
    return events;
  } catch (error) {
    console.error("Error fetching events: ", error);
    return [];
  }
};