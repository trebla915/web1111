import { db, storage } from '@/lib/firebase/config';
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface BottleCatalog {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

interface BottleData {
  name: string;
  price: number;
  imageUrl: string;
}

interface BottleUpdateData {
  name?: string;
  price?: number;
  imageUrl?: string;
}

/**
 * Fetch all bottles from the catalog
 * @returns An array of bottles
 */
export const fetchAllBottlesFromCatalog = async (): Promise<BottleCatalog[]> => {
  try {
    const bottlesCollection = collection(db, 'bottleCatalog');
    const q = query(bottlesCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      price: parseFloat(doc.data().price) // Ensure price is a number
    } as BottleCatalog));
  } catch (error) {
    console.error('Error fetching all bottles:', error);
    throw error;
  }
};

/**
 * Add a new bottle to the catalog
 * @param bottleData The bottle data to add
 * @returns The ID of the newly created bottle
 */
export const addBottleToCatalog = async (bottleData: BottleData): Promise<string> => {
  try {
    const bottlesCollection = collection(db, 'bottleCatalog');
    
    const bottleToAdd = {
      ...bottleData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(bottlesCollection, bottleToAdd);
    console.log('Bottle added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding bottle to catalog:', error);
    throw error;
  }
};

/**
 * Update a bottle in the catalog
 * @param bottleId The ID of the bottle to update
 * @param updateData The data to update
 */
export const updateBottleInCatalog = async (bottleId: string, updateData: BottleUpdateData): Promise<void> => {
  try {
    const bottleRef = doc(db, 'bottleCatalog', bottleId);
    
    // Check if the bottle exists
    const bottleSnap = await getDoc(bottleRef);
    if (!bottleSnap.exists()) {
      throw new Error(`Bottle with ID ${bottleId} not found`);
    }
    
    // Update the bottle with new data
    await updateDoc(bottleRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
    
    console.log(`Bottle ${bottleId} updated successfully`);
  } catch (error) {
    console.error('Error updating bottle in catalog:', error);
    throw error;
  }
};

/**
 * Delete a bottle from the catalog
 * @param bottleId The ID of the bottle to delete
 */
export const deleteBottleFromCatalog = async (bottleId: string): Promise<void> => {
  try {
    const bottleRef = doc(db, 'bottleCatalog', bottleId);
    
    // Check if the bottle exists
    const bottleSnap = await getDoc(bottleRef);
    if (!bottleSnap.exists()) {
      throw new Error(`Bottle with ID ${bottleId} not found`);
    }
    
    // Delete the bottle
    await deleteDoc(bottleRef);
    console.log(`Bottle ${bottleId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting bottle from catalog:', error);
    throw error;
  }
};

/**
 * Upload a bottle image to storage
 * @param bottleId The ID of the bottle
 * @param file The file to upload
 * @returns The download URL of the uploaded image
 */
export const uploadBottleImage = async (bottleId: string, file: File): Promise<string> => {
  try {
    // Create a storage reference
    const storageRef = ref(storage, `bottles/${bottleId}/${Date.now()}_${file.name}`);
    
    // Convert the file to a Blob if needed
    const fileBlob = file instanceof Blob ? file : await file.arrayBuffer().then(buffer => new Blob([buffer]));
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, fileBlob);
    console.log('Uploaded bottle image:', snapshot.ref.fullPath);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading bottle image:', error);
    throw error;
  }
}; 