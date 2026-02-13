// ============================================
// FIREBASE CLOUD MESSAGING - PUSH NOTIFICATIONS
// ============================================
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import app, { VAPID_KEY } from './config';
import { db } from './config';

let messaging = null;

// Initialize messaging (only works in browser with service worker support)
const initializeMessaging = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      messaging = getMessaging(app);
      return messaging;
    } catch (error) {
      console.error('Failed to initialize Firebase Messaging:', error);
      return null;
    }
  }
  return null;
};

/**
 * Request notification permission and get FCM token
 * @param {string} userId - The user's ID to associate the token with
 * @returns {Promise<string|null>} The FCM token or null if failed
 */
export const requestNotificationPermission = async (userId) => {
  if (!messaging) {
    messaging = initializeMessaging();
  }
  
  if (!messaging) {
    console.warn('Messaging not supported in this browser');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      // Save token to user's document in Firestore
      if (userId) {
        await saveTokenToUser(userId, token);
      }
      
      return token;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

/**
 * Save FCM token to user's Firestore document
 */
const saveTokenToUser = async (userId, token) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      lastTokenUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

/**
 * Remove FCM token from user's document (call on logout)
 */
export const removeNotificationToken = async (userId, token) => {
  if (!token || !userId) return;
  
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmTokens: arrayRemove(token)
    });
  } catch (error) {
    console.error('Error removing FCM token:', error);
  }
};

/**
 * Set up foreground message handler
 * @param {function} callback - Function to call when message received
 */
export const onForegroundMessage = (callback) => {
  if (!messaging) {
    messaging = initializeMessaging();
  }
  
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

/**
 * Check if notifications are supported and enabled
 */
export const getNotificationStatus = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission; // 'granted', 'denied', or 'default'
};

export { messaging };
