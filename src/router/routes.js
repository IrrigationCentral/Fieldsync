// FieldSync v2 - Route Configuration
// Maps tab IDs to route paths for react-router-dom v6

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  SIGNUP: '/signup',

  // Farmer
  FARMER_EQUIPMENT: '/equipment',
  FARMER_JOBS: '/service-history',

  // Tech
  TECH_DASHBOARD: '/dashboard',
  TECH_JOBS: '/my-jobs',

  // Office
  OFFICE_JOBS: '/jobs',
  OFFICE_CALLIN: '/call-in',

  // Manager
  MANAGER_DASHBOARD: '/dashboard',
  MANAGER_MY_JOBS: '/my-jobs',
  MANAGER_JOBS: '/all-jobs',
  MANAGER_CALENDAR: '/calendar',
  MANAGER_ANALYTICS: '/analytics',
  MANAGER_SETTINGS: '/settings',

  // Shared
  CUSTOMERS: '/customers',
  TEAM: '/team',
  MAP: '/map',
  WEATHER: '/weather',
  EQUIPMENT_PROFILE: '/equipment/:id'
};

// Map old tab IDs → route paths (used during migration)
export const TAB_TO_ROUTE = {
  // Farmer tabs
  equipment: '/equipment',
  // Tech/shared tabs
  dashboard: '/dashboard',
  jobs: '/jobs',
  myjobs: '/my-jobs',
  // Office
  callin: '/call-in',
  // Shared
  customers: '/customers',
  team: '/team',
  map: '/map',
  weather: '/weather',
  calendar: '/calendar',
  analytics: '/analytics',
  settings: '/settings'
};

// Map route paths → tab IDs (reverse lookup)
export const ROUTE_TO_TAB = Object.fromEntries(
  Object.entries(TAB_TO_ROUTE).map(([tab, route]) => [route, tab])
);
