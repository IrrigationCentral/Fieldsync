// FieldSync v2 - App Layout (sidebar + top bar + content)
import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import Header from './Header';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

const STORAGE_KEY = 'fieldsync-sidebar-collapsed';

const AppLayout = ({ selectedTab, onSelectTab, onOpenProfile, onLogout, onOpenJobDetails, children }) => {
  const { colors } = useTheme();
  const { notifications } = useNotifications();
  const tabHistoryRef = useRef([]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(sidebarCollapsed)); } catch {}
  }, [sidebarCollapsed]);

  // Track tab history for back-button navigation
  useEffect(() => {
    tabHistoryRef.current.push(selectedTab);
    if (tabHistoryRef.current.length > 20) tabHistoryRef.current.shift();
  }, [selectedTab]);

  // Capacitor back-button handler (Android hardware back)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup;
    import('@capacitor/app').then(({ App }) => {
      const listener = App.addListener('backButton', ({ canGoBack }) => {
        // Close mobile sidebar first
        if (mobileSidebarOpen) {
          setMobileSidebarOpen(false);
          return;
        }
        // Navigate to previous tab
        const history = tabHistoryRef.current;
        if (history.length > 1) {
          history.pop(); // remove current
          const prev = history[history.length - 1];
          onSelectTab(prev);
        } else {
          // Minimize app instead of exiting
          App.minimizeApp();
        }
      });
      cleanup = () => listener.then(l => l.remove());
    });

    return () => { if (cleanup) cleanup(); };
  }, [mobileSidebarOpen, onSelectTab]);

  // Native status bar styling
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#0D1117' });
    }).catch(() => {});
  }, []);

  // Close mobile sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        backgroundColor: colors.background,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {/* Sidebar */}
      <Sidebar
        selectedTab={selectedTab}
        onSelectTab={onSelectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

      {/* Right side: header + content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <Header
          selectedTab={selectedTab}
          onSelectTab={onSelectTab}
          onOpenJobDetails={onOpenJobDetails}
          onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className="card p-3 shadow-lg flex items-center space-x-3 animate-slide-in max-w-sm"
            style={{
              backgroundColor: notif.type === 'error' ? colors.danger + '15' :
                               notif.type === 'success' ? colors.success + '15' :
                               colors.water + '15'
            }}
          >
            {notif.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: colors.danger }} />
            ) : notif.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: colors.success }} />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: colors.water }} />
            )}
            <p className="text-sm" style={{ color: colors.textPrimary }}>{notif.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppLayout;
