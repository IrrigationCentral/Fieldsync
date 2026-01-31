// ============================================
// FIREBASE CONFIGURATION - FIELDSYNC
// ============================================
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyB2_veGmiiask_IBUqspw9wmYcPbVrfTxc",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "fieldsync-2768a.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://fieldsync-2768a-default-rtdb.firebaseio.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "fieldsync-2768a",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "fieldsync-2768a.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1071854844469",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1071854844469:web:0ab89170730a0900a44f7c",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-DD40T9ZFFN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);

// Use the custom database ID "hardluck"
export const db = getFirestore(app, "hardluck");

// Initialize Storage for photo uploads
export const storage = getStorage(app);

export default app;
