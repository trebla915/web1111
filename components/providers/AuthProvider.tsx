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

// Define the auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  isGuest: boolean; // Keep the guest mode functionality
}

// Create the context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  forgotPassword: async () => {},
  isGuest: false
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Check if user is in guest mode
  const isGuest = typeof window !== 'undefined' && localStorage.getItem('guestMode') === 'true';

  useEffect(() => {
    try {
      // Check for saved user
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        
        // Check if user should be admin based on email
        if (parsedUser.email) {
          const isAdmin = parsedUser.email.includes('admin') || 
                         parsedUser.email === 'albert@1111eptx.com' ||
                         parsedUser.email === 'admin@1111eptx.com';
          
          // Force admin role if email matches
          if (isAdmin && parsedUser.role !== 'admin') {
            parsedUser.role = 'admin';
          }
          
          // Check for promoter
          if (parsedUser.email.includes('promoter') && parsedUser.role !== 'promoter') {
            parsedUser.role = 'promoter';
          }
        }
        
        setUser(parsedUser);
        console.log('Restored user with role:', parsedUser.role);
      } 
      // Check for guest mode
      else if (isGuest) {
        setUser({
          uid: 'guest-user',
          email: 'guest@example.com',
          displayName: 'Guest User',
          role: 'user',
          isGuest: true,
        });
      }
    } catch (error) {
      console.error('Error restoring auth state:', error);
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const user = await loginUser(email, password);
      
      // Set user immediately which will update UI components
      setUser(user);
      
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
        window.location.reload(); // Refresh to update UI
        return;
      }
      
      // Otherwise logout from Firebase
      await logoutUser();
      setUser(null);
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
    isGuest
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}