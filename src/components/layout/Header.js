// FieldSync v2 - Header (slim top bar for sidebar layout)
import React, { useState } from 'react';
import {
  Wifi, WifiOff, Cloud, Moon, Sun,
  Bell, AlertCircle, Menu
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { formatDate } from '../../utils/formatters';

const Header = ({ onSelectTab, onOpenJobDetails, onToggleMobileSidebar }) => {
  const { isDarkMode, colors, toggleDarkMode } = useTheme();
  const { jobNotifications } = useData();
  const { syncStatus } = useOnlineStatus();
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const weatherData = { temp: 72 };

  return (
    <>
      <header
        className="h-12 flex-shrink-0 flex items-center justify-between px-3 z-40"
        style={{
          backgroundColor: colors.sidebarBg,
          borderBottom: `1px solid ${colors.sidebarBorder}`
        }}
      >
        {/* Left: Mobile hamburger */}
        <div className="flex items-center">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg mr-2"
            style={{ color: colors.sidebarText }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center space-x-2">
          {/* Sync Status */}
          <div
            className="hidden md:flex items-center space-x-1 px-2 py-1 rounded"
            style={{ backgroundColor: syncStatus === 'online' ? colors.success + '15' : colors.danger + '15' }}
          >
            {syncStatus === 'online' ? (
              <Wifi className="w-3.5 h-3.5" style={{ color: colors.success }} />
            ) : (
              <WifiOff className="w-3.5 h-3.5" style={{ color: colors.danger }} />
            )}
            <span className="text-[10px] font-medium" style={{ color: syncStatus === 'online' ? colors.success : colors.danger }}>
              {syncStatus}
            </span>
          </div>

          {/* Weather */}
          {weatherData && (
            <div className="hidden md:flex items-center space-x-1 px-2 py-1 rounded" style={{ backgroundColor: colors.sky + '15' }}>
              <Cloud className="w-3.5 h-3.5" style={{ color: colors.water }} />
              <span className="text-[10px] font-medium" style={{ color: '#E6EDF3' }}>{weatherData.temp}°F</span>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: colors.sidebarText }}
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" style={{ color: colors.accent }} />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              className="relative p-1.5 rounded-lg transition-colors"
              style={{ color: colors.sidebarText }}
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
            >
              <Bell className="w-4 h-4" />
              {jobNotifications.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.danger }} />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotificationsDropdown && (
              <div
                className="absolute right-0 top-10 w-80 rounded-xl shadow-xl border z-50"
                style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}
              >
                <div className="p-3 border-b" style={{ borderColor: colors.border }}>
                  <h3 className="font-semibold text-sm" style={{ color: colors.textPrimary }}>Notifications</h3>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {jobNotifications.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm" style={{ color: colors.textSecondary }}>No new notifications</p>
                    </div>
                  ) : (
                    jobNotifications.map(notif => (
                      <div
                        key={notif.id}
                        className="p-3 border-b cursor-pointer transition-colors"
                        style={{ borderColor: colors.border }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.inputBg; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        onClick={() => {
                          if (onOpenJobDetails && notif.job) {
                            onOpenJobDetails(notif.job);
                          } else {
                            onSelectTab('jobs');
                          }
                          setShowNotificationsDropdown(false);
                        }}
                      >
                        <div className="flex items-start space-x-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.warning + '20' }}>
                            <AlertCircle className="w-3.5 h-3.5" style={{ color: colors.warning }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium" style={{ color: colors.textPrimary }}>{notif.title}</p>
                            <p className="text-[10px]" style={{ color: colors.textSecondary }}>{notif.message}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: colors.muted }}>{formatDate(notif.time)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {jobNotifications.length > 0 && (
                  <div className="p-2 border-t" style={{ borderColor: colors.border }}>
                    <button
                      className="w-full text-xs font-medium"
                      style={{ color: colors.primary }}
                      onClick={() => { onSelectTab('jobs'); setShowNotificationsDropdown(false); }}
                    >
                      View All Jobs
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Click outside to close notifications */}
      {showNotificationsDropdown && (
        <div className="fixed inset-0 z-30" onClick={() => setShowNotificationsDropdown(false)} />
      )}
    </>
  );
};

export default Header;
