// FieldSync v2 - New App Entry Point
// Slim wrapper: Providers → Auth gate → Layout → Tab-based views
// Views still come from the old App.js during migration
//
// Feature flag: REACT_APP_USE_V2=true activates this
import React, { useState } from 'react';
import AppProviders from './context/AppContext';
import { useAuth } from './context/AuthContextV2';
import { useTheme } from './context/ThemeContext';
import { useNotifications } from './context/NotificationContext';
import { getDefaultTab } from './constants/roles';
import { AppLayout } from './components/layout';
import { LoadingScreen } from './components/ui';
import LoginPage from './pages/shared/LoginPage';

// ============================================
// AUTH GATE - Renders login or app based on auth state
// ============================================
const AuthGate = () => {
  const { isAuthenticated, authLoading, role, logout } = useAuth();
  const { colors } = useTheme();
  const { addNotification } = useNotifications();
  const [selectedTab, setSelectedTab] = useState(null);

  // Show loading screen while checking auth
  if (authLoading) return <LoadingScreen />;

  // Not authenticated → login page
  if (!isAuthenticated) return <LoginPage />;

  // Set default tab if not set
  const currentTab = selectedTab || getDefaultTab(role);

  const handleLogout = async () => {
    await logout();
    addNotification('info', 'Logged out successfully');
  };

  return (
    <AppLayout
      selectedTab={currentTab}
      onSelectTab={setSelectedTab}
      onOpenProfile={() => {/* TODO: open profile modal */}}
      onLogout={handleLogout}
    >
      {/* During migration, render a placeholder. Views will be migrated one by one. */}
      <ViewRouter tab={currentTab} role={role} />
    </AppLayout>
  );
};

// ============================================
// VIEW ROUTER - Tab-based view switching (migration bridge)
// Will be replaced by react-router-dom routes later
// ============================================
const ViewRouter = ({ tab, role }) => {
  // Placeholder during migration - shows which view should render
  return (
    <div className="p-8 text-center">
      <p style={{ color: 'var(--color-text-secondary)' }}>
        v2 Architecture Active — Tab: <strong>{tab}</strong> | Role: <strong>{role}</strong>
      </p>
      <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
        Views are being migrated. This placeholder confirms the v2 shell is working.
      </p>
    </div>
  );
};

// ============================================
// APP V2 - Top-level with providers
// ============================================
const AppV2 = () => (
  <AppProviders>
    <AuthGate />
  </AppProviders>
);

export default AppV2;
