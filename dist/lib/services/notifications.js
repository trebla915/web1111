"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotificationToUsers = exports.getUserTokens = exports.storePushToken = exports.getNotificationHistory = exports.sendPushNotification = void 0;
exports.deleteUserToken = deleteUserToken;
const config_1 = require("@/lib/firebase/config");
const firestore_1 = require("firebase/firestore");
/**
 * Send a push notification to all users or a specific topic
 * @param data The notification data (title, message, optional topic)
 * @returns Promise with the result containing notification ID
 */
const sendPushNotification = async (data) => {
    try {
        // Store the notification in Firestore for record-keeping
        const notificationsCollection = (0, firestore_1.collection)(config_1.db, 'notifications');
        // Create notification data without undefined fields
        const notificationData = {
            title: data.title,
            message: data.message,
            sentAt: (0, firestore_1.serverTimestamp)(),
            status: 'queued'
        };
        // Only add these fields if they exist
        if (data.topic)
            notificationData.topic = data.topic;
        if (data.data && Object.keys(data.data).length > 0)
            notificationData.data = data.data;
        if (data.targetedUsers)
            notificationData.targetedUsers = data.targetedUsers;
        // Add to Firestore
        const docRef = await (0, firestore_1.addDoc)(notificationsCollection, notificationData);
        console.log(`Notification created with ID: ${docRef.id}`);
        // In a real implementation, you would connect to Firebase Cloud Messaging here
        // and send the notification to all users
        // Simulate sending push notification
        await new Promise(resolve => setTimeout(resolve, 300));
        // Update the notification status to 'sent'
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(config_1.db, 'notifications', docRef.id), {
            status: 'sent',
            sentAt: (0, firestore_1.serverTimestamp)()
        });
        return {
            success: true,
            id: docRef.id
        };
    }
    catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
};
exports.sendPushNotification = sendPushNotification;
/**
 * Get notification history
 * @param maxResults Maximum number of notifications to retrieve
 * @returns Promise<Array> List of past notifications
 */
const getNotificationHistory = async (maxResults = 10) => {
    try {
        const notificationsCollection = (0, firestore_1.collection)(config_1.db, 'notifications');
        const q = (0, firestore_1.query)(notificationsCollection, (0, firestore_1.orderBy)('sentAt', 'desc'), (0, firestore_1.limit)(maxResults));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
    catch (error) {
        console.error('Error fetching notification history:', error);
        throw error;
    }
};
exports.getNotificationHistory = getNotificationHistory;
/**
 * Store a user's push notification token
 * @param userId The user's ID
 * @param token The push notification token
 * @param deviceInfo Optional device information
 * @returns Promise with the result
 */
const storePushToken = async (userId, token, deviceInfo = {}) => {
    try {
        // Use the token as the document ID to prevent duplicates
        const tokenRef = (0, firestore_1.doc)(config_1.db, 'pushTokens', token);
        const tokenData = {
            userId,
            token,
            platform: deviceInfo.os || 'unknown',
            createdAt: (0, firestore_1.serverTimestamp)(),
            lastUsed: (0, firestore_1.serverTimestamp)(),
            deviceInfo
        };
        await (0, firestore_1.setDoc)(tokenRef, tokenData);
        console.log(`Push token saved for user ${userId}`);
        return { success: true };
    }
    catch (error) {
        console.error('Error storing push token:', error);
        throw error;
    }
};
exports.storePushToken = storePushToken;
/**
 * Get all tokens for a specific user
 * @param userId The user's ID
 * @returns Promise with array of token objects
 */
const getUserTokens = async (userId) => {
    try {
        const tokensCollection = (0, firestore_1.collection)(config_1.db, 'pushTokens');
        const q = (0, firestore_1.query)(tokensCollection, (0, firestore_1.where)('userId', '==', userId));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        return querySnapshot.docs.map(doc => doc.data());
    }
    catch (error) {
        console.error(`Error fetching tokens for user ${userId}:`, error);
        throw error;
    }
};
exports.getUserTokens = getUserTokens;
/**
 * Delete a user's push token
 * @param userId The user's ID
 * @param token The push notification token to delete
 * @returns Promise with boolean success result
 */
async function deleteUserToken(userId, token) {
    try {
        // Get the token document
        const tokenRef = (0, firestore_1.doc)(config_1.db, "pushTokens", token);
        const tokenDoc = await (0, firestore_1.getDoc)(tokenRef);
        // Check if the token belongs to the user
        if (!tokenDoc.exists() || tokenDoc.data()?.userId !== userId) {
            console.log(`Token ${token} not found or doesn't belong to user ${userId}`);
            return false;
        }
        // Delete the token
        await (0, firestore_1.deleteDoc)(tokenRef);
        console.log(`Deleted push token ${token} for user ${userId}`);
        return true;
    }
    catch (error) {
        console.error(`Error deleting token for user ${userId}:`, error);
        throw error;
    }
}
/**
 * Send a push notification to specific users
 * @param userIds Array of user IDs to send the notification to
 * @param data The notification data
 * @returns Promise with the result containing notification ID
 */
const sendPushNotificationToUsers = async (userIds, data) => {
    try {
        // Store the notification in Firestore
        const notificationsCollection = (0, firestore_1.collection)(config_1.db, 'notifications');
        // Create notification data without undefined fields
        const notificationData = {
            title: data.title,
            message: data.message,
            sentAt: (0, firestore_1.serverTimestamp)(),
            status: 'queued',
            targetedUsers: userIds
        };
        // Only add data field if it exists
        if (data.data && Object.keys(data.data).length > 0)
            notificationData.data = data.data;
        const docRef = await (0, firestore_1.addDoc)(notificationsCollection, notificationData);
        console.log(`Created targeted notification with ID: ${docRef.id} for ${userIds.length} users`);
        // Get all tokens for the specified users
        const tokenPromises = userIds.map(userId => (0, exports.getUserTokens)(userId));
        const tokenResults = await Promise.all(tokenPromises);
        // Flatten the array of token arrays
        const allTokens = tokenResults.flat();
        const tokenCount = allTokens.length;
        console.log(`Found ${tokenCount} tokens for ${userIds.length} users`);
        // In a real implementation, you would connect to Firebase Cloud Messaging here
        // and send the notification to the specific user tokens
        // Simulate sending push notifications
        await new Promise(resolve => setTimeout(resolve, 300));
        // Update the notification status
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(config_1.db, 'notifications', docRef.id), {
            status: 'sent',
            sentAt: (0, firestore_1.serverTimestamp)(),
            tokenCount
        });
        return {
            success: true,
            id: docRef.id,
            tokenCount
        };
    }
    catch (error) {
        console.error('Error sending targeted push notification:', error);
        throw error;
    }
};
exports.sendPushNotificationToUsers = sendPushNotificationToUsers;
