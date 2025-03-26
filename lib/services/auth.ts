import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser, 
  sendPasswordResetEmail,
  getIdToken
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { User } from '@/types/user';
import Cookies from 'js-cookie';
import { getUserById } from './users';

// Convert Firebase user to our User type
const formatUser = (user: FirebaseUser): User => {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
  };
};

// Register a new user
export const registerUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Format user with the default role of 'user'
    const user = {
      ...formatUser(userCredential.user),
      role: 'user'
    };
    
    // Get token and store in cookie
    const token = await getIdToken(userCredential.user, true);
    Cookies.set('authToken', token, { expires: 7 }); // 7 days expiry
    
    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Login existing user
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Format the user with basic Firebase info
    const formattedUser = formatUser(userCredential.user);
    
    // Get additional user info from Firestore
    const userDoc = await getUserById(formattedUser.uid);
    
    // Merge Firebase auth info with Firestore data
    const user = {
      ...formattedUser,
      role: userDoc?.role || 'user',
      // Add any other fields from Firestore that you need
    };
    
    // Get token and store in cookie
    const token = await getIdToken(userCredential.user, true);
    console.log('Setting auth token:', {
      tokenLength: token.length,
      uid: user.uid,
      role: user.role
    });
    
    Cookies.set('authToken', token, { 
      expires: 7, // 7 days expiry
      path: '/', // Make sure cookie is available across all paths
      secure: true, // Only send over HTTPS
      sameSite: 'lax' // Allow cross-site requests
    });
    
    // Also store the user's role and basic info in a separate cookie for the middleware
    const userInfo = {
      uid: user.uid,
      email: user.email,
      role: user.role,
    };
    Cookies.set('userInfo', JSON.stringify(userInfo), { 
      expires: 7,
      path: '/',
      secure: true,
      sameSite: 'lax'
    });
    
    return user;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message);
  }
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  // Remove all auth-related cookies
  Cookies.remove('authToken');
  Cookies.remove('userInfo');
  return signOut(auth);
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Format the user with basic Firebase info
        const formattedUser = formatUser(firebaseUser);
        
        // Get additional user info from Firestore
        const userDoc = await getUserById(formattedUser.uid);
        
        // Merge Firebase auth info with Firestore data
        const completeUser = {
          ...formattedUser,
          role: userDoc?.role || 'user',
          // Include any other fields from Firestore
          displayName: userDoc?.displayName || formattedUser.displayName,
          photoURL: userDoc?.photoURL || formattedUser.photoURL,
          phone: userDoc?.phone,
        };
        
        callback(completeUser);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fall back to basic user info if Firestore fetch fails
        callback(formatUser(firebaseUser));
      }
    } else {
      callback(null);
    }
  });
};
