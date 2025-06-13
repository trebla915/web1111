import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  Auth
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Helper: Get env or expo-constants variable
const getEnvVar = (key: string) => {
  // Priority order for different environments:
  // 1. EXPO_PUBLIC_FIREBASE_* (works in all builds)
  const expoPublicValue = process.env[`EXPO_PUBLIC_FIREBASE_${key}`];
  if (expoPublicValue) {
    console.log(`🔍 Firebase Config - Found EXPO_PUBLIC_FIREBASE_${key}:`, expoPublicValue?.substring(0, 10) + '...');
    return expoPublicValue;
  }
  
  // 2. FIREBASE_* (local development only)
  const localValue = process.env[`FIREBASE_${key}`];
  if (localValue) {
    console.log(`🔍 Firebase Config - Found FIREBASE_${key}:`, localValue?.substring(0, 10) + '...');
    return localValue;
  }
  
  // 3. Constants (fallback)
  const constantValue = Constants.expoConfig?.extra?.[`FIREBASE_${key}`];
  if (constantValue) {
    console.log(`🔍 Firebase Config - Found Constants FIREBASE_${key}:`, constantValue?.substring(0, 10) + '...');
    return constantValue;
  }
  
  console.error(`❌ Firebase Config - Missing ${key}. Checked:`, [
    `EXPO_PUBLIC_FIREBASE_${key}`,
    `FIREBASE_${key}`,
    `Constants.expoConfig.extra.FIREBASE_${key}`
  ]);
  return undefined;
};

console.log('🔧 Firebase Configuration Loading...');
console.log('📱 Platform:', Platform.OS);
console.log('🌐 Constants available:', !!Constants.expoConfig?.extra);

// Debug: Log all EXPO_PUBLIC environment variables
console.log('🔍 STANDALONE BUILD DEBUG:');
const expoPublicVars = Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC_FIREBASE'));
console.log('Available EXPO_PUBLIC_FIREBASE vars:', expoPublicVars);
expoPublicVars.forEach(key => {
  console.log(`${key}:`, process.env[key] ? 'PRESENT' : 'MISSING');
});

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
  console.log('🔐 Initializing Firebase Auth...');
  auth = initializeAuth(firebaseApp);
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