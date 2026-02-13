// ============================================
// FIREBASE CONFIGURATION - FIELDSYNC
// ============================================
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);

// Use the custom database ID "hardluck"
export const db = getFirestore(app, "hardluck");

// Initialize Storage for photo uploads
export const storage = getStorage(app);

// Secondary app instance for creating users without affecting current auth session
const secondaryApp = getApps().find(a => a.name === 'userCreation')
  || initializeApp(firebaseConfig, 'userCreation');
export const secondaryAuth = getAuth(secondaryApp);

// VAPID key for Firebase Cloud Messaging (FCM) push notifications
export const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

export default app;
