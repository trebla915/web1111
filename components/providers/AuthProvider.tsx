"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import { 
  loginUser, 
  logoutUser, 
  registerUser, 
  resetPassword, 
  onAuthStateChange 
} from "@/lib/services/auth";
import { createUserDocument } from "@/lib/services/users";
import { toast } from "react-hot-toast";
import { auth } from '@/lib/firebase/config';
import { getIdToken } from 'firebase/auth';
import Cookies from 'js-cookie';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { setUserRole, getUserById } from "@/lib/services/users";

// Define the auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  isGuest: boolean;
  refreshToken: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Check if user is in guest mode
  const isGuest = typeof window !== 'undefined' && localStorage.getItem('guestMode') === 'true';

  // Function to refresh the auth token
  const refreshToken = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await getIdToken(currentUser, true);
        Cookies.set('authToken', token, { 
          expires: 7,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('Auth state changed - User:', user.email);
        // Clear guest mode if it exists
        localStorage.removeItem('guestMode');
        
        // Get fresh token
        const token = await user.getIdToken(true);
        Cookies.set('authToken', token, { 
          expires: 7,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        // Get user data from Firestore
        const userDoc = await getUserById(user.uid);
        console.log('User document from Firestore:', userDoc);
        
        // Check if user should be admin based on email
        let userRole = userDoc?.role || 'user';
        console.log('Initial user role:', userRole);
        
        if (user.email) {
          const isAdmin = user.email.includes('admin') || 
                        user.email === 'albert@1111eptx.com' ||
                        user.email === 'admin@1111eptx.com';
          
          console.log('Checking admin status:', { email: user.email, isAdmin });
          
          if (isAdmin) {
            userRole = 'admin';
            await setUserRole(user.uid, 'admin');
            console.log('Set user role to admin');
          } else if (user.email.includes('promoter')) {
            userRole = 'promoter';
            await setUserRole(user.uid, 'promoter');
            console.log('Set user role to promoter');
          }
        }
        
        // Set user with role
        const userWithRole = {
          ...user,
          role: userRole
        };
        console.log('Setting user state with role:', userWithRole);
        setUser(userWithRole);

        // Set userInfo cookie for middleware
        const userInfo = {
          uid: user.uid,
          email: user.email,
          role: userRole
        };
        Cookies.set('userInfo', JSON.stringify(userInfo), {
          expires: 7,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        console.log('Set userInfo cookie:', userInfo);
        
        // Only redirect if we're on the login page
        const currentPath = window.location.pathname;
        console.log('Current path:', currentPath);
        if (currentPath === '/auth/login') {
          if (userRole === 'admin' || userRole === 'promoter') {
            console.log('Redirecting to admin dashboard');
            router.replace("/admin/dashboard");
          } else {
            console.log('Redirecting to member dashboard');
            router.replace("/dashboard");
          }
        }
      } else {
        console.log('User logged out');
        Cookies.remove('authToken');
        Cookies.remove('userInfo');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      // Ensure token is set
      await refreshToken();
      
      // Get the user's role from Firestore
      const userDoc = await getUserById(currentUser.uid);
      let userRole = userDoc?.role || 'user';
      
      // Check if user should be admin based on email
      if (currentUser.email) {
        const isAdmin = currentUser.email.includes('admin') || 
                      currentUser.email === 'albert@1111eptx.com' ||
                      currentUser.email === 'admin@1111eptx.com';
        
        // Update user role in Firestore if needed
        if (isAdmin) {
          await setUserRole(currentUser.uid, 'admin');
          userRole = 'admin';
        } else if (currentUser.email.includes('promoter')) {
          await setUserRole(currentUser.uid, 'promoter');
          userRole = 'promoter';
        }
      }
      
      // Set user with role
      const userWithRole = {
        ...currentUser,
        role: userRole
      };
      setUser(userWithRole);

      // Set userInfo cookie for middleware
      const userInfo = {
        uid: currentUser.uid,
        email: currentUser.email,
        role: userRole
      };
      Cookies.set('userInfo', JSON.stringify(userInfo), {
        expires: 7,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      console.log('Set userInfo cookie:', userInfo);
      
      toast.success("Logged in successfully");
      
      // Route based on user role
      if (userRole === 'admin' || userRole === 'promoter') {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Handle guest mode logout
      if (isGuest) {
        localStorage.removeItem('guestMode');
        setUser(null);
        Cookies.remove('authToken');
        Cookies.remove('userInfo');
        window.location.reload(); // Refresh to update UI
        return;
      }
      
      // Otherwise logout from Firebase
      await signOut(auth);
      setUser(null);
      Cookies.remove('authToken');
      Cookies.remove('userInfo');
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      // Determine role based on email
      let role = 'user';
      if (currentUser.email) {
        const isAdmin = currentUser.email.includes('admin') || 
                      currentUser.email === 'albert@1111eptx.com' ||
                      currentUser.email === 'admin@1111eptx.com';
        
        if (isAdmin) {
          role = 'admin';
        } else if (currentUser.email.includes('promoter')) {
          role = 'promoter';
        }
      }
      
      // Create the user document in Firestore with the correct role
      await createUserDocument({
        ...currentUser,
        role
      });
      
      // Ensure token is set
      await refreshToken();
      
      // Set user state with role
      setUser({
        ...currentUser,
        role
      });
      
      toast.success("Account created successfully");
      
      // Route based on role
      if (role === 'admin' || role === 'promoter') {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent");
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  // Context value
  const value = {
    user,
    loading,
    login,
    logout,
    register,
    forgotPassword,
    isGuest,
    refreshToken,
    signIn,
    signUp,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}