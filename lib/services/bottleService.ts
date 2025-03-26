import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDocs, deleteDoc, query, where, Timestamp } from 'firebase/firestore';

interface EventBottle {
  id: string;
  name: string;
  price: number;
  eventId: string;
}

/**
 * Fetch all bottles for a specific event
 * @param eventId - The ID of the event
 * @returns - An array of bottles associated with the event
 */
export const fetchAllBottlesForEvent = async (eventId: string): Promise<EventBottle[]> => {
  try {
    const bottlesCollection = collection(db, 'eventBottles');
    const q = query(bottlesCollection, where('eventId', '==', eventId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      price: parseFloat(doc.data().price) // Ensure price is a number
    } as EventBottle));
  } catch (error) {
    console.error(`Error fetching bottles for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Add bottles to an event
 * @param eventId - The ID of the event
 * @param bottles - An array of bottles to add
 */
export const addBottlesToEvent = async (eventId: string, bottles: EventBottle[]): Promise<void> => {
  try {
    const batch = [];
    
    for (const bottle of bottles) {
      const bottleRef = doc(db, 'eventBottles', bottle.id);
      
      const bottleData = {
        id: bottle.id,
        name: bottle.name,
        price: bottle.price,
        eventId: eventId,
        updatedAt: Timestamp.now()
      };
      
      batch.push(setDoc(bottleRef, bottleData));
    }
    
    await Promise.all(batch);
    console.log(`Added ${bottles.length} bottles to event ${eventId}`);
  } catch (error) {
    console.error(`Error adding bottles to event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Delete a bottle from an event
 * @param eventId - The ID of the event
 * @param bottleId - The ID of the bottle
 */
export const deleteBottleFromEvent = async (eventId: string, bottleId: string): Promise<void> => {
  try {
    const bottleRef = doc(db, 'eventBottles', bottleId);
    await deleteDoc(bottleRef);
    console.log(`Deleted bottle ${bottleId} from event ${eventId}`);
  } catch (error) {
    console.error(`Error deleting bottle ${bottleId} from event ${eventId}:`, error);
    throw error;
  }
}; 