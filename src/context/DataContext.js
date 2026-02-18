// FieldSync v2 - Data Context
// All 5 real-time Firestore subscriptions + analytics polling
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  subscribeToUsers,
  subscribeToPivots,
  subscribeToJobs,
  subscribeToSettings,
  subscribeToParts,
  getAnalytics
} from '../firebase';
import { useAuth } from './AuthContextV2';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

export const DataProvider = ({ children }) => {
  const { currentUser, userProfile } = useAuth();

  // Data collections
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]); // 'pivots' collection in Firestore
  const [jobs, setJobs] = useState([]);
  const [parts, setParts] = useState([]);
  const [pricingSettings, setPricingSettings] = useState({
    hourlyRate: 75,
    mileageRate: 0.65,
    partsMarkup: 0
  });
  const [analytics, setAnalytics] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Real-time subscriptions - activate when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setUsers([]);
      setEquipment([]);
      setJobs([]);
      setParts([]);
      setPricingSettings({ hourlyRate: 75, mileageRate: 0.65, partsMarkup: 0 });
      setAnalytics(null);
      setDataLoading(false);
      return;
    }

    let loaded = 0;
    const totalSubs = 5;
    const checkLoaded = () => {
      loaded++;
      if (loaded >= totalSubs) setDataLoading(false);
    };

    const unsubUsers = subscribeToUsers((data) => {
      setUsers(data);
      checkLoaded();
    });
    const unsubEquipment = subscribeToPivots((data) => {
      setEquipment(data);
      checkLoaded();
    });
    const unsubJobs = subscribeToJobs((data) => {
      setJobs(data);
      checkLoaded();
    });
    const unsubSettings = subscribeToSettings((data) => {
      setPricingSettings(data);
      checkLoaded();
    });
    const unsubParts = subscribeToParts((data) => {
      setParts(data);
      checkLoaded();
    });

    return () => {
      unsubUsers();
      unsubEquipment();
      unsubJobs();
      unsubSettings();
      unsubParts();
    };
  }, [currentUser]);

  // Analytics polling for manager/office roles
  useEffect(() => {
    if (!currentUser || !['manager', 'office'].includes(userProfile?.role)) return;

    const loadAnalytics = async () => {
      const result = await getAnalytics();
      if (result.success) setAnalytics(result.analytics);
    };

    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [currentUser, userProfile]);

  // Job notifications (pending jobs for dropdown)
  const jobNotifications = jobs
    .filter(j => j.status === 'pending')
    .map(j => ({
      id: j.id,
      title: j.title,
      message: `New issue reported${j.pivotName ? ` - ${j.pivotName}` : ''}`,
      time: j.createdAt,
      type: 'pending'
    }));

  return (
    <DataContext.Provider value={{
      users,
      setUsers,
      equipment,
      setEquipment,
      jobs,
      setJobs,
      parts,
      setParts,
      pricingSettings,
      setPricingSettings,
      analytics,
      setAnalytics,
      jobNotifications,
      dataLoading
    }}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;
