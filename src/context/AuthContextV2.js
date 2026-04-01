// FieldSync v2 - Auth Context (Rewritten)
// Only handles authentication state - data subscriptions moved to DataContext
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthChange, getUserProfile, signIn, signUp, logOut } from '../firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        const result = await getUserProfile(user.uid);
        if (cancelled) return;
        if (result.success) {
          setCurrentUser(user);
          setUserProfile(result.profile);
        } else {
          // Profile not found - log out
          await logOut();
          setCurrentUser(null);
          setUserProfile(null);
        }
      } else {
        if (cancelled) return;
        setCurrentUser(null);
        setUserProfile(null);
      }
      if (!cancelled) setAuthLoading(false);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await signIn(email, password);
    return result;
  }, []);

  const signup = useCallback(async (email, password, name, role = 'farmer', phone = '') => {
    const result = await signUp(email, password, name, role, phone);
    return result;
  }, []);

  const logout = useCallback(async () => {
    const result = await logOut();
    if (result.success) {
      setCurrentUser(null);
      setUserProfile(null);
    }
    return result;
  }, []);

  // Refresh user profile from Firestore
  const refreshProfile = useCallback(async () => {
    if (!currentUser) return;
    const result = await getUserProfile(currentUser.uid);
    if (result.success) {
      setUserProfile(result.profile);
    }
  }, [currentUser]);

  const isAuthenticated = !!currentUser && !!userProfile;
  const role = userProfile?.role || null;

  const switchRole = useCallback((newRole) => {
    if (!userProfile) return;
    setUserProfile(prev => ({ ...prev, role: newRole }));
  }, [userProfile]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      authLoading,
      isAuthenticated,
      role,
      login,
      signup,
      logout,
      refreshProfile,
      switchRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
