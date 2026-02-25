// ============================================
// FIREBASE FIRESTORE DATABASE SERVICE
// ============================================
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  runTransaction
} from 'firebase/firestore';
import { db } from './config';

// ============================================
// SETTINGS (Pricing, etc.)
// ============================================
export const getSettings = async () => {
  try {
    const docRef = doc(db, 'settings', 'pricing');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, settings: docSnap.data() };
    } else {
      // Return defaults if no settings exist
      const defaults = {
        hourlyRate: 75,
        mileageRate: 0.65,
        partsMarkup: 0 // percentage markup on parts
      };
      return { success: true, settings: defaults };
    }
  } catch (error) {
    console.error('Get settings error:', error);
    return { success: false, error: error.message };
  }
};

export const updateSettings = async (settings) => {
  try {
    await setDoc(doc(db, 'settings', 'pricing'), {
      ...settings,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Update settings error:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeToSettings = (callback, errorCallback) => {
  return onSnapshot(doc(db, 'settings', 'pricing'), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback({ hourlyRate: 75, mileageRate: 0.65, partsMarkup: 0 });
    }
  }, (error) => {
    console.error('Subscription error:', error);
    if (errorCallback) errorCallback(error);
  });
};

// ============================================
// USERS
// ============================================
export const getUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, users };
  } catch (error) {
    console.error('Get users error:', error);
    return { success: false, error: error.message };
  }
};

export const getUsersByRole = async (role) => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, users };
  } catch (error) {
    console.error('Get users by role error:', error);
    return { success: false, error: error.message };
  }
};

export const updateUser = async (userId, data) => {
  try {
    await updateDoc(doc(db, 'users', userId), { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PIVOTS
// ============================================
export const addPivot = async (pivotData) => {
  try {
    const docRef = await addDoc(collection(db, 'pivots'), {
      ...pivotData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Add pivot error:', error);
    return { success: false, error: error.message };
  }
};

export const getPivots = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'pivots'));
    const pivots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, pivots };
  } catch (error) {
    console.error('Get pivots error:', error);
    return { success: false, error: error.message };
  }
};

export const getPivotsByFarmer = async (farmerId) => {
  try {
    const q = query(collection(db, 'pivots'), where('farmerId', '==', farmerId));
    const querySnapshot = await getDocs(q);
    const pivots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, pivots };
  } catch (error) {
    console.error('Get pivots by farmer error:', error);
    return { success: false, error: error.message };
  }
};

export const updatePivot = async (pivotId, data) => {
  try {
    await updateDoc(doc(db, 'pivots', pivotId), { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error('Update pivot error:', error);
    return { success: false, error: error.message };
  }
};

export const deletePivot = async (pivotId) => {
  try {
    await deleteDoc(doc(db, 'pivots', pivotId));
    return { success: true };
  } catch (error) {
    console.error('Delete pivot error:', error);
    return { success: false, error: error.message };
  }
};

// Real-time pivots listener
export const subscribeToPivots = (callback, errorCallback) => {
  return onSnapshot(collection(db, 'pivots'), (snapshot) => {
    const pivots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(pivots);
  }, (error) => {
    console.error('Subscription error:', error);
    if (errorCallback) errorCallback(error);
  });
};


// ============================================
// JOBS / SERVICE REQUESTS
// ============================================
export const addJob = async (jobData) => {
  try {
    const docRef = await addDoc(collection(db, 'jobs'), {
      ...jobData,
      status: 'pending',
      soNumber: '', // SO number from NetSuite - to be filled by manager/office
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Add job error:', error);
    return { success: false, error: error.message };
  }
};

export const getJobs = async () => {
  try {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const jobs = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || doc.data().completedAt
    }));
    return { success: true, jobs };
  } catch (error) {
    console.error('Get jobs error:', error);
    return { success: false, error: error.message };
  }
};

export const getJobsByFarmer = async (farmerId) => {
  try {
    const q = query(collection(db, 'jobs'), where('farmerId', '==', farmerId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const jobs = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
    }));
    return { success: true, jobs };
  } catch (error) {
    console.error('Get jobs by farmer error:', error);
    return { success: false, error: error.message };
  }
};

