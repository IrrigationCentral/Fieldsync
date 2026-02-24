// ============================================
// FIREBASE CONFIGURATION - FIELDSYNC
// ============================================
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB2_veGmiiask_IBUqspw9wmYcPbVrfTxc",
  authDomain: "fieldsync-2768a.firebaseapp.com",
  databaseURL: "https://fieldsync-2768a-default-rtdb.firebaseio.com",
  projectId: "fieldsync-2768a",
  storageBucket: "fieldsync-2768a.firebasestorage.app",
  messagingSenderId: "1071854844469",
  appId: "1:1071854844469:web:0ab89170730a0900a44f7c",
  measurementId: "G-DD40T9ZFFN"
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
