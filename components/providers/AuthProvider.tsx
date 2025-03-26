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
}

// Create the context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  forgotPassword: async () => {},
  isGuest: false,
  refreshToken: async () => {}
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

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
          secure: true,
          sameSite: 'lax'
        });
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      try {
        if (user) {
          // Get fresh token
          const token = await getIdToken(user, true);
          Cookies.set('authToken', token, { 
            expires: 7,
            path: '/',
            secure: true,
            sameSite: 'lax'
          });
          
          // Check if user should be admin based on email
          if (user.email) {
            const isAdmin = user.email.includes('admin') || 
                          user.email === 'albert@1111eptx.com' ||
                          user.email === 'admin@1111eptx.com';
            
            // Force admin role if email matches
            if (isAdmin && user.role !== 'admin') {
              user.role = 'admin';
            }
            
            // Check for promoter
            if (user.email.includes('promoter') && user.role !== 'promoter') {
              user.role = 'promoter';
            }
          }
          
          setUser(user);
          console.log('User authenticated with role:', user.role);
        } else {
          // Clear token when user is not authenticated
          Cookies.remove('authToken');
          setUser(null);
          console.log('User logged out, token cleared');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const user = await loginUser(email, password);
      
      // Set user immediately which will update UI components
      setUser(user);
      
      // Ensure token is set
      await refreshToken();
      
      toast.success("Logged in successfully");
      
      // Route based on user role
      if (user && (user.role === 'admin' || user.role === 'promoter')) {
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

  const logout = async () => {
    try {
      // Handle guest mode logout
      if (isGuest) {
        localStorage.removeItem('guestMode');
        setUser(null);
        Cookies.remove('authToken');
        window.location.reload(); // Refresh to update UI
        return;
      }
      
      // Otherwise logout from Firebase
      await logoutUser();
      setUser(null);
      Cookies.remove('authToken');
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      const user = await registerUser(email, password);
      
      // Create the user document in Firestore
      await createUserDocument(user);
      
      // Ensure token is set
      await refreshToken();
      
      setUser(user);
      toast.success("Account created successfully");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await resetPassword(email);
      toast.success("Password reset email sent");
    } catch (error: any) {
      toast.error(error.message);
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
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}