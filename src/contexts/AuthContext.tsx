import React, { createContext, useContext, useState, useEffect } from "react";
import { Alert } from "react-native";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, User } from "firebase/auth";
import { setAuthToken } from "../utils/api"; // Import from api
import { createUser } from "../utils/users"; // Import from users
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../config/firebase.native";

interface AuthContextType {
  firebaseUser: User | null;
  userId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<void>;
  token: string | null;
  refreshAuthToken: () => Promise<string | null>;
  setGuestMode: (isGuest: boolean) => void;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<{
    firebaseUser: User | null;
    userId: string | null;
    token: string | null;
    isLoading: boolean;
    isGuest: boolean;
  }>({
    firebaseUser: null,
    userId: null,
    token: null,
    isLoading: true,
    isGuest: false,
  });

  const updateToken = async (token: string | null) => {
    try {
      if (token) {
        console.log("Storing token in AsyncStorage:", token);
        await AsyncStorage.setItem("userToken", token);
        setAuthToken(token);
      } else {
        console.log("No token found, removing token from AsyncStorage");
        await AsyncStorage.removeItem("userToken");
        setAuthToken(null);
      }
      setAuthState((prev) => ({ ...prev, token }));
    } catch (error) {
      console.error("Error updating token in storage:", error);
    }
  };

  const refreshAuthToken = async (): Promise<string | null> => {
    try {
      console.log("Refreshing auth token...");
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("No current user found");
        return null;
      }

      const newToken = await currentUser.getIdToken(true);
      console.log("New token retrieved:", newToken);
      await updateToken(newToken);
      return newToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  };

  useEffect(() => {
    console.log("AuthProvider mounted");
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("Checking stored token...");
        const storedToken = await AsyncStorage.getItem("userToken");
        const storedUserId = await AsyncStorage.getItem("userId");
        
        if (storedToken && storedUserId) {
          console.log("Found stored token and userId");
          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              token: storedToken,
              userId: storedUserId,
              isLoading: false
            }));
          }
        } else {
          console.log("No stored credentials found");
          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              isLoading: false
            }));
          }
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
      }
    };

    initializeAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "User logged out");
      
      if (user) {
        try {
          const token = await user.getIdToken();
          console.log("Token retrieved onAuthStateChanged:", token);

          await AsyncStorage.setItem("userId", user.uid);
          await updateToken(token);

          if (mounted) {
            setAuthState({
              firebaseUser: user,
              userId: user.uid,
              token,
              isLoading: false,
              isGuest: false,
            });
          }
        } catch (error) {
          console.error("Error during authentication:", error);
          await AsyncStorage.removeItem("userId");
          await updateToken(null);

          if (mounted) {
            setAuthState({
              firebaseUser: null,
              userId: null,
              token: null,
              isLoading: false,
              isGuest: false,
            });
          }
        }
      } else {
        console.log("No user, clearing auth state");
        if (mounted) {
          setAuthState({
            firebaseUser: null,
            userId: null,
            token: null,
            isLoading: false,
            isGuest: false,
          });
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      console.log("Token retrieved on signIn:", token);
      await updateToken(token);

      setAuthState({
        firebaseUser: userCredential.user,
        userId: userCredential.user.uid,
        token,
        isLoading: false,
        isGuest: false,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Sign-in failed:", error.message);
        Alert.alert("Error", error.message || "An unknown error occurred.");
      } else {
        console.error("Sign-in failed:", error);
        Alert.alert("Error", "An unknown error occurred.");
      }
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      console.log("Token retrieved on signUp:", token);
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
        isGuest: false,
      });
    } catch (error: any) {
      console.error("Sign-up failed:", error.message || error);
      Alert.alert("Error", "Unable to create an account. Please try again.");
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const signOutUser = async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      console.log("Signing out user.");
      await signOut(auth);
      setAuthState({
        firebaseUser: null,
        userId: null,
        token: null,
        isLoading: false,
        isGuest: false,
      });
    } catch (error: any) {
      console.error("Sign-out failed:", error.message || error);
      Alert.alert("Error", "Unable to sign out. Please try again.");
    }
  };

  const setGuestMode = (isGuest: boolean) => {
    setAuthState((prev) => ({
      ...prev,
      firebaseUser: null,
      userId: null,
      token: null,
      isGuest,
      isLoading: false,
    }));
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
        setGuestMode,
        isGuest: authState.isGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
