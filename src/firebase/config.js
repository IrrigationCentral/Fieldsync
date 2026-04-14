// ============================================
// FIREBASE CONFIGURATION - FIELDSYNC
// ============================================
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCfd4dg2eN8MrW0w23SZDI0-oE-CxrQFwY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "fieldsync-65fa2.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://fieldsync-65fa2-default-rtdb.firebaseio.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "fieldsync-65fa2",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "fieldsync-65fa2.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "638881914944",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:638881914944:web:8c8f50c8f520b119533fa5",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-RTB0SFNF1Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);

// Use named Firestore database — "fieldsync-prod" for new IC project, "hardluck" for legacy
const FIRESTORE_DB = process.env.REACT_APP_FIRESTORE_DB || "fieldsync-prod";
export const db = getFirestore(app, FIRESTORE_DB);

// Initialize Storage for photo uploads
export const storage = getStorage(app);

export default app;
