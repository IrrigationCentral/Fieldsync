// ============================================
// AUTHENTICATION CONTEXT
// ============================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getUserProfile, signIn, signUp, logOut } from '../firebase/auth';
import { getUsers, getPivots, getJobs, subscribeToPivots, subscribeToJobs } from '../firebase/database';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pivots, setPivots] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);

      if (user) {
        // Get user profile from Firestore with retry logic
        let profileLoaded = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          const result = await getUserProfile(user.uid);
          if (result.success) {
            setUserProfile(result.data);
            profileLoaded = true;
            break;
          } else {
            console.error(`Profile load attempt ${attempt} failed:`, result.error);
            if (attempt < 3) {
              // Wait before retry (exponential backoff: 1s, 2s)
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
          }
        }

        if (!profileLoaded) {
          console.error('Failed to load profile after 3 attempts. Continuing with limited functionality.');
          // Don't log out - let user continue with limited data
        }

        // Load initial data with error handling
        try {
          const [usersData, pivotsData, jobsData] = await Promise.all([
            getUsers(),
            getPivots(),
            getJobs()
          ]);
          setUsers(usersData);
          setPivots(pivotsData);
          setJobs(jobsData);
        } catch (error) {
          console.error('Error loading initial data:', error);
          // Continue with empty arrays - real-time subscriptions will populate data
          setUsers([]);
          setPivots([]);
          setJobs([]);
        }
      } else {
        setUserProfile(null);
        setUsers([]);
        setPivots([]);
        setJobs([]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time subscriptions when user is logged in
  useEffect(() => {
    if (!currentUser) return;

    const unsubPivots = subscribeToPivots((data) => setPivots(data));
    const unsubJobs = subscribeToJobs((data) => setJobs(data));

    return () => {
      unsubPivots();
      unsubJobs();
    };
  }, [currentUser]);

  // Auth actions
  const login = async (email, password) => {
    const result = await signIn(email, password);
    return result;
  };

  const register = async (email, password, name, role, phone) => {
    const result = await signUp(email, password, name, role, phone);
    return result;
  };

  const logout = async () => {
    const result = await logOut();
    if (result.success) {
      setCurrentUser(null);
      setUserProfile(null);
    }
    return result;
  };

  // Refresh data
  const refreshData = async () => {
    if (currentUser) {
      try {
        const [usersData, pivotsData, jobsData] = await Promise.all([
          getUsers(),
          getPivots(),
          getJobs()
        ]);
        setUsers(usersData);
        setPivots(pivotsData);
        setJobs(jobsData);
      } catch (error) {
        console.error('Error refreshing data:', error);
        // Don't clear existing data on refresh failure - keep stale data visible
      }
    }
  };

  const value = {
    currentUser,
    userProfile,
    users,
    setUsers,
    pivots,
    setPivots,
    jobs,
    setJobs,
    loading,
    login,
    register,
    logout,
    refreshData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
