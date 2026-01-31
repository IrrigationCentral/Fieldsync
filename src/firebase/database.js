// ============================================
// FIREBASE DATABASE SERVICE (FIRESTORE)
// ============================================

import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  getDoc,
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// ============================================
// USERS
// ============================================

export const getUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const getUsersByRole = async (role) => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', role));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting users by role:', error);
    return [];
  }
};

export const updateUser = async (userId, data) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================
// PIVOTS
// ============================================

export const getPivots = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'pivots'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting pivots:', error);
    return [];
  }
};

export const getPivotsByFarmer = async (farmerId) => {
  try {
    const q = query(collection(db, 'pivots'), where('farmerId', '==', farmerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting farmer pivots:', error);
    return [];
  }
};

export const addPivot = async (pivotData) => {
  try {
    const docRef = await addDoc(collection(db, 'pivots'), {
      ...pivotData,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastService: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updatePivot = async (pivotId, data) => {
  try {
    await updateDoc(doc(db, 'pivots', pivotId), {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deletePivot = async (pivotId) => {
  try {
    await deleteDoc(doc(db, 'pivots', pivotId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Real-time pivots listener
export const subscribeToPivots = (callback) => {
  return onSnapshot(
    collection(db, 'pivots'),
    (snapshot) => {
      const pivots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(pivots);
    },
    (error) => {
      console.error('Realtime listener error (pivots):', error);
      // Don't crash - let the app continue with stale data
    }
  );
};


// ============================================
// JOBS
// ============================================

export const getJobs = async () => {
  try {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting jobs:', error);
    return [];
  }
};

export const getJobsByFarmer = async (farmerId) => {
  try {
    const q = query(
      collection(db, 'jobs'), 
      where('farmerId', '==', farmerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting farmer jobs:', error);
    return [];
  }
};

export const getJobsByTech = async (techId) => {
  try {
    const q = query(
      collection(db, 'jobs'), 
      where('assignedTo', '==', techId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting tech jobs:', error);
    return [];
  }
};

export const getJobsByStatus = async (status) => {
  try {
    const q = query(
      collection(db, 'jobs'), 
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting jobs by status:', error);
    return [];
  }
};

export const createJob = async (jobData) => {
  try {
    const docRef = await addDoc(collection(db, 'jobs'), {
      ...jobData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      reportedAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const assignJob = async (jobId, techId) => {
  try {
    await updateDoc(doc(db, 'jobs', jobId), {
      assignedTo: techId,
      status: 'assigned',
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const completeJob = async (jobId, completionData) => {
  try {
    const totalCost = (completionData.hoursWorked * 75) + (completionData.milesDriven * 0.65);
    await updateDoc(doc(db, 'jobs', jobId), {
      ...completionData,
      status: 'completed',
      totalCost: totalCost,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateJob = async (jobId, data) => {
  try {
    await updateDoc(doc(db, 'jobs', jobId), {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteJob = async (jobId) => {
  try {
    await deleteDoc(doc(db, 'jobs', jobId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Real-time jobs listener
export const subscribeToJobs = (callback) => {
  const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(jobs);
    },
    (error) => {
      console.error('Realtime listener error (jobs):', error);
      // Don't crash - let the app continue with stale data
    }
  );
};

// Real-time listener for specific user's jobs
export const subscribeToUserJobs = (userId, role, callback) => {
  let q;
  if (role === 'farmer') {
    q = query(collection(db, 'jobs'), where('farmerId', '==', userId));
  } else if (role === 'tech') {
    q = query(collection(db, 'jobs'), where('assignedTo', '==', userId));
  } else {
    q = collection(db, 'jobs');
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(jobs);
    },
    (error) => {
      console.error('Realtime listener error (user jobs):', error);
      // Don't crash - let the app continue with stale data
    }
  );
};

// ============================================
// ANALYTICS
// ============================================

export const getAnalytics = async () => {
  try {
    const jobsSnapshot = await getDocs(collection(db, 'jobs'));
    const jobs = jobsSnapshot.docs.map(doc => doc.data());
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    const completedJobs = jobs.filter(j => j.status === 'completed');
    
    const monthRevenue = completedJobs
      .filter(j => j.completedAt?.toDate() >= startOfMonth)
      .reduce((sum, j) => sum + (j.totalCost || 0), 0);
    
    const quarterRevenue = completedJobs
      .filter(j => j.completedAt?.toDate() >= startOfQuarter)
      .reduce((sum, j) => sum + (j.totalCost || 0), 0);
    
    const yearRevenue = completedJobs
      .filter(j => j.completedAt?.toDate() >= startOfYear)
      .reduce((sum, j) => sum + (j.totalCost || 0), 0);
    
    return {
      totalJobs: jobs.length,
      completedThisMonth: completedJobs.filter(j => j.completedAt?.toDate() >= startOfMonth).length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      assignedJobs: jobs.filter(j => j.status === 'assigned').length,
      revenue: {
        month: monthRevenue,
        quarter: quarterRevenue,
        year: yearRevenue
      }
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    return null;
  }
};

// ============================================
// SEED DATA (Run once to populate database)
// ============================================

export const seedDatabase = async (managerId) => {
  try {
    // Create sample pivots
    const pivotData = [
      { name: 'North Field A', lat: 40.7614, lng: -96.6856, farmerId: managerId, type: 'center', acres: 160, nozzles: 180, pressure: 45, flow: 850 },
      { name: 'South Field B', lat: 40.7514, lng: -96.6756, farmerId: managerId, type: 'center', acres: 120, nozzles: 140, pressure: 42, flow: 750, status: 'needs-service' },
      { name: 'East Quarter', lat: 40.7714, lng: -96.6956, farmerId: managerId, type: 'linear', acres: 80, nozzles: 100, pressure: 40, flow: 600, status: 'inactive' }
    ];

    for (const pivot of pivotData) {
      await addPivot(pivot);
    }

    console.log('Database seeded successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error: error.message };
  }
};
