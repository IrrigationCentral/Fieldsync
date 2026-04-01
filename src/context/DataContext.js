// FieldSync v2 - Data Context
// All 5 real-time Firestore subscriptions + analytics polling
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  subscribeToUsers,
  subscribeToPivots,
  subscribeToJobs,
  subscribeToSettings,
  subscribeToParts,
  subscribeToTruckLocations,
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
  const [truckLocations, setTruckLocations] = useState([]);
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
      setTruckLocations([]);
      setPricingSettings({ hourlyRate: 75, mileageRate: 0.65, partsMarkup: 0 });
      setAnalytics(null);
      setDataLoading(false);
      return;
    }

    let mounted = true;
    const loadedSubs = new Set();
    const totalSubs = 6;
    const checkLoaded = (name) => {
      if (mounted) {
        loadedSubs.add(name);
        if (loadedSubs.size >= totalSubs) setDataLoading(false);
      }
    };

    const handleError = (name, error) => {
      if (mounted) {
        console.error(`${name} subscription error:`, error);
        checkLoaded(name);
      }
    };

    const unsubUsers = subscribeToUsers(
      (data) => {
        if (mounted) {
          setUsers(data);
          checkLoaded('users');
        }
      },
      (error) => handleError('users', error)
    );
    const unsubEquipment = subscribeToPivots(
      (data) => {
        if (mounted) {
          setEquipment(data);
          checkLoaded('equipment');
        }
      },
      (error) => handleError('equipment', error)
    );
    const unsubJobs = subscribeToJobs(
      (data) => {
        if (mounted) {
          setJobs(data);
          checkLoaded('jobs');
        }
      },
      (error) => handleError('jobs', error)
    );
    const unsubSettings = subscribeToSettings(
      (data) => {
        if (mounted) {
          setPricingSettings(data);
          checkLoaded('settings');
        }
      },
      (error) => handleError('settings', error)
    );
    const unsubParts = subscribeToParts(
      (data) => {
        if (mounted) {
          setParts(data);
          checkLoaded('parts');
        }
      },
      (error) => handleError('parts', error)
    );
    const unsubTruckLocations = subscribeToTruckLocations(
      (data) => {
        if (mounted) {
          setTruckLocations(data);
          checkLoaded('truckLocations');
        }
      },
      (error) => handleError('truckLocations', error)
    );

    return () => {
      mounted = false;
      unsubUsers();
      unsubEquipment();
      unsubJobs();
      unsubSettings();
      unsubParts();
      unsubTruckLocations();
    };
  }, [currentUser]);

  // Analytics polling for manager/office roles
  useEffect(() => {
    if (!currentUser || !['manager', 'office'].includes(userProfile?.role)) return;

    let mounted = true;
    const loadAnalytics = async () => {
      const result = await getAnalytics();
      if (result.success && mounted) setAnalytics(result.analytics);
    };

    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
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
      truckLocations,
      setTruckLocations,
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
