// firebase.web.js
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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
const auth = getAuth(app);

// Set persistence for web
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting persistence:', error);
});

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };