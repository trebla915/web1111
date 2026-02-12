import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function ensureApp() {
  if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!projectId || !privateKey) return;
    const storageBucket =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      `${projectId}.appspot.com`;
    initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey,
      }),
      storageBucket,
    });
  }
}

function getAdminAuth() {
  ensureApp();
  return getAuth();
}
function getAdminFirestore() {
  ensureApp();
  return getFirestore();
}
function getAdminStorage() {
  ensureApp();
  return getStorage();
}

// Lazy proxies so Firebase is only initialized when first used (e.g. at runtime on Vercel, not at build).
export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_, prop) {
    return (getAdminAuth() as Record<string | symbol, unknown>)[prop];
  },
});
export const adminFirestore = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_, prop) {
    return (getAdminFirestore() as Record<string | symbol, unknown>)[prop];
  },
});
export const adminStorage = new Proxy({} as ReturnType<typeof getStorage>, {
  get(_, prop) {
    return (getAdminStorage() as Record<string | symbol, unknown>)[prop];
  },
});
export { adminAuth as auth }; 