export const getJobsByTech = async (techId) => {
  try {
    // Note: Only matches jobs where assignedTo is an array (v2 format).
    // Legacy jobs with string assignedTo won't appear. Consider data migration.
    const q = query(collection(db, 'jobs'), where('assignedTo', 'array-contains', techId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const jobs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || doc.data().completedAt
    }));
    return { success: true, jobs };
  } catch (error) {
    console.error('Get jobs by tech error:', error);
    return { success: false, error: error.message };
  }
};

export const updateJob = async (jobId, data) => {
  try {
    await updateDoc(doc(db, 'jobs', jobId), { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error('Update job error:', error);
    return { success: false, error: error.message };
  }
};

export const assignJob = async (jobId, techIds) => {
  try {
    // Support both single ID and array of IDs
    const assignees = Array.isArray(techIds) ? techIds : [techIds];
    await updateDoc(doc(db, 'jobs', jobId), { 
      assignedTo: assignees, 
      status: 'assigned',
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp() 
    });
    return { success: true };
  } catch (error) {
    console.error('Assign job error:', error);
    return { success: false, error: error.message };
  }
};

export const addAssigneeToJob = async (jobId, userId) => {
  try {
    await runTransaction(db, async (transaction) => {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await transaction.get(jobRef);
      if (!jobSnap.exists()) throw new Error('Job not found');

      const currentStatus = jobSnap.data().status;
      const updateData = {
        assignedTo: arrayUnion(userId),
        updatedAt: serverTimestamp()
      };

      // Only change status to assigned if currently pending
      if (currentStatus === 'pending') {
        updateData.status = 'assigned';
      }

      transaction.update(jobRef, updateData);
    });
    return { success: true };
  } catch (error) {
    console.error('Add assignee error:', error);
    return { success: false, error: error.message };
  }
};

export const removeAssigneeFromJob = async (jobId, userId) => {
  try {
    await runTransaction(db, async (transaction) => {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await transaction.get(jobRef);
      if (!jobSnap.exists()) throw new Error('Job not found');

      const currentAssignees = jobSnap.data().assignedTo || [];
      const assigneeArray = Array.isArray(currentAssignees) ? currentAssignees : [currentAssignees].filter(Boolean);
      const newAssignees = assigneeArray.filter(id => id !== userId);

      transaction.update(jobRef, {
        assignedTo: newAssignees,
        status: newAssignees.length === 0 ? 'pending' : 'assigned',
        updatedAt: serverTimestamp()
      });
    });
    return { success: true };
  } catch (error) {
    console.error('Remove assignee error:', error);
    return { success: false, error: error.message };
  }
};

export const completeJob = async (jobId, completionData) => {
  try {
    await updateDoc(doc(db, 'jobs', jobId), {
      ...completionData,
      status: completionData.needsFollowUp ? 'needs-followup' : 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Complete job error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// TIME TRACKING
// ============================================

// Start time entry for a job
export const startTimeEntry = async (jobId, techId, techName) => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    
    if (!jobSnap.exists()) {
      return { success: false, error: 'Job not found' };
    }
    
    const job = jobSnap.data();
    const timeEntries = job.timeEntries || [];
    
    // Check if tech already has an active time entry
    const activeEntry = timeEntries.find(e => e.techId === techId && !e.endTime);
    if (activeEntry) {
      return { success: false, error: 'You already have an active time entry for this job' };
    }
    
    const newEntry = {
      id: Date.now().toString(),
      techId,
      techName,
      startTime: new Date().toISOString(),
      endTime: null,
      lunchTaken: false
    };
    
    await updateDoc(jobRef, {
      timeEntries: [...timeEntries, newEntry],
      status: job.status === 'pending' ? 'assigned' : job.status,
      assignedTo: job.assignedTo || [techId], // Set assignedTo as array if not already set
      updatedAt: serverTimestamp()
    });
    
    return { success: true, entryId: newEntry.id };
  } catch (error) {
    console.error('Start time entry error:', error);
    return { success: false, error: error.message };
  }
};

// Stop time entry for a job
export const stopTimeEntry = async (jobId, techId, lunchTaken = false) => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    
    if (!jobSnap.exists()) {
      return { success: false, error: 'Job not found' };
    }
    
    const job = jobSnap.data();
    const timeEntries = job.timeEntries || [];
    
    // Find the active time entry for this tech
    const entryIndex = timeEntries.findIndex(e => e.techId === techId && !e.endTime);
    if (entryIndex === -1) {
      return { success: false, error: 'No active time entry found' };
    }
    
    // Update the entry with end time
    timeEntries[entryIndex] = {
      ...timeEntries[entryIndex],
      endTime: new Date().toISOString(),
      lunchTaken
    };
    
    await updateDoc(jobRef, {
      timeEntries,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Stop time entry error:', error);
    return { success: false, error: error.message };
  }
};

// Get active time entry for a tech on a job
export const getActiveTimeEntry = async (jobId, techId) => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    
    if (!jobSnap.exists()) {
      return { success: false, error: 'Job not found' };
    }
    
    const job = jobSnap.data();
    const timeEntries = job.timeEntries || [];
    const activeEntry = timeEntries.find(e => e.techId === techId && !e.endTime);
    
    return { success: true, activeEntry };
  } catch (error) {
    console.error('Get active time entry error:', error);
    return { success: false, error: error.message };
  }
};

// Manually add a time entry
export const addManualTimeEntry = async (jobId, techId, techName, startTime, endTime, lunchTaken = false, notes = '') => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    
    if (!jobSnap.exists()) {
      return { success: false, error: 'Job not found' };
    }
    
    const job = jobSnap.data();
    const timeEntries = job.timeEntries || [];
    
    const newEntry = {
      id: Date.now().toString(),
      techId,
      techName,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      lunchTaken,
      notes,
      manualEntry: true // Flag to indicate this was manually added
    };
    
    await updateDoc(jobRef, {
      timeEntries: [...timeEntries, newEntry],
      updatedAt: serverTimestamp()
    });
    
    return { success: true, entryId: newEntry.id };
  } catch (error) {
    console.error('Add manual time entry error:', error);
    return { success: false, error: error.message };
  }
};

