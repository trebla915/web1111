"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { AuthUser, UserRole } from "@/types/user";
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
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getUserById } from "@/lib/services/users";

// Define the auth context
interface AuthContextType {
  user: AuthUser | null;
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
  const [user, setUser] = useState<AuthUser | null>(null);
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
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };

  useEffect(() => {
    // A Firebase ID token is valid for one hour, but the cookie was written
    // with a 7-day expiry and only refreshed on sign-in. Now that the server
    // actually verifies the token, a stale cookie would sign the user out
    // mid-session. onIdTokenChanged fires on the SDK's own ~55-minute refresh,
    // so the cookie always carries a live token.
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        Cookies.remove('authToken');
        return;
      }
      try {
        const token = await user.getIdToken();
        Cookies.set('authToken', token, {
          expires: 1 / 24, // match the token's own lifetime
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
      } catch {
        // A failed refresh must not break the app; the next call will retry.
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
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

        // Role comes from VERIFIED custom claims in the ID token — the same
        // source the server trusts.
        //
        // This previously inferred admin from the email address IN THE BROWSER
        // (`email.includes('admin')`) and wrote the result into Firestore.
        // Sign-up is self-service, so any address containing the substring
        // "admin" — notadmin@, sysadmin@, even badminton@ — granted
        // administrator. It also means an existing Firestore `role` field is
        // not evidence that anyone approved that role.
        const claimedRole = (await user.getIdTokenResult()).claims.role;
        const userRole: UserRole =
          claimedRole === 'admin' || claimedRole === 'promoter' || claimedRole === 'staff'
            ? claimedRole
            : 'user';

        // Set user with role
        const userWithRole = {
          ...user,
          role: userRole
        };
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

        // Only redirect if we're on the login page
        const currentPath = window.location.pathname;
        if (currentPath === '/auth/login') {
          if (userRole === 'admin' || userRole === 'promoter') {
            router.replace("/admin/dashboard");
          } else {
            router.replace("/dashboard");
          }
        }
      } else {
        Cookies.remove('authToken');
        Cookies.remove('userInfo');
        setUser(null);
      }
      setLoading(false);
    });

    return () => {

      unsubscribe();

      unsubscribeToken();

    };
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
      // Verified claims only — see the note above; email is not evidence of role.
      const claimedRole2 = (await currentUser.getIdTokenResult()).claims.role;
      const userRole: UserRole =
        claimedRole2 === 'admin' || claimedRole2 === 'promoter' || claimedRole2 === 'staff'
          ? claimedRole2
          : 'user';
      
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
      
      // A new account is always an ordinary customer. Privilege is granted
      // deliberately by an administrator, never inferred from an email address.
      const role: UserRole = 'user';
      
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
      
      // A newly registered account is always an ordinary customer, so there is
      // no privileged destination to route to.
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