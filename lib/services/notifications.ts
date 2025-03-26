import { db } from '@/lib/firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

export interface PushNotificationData {
  title: string;
  message: string;
  topic?: string; // Optional topic for targeted notifications
  data?: Record<string, any>; // Additional data payload
  sentAt?: any;
  status?: string;
  targetedUsers?: string[];
}

export interface TokenRegistration {
  userId: string;
  token: string;
  platform?: string;
  createdAt: any;
  lastUsed?: any;
  deviceInfo?: {
    model?: string;
    os?: string;
    appVersion?: string;
  };
}

/**
 * Send a push notification to all users or a specific topic
 * @param data The notification data (title, message, optional topic)
 * @returns Promise with the result containing notification ID
 */
export const sendPushNotification = async (data: PushNotificationData) => {
  try {
    // Store the notification in Firestore for record-keeping
    const notificationsCollection = collection(db, 'notifications');
    
    // Create notification data without undefined fields
    const notificationData: any = {
      title: data.title,
      message: data.message,
      sentAt: serverTimestamp(),
      status: 'queued'
    };
    
    // Only add these fields if they exist
    if (data.topic) notificationData.topic = data.topic;
    if (data.data && Object.keys(data.data).length > 0) notificationData.data = data.data;
    if (data.targetedUsers) notificationData.targetedUsers = data.targetedUsers;
    
    // Add to Firestore
    const docRef = await addDoc(notificationsCollection, notificationData);
    console.log(`Notification created with ID: ${docRef.id}`);
    
    // In a real implementation, you would connect to Firebase Cloud Messaging here
    // and send the notification to all users
    
    // Simulate sending push notification
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update the notification status to 'sent'
    await updateDoc(doc(db, 'notifications', docRef.id), {
      status: 'sent',
      sentAt: serverTimestamp()
    });
    
    return { 
      success: true, 
      id: docRef.id
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

/**
 * Get notification history
 * @param maxResults Maximum number of notifications to retrieve
 * @returns Promise<Array> List of past notifications
 */
export const getNotificationHistory = async (maxResults = 10) => {
  try {
    const notificationsCollection = collection(db, 'notifications');
    const q = query(
      notificationsCollection,
      orderBy('sentAt', 'desc'),
      limit(maxResults)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching notification history:', error);
    throw error;
  }
};

/**
 * Store a user's push notification token
 * @param userId The user's ID
 * @param token The push notification token
 * @param deviceInfo Optional device information
 * @returns Promise with the result
 */
export const storePushToken = async (
  userId: string, 
  token: string, 
  deviceInfo: any = {}
) => {
  try {
    // Use the token as the document ID to prevent duplicates
    const tokenRef = doc(db, 'pushTokens', token);
    
    const tokenData: TokenRegistration = {
      userId,
      token,
      platform: deviceInfo.os || 'unknown',
      createdAt: serverTimestamp(),
      lastUsed: serverTimestamp(),
      deviceInfo
    };
    
    await setDoc(tokenRef, tokenData);
    console.log(`Push token saved for user ${userId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error storing push token:', error);
    throw error;
  }
};

/**
 * Get all tokens for a specific user
 * @param userId The user's ID
 * @returns Promise with array of token objects
 */
export const getUserTokens = async (userId: string) => {
  try {
    const tokensCollection = collection(db, 'pushTokens');
    const q = query(tokensCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as TokenRegistration);
  } catch (error) {
    console.error(`Error fetching tokens for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Delete a user's push token
 * @param userId The user's ID
 * @param token The push notification token to delete
 * @returns Promise with boolean success result
 */
export async function deleteUserToken(userId: string, token: string) {
  try {
    // Get the token document
    const tokenRef = doc(db, "pushTokens", token);
    const tokenDoc = await getDoc(tokenRef);
    
    // Check if the token belongs to the user
    if (!tokenDoc.exists() || tokenDoc.data()?.userId !== userId) {
      console.log(`Token ${token} not found or doesn't belong to user ${userId}`);
      return false;
    }
    
    // Delete the token
    await deleteDoc(tokenRef);
    
    console.log(`Deleted push token ${token} for user ${userId}`);
    
    return true;
  } catch (error) {
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
export const sendPushNotificationToUsers = async (
  userIds: string[], 
  data: PushNotificationData
) => {
  try {
    // Store the notification in Firestore
    const notificationsCollection = collection(db, 'notifications');
    
    // Create notification data without undefined fields
    const notificationData: any = {
      title: data.title,
      message: data.message,
      sentAt: serverTimestamp(),
      status: 'queued',
      targetedUsers: userIds
    };
    
    // Only add data field if it exists
    if (data.data && Object.keys(data.data).length > 0) notificationData.data = data.data;
    
    const docRef = await addDoc(notificationsCollection, notificationData);
    console.log(`Created targeted notification with ID: ${docRef.id} for ${userIds.length} users`);
    
    // Get all tokens for the specified users
    const tokenPromises = userIds.map(userId => getUserTokens(userId));
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
    await updateDoc(doc(db, 'notifications', docRef.id), {
      status: 'sent',
      sentAt: serverTimestamp(),
      tokenCount
    });
    
    return { 
      success: true, 
      id: docRef.id,
      tokenCount
    };
  } catch (error) {
    console.error('Error sending targeted push notification:', error);
    throw error;
  }
}; 