// Delete a time entry
export const deleteTimeEntry = async (jobId, entryId) => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    
    if (!jobSnap.exists()) {
      return { success: false, error: 'Job not found' };
    }
    
    const job = jobSnap.data();
    const timeEntries = job.timeEntries || [];
    
    const filteredEntries = timeEntries.filter(e => e.id !== entryId);
    
    await updateDoc(jobRef, {
      timeEntries: filteredEntries,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Delete time entry error:', error);
    return { success: false, error: error.message };
  }
};

// Update a time entry
export const updateTimeEntry = async (jobId, entryId, updates) => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    
    if (!jobSnap.exists()) {
      return { success: false, error: 'Job not found' };
    }
    
    const job = jobSnap.data();
    const timeEntries = job.timeEntries || [];
    
    const entryIndex = timeEntries.findIndex(e => e.id === entryId);
    if (entryIndex === -1) {
      return { success: false, error: 'Time entry not found' };
    }
    
    timeEntries[entryIndex] = {
      ...timeEntries[entryIndex],
      ...updates
    };
    
    await updateDoc(jobRef, {
      timeEntries,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Update time entry error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteJob = async (jobId) => {
  try {
    await deleteDoc(doc(db, 'jobs', jobId));
    return { success: true };
  } catch (error) {
    console.error('Delete job error:', error);
    return { success: false, error: error.message };
  }
};

// Real-time jobs listener
export const subscribeToJobs = (callback, errorCallback) => {
  const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || doc.data().completedAt
    }));
    callback(jobs);
  }, (error) => {
    console.error('Subscription error:', error);
    if (errorCallback) errorCallback(error);
  });
};

