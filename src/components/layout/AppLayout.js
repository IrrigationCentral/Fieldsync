// FieldSync v2 - App Layout Component
// Wraps authenticated views with Header + Nav + Toast
import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import Header from './Header';
import NavTabs from './NavTabs';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

const AppLayout = ({ selectedTab, onSelectTab, onOpenProfile, onLogout, onOpenJobDetails, children }) => {
  const { colors } = useTheme();
  const { notifications } = useNotifications();

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <Header
        selectedTab={selectedTab}
        onSelectTab={onSelectTab}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
        onOpenJobDetails={onOpenJobDetails}
      />
      <NavTabs selectedTab={selectedTab} onSelectTab={onSelectTab} />

      {/* Main Content */}
      <main className="p-4 max-w-7xl mx-auto">
        {children}
      </main>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className="card p-4 shadow-lg flex items-center space-x-3 animate-slide-in"
            style={{
              backgroundColor: notif.type === 'error' ? colors.danger + '15' :
                               notif.type === 'success' ? colors.success + '15' :
                               colors.water + '15'
            }}
          >
            {notif.type === 'error' ? (
              <AlertCircle className="w-5 h-5" style={{ color: colors.danger }} />
            ) : notif.type === 'success' ? (
              <CheckCircle className="w-5 h-5" style={{ color: colors.success }} />
            ) : (
              <AlertCircle className="w-5 h-5" style={{ color: colors.water }} />
            )}
            <p className="text-sm" style={{ color: colors.textPrimary }}>{notif.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppLayout;
