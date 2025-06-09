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
import { Platform } from 'react-native';

// Helper: Get env or expo-constants variable
const getEnvVar = (key: string) => {
  const value = process.env[`FIREBASE_${key}`];
  if (value) {
    console.log(`🔍 Firebase Config - Found FIREBASE_${key}:`, value?.substring(0, 10) + '...');
    return value;
  }
  const expoValue = process.env[`EXPO_PUBLIC_FIREBASE_${key}`];
  if (expoValue) {
    console.log(`🔍 Firebase Config - Found EXPO_PUBLIC_FIREBASE_${key}:`, expoValue?.substring(0, 10) + '...');
    return expoValue;
  }
  const constantValue = Constants.expoConfig?.extra?.[`FIREBASE_${key}`];
  if (constantValue) {
    console.log(`🔍 Firebase Config - Found Constants FIREBASE_${key}:`, constantValue?.substring(0, 10) + '...');
    return constantValue;
  }
  console.warn(`⚠️ Firebase Config - Missing ${key}`);
  return constantValue;
};

console.log('🔧 Firebase Configuration Loading...');
console.log('📱 Platform:', Platform.OS);
console.log('🌐 Constants available:', !!Constants.expoConfig?.extra);

// Firebase config (do NOT hardcode secrets, always use env or app.config.js)
const firebaseConfig = {
  apiKey: getEnvVar('API_KEY'),
  authDomain: getEnvVar('AUTH_DOMAIN'),
  projectId: getEnvVar('PROJECT_ID'),
  storageBucket: getEnvVar('STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('MESSAGING_SENDER_ID'),
  appId: getEnvVar('APP_ID')
};

console.log('🔥 Firebase Config Created:', {
  apiKey: firebaseConfig.apiKey ? '✅ Present' : '❌ Missing',
  authDomain: firebaseConfig.authDomain ? '✅ Present' : '❌ Missing',
  projectId: firebaseConfig.projectId ? '✅ Present' : '❌ Missing',
  storageBucket: firebaseConfig.storageBucket ? '✅ Present' : '❌ Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Present' : '❌ Missing',
  appId: firebaseConfig.appId ? '✅ Present' : '❌ Missing'
});

if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase API Key is missing. Check your .env or app.config.js');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('FIREBASE')));
  console.error('Available constants:', Object.keys(Constants.expoConfig?.extra || {}));
  throw new Error('Missing Firebase API Key.');
}

// --- Initialize Firebase ---
let firebaseApp: FirebaseApp;
if (getApps().length === 0) {
  console.log('🔥 Initializing new Firebase app...');
  firebaseApp = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
} else {
  console.log('🔥 Using existing Firebase app...');
  firebaseApp = getApp();
}

// --- Auth with AsyncStorage Persistence ---
let auth: Auth;
try {
  console.log('🔐 Initializing Firebase Auth with AsyncStorage persistence...');
  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log('✅ Firebase Auth initialized successfully');
} catch (e) {
  console.log('🔐 Using existing Firebase Auth instance...');
  // Fallback if already initialized (hot reload, fast refresh)
  auth = getAuth(firebaseApp);
}

// --- Firestore ---
const firestore = getFirestore(firebaseApp);
console.log('📊 Firestore initialized');

// Export
export { firebaseApp, auth, firestore };