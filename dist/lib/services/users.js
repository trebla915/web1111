"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceUpdateUserRole = exports.getUsersByRole = exports.updateUserProfile = exports.updateUserRole = exports.setUserRole = exports.checkUserRoleByEmail = exports.deleteUser = exports.updateUser = exports.getUserById = exports.createUserDocument = void 0;
exports.getUserByEmail = getUserByEmail;
const firestore_1 = require("firebase/firestore");
const config_1 = require("@/lib/firebase/config");
const USERS_COLLECTION = 'users';
// Create a new user document in Firestore
const createUserDocument = async (user) => {
    try {
        const userRef = (0, firestore_1.doc)(config_1.db, USERS_COLLECTION, user.uid);
        // Determine role based on email
        let role = 'user';
        if (user.email) {
            const isAdmin = user.email.includes('admin') ||
                user.email === 'albert@1111eptx.com' ||
                user.email === 'admin@1111eptx.com';
            if (isAdmin) {
                role = 'admin';
            }
            else if (user.email.includes('promoter')) {
                role = 'promoter';
            }
        }
        await (0, firestore_1.setDoc)(userRef, {
            ...user,
            role,
            createdAt: (0, firestore_1.serverTimestamp)(),
            updatedAt: (0, firestore_1.serverTimestamp)(),
        });
        console.log(`Created user document with role: ${role}`);
    }
    catch (error) {
        console.error('Error creating user document:', error);
        throw error;
    }
};
exports.createUserDocument = createUserDocument;
// Get user by ID
const getUserById = async (userId) => {
    try {
        const userRef = (0, firestore_1.doc)(config_1.db, USERS_COLLECTION, userId);
        const userSnap = await (0, firestore_1.getDoc)(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log('User data from Firestore:', userData);
            return userData;
        }
        console.log('No user document found for ID:', userId);
        return null;
    }
    catch (error) {
        console.error('Error getting user:', error);
        throw error;
    }
};
exports.getUserById = getUserById;
// Update user document
const updateUser = async (userId, data) => {
    try {
        const userRef = (0, firestore_1.doc)(config_1.db, USERS_COLLECTION, userId);
        await (0, firestore_1.updateDoc)(userRef, {
            ...data,
            updatedAt: (0, firestore_1.serverTimestamp)(),
        });
    }
    catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};
exports.updateUser = updateUser;
// Delete user document
const deleteUser = async (userId) => {
    try {
        const userRef = (0, firestore_1.doc)(config_1.db, USERS_COLLECTION, userId);
        await (0, firestore_1.deleteDoc)(userRef);
    }
    catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};
exports.deleteUser = deleteUser;
/**
 * Fetches a user's data from Firestore by email
 */
async function getUserByEmail(email) {
    try {
        const usersRef = (0, firestore_1.collection)(config_1.db, 'users');
        const q = (0, firestore_1.query)(usersRef, (0, firestore_1.where)('email', '==', email));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        if (querySnapshot.empty) {
            return null;
        }
        // Return the first matching user
        return {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data(),
            role: querySnapshot.docs[0].data().role || 'user' // Default role if none exists
        };
    }
    catch (error) {
        console.error('Error fetching user by email:', error);
        return null;
    }
}
// Debug function to check user role by email
const checkUserRoleByEmail = async (email) => {
    try {
        const user = await getUserByEmail(email);
        console.log('User from Firestore:', user);
        return user?.role || null;
    }
    catch (error) {
        console.error('Error checking user role:', error);
        return null;
    }
};
exports.checkUserRoleByEmail = checkUserRoleByEmail;
// Set user role (for testing/debugging)
const setUserRole = async (userId, role) => {
    try {
        const userRef = (0, firestore_1.doc)(config_1.db, USERS_COLLECTION, userId);
        await (0, firestore_1.updateDoc)(userRef, {
            role,
            updatedAt: (0, firestore_1.serverTimestamp)()
        });
        console.log(`User ${userId} role set to ${role}`);
        return true;
    }
    catch (error) {
        console.error(`Error setting role for user ${userId}:`, error);
        throw error;
    }
};
exports.setUserRole = setUserRole;
// Update a user's role
const updateUserRole = async (uid, role) => {
    try {
        const userRef = (0, firestore_1.doc)(config_1.db, USERS_COLLECTION, uid);
        await (0, firestore_1.updateDoc)(userRef, {
            role,
            updatedAt: (0, firestore_1.serverTimestamp)()
        });
        return true;
    }
    catch (error) {
        console.error(`Error updating role for user ${uid}:`, error);
        throw error;
    }
};
exports.updateUserRole = updateUserRole;
// Update a user's profile information
const updateUserProfile = async (uid, profileData) => {
    try {
        const userRef = (0, firestore_1.doc)(config_1.db, USERS_COLLECTION, uid);
        // Ensure we're not updating the UID or email
        const { uid: _, email: __, ...updateData } = profileData;
        await (0, firestore_1.updateDoc)(userRef, {
            ...updateData,
            updatedAt: (0, firestore_1.serverTimestamp)()
        });
        return true;
    }
    catch (error) {
        console.error(`Error updating profile for user ${uid}:`, error);
        throw error;
    }
};
exports.updateUserProfile = updateUserProfile;
// Get users by role
const getUsersByRole = async (role) => {
    try {
        const usersCollection = (0, firestore_1.collection)(config_1.db, USERS_COLLECTION);
        const q = (0, firestore_1.query)(usersCollection, (0, firestore_1.where)('role', '==', role));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        return querySnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        }));
    }
    catch (error) {
        console.error(`Error fetching users with role ${role}:`, error);
        throw error;
    }
};
exports.getUsersByRole = getUsersByRole;
// Force update user role (for testing/debugging)
const forceUpdateUserRole = async (userId, role) => {
    try {
        const userRef = (0, firestore_1.doc)(config_1.db, USERS_COLLECTION, userId);
        await (0, firestore_1.setDoc)(userRef, {
            role,
            updatedAt: (0, firestore_1.serverTimestamp)()
        }, { merge: true });
        console.log(`Force updated user ${userId} role to ${role}`);
    }
    catch (error) {
        console.error(`Error force updating role for user ${userId}:`, error);
        throw error;
    }
};
exports.forceUpdateUserRole = forceUpdateUserRole;
