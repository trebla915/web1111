import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  DocumentReference,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User } from '@/types/user';
import { getAuth } from 'firebase/auth';

const USERS_COLLECTION = 'users';

// Create a new user document in Firestore
export const createUserDocument = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    
    // Determine role based on email
    let role = 'user';
    if (user.email) {
      const isAdmin = user.email.includes('admin') || 
                    user.email === 'albert@1111eptx.com' ||
                    user.email === 'admin@1111eptx.com';
      
      if (isAdmin) {
        role = 'admin';
      } else if (user.email.includes('promoter')) {
        role = 'promoter';
      }
    }
    
    await setDoc(userRef, {
      ...user,
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log(`Created user document with role: ${role}`);
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data() as User;
      console.log('User data from Firestore (direct ID lookup):', userData);
      return userData;
    }
    
    console.log('No user document found for ID:', userId);
    
    // FALLBACK: If no user found by UID, try to find by email
    // This handles the case where user IDs were migrated to email-based format
    try {
      // First, get the user's email from Firebase Auth
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser?.email) {
        console.log('Attempting fallback lookup by email:', currentUser.email);
        const userByEmail = await getUserByEmail(currentUser.email);
        
        if (userByEmail) {
          console.log('Found user via email fallback:', userByEmail);
          return {
            uid: userId, // Keep the original Firebase Auth UID for consistency
            email: userByEmail.email,
            displayName: userByEmail.name || userByEmail.displayName,
            photoURL: userByEmail.avatar || userByEmail.photoURL,
            role: userByEmail.role,
            phone: userByEmail.phone
          } as User;
        }
      }
    } catch (fallbackError) {
      console.warn('Fallback email lookup failed:', fallbackError);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Update user document
export const updateUser = async (userId: string, data: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Anonymize user account - removes personal data but preserves business records
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // Call the backend API to properly anonymize the user account
    // This preserves reservations and business data while removing personal info
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user account');
    }

    const result = await response.json();
    console.log('User account anonymized:', result.message);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Fetches a user's data from Firestore by email
 */
export async function getUserByEmail(email: string): Promise<DocumentData | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Return the first matching user
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
      role: querySnapshot.docs[0].data().role || 'user' // Default role if none exists
    };
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

// Debug function to check user role by email
export const checkUserRoleByEmail = async (email: string): Promise<string | null> => {
  try {
    const user = await getUserByEmail(email);
    console.log('User from Firestore:', user);
    return user?.role || null;
  } catch (error) {
    console.error('Error checking user role:', error);
    return null;
  }
};

// Set user role (for testing/debugging)
export const setUserRole = async (userId: string, role: 'user' | 'admin' | 'promoter'): Promise<boolean> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    
    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp()
    });
    
    console.log(`User ${userId} role set to ${role}`);
    return true;
  } catch (error) {
    console.error(`Error setting role for user ${userId}:`, error);
    throw error;
  }
};

// Update a user's role
export const updateUserRole = async (uid: string, role: string): Promise<boolean> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    
    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating role for user ${uid}:`, error);
    throw error;
  }
};

// Update a user's profile information
export const updateUserProfile = async (uid: string, profileData: Partial<User>): Promise<boolean> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    
    // Ensure we're not updating the UID or email
    const { uid: _, email: __, ...updateData } = profileData;
    
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating profile for user ${uid}:`, error);
    throw error;
  }
};

// Get users by role
export const getUsersByRole = async (role: string): Promise<User[]> => {
  try {
    const usersCollection = collection(db, USERS_COLLECTION);
    const q = query(usersCollection, where('role', '==', role));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data() as User
    }));
  } catch (error) {
    console.error(`Error fetching users with role ${role}:`, error);
    throw error;
  }
};

// Force update user role (for testing/debugging)
export const forceUpdateUserRole = async (userId: string, role: 'user' | 'admin' | 'promoter'): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, {
      role,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log(`Force updated user ${userId} role to ${role}`);
  } catch (error) {
    console.error(`Error force updating role for user ${userId}:`, error);
    throw error;
  }
};
