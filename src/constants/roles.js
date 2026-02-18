// FieldSync v2 - Role Constants & Navigation
import { Home, Briefcase, Users, Map, Cloud, Phone, Calendar, BarChart3, Settings, Clipboard, Navigation, Wrench } from 'lucide-react';

export const ROLES = {
  FARMER: 'farmer',
  TECH: 'tech',
  OFFICE: 'office',
  MANAGER: 'manager'
};

/** @param {string} role */
export const getNavItems = (role) => {
  if (role === 'farmer') return [
    { id: 'equipment', label: 'My Equipment', icon: Navigation },
    { id: 'jobs', label: 'Service History', icon: Clipboard },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'weather', label: 'Weather', icon: Cloud }
  ];
  if (role === 'tech') return [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'jobs', label: 'My Jobs', icon: Briefcase },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'map', label: 'Field Map', icon: Map }
  ];
  if (role === 'office') return [
    { id: 'jobs', label: 'All Jobs', icon: Briefcase },
    { id: 'callin', label: 'New Call-In', icon: Phone },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'map', label: 'Map', icon: Map }
  ];
  // Manager
  return [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'myjobs', label: 'My Jobs', icon: Wrench },
    { id: 'jobs', label: 'All Jobs', icon: Briefcase },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
};

/** @param {string} role */
export const getDefaultTab = (role) => {
  switch (role) {
    case 'farmer': return 'equipment';
    case 'tech': return 'dashboard';
    case 'office': return 'jobs';
    case 'manager': return 'dashboard';
    default: return 'dashboard';
  }
};