// Real-time users listener
export const subscribeToUsers = (callback, errorCallback) => {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(users);
  }, (error) => {
    console.error('Subscription error:', error);
    if (errorCallback) errorCallback(error);
  });
};

// ============================================
// ANALYTICS HELPERS
// ============================================
export const getAnalytics = async () => {
  try {
    const jobsResult = await getJobs();
    const usersResult = await getUsers();
    const pivotsResult = await getPivots();
    
    if (!jobsResult.success) throw new Error(jobsResult.error);
    
    const jobs = jobsResult.jobs;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const completedJobs = jobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status));
    const completedThisMonth = completedJobs.filter(j => {
      const date = new Date(j.completedAt);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.totalCost || 0), 0);
    const monthlyRevenue = completedThisMonth.reduce((sum, job) => sum + (job.totalCost || 0), 0);

    return {
      success: true,
      analytics: {
        totalJobs: jobs.length,
        pendingJobs: jobs.filter(j => j.status === 'pending').length,
        assignedJobs: jobs.filter(j => j.status === 'assigned').length,
        inProgressJobs: jobs.filter(j => j.status === 'in-progress').length,
        completedJobs: completedJobs.length,
        readyToBillJobs: jobs.filter(j => j.status === 'ready-to-bill').length,
        billedJobs: jobs.filter(j => j.status === 'billed').length,
        needsFollowupJobs: jobs.filter(j => j.status === 'needs-followup').length,
        completedThisMonth: completedThisMonth.length,
        totalRevenue,
        monthlyRevenue,
        totalUsers: usersResult.success ? usersResult.users.length : 0,
        totalPivots: pivotsResult.success ? pivotsResult.pivots.length : 0,
        techs: usersResult.success ? usersResult.users.filter(u => u.role === 'tech').length : 0
      }
    };
  } catch (error) {
    console.error('Get analytics error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PARTS INVENTORY
// ============================================

// Add a single part
export const addPart = async (partData) => {
  try {
    const docRef = await addDoc(collection(db, 'parts'), {
      ...partData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Add part error:', error);
    return { success: false, error: error.message };
  }
};

// Bulk import parts
export const importParts = async (partsArray) => {
  try {
    let imported = 0;
    let errors = 0;
    
    for (const part of partsArray) {
      try {
        await addDoc(collection(db, 'parts'), {
          partNumber: part.partNumber || '',
          description: part.description || '',
          category: part.category || '',
          manufacturer: part.manufacturer || '',
          price: part.price || 0,
          inStock: part.inStock || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        imported++;
      } catch (e) {
        console.error('Error importing part:', part, e);
        errors++;
      }
    }
    
    return { success: true, imported, errors };
  } catch (error) {
    console.error('Import parts error:', error);
    return { success: false, error: error.message };
  }
};

// Get all parts
export const getParts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'parts'));
    const parts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, parts };
  } catch (error) {
    console.error('Get parts error:', error);
    return { success: false, error: error.message };
  }
};

// Update a part
export const updatePart = async (partId, partData) => {
  try {
    await updateDoc(doc(db, 'parts', partId), {
      ...partData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Update part error:', error);
    return { success: false, error: error.message };
  }
};

// Delete a part
export const deletePart = async (partId) => {
  try {
    await deleteDoc(doc(db, 'parts', partId));
    return { success: true };
  } catch (error) {
    console.error('Delete part error:', error);
    return { success: false, error: error.message };
  }
};

// Delete all parts (for reimport)
export const deleteAllParts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'parts'));
    let deleted = 0;
    for (const docSnap of querySnapshot.docs) {
      await deleteDoc(doc(db, 'parts', docSnap.id));
      deleted++;
    }
    return { success: true, deleted };
  } catch (error) {
    console.error('Delete all parts error:', error);
    return { success: false, error: error.message };
  }
};

// Real-time parts listener
export const subscribeToParts = (callback, errorCallback) => {
  const q = query(collection(db, 'parts'), orderBy('partNumber', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const parts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(parts);
  }, (error) => {
    console.error('Subscription error:', error);
    if (errorCallback) errorCallback(error);
  });
};
