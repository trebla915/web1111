import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { setAuthToken } from '../utils/api'; // Import from api
import { createUser } from '../utils/users'; // Import from users
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase.native';

interface AuthContextType {
  firebaseUser: User | null;
  userId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<void>;
  token: string | null;
  refreshAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [authState, setAuthState] = useState<{
    firebaseUser: User | null;
    userId: string | null;
    token: string | null;
    isLoading: boolean;
  }>({
    firebaseUser: null,
    userId: null,
    token: null,
    isLoading: true,
  });

  const updateToken = async (token: string | null) => {
    try {
      if (token) {
        console.log('Storing token in AsyncStorage:', token);
        await AsyncStorage.setItem('userToken', token);
        setAuthToken(token); // Update Axios headers
      } else {
        console.log('Removing token from AsyncStorage');
        await AsyncStorage.removeItem('userToken');
        setAuthToken(null); // Clear Axios headers
      }
      setAuthState((prev) => ({ ...prev, token }));
    } catch (error) {
      console.error('Error updating token in storage:', error);
    }
  };

  const refreshAuthToken = async (): Promise<string | null> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      const newToken = await currentUser.getIdToken(true);
      console.log('New token retrieved:', newToken);
      await updateToken(newToken);
      return newToken;
    } catch (error: any) {
      console.error('Error refreshing token:', error.message || error);
      Alert.alert('Error', 'Unable to refresh session. Please sign in again.');
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          console.log('Token retrieved onAuthStateChanged:', token);
  
          // Store userId in AsyncStorage for later retrieval in other components
          await AsyncStorage.setItem('userId', user.uid);
  
          await updateToken(token);
          setAuthState({
            firebaseUser: user,
            userId: user.uid,
            token,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error during authentication:', error);
  
          // Clear stored userId in case of an error
          await AsyncStorage.removeItem('userId');
  
          await updateToken(null);
          setAuthState({
            firebaseUser: null,
            userId: null,
            token: null,
            isLoading: false,
          });
        }
      } else {
        console.log('User signed out. Clearing token.');
  
        // Clear stored userId when user signs out
        await AsyncStorage.removeItem('userId');
  
        await updateToken(null);
        setAuthState({
          firebaseUser: null,
          userId: null,
          token: null,
          isLoading: false,
        });
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  const signIn = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      console.log('Token retrieved on signIn:', token);
      await updateToken(token);
      setAuthState({
        firebaseUser: userCredential.user,
        userId: userCredential.user.uid,
        token,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Sign-in failed:', error.message || error);
      Alert.alert('Error', 'Invalid email or password. Please try again.');
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      console.log('Token retrieved on signUp:', token);
      await createUser({
        id: userCredential.user.uid,
        email,
        name,
        role,
      });
      await updateToken(token);
      setAuthState({
        firebaseUser: userCredential.user,
        userId: userCredential.user.uid,
        token,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Sign-up failed:', error.message || error);
      Alert.alert('Error', 'Unable to create an account. Please try again.');
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const signOutUser = async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      console.log('Signing out user.');

      // Perform Firebase sign-out
      await signOut(auth);

      // Navigate to the login screen
      router.replace('/(auth)/Login');
    } catch (error: any) {
      console.error('Sign-out failed:', error.message || error);
      Alert.alert('Error', 'Unable to sign out. Please try again.');
    } finally {
      setAuthState({
        firebaseUser: null,
        userId: null,
        token: null,
        isLoading: false,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser: authState.firebaseUser,
        userId: authState.userId,
        isLoading: authState.isLoading,
        signIn,
        signOut: signOutUser,
        signUp,
        token: authState.token,
        refreshAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};