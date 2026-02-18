// FieldSync v2 - Navigation Tabs Component
// Extracted from App.js lines 3692-3699
import React from 'react';
import { getNavItems } from '../../constants/roles';
import { useAuth } from '../../context/AuthContextV2';
import { useTheme } from '../../context/ThemeContext';

const NavTabs = ({ selectedTab, onSelectTab }) => {
  const { role } = useAuth();
  const { colors } = useTheme();
  const navItems = getNavItems(role);

  return (
    <nav
      className="px-4 flex space-x-1 overflow-x-auto sticky top-[60px] z-30"
      style={{ backgroundColor: colors.cardBg, borderBottom: `1px solid ${colors.border}` }}
    >
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onSelectTab(item.id)}
          className={`nav-tab ${selectedTab === item.id ? 'active' : ''}`}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default NavTabs;
