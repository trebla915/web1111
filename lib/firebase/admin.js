"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.adminStorage = exports.adminFirestore = exports.adminAuth = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
// Initialize Firebase Admin SDK
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)({
        credential: (0, app_1.cert)({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}
const adminAuth = (0, auth_1.getAuth)();
exports.adminAuth = adminAuth;
exports.auth = adminAuth;
const adminFirestore = (0, firestore_1.getFirestore)();
exports.adminFirestore = adminFirestore;
const adminStorage = (0, storage_1.getStorage)();
exports.adminStorage = adminStorage;
