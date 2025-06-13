import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  Auth
} from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Helper: Get env or expo-constants variable
const getEnvVar = (key: string) => {
  // Priority order for different environments:
  // 1. EXPO_PUBLIC_FIREBASE_* (works in all builds)
  let expoPublicValue: string | undefined;
  switch (key) {
    case 'API_KEY':
      expoPublicValue = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      break;
    case 'AUTH_DOMAIN':
      expoPublicValue = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
      break;
    case 'PROJECT_ID':
      expoPublicValue = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
      break;
    case 'STORAGE_BUCKET':
      expoPublicValue = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
      break;
    case 'MESSAGING_SENDER_ID':
      expoPublicValue = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
      break;
    case 'APP_ID':
      expoPublicValue = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
      break;
  }
  
  if (expoPublicValue) {
    console.log(`🔍 Firebase Config - Found EXPO_PUBLIC_FIREBASE_${key}:`, expoPublicValue?.substring(0, 10) + '...');
    return expoPublicValue;
  }
  
  // 2. FIREBASE_* (local development only)
  let localValue: string | undefined;
  switch (key) {
    case 'API_KEY':
      localValue = process.env.FIREBASE_API_KEY;
      break;
    case 'AUTH_DOMAIN':
      localValue = process.env.FIREBASE_AUTH_DOMAIN;
      break;
    case 'PROJECT_ID':
      localValue = process.env.FIREBASE_PROJECT_ID;
      break;
    case 'STORAGE_BUCKET':
      localValue = process.env.FIREBASE_STORAGE_BUCKET;
      break;
    case 'MESSAGING_SENDER_ID':
      localValue = process.env.FIREBASE_MESSAGING_SENDER_ID;
      break;
    case 'APP_ID':
      localValue = process.env.FIREBASE_APP_ID;
      break;
  }
  
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