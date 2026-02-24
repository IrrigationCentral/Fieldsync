// ============================================
// FIREBASE EXPORTS
// ============================================

// Auth exports
export { 
  signUp, 
  signIn, 
  logOut, 
  getUserProfile, 
  onAuthChange,
  resetPassword,
  reauthenticate,
  updateUserEmail,
  updateUserPassword,
  updateUserProfile
} from './auth';

// Firestore exports
export {
  // Settings
  getSettings,
  updateSettings,
  subscribeToSettings,
  
  // Users
  getUsers,
  getUsersByRole,
  updateUser,
  deleteUser,
  subscribeToUsers,
  
  // Pivots
  addPivot,
  getPivots,
  getPivotsByFarmer,
  updatePivot,
  deletePivot,
  subscribeToPivots,
  
  // Jobs
  addJob,
  getJobs,
  getJobsByFarmer,
  getJobsByTech,
  updateJob,
  assignJob,
  addAssigneeToJob,
  removeAssigneeFromJob,
  completeJob,
  deleteJob,
  subscribeToJobs,
  
  // Time Tracking
  startTimeEntry,
  stopTimeEntry,
  getActiveTimeEntry,
  addManualTimeEntry,
  deleteTimeEntry,
  updateTimeEntry,
  
  // Parts Inventory
  addPart,
  importParts,
  getParts,
  updatePart,
  deletePart,
  deleteAllParts,
  subscribeToParts,
  
  // Analytics
  getAnalytics
} from './firestore';

// Storage exports
export {
  uploadPhoto,
  uploadJobPhoto,
  uploadPivotPhoto,
  deletePhoto,
  compressImage
} from './storage';

// Push Notifications
export {
  requestNotificationPermission,
  removeNotificationToken,
  onForegroundMessage,
  getNotificationStatus
} from './messaging';

// Firebase instances
export { auth, db, storage } from './config';
