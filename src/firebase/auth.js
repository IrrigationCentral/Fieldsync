// ============================================
// FIREBASE AUTHENTICATION SERVICE
// ============================================
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Sign up new user
export const signUp = async (email, password, name, role = 'farmer', phone = '') => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, { displayName: name });
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      name: name,
      role: role,
      phone: phone,
      avatar: role === 'tech' ? '👨‍🔧' : role === 'farmer' ? '👩‍🌾' : role === 'manager' ? '👨‍💼' : '👤',
      createdAt: new Date().toISOString(),
      isActive: true
    });
    
    return { success: true, user };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: getErrorMessage(error.code) };
  }
};

// Sign in existing user
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: getErrorMessage(error.code) };
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, profile: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('Get profile error:', error);
    return { success: false, error: error.message };
  }
};

// Password reset
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: getErrorMessage(error.code) };
  }
};

// Auth state listener
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Re-authenticate user (required before sensitive operations like email change)
export const reauthenticate = async (currentPassword) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, error: 'No user logged in' };
    }
    
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    return { success: true };
  } catch (error) {
    console.error('Reauthentication error:', error);
    return { success: false, error: getErrorMessage(error.code) };
  }
};

// Update user email (requires recent login)
export const updateUserEmail = async (newEmail, currentPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    // First re-authenticate
    const reauth = await reauthenticate(currentPassword);
    if (!reauth.success) {
      return { success: false, error: reauth.error || 'Please verify your current password' };
    }

    // Update email in Firebase Auth
    await updateEmail(user, newEmail);
    
    // Update email in Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { 
      email: newEmail,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Update email error:', error);
    return { success: false, error: getErrorMessage(error.code) };
  }
};

// Update user password (requires recent login)
export const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    // First re-authenticate
    const reauth = await reauthenticate(currentPassword);
    if (!reauth.success) {
      return { success: false, error: reauth.error || 'Current password is incorrect' };
    }

    // Update password
    await updatePassword(user, newPassword);
    
    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, error: getErrorMessage(error.code) };
  }
};

// Update user profile (name, phone, avatar, etc - NOT email)
export const updateUserProfile = async (uid, profileData) => {
  try {
    const user = auth.currentUser;
    
    // Update display name in Firebase Auth if provided
    if (user && profileData.name) {
      await updateProfile(user, { displayName: profileData.name });
    }
    
    // Update Firestore document
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
};

// Error message helper
const getErrorMessage = (code) => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
};
