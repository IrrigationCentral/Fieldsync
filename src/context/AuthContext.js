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
        // Get user profile from Firestore
        const result = await getUserProfile(user.uid);
        if (result.success) {
          setUserProfile(result.data);
        }
        
        // Load initial data
        const [usersData, pivotsData, jobsData] = await Promise.all([
          getUsers(),
          getPivots(),
          getJobs()
        ]);
        setUsers(usersData);
        setPivots(pivotsData);
        setJobs(jobsData);
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
      const [usersData, pivotsData, jobsData] = await Promise.all([
        getUsers(),
        getPivots(),
        getJobs()
      ]);
      setUsers(usersData);
      setPivots(pivotsData);
      setJobs(jobsData);
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
