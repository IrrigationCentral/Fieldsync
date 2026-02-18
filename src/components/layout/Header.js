// FieldSync v2 - Header Component
// Extracted from App.js lines 3615-3700
import React, { useState } from 'react';
import {
  Droplets, Wifi, WifiOff, Cloud, Moon, Sun,
  Bell, LogOut, AlertCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContextV2';
import { useData } from '../../context/DataContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { formatDate } from '../../utils/formatters';

const PORTAL_LABELS = {
  farmer: 'Farmer Portal',
  tech: 'Technician Portal',
  office: 'Office Portal',
  manager: 'Manager Portal'
};

const Header = ({ selectedTab, onSelectTab, onOpenProfile, onLogout }) => {
  const { isDarkMode, colors, toggleDarkMode } = useTheme();
  const { userProfile } = useAuth();
  const { jobNotifications } = useData();
  const { syncStatus } = useOnlineStatus();
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Mock weather (same as App.js)
  const weatherData = { temp: 72 };

  return (
    <>
      <header
        className="shadow-sm sticky top-0 z-40"
        style={{ backgroundColor: colors.cardBg, borderBottom: `1px solid ${colors.border}` }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${isDarkMode ? '#8FBC3B' : '#2D5016'} 0%, ${isDarkMode ? '#2D5016' : '#8FBC3B'} 100%)`
                }}
              >
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold" style={{ color: isDarkMode ? '#8FBC3B' : '#2D5016' }}>FieldSync</h1>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {PORTAL_LABELS[userProfile?.role] || 'Portal'}
                </p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              {/* Sync Status */}
              <div
                className="hidden md:flex items-center space-x-1 px-2 py-1 rounded-lg"
                style={{ backgroundColor: syncStatus === 'online' ? colors.success + '15' : colors.danger + '15' }}
              >
                {syncStatus === 'online' ? (
                  <Wifi className="w-4 h-4" style={{ color: colors.success }} />
                ) : (
                  <WifiOff className="w-4 h-4" style={{ color: colors.danger }} />
                )}
                <span className="text-xs" style={{ color: syncStatus === 'online' ? colors.success : colors.danger }}>
                  {syncStatus}
                </span>
              </div>

              {/* Weather Widget */}
              {weatherData && (
                <div className="hidden md:flex items-center space-x-1 px-2 py-1 rounded-lg" style={{ backgroundColor: colors.sky + '15' }}>
                  <Cloud className="w-4 h-4" style={{ color: colors.water }} />
                  <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>{weatherData.temp}°F</span>
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: isDarkMode ? colors.accent + '20' : 'transparent' }}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" style={{ color: colors.accent }} />
                ) : (
                  <Moon className="w-5 h-5" style={{ color: colors.textSecondary }} />
                )}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  className="relative p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: showNotificationsDropdown ? colors.border : 'transparent' }}
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                >
                  <Bell className="w-5 h-5" style={{ color: colors.textSecondary }} />
                  {jobNotifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: colors.danger }} />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotificationsDropdown && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border z-50" style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}>
                    <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {jobNotifications.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-sm" style={{ color: colors.textSecondary }}>No new notifications</p>
                        </div>
                      ) : (
                        jobNotifications.map(notif => (
                          <div key={notif.id} className="p-4 border-b hover:bg-gray-50 cursor-pointer" style={{ borderColor: colors.border }}>
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.warning + '20' }}>
                                <AlertCircle className="w-4 h-4" style={{ color: colors.warning }} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{notif.title}</p>
                                <p className="text-xs" style={{ color: colors.textSecondary }}>{notif.message}</p>
                                <p className="text-xs mt-1" style={{ color: colors.muted }}>{formatDate(notif.time)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {jobNotifications.length > 0 && (
                      <div className="p-3 border-t" style={{ borderColor: colors.border }}>
                        <button
                          className="w-full text-sm font-medium"
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

              {/* User Menu */}
              <div
                className="flex items-center space-x-2 pl-2 border-l cursor-pointer rounded-lg p-1 transition-colors"
                style={{ borderColor: colors.border }}
                onClick={onOpenProfile}
              >
                <span className="text-2xl">{userProfile?.avatar || '\uD83D\uDC64'}</span>
                <div className="hidden md:block">
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{userProfile?.name || 'User'}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>{userProfile?.email || ''}</p>
                </div>
              </div>

              {/* Logout */}
              <button onClick={onLogout} className="p-2 rounded-lg transition-colors" title="Logout">
                <LogOut className="w-4 h-4" style={{ color: colors.textSecondary }} />
              </button>
            </div>
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
