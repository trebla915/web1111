// firebase.native.js
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebase?.apiKey || '',
  authDomain: Constants.expoConfig?.extra?.firebase?.authDomain || '',
  projectId: Constants.expoConfig?.extra?.firebase?.projectId || '',
  storageBucket: Constants.expoConfig?.extra?.firebase?.storageBucket || '',
  messagingSenderId: Constants.expoConfig?.extra?.firebase?.messagingSenderId || '',
  appId: Constants.expoConfig?.extra?.firebase?.appId || '',
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };