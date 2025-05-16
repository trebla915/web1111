import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  Auth
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

// Helper: Get env or expo-constants variable
const getEnvVar = (key: string) => {
  const value = process.env[`FIREBASE_${key}`];
  if (value) return value;
  const expoValue = process.env[`EXPO_PUBLIC_FIREBASE_${key}`];
  if (expoValue) return expoValue;
  const constantValue = Constants.expoConfig?.extra?.[`FIREBASE_${key}`];
  return constantValue;
};

// Firebase config (do NOT hardcode secrets, always use env or app.config.js)
const firebaseConfig = {
  apiKey: getEnvVar('API_KEY'),
  authDomain: getEnvVar('AUTH_DOMAIN'),
  projectId: getEnvVar('PROJECT_ID'),
  storageBucket: getEnvVar('STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('MESSAGING_SENDER_ID'),
  appId: getEnvVar('APP_ID')
};

if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase API Key is missing. Check your .env or app.config.js');
  throw new Error('Missing Firebase API Key.');
}

// --- Initialize Firebase ---
let firebaseApp: FirebaseApp;
if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

// --- Auth with AsyncStorage Persistence ---
let auth: Auth;
try {
  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Fallback if already initialized (hot reload, fast refresh)
  auth = getAuth(firebaseApp);
}

// --- Firestore ---
const firestore = getFirestore(firebaseApp);

// Export
export { firebaseApp, auth, firestore };