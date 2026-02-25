// FieldSync v2 - Sidebar Navigation (replaces NavTabs for v2 layout)
import React from 'react';
import { Droplets, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { getNavItems } from '../../constants/roles';
import { useAuth } from '../../context/AuthContextV2';
import { useTheme } from '../../context/ThemeContext';

const PORTAL_LABELS = {
  farmer: 'Farmer Portal',
  tech: 'Technician Portal',
  office: 'Office Portal',
  manager: 'Manager Portal'
};

const Sidebar = ({ selectedTab, onSelectTab, collapsed, onToggleCollapse, mobileOpen, onCloseMobile, onOpenProfile, onLogout }) => {
  const { role, userProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const navItems = getNavItems(role);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          flex flex-col flex-shrink-0 overflow-hidden z-50
          transition-all duration-200 ease-out
          ${mobileOpen ? 'fixed inset-y-0 left-0 w-60' : 'hidden lg:flex'}
          ${collapsed && !mobileOpen ? 'lg:w-16' : 'lg:w-60'}
        `}
        style={{
          backgroundColor: colors.sidebarBg,
          borderRight: `1px solid ${colors.sidebarBorder}`
        }}
      >
        {/* Branding */}
        <div
          className="flex items-center h-12 flex-shrink-0 px-3"
          style={{ borderBottom: `1px solid ${colors.sidebarBorder}` }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${isDarkMode ? '#8FBC3B' : '#2D5016'} 0%, ${isDarkMode ? '#2D5016' : '#8FBC3B'} 100%)`
            }}
          >
            <Droplets className="w-4 h-4 text-white" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="ml-3 min-w-0">
              <h1 className="font-bold text-sm leading-tight" style={{ color: colors.sidebarActive }}>
                FieldSync
              </h1>
              <p className="text-[10px] leading-tight truncate" style={{ color: colors.sidebarText }}>
                {PORTAL_LABELS[role] || 'Portal'}
              </p>
            </div>
          )}

          {/* Mobile close button */}
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="ml-auto p-1 rounded lg:hidden"
              style={{ color: colors.sidebarText }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(item => {
            const isActive = selectedTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (mobileOpen) onCloseMobile();
                }}
                className={`
                  w-full flex items-center transition-all duration-150
                  ${collapsed && !mobileOpen ? 'justify-center px-0 py-3' : 'px-4 py-2.5'}
                `}
                style={{
                  backgroundColor: isActive ? colors.sidebarHover : 'transparent',
                  borderLeft: isActive ? `3px solid ${colors.sidebarActive}` : '3px solid transparent',
                  color: isActive ? colors.sidebarActive : colors.sidebarText
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = colors.sidebarHover;
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || mobileOpen) && (
                  <span className="ml-3 text-sm font-medium truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div
          className="flex-shrink-0 py-2"
          style={{ borderTop: `1px solid ${colors.sidebarBorder}` }}
        >
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center transition-all duration-150 px-4 py-2"
            style={{ color: colors.sidebarText }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.sidebarHover; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed && !mobileOpen ? (
              <ChevronRight className="w-5 h-5 mx-auto" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                <span className="ml-3 text-sm">Collapse</span>
              </>
            )}
          </button>

          {/* User info */}
          <button
            onClick={() => {
              onOpenProfile();
              if (mobileOpen) onCloseMobile();
            }}
            className={`
              w-full flex items-center transition-all duration-150
              ${collapsed && !mobileOpen ? 'justify-center px-0 py-2' : 'px-4 py-2'}
            `}
            style={{ color: colors.sidebarText }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.sidebarHover; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            title={collapsed && !mobileOpen ? userProfile?.name || 'Profile' : undefined}
          >
            <span className="text-lg flex-shrink-0">{userProfile?.avatar || '\uD83D\uDC64'}</span>
            {(!collapsed || mobileOpen) && (
              <div className="ml-3 text-left min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#E6EDF3' }}>
                  {userProfile?.name || 'User'}
                </p>
                <p className="text-[10px] truncate" style={{ color: colors.sidebarText }}>
                  {userProfile?.email || ''}
                </p>
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={() => {
              onLogout();
              if (mobileOpen) onCloseMobile();
            }}
            className={`
              w-full flex items-center transition-all duration-150
              ${collapsed && !mobileOpen ? 'justify-center px-0 py-2' : 'px-4 py-2'}
            `}
            style={{ color: colors.sidebarText }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.sidebarHover; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            title={collapsed && !mobileOpen ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || mobileOpen) && (
              <span className="ml-3 text-sm">Logout</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
