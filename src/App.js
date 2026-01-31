import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Users, CheckCircle, AlertCircle, Clock, Wrench,
  Navigation, Droplets, Phone, Mail, Calendar, FileText,
  LogOut, ChevronRight, ChevronDown, ChevronUp,
  Plus, Edit, Trash2, X, Search,
  Bell, User, DollarSign, Briefcase, BarChart3,
  Home, Map, Clipboard, UserPlus, Cloud, Wifi,
  WifiOff, Eye, Check, Settings, Moon, Sun,
  Star, ChevronLeft, Power
} from 'lucide-react';

// Firebase imports
import {
  signUp,
  signIn,
  logOut,
  getUserProfile,
  onAuthChange,
  updateUserEmail,
  updateUserPassword,
  updateUser,
  resetPassword,
  deleteUser as fbDeleteUser,
  subscribeToUsers,
  subscribeToPivots,
  subscribeToJobs,
  subscribeToSettings,
  addPivot as fbAddPivot,
  addJob as fbAddJob,
  updateJob as fbUpdateJob,
  assignJob as fbAssignJob,
  addAssigneeToJob as fbAddAssignee,
  removeAssigneeFromJob as fbRemoveAssignee,
  completeJob as fbCompleteJob,
  updatePivot as fbUpdatePivot,
  updateSettings as fbUpdateSettings,
  deletePivot as fbDeletePivot,
  deleteJob as fbDeleteJob,
  getAnalytics,
  startTimeEntry as fbStartTimeEntry,
  stopTimeEntry as fbStopTimeEntry,
  addManualTimeEntry as fbAddManualTimeEntry,
  deleteTimeEntry as fbDeleteTimeEntry,
  subscribeToParts
} from './firebase';

// SMS Service
import {
  CARRIERS,
  sendTestNotification,
  isEmailJSConfigured,
  getSmsEmail
} from './services/sms';

// Notification Service
import { 
  notifyNewIssue, 
  notifyJobAssigned, 
  notifyJobCompletedFarmer, 
  notifyJobCompletedStaff, 
  notifyUrgentIssue 
} from './services/notifications';

// Excel Export
import { exportJobToExcel } from './services/excelExport';

// UI Components
import { Modal, Button, Input, Select, SearchableSelect, Badge, StarRating, Spinner } from './components/ui';

// Floating Action Button - Currently disabled, using manual time entry only
// import { ClockInFAB } from './components/ClockInFAB';

// View Components
import {
  ManagerDashboard,
  ManagerJobsView,
  TeamManagement,
  AnalyticsView,
  TechTeamView,
  CustomersView,
  TVDashboard
} from './components/views';

// Modal Components - Lazy loaded for better performance
const ReportIssueModal = React.lazy(() => import('./components/modals/ReportIssueModal'));
const CompleteJobModal = React.lazy(() => import('./components/modals/CompleteJobModal'));
const AddUserModal = React.lazy(() => import('./components/modals/AddUserModal'));
const AssignJobModal = React.lazy(() => import('./components/modals/AssignJobModal'));
const SettingsModal = React.lazy(() => import('./components/modals/SettingsModal'));
const SONumberModal = React.lazy(() => import('./components/modals/SONumberModal'));
const AddEquipmentModal = React.lazy(() => import('./components/modals/AddEquipmentModal'));
const JobDetailsModal = React.lazy(() => import('./components/modals/JobDetailsModal'));
const ProfileModal = React.lazy(() => import('./components/modals/ProfileModal'));
const EditJobModal = React.lazy(() => import('./components/modals/EditJobModal'));
const ClockOutSurveyModal = React.lazy(() => import('./components/modals/ClockOutSurveyModal'));


// ============================================
// THEME & COLORS
// ============================================
const lightTheme = {
  primary: '#2D5016',
  secondary: '#8FBC3B',
  accent: '#F4B942',
  danger: '#C73E1D',
  water: '#4A90A4',
  soil: '#8B6F47',
  sky: '#87CEEB',
  muted: '#9CA986',
  background: '#FEFDF8',
  cardBg: '#FFFFFF',
  textPrimary: '#1A1F16',
  textSecondary: '#5C6650',
  success: '#52C41A',
  warning: '#FAAD14',
  border: '#E8E5D7',
  inputBg: '#FFFFFF',
  headerBg: '#2D5016',
  navBg: '#FFFFFF'
};

const darkTheme = {
  primary: '#8FBC3B',
  secondary: '#2D5016',
  accent: '#F4B942',
  danger: '#FF6B6B',
  water: '#5BA8BE',
  soil: '#A68B5B',
  sky: '#5C9EBF',
  muted: '#8B9A7A',
  background: '#0D1117',
  cardBg: '#161B22',
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  success: '#7EE787',
  warning: '#F0B429',
  border: '#30363D',
  inputBg: '#21262D',
  headerBg: '#161B22',
  navBg: '#161B22'
};

// ============================================
// TRUCK INVENTORY LOCATIONS
// ============================================
const TRUCK_LOCATIONS = [
  { id: '1', name: '1. Well Rig 2005 Mack' },
  { id: '3', name: '3. 2005 Mack' },
  { id: '5', name: '5. Water Truck 1996 Freightliner' },
  { id: '11', name: '11. 2005 Mack' },
  { id: '14', name: '14. Red Crane 2005 Mack' },
  { id: '18', name: '18. Dump Truck 2006 Mack' },
  { id: '20', name: '20. 1995 Mack' },
  { id: '30', name: '30. Blue Crane 2013 Mack' },
  { id: '40', name: '40. Dump Truck 1998 Mack' },
  { id: '54', name: '54. V10 Ford 3500' },
  { id: '55', name: '55. 2006 GMC 2500' },
  { id: '56', name: '56. 2016 Ram 1500' },
  { id: '57', name: '57. 2015 Ram 5500' },
  { id: '58', name: '58. 2014 Ram 5500' },
  { id: '59', name: '59. 2012 Ram 5500' },
  { id: '60', name: '60. 2016 Ram 5500' },
  { id: '61', name: '61. 2012 Ram 3500' },
  { id: '62', name: '62. 2022 Ram 2500' },
  { id: '65', name: '65. 2009 GMC 2500' },
  { id: '67', name: '67. 2022 Ram 5500' },
  { id: '68', name: '68. 2022 Ram 5500' },
  { id: '69', name: '69. 1999 International 4700' },
  { id: '70', name: '70. Rope Crane 1995 International 4900' },
  { id: '71', name: '71. Roll Back 1999 International 4700' },
  { id: '72', name: '72. Bucket Truck 1994 International 4700' },
  { id: '73', name: '73. Little Well Rig 1999 International 4700' },
  { id: '76', name: '76. 2024 Ram 1500' },
  { id: '77', name: '77. 2024 GMC 1500' },
  { id: '78', name: '78. 2025 GMC 1500' },
  { id: '79', name: '79. 2023 International' },
  { id: '80', name: '80. 2025 GMC 2500' },
  { id: 'hq', name: 'Irrigation Central HQ (Warehouse)' },
  { id: 'shop', name: 'Shop Inventory' },
  { id: 'other', name: 'Other' }
];

// ============================================

// ============================================
// LOCAL COMPONENTS (StatCard, EmptyState, LoadingScreen)
// ============================================

// Stat Card Component
// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, icon: Icon, trend, color = '#2D5016' }) => (
  <div className="card p-4" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
    <div className="flex items-center justify-between mb-2">
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: color + '15' }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      {trend && (
        <span className="text-xs font-medium" style={{ color: trend > 0 ? '#52C41A' : '#C73E1D' }}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
  </div>
);

// Clickable Stat Card - MUST be outside component to prevent re-renders
const ClickableStat = ({ title, value, icon: Icon, color, onClick, subtitle, colors }) => (
  <div 
    className="card p-4 cursor-pointer hover:shadow-lg transition-all transform hover:scale-[1.02]" 
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
    </div>
    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{value}</p>
    <p className="text-sm" style={{ color: colors.textSecondary }}>{title}</p>
    {subtitle && <p className="text-xs mt-1" style={{ color: colors.muted }}>{subtitle}</p>}
  </div>
);

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div 
      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
      style={{ backgroundColor: '#9CA98620' }}
    >
      <Icon className="w-8 h-8" style={{ color: '#9CA986' }} />
    </div>
    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
    <p className="text-sm mb-4 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
    {action}
  </div>
);

// Loading Screen Component
const LoadingScreen = () => (
  <div 
    className="min-h-screen flex flex-col items-center justify-center"
    style={{ background: `linear-gradient(135deg, #FEFDF8 0%, #E8F5E9 100%)` }}
  >
    <div className="text-center">
      <div 
        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg"
        style={{ background: `linear-gradient(135deg, #2D5016 0%, #8FBC3B 100%)` }}
      >
        <Droplets className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold mb-4" style={{ color: '#2D5016' }}>FieldSync</h1>
      <Spinner size="lg" />
    </div>
  </div>
);


// TV Dashboard Token - Change this to your own secret token
const TV_DASHBOARD_TOKEN = process.env.REACT_APP_TV_DASHBOARD_TOKEN || 'irrigationcentral2025tv';

// TV Dashboard Wrapper Component
const TVDashboardWrapper = () => {
  const [tvJobs, setTVJobs] = useState([]);
  const [tvUsers, setTVUsers] = useState([]);
  const [tvEquipment, setTVEquipment] = useState([]);
  
  useEffect(() => {
    // Subscribe to data without auth
    const unsubJobs = subscribeToJobs((jobsData) => {
      setTVJobs(jobsData);
    });
    
    const unsubUsers = subscribeToUsers((usersData) => {
      setTVUsers(usersData);
    });
    
    const unsubPivots = subscribeToPivots((pivotsData) => {
      setTVEquipment(pivotsData);
    });
    
    return () => {
      unsubJobs && unsubJobs();
      unsubUsers && unsubUsers();
      unsubPivots && unsubPivots();
    };
  }, []);
  
  return (
    <TVDashboard 
      jobs={tvJobs}
      users={tvUsers}
      equipment={tvEquipment}
    />
  );
};

// Check if TV mode before rendering main app
const isTVRoute = () => {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  return path === '/tv' && token === TV_DASHBOARD_TOKEN;
};

const FieldSyncApp = () => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fieldsync-darkmode');
      return saved === 'true';
    }
    return false;
  });
  
  // Dynamic colors based on theme
  const colors = isDarkMode ? darkTheme : lightTheme;
  
  // Auth State
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // Dev Mode - Role Override (only for specific emails)
  const [devRoleOverride, setDevRoleOverride] = useState(null);
  const DEV_EMAILS = [
    'leemarcum@hardluckelectrical.com',
    'lmarcum@irrigationcentral.com', 
    'leehmarcum416@gmail.com',
    'rkbateman@irrigationcentral.com',
    'koguin@irrigationcentral.com'
  ];
  const isDevUser = currentUser?.email && DEV_EMAILS.includes(currentUser.email.toLowerCase());
  
  // Feature Kill Switches (stored in localStorage for persistence)
  const [featureFlags, setFeatureFlags] = useState(() => {
    const saved = localStorage.getItem('fieldsync_feature_flags');
    return saved ? JSON.parse(saved) : {
      jobCreation: true,
      timeTracking: true,
      notifications: true,
      equipmentEditing: true,
      userManagement: true,
      mapView: true,
      calendarView: true,
      reportIssue: true
    };
  });
  
  // Save feature flags to localStorage when changed
  useEffect(() => {
    localStorage.setItem('fieldsync_feature_flags', JSON.stringify(featureFlags));
  }, [featureFlags]);
  
  // App State
  const [currentView, setCurrentView] = useState('login');
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [syncStatus, setSyncStatus] = useState('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [customerSearchQuery, setCustomerSearchQuery] = useState(''); // Lifted from CustomersView to prevent reset
  const [callInFormData, setCallInFormData] = useState({ customerName: '', customerPhone: '', pivotId: '', description: '', priority: 'medium', farmerId: '', soNumber: '' }); // Lifted from CallInView
  const [weatherData, setWeatherData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  
  // Data State (from Firebase)
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]); // Still called 'pivots' in database
  const [jobs, setJobs] = useState([]);
  const [parts, setParts] = useState([]); // Parts inventory
  const [pricingSettings, setPricingSettings] = useState({ hourlyRate: 75, mileageRate: 0.65, partsMarkup: 0 });
  
  // Modal States
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [showCompleteJobModal, setShowCompleteJobModal] = useState(false);
  const [showAssignJobModal, setShowAssignJobModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showSOModal, setShowSOModal] = useState(false);
  const [showClockOutSurvey, setShowClockOutSurvey] = useState(false);
  const [clockOutJobId, setClockOutJobId] = useState(null);
  const [selectedEquipmentForIssueId, setSelectedEquipmentForIssueId] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  
  // Equipment Profile States
  const [selectedEquipmentProfileId, setSelectedEquipmentProfileId] = useState(null);
  const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(false);
  // const [viewingFarmerProfile, setViewingFarmerProfile] = useState(null); // TODO: Implement farmer profile viewing

  // ============================================
  // DERIVED STATE - Always use fresh data from subscriptions
  // ============================================
  // Derive selected items from IDs - ensures we always use fresh data
  const selectedJobForAction = selectedJobId ? jobs.find(j => j.id === selectedJobId) : null;
  const selectedEquipmentForIssue = selectedEquipmentForIssueId ? equipment.find(e => e.id === selectedEquipmentForIssueId) : null;
  const selectedEquipmentProfile = selectedEquipmentProfileId ? equipment.find(e => e.id === selectedEquipmentProfileId) : null;
  
  // Helper setters (store ID, not object) - these replace the old setState functions
  const setSelectedJobForAction = (job) => setSelectedJobId(job?.id || null);
  const setSelectedEquipmentForIssue = (equip) => setSelectedEquipmentForIssueId(equip?.id || null);
  const setSelectedEquipmentProfile = (equip) => setSelectedEquipmentProfileId(equip?.id || null);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('fieldsync-darkmode', String(newValue));
      return newValue;
    });
  };

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      document.body.classList.add('dark');
      root.style.setProperty('--color-background', darkTheme.background);
      root.style.setProperty('--color-card', darkTheme.cardBg);
      root.style.setProperty('--color-text-primary', darkTheme.textPrimary);
      root.style.setProperty('--color-text-secondary', darkTheme.textSecondary);
      root.style.setProperty('--color-border', darkTheme.border);
      root.style.setProperty('--color-input-bg', darkTheme.inputBg);
    } else {
      document.body.classList.remove('dark');
      root.style.setProperty('--color-background', lightTheme.background);
      root.style.setProperty('--color-card', lightTheme.cardBg);
      root.style.setProperty('--color-text-primary', lightTheme.textPrimary);
      root.style.setProperty('--color-text-secondary', lightTheme.textSecondary);
      root.style.setProperty('--color-border', lightTheme.border);
      root.style.setProperty('--color-input-bg', lightTheme.inputBg);
    }
  }, [isDarkMode]);

  // ============================================
  // FIREBASE AUTH LISTENER
  // ============================================
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        const result = await getUserProfile(user.uid);
        if (result.success) {
          setCurrentUser(user);
          setUserProfile(result.profile);
          setCurrentView('app');
          // Set default tab based on role
          const role = result.profile.role;
          if (role === 'farmer') setSelectedTab('dashboard');
          else if (role === 'office') setSelectedTab('jobs');
          else setSelectedTab('dashboard');
        } else {
          await logOut();
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setCurrentView('login');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ============================================
  // REAL-TIME DATA SUBSCRIPTIONS
  // ============================================
  useEffect(() => {
    if (!currentUser) return;
    const unsubUsers = subscribeToUsers((data) => setUsers(data));
    const unsubEquipment = subscribeToPivots((data) => setEquipment(data)); // Database still uses 'pivots' collection
    const unsubJobs = subscribeToJobs((data) => setJobs(data));
    const unsubSettings = subscribeToSettings((data) => setPricingSettings(data));
    const unsubParts = subscribeToParts((data) => setParts(data));

    return () => {
      unsubUsers();
      unsubEquipment();
      unsubJobs();
      unsubSettings();
      unsubParts();
    };
  }, [currentUser]);

  // ============================================
  // LOAD ANALYTICS (Manager only)
  // ============================================
  useEffect(() => {
    if (!currentUser || !['manager', 'office'].includes(userProfile?.role)) return;
    const loadAnalytics = async () => {
      const result = await getAnalytics();
      if (result.success) setAnalytics(result.analytics);
    };
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [currentUser, userProfile]);

  // ============================================
  // WEATHER DATA (Mock)
  // ============================================
  useEffect(() => {
    setWeatherData({
      temp: 72, conditions: 'Partly Cloudy', humidity: 65, windSpeed: 8, precipitation: 0,
      forecast: [
        { day: 'Mon', high: 75, low: 55, conditions: 'sunny' },
        { day: 'Tue', high: 78, low: 58, conditions: 'cloudy' },
        { day: 'Wed', high: 72, low: 54, conditions: 'rain' },
        { day: 'Thu', high: 70, low: 52, conditions: 'partly-cloudy' },
        { day: 'Fri', high: 76, low: 56, conditions: 'sunny' }
      ]
    });
  }, []);

  // ============================================
  // SYNC STATUS
  // ============================================
  useEffect(() => {
    const handleOnline = () => setSyncStatus('online');
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================
  // NOTIFICATION SYSTEM
  // ============================================
  const addNotification = useCallback((type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  // Track dismissed notifications (persists in session)
  const [dismissedNotifications, setDismissedNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('fieldsync-dismissed-notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save dismissed notifications to localStorage
  useEffect(() => {
    localStorage.setItem('fieldsync-dismissed-notifications', JSON.stringify(dismissedNotifications));
  }, [dismissedNotifications]);

  // Dismiss a single notification
  const dismissNotification = (notifId) => {
    setDismissedNotifications(prev => [...prev, notifId]);
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    const allIds = jobNotifications.map(n => n.id);
    setDismissedNotifications(prev => [...prev, ...allIds]);
  };

  // Get pending job notifications for dropdown - FILTERED BY ROLE
  const jobNotifications = jobs
    .filter(j => {
      // Only pending jobs
      if (j.status !== 'pending') return false;
      
      // Filter based on user role
      const role = userProfile?.role;
      if (role === 'farmer') {
        // Farmers only see notifications for THEIR equipment
        return j.farmerId === userProfile?.id;
      }
      // Techs see jobs assigned to them OR pending
      if (role === 'tech') {
        const assigned = j.assignedTo;
        const isAssignedToMe = Array.isArray(assigned) ? assigned.includes(userProfile?.id) : assigned === userProfile?.id;
        return isAssignedToMe || j.status === 'pending';
      }
      // Manager and office see all
      return true;
    })
    .filter(j => !dismissedNotifications.includes(j.id)) // Exclude dismissed
    .map(j => ({
      id: j.id,
      title: j.title,
      message: `New issue reported${j.pivotName ? ` - ${j.pivotName}` : ''}`,
      time: j.createdAt,
      type: 'pending'
    }));

  // ============================================
  // AUTH HANDLERS
  // ============================================
  const handleLogin = async (email, password) => {
    setIsLoading(true);
    const result = await signIn(email, password);
    if (!result.success) addNotification('error', result.error);
    setIsLoading(false);
  };

  const handleSignup = async (formData) => {
    setIsLoading(true);
    const result = await signUp(formData.email, formData.password, formData.name, 'farmer', formData.phone);
    if (result.success) {
      addNotification('success', 'Account created successfully! Welcome to FieldSync.');
    } else {
      addNotification('error', result.error);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await logOut();
    addNotification('info', 'Logged out successfully');
  };

  // ============================================
  // SETTINGS UPDATE (Manager only)
  // ============================================
  const handleUpdateSettings = async (settings) => {
    setIsLoading(true);
    const result = await fbUpdateSettings(settings);
    if (result.success) {
      addNotification('success', 'Settings updated successfully');
      setShowSettingsModal(false);
    } else {
      addNotification('error', 'Failed to update settings');
    }
    setIsLoading(false);
  };

  // ============================================
  // JOB MANAGEMENT
  // ============================================
  const createJob = async (pivotId, description, priority, pivotOptions) => {
    const pivot = equipment.find(p => p.id === pivotId);
    if (!pivot) return;

    // Determine the correct farmerId - use pivot owner for staff reports
    const isStaff = ['tech', 'manager', 'office'].includes(userProfile?.role);
    const targetFarmerId = isStaff ? pivot.farmerId : userProfile.id;

    setIsLoading(true);
    try {
      const jobData = {
        title: `Issue reported - ${pivot.name}`,
        description,
        priority,
        farmerId: targetFarmerId,
        pivotId,
        pivotName: pivot.name,
        location: { lat: pivot.lat || 40.7614, lng: pivot.lng || -96.6856 },
        estimatedHours: 2,
        requiredParts: [],
        photos: pivotOptions?.photos || [],
        weatherAlert: false,
        // Pivot running options
        leavePivotRunning: pivotOptions?.leavePivotRunning || false,
        pivotDirection: pivotOptions?.pivotDirection || '',
        pivotPercentage: pivotOptions?.pivotPercentage || 0,
        farmerAcknowledgedResponsibility: pivotOptions?.acknowledged || false,
        // Staff reporting metadata
        reportedBy: pivotOptions?.reportedBy || null,
        reportedByRole: pivotOptions?.reportedByRole || null
      };
      
      const result = await fbAddJob(jobData);

      if (result.success) {
        addNotification('success', 'Issue reported successfully');
        setShowReportIssueModal(false);
        setSelectedEquipmentForIssue(null);
        
        // Notify managers and office staff about new issue
        const managers = users.filter(u => u.role === 'manager');
        const officeStaff = users.filter(u => u.role === 'office');
        const reporterName = pivotOptions?.reportedBy || userProfile?.name || 'Customer';
        notifyNewIssue(managers, officeStaff, jobData, reporterName);
        
        // If high priority, send urgent notification
        if (priority === 'high') {
          notifyUrgentIssue(managers, jobData, reporterName);
        }
      } else {
        addNotification('error', 'Failed to report issue');
      }
    } catch (error) {
      console.error('Create job error:', error);
      addNotification('error', 'Failed to create job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create job for office call-ins
  const createCallInJob = async (jobData) => {
    setIsLoading(true);
    try {
      const fullJobData = {
        ...jobData,
        createdBy: userProfile.id,
        createdByRole: 'office',
        isCallIn: true
      };
      
      const result = await fbAddJob(fullJobData);

      if (result.success) {
        addNotification('success', 'Call-in job created successfully');
        
        // Notify managers about new call-in job
        const managers = users.filter(u => u.role === 'manager');
        const reporterName = userProfile?.name || 'Office';
        notifyNewIssue(managers, [], fullJobData, reporterName);
        
        return { success: true };
      } else {
        addNotification('error', 'Failed to create job');
        return { success: false };
      }
    } catch (error) {
      console.error('Create call-in job error:', error);
      addNotification('error', 'Failed to create job. Please try again.');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignJob = async (jobId, techId) => {
    setIsLoading(true);
    try {
      const result = await fbAssignJob(jobId, techId);
      if (result.success) {
        const tech = users.find(u => u.id === techId);
        addNotification('success', `Job assigned to ${tech?.name || 'technician'}`);

        // Send notification to assigned tech
        const job = jobs.find(j => j.id === jobId);
        if (tech && job) {
          notifyJobAssigned(tech, job);
        }

        setShowAssignJobModal(false);
        setSelectedJobForAction(null);
      } else {
        addNotification('error', result.error || 'Failed to assign job');
      }
    } catch (error) {
      console.error('Assign job error:', error);
      addNotification('error', 'Failed to assign job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Self-assign job (for techs and managers)
  const handleSelfAssign = async (jobId) => {
    setIsLoading(true);
    try {
      const result = await fbAssignJob(jobId, userProfile.id);
      if (result.success) {
        addNotification('success', 'Job assigned to you');
        console.log('Self-assigned job:', jobId);
      } else {
        addNotification('error', result.error || 'Failed to assign job');
      }
    } catch (error) {
      console.error('Self-assign error:', error);
      addNotification('error', 'Failed to assign job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start time tracking
  const handleStartTime = async (jobId) => {
    setIsLoading(true);
    try {
      const result = await fbStartTimeEntry(jobId, userProfile.id, userProfile.name);
      if (result.success) {
        // Status is now set to 'in-progress' inside startTimeEntry - no need for second update
        addNotification('success', 'Time tracking started ⏱️');
      } else {
        addNotification('error', result.error || 'Failed to start time tracking');
      }
    } catch (error) {
      console.error('Start time error:', error);
      addNotification('error', 'Failed to start time tracking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop time tracking
  const handleStopTime = async (jobId, lunchTaken = false, sessionNotes = '', sessionData = {}) => {
    setIsLoading(true);
    try {
      const result = await fbStopTimeEntry(jobId, userProfile.id, lunchTaken, sessionNotes, sessionData);
      if (result.success) {
        addNotification('success', 'Time tracking stopped ⏹️');
      } else {
        addNotification('error', result.error || 'Failed to stop time tracking');
      }
    } catch (error) {
      console.error('Stop time error:', error);
      addNotification('error', 'Failed to stop time tracking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initiate clock out - shows the survey modal
  const handleInitiateClockOut = (jobId) => {
    setClockOutJobId(jobId);
    setShowClockOutSurvey(true);
  };

  // Complete clock out with survey data
  const handleClockOutSurveyComplete = async (surveyData) => {
    if (!clockOutJobId) return;
    
    await handleStopTime(
      clockOutJobId, 
      surveyData.lunchTaken, 
      surveyData.sessionNotes,
      {
        isJobComplete: surveyData.isJobComplete,
        partsNeeded: surveyData.partsNeeded
      }
    );
    
    setShowClockOutSurvey(false);
    setClockOutJobId(null);
  };

  // Add manual time entry
  const handleAddManualTimeEntry = async (jobId, techId, techName, startTime, endTime, lunchTaken, notes) => {
    setIsLoading(true);
    const result = await fbAddManualTimeEntry(jobId, techId, techName, startTime, endTime, lunchTaken, notes);
    if (result.success) {
      addNotification('success', 'Time entry added');
    } else {
      addNotification('error', result.error || 'Failed to add time entry');
    }
    setIsLoading(false);
    return result;
  };

  // Delete time entry
  const handleDeleteTimeEntry = async (jobId, entryId) => {
    setIsLoading(true);
    const result = await fbDeleteTimeEntry(jobId, entryId);
    if (result.success) {
      addNotification('success', 'Time entry deleted');
    } else {
      addNotification('error', result.error || 'Failed to delete time entry');
    }
    setIsLoading(false);
    return result;
  };

  // Export job to Excel
  const handleExportToExcel = async (job) => {
    try {
      const pivot = equipment.find(p => p.id === job.pivotId);
      const farmer = users.find(u => u.id === job.farmerId);
      const allTechs = users.filter(u => u.role === 'tech' || u.role === 'manager');
      
      const result = await exportJobToExcel(job, pivot, farmer, allTechs, pricingSettings);
      if (result.success) {
        addNotification('success', `Exported: ${result.fileName}`);
      } else {
        addNotification('error', 'Failed to export');
      }
    } catch (error) {
      console.error('Export error:', error);
      addNotification('error', 'Failed to export to Excel');
    }
  };

  const handleCompleteJob = async (jobId, completionData) => {
    setIsLoading(true);
    
    try {
      // First, stop any active time entries for this job
      const job = jobs.find(j => j.id === jobId);
      if (job?.timeEntries) {
        const activeEntries = job.timeEntries.filter(e => !e.endTime);
        for (const entry of activeEntries) {
          try {
            await fbStopTimeEntry(jobId, entry.techId, false);
          } catch (err) {
            console.error('Error stopping time entry:', err);
            // Continue even if stopping time fails
          }
        }
      }
      
      const totalCost = (completionData.hoursWorked * pricingSettings.hourlyRate) +
                        (completionData.milesDriven * pricingSettings.mileageRate) +
                        (completionData.partsCost || 0) * (1 + pricingSettings.partsMarkup / 100);

      const result = await fbCompleteJob(jobId, {
        ...completionData,
        completedBy: userProfile.id,
        totalCost,
        hourlyRate: pricingSettings.hourlyRate,
        mileageRate: pricingSettings.mileageRate
      });

      if (result.success) {
        addNotification('success', 'Job completed successfully! 🎉');
        
        // Close modal FIRST before any notification logic
        setShowCompleteJobModal(false);
        setSelectedJobForAction(null);

        // Send notifications (non-blocking, errors won't affect UI)
        try {
          const completedByName = userProfile?.name || 'Technician';
          if (job) {
            // Notify farmer that their equipment is serviced
            const farmer = users.find(u => u.id === job.farmerId);
            if (farmer) {
              notifyJobCompletedFarmer(farmer, job);
            }
            // Notify managers and office staff about completion
            const managers = users.filter(u => u.role === 'manager');
            const officeStaff = users.filter(u => u.role === 'office');
            notifyJobCompletedStaff(managers, officeStaff, job, completedByName);
          }
        } catch (notifError) {
          console.error('Notification error (non-critical):', notifError);
        }
      } else {
        addNotification('error', result.error || 'Failed to complete job');
      }
    } catch (error) {
      console.error('Complete job error:', error);
      addNotification('error', 'Failed to complete job: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update job status (for status changes like revert, billing status, etc.)
  const handleUpdateJobStatus = async (jobId, newStatus) => {
    setIsLoading(true);
    const statusLabels = {
      'assigned': 'Assigned',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'ready-to-bill': 'Ready to Bill',
      'billed': 'Billed',
      'waiting-on-parts': 'Waiting on Parts',
      'canceled': 'Canceled'
    };
    
    const updateData = { status: newStatus, updatedAt: new Date().toISOString() };
    
    // If reverting to assigned/in-progress, clear completion data
    if (newStatus === 'assigned' || newStatus === 'in-progress') {
      updateData.completedAt = null;
      updateData.completedBy = null;
    }
    
    const result = await fbUpdateJob(jobId, updateData);
    if (result.success) {
      addNotification('success', `Job status updated to ${statusLabels[newStatus] || newStatus}`);
    } else {
      addNotification('error', 'Failed to update job status');
    }
    setIsLoading(false);
    return result;
  };

  const handleUpdateSONumber = async (jobId, soNumber) => {
    setIsLoading(true);
    const result = await fbUpdateJob(jobId, { soNumber });
    if (result.success) {
      addNotification('success', 'SO Number updated');
      setShowSOModal(false);
      setSelectedJobForAction(null);
    } else {
      addNotification('error', 'Failed to update SO Number');
    }
    setIsLoading(false);
  };

  const handleRateJob = async (jobId, rating, feedback) => {
    const result = await fbUpdateJob(jobId, { 
      rating, 
      feedback,
      ratedAt: new Date().toISOString()
    });
    if (result.success) {
      addNotification('success', 'Thank you for your feedback! ⭐');
    } else {
      addNotification('error', 'Failed to submit rating');
    }
  };

  const handleDownloadJobSheet = async (job) => {
    // Use Excel export as primary
    await handleExportToExcel(job);
  };

  // ============================================
  // EQUIPMENT MANAGEMENT
  // ============================================
  const handleAddEquipment = async (equipmentData) => {
    setIsLoading(true);
    try {
      const result = await fbAddPivot({
        ...equipmentData,
        farmerId: equipmentData.farmerId || userProfile.id,
        status: equipmentData.status || 'active',
        lastService: new Date().toISOString().split('T')[0]
      });

      if (result.success) {
        addNotification('success', 'Equipment added successfully');
        setShowAddEquipmentModal(false);
        return { success: true, id: result.id };
      } else {
        console.error('Add equipment failed:', result.error);
        addNotification('error', `Failed to add equipment: ${result.error || 'Unknown error'}`);
        return { success: false };
      }
    } catch (error) {
      console.error('Add equipment error:', error);
      addNotification('error', `Failed to add equipment: ${error.message}`);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEquipmentLocation = async (equipmentId, lat, lng, address) => {
    const result = await fbUpdatePivot(equipmentId, { lat, lng, address });
    if (result.success) {
      addNotification('success', 'Equipment location updated');
    } else {
      addNotification('error', 'Failed to update location');
    }
  };

  const handleDeleteEquipment = useCallback(async (equipmentId, equipmentName) => {
    if (!window.confirm(`Are you sure you want to delete "${equipmentName}"? This cannot be undone.`)) {
      return;
    }
    setIsLoading(true);
    const result = await fbDeletePivot(equipmentId);
    if (result.success) {
      addNotification('success', 'Equipment deleted successfully');
      setSelectedEquipmentProfile(null);
    } else {
      addNotification('error', 'Failed to delete equipment');
    }
    setIsLoading(false);
  }, [addNotification]);

  const handleDeleteJob = useCallback(async (jobId, jobTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${jobTitle}"? This cannot be undone.`)) {
      return;
    }
    setIsLoading(true);
    const result = await fbDeleteJob(jobId);
    if (result.success) {
      addNotification('success', 'Job deleted successfully');
    } else {
      addNotification('error', 'Failed to delete job');
    }
    setIsLoading(false);
  }, [addNotification]);

  // Delete user (customer or team member) - Manager only
  const handleDeleteUser = useCallback(async (userId, userName, userRole) => {
    const roleLabel = userRole === 'farmer' ? 'customer' : 'team member';
    if (!window.confirm(`Are you sure you want to delete ${roleLabel} "${userName}"? This cannot be undone.`)) {
      return;
    }
    setIsLoading(true);
    const result = await fbDeleteUser(userId);
    if (result.success) {
      addNotification('success', `${roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)} deleted successfully`);
    } else {
      addNotification('error', `Failed to delete ${roleLabel}`);
    }
    setIsLoading(false);
  }, [addNotification]);

  // Add assignee to job
  // eslint-disable-next-line no-unused-vars
  const handleAddAssignee = async (jobId, userId) => {
    setIsLoading(true);
    const result = await fbAddAssignee(jobId, userId);
    if (result.success) {
      const user = users.find(u => u.id === userId);
      addNotification('success', `${user?.name || 'User'} added to job`);
    } else {
      addNotification('error', 'Failed to add assignee');
    }
    setIsLoading(false);
  };

  // Remove assignee from job
  const handleRemoveAssignee = async (jobId, userId) => {
    const user = users.find(u => u.id === userId);
    if (!window.confirm(`Remove ${user?.name || 'this person'} from this job?`)) {
      return;
    }
    setIsLoading(true);
    const result = await fbRemoveAssignee(jobId, userId);
    if (result.success) {
      addNotification('success', `${user?.name || 'User'} removed from job`);
    } else {
      addNotification('error', 'Failed to remove assignee');
    }
    setIsLoading(false);
  };

  const handleUpdateEquipmentDetails = async (equipmentId, equipmentData) => {
    setIsLoading(true);
    const result = await fbUpdatePivot(equipmentId, equipmentData);
    if (result.success) {
      addNotification('success', 'Equipment details updated successfully');
      setShowEditEquipmentModal(false);
      // Update the selected equipment profile with new data
      if (selectedEquipmentProfile) {
        setSelectedEquipmentProfile({ ...selectedEquipmentProfile, ...equipmentData });
      }
    } else {
      addNotification('error', 'Failed to update equipment details');
    }
    setIsLoading(false);
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getStatusVariant = (status) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'assigned': return 'water';
      case 'in-progress': return 'water';  // Active time tracking
      case 'completed': return 'success';
      case 'ready-to-bill': return 'accent';  // Ready for billing
      case 'billed': return 'success';  // Invoice sent
      case 'waiting-on-parts': return 'warning';  // Waiting for parts
      case 'canceled': return 'danger';  // Job canceled
      case 'active': return 'success';
      case 'needs-service': return 'danger';
      default: return 'default';
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    const statusLabels = {
      'pending': 'Pending',
      'assigned': 'Assigned',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'ready-to-bill': 'Ready to Bill',
      'billed': 'Billed',
      'waiting-on-parts': 'Waiting on Parts',
      'canceled': 'Canceled'
    };
    return statusLabels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  // Format equipment type for display
  const formatEquipmentType = (type) => {
    const typeLabels = {
      'center': 'Center Pivot',
      'linear': 'Linear Pivot',
      'corner': 'Corner System',
      'power_unit': 'Power Unit',
      'generator': 'Generator',
      'pump': 'Pump',
      'well': 'Well',
      'motor': 'Motor',
      'panel': 'Control Panel',
      'other': 'Other'
    };
    return typeLabels[type] || type || 'Unknown';
  };

  // Check if user can see pricing - COMMENTED OUT FOR NOW
  // const canSeePricing = userProfile?.role === 'manager';
  const canSeePricing = false; // Pricing disabled for now

  // Effective profile - uses dev override if set
  const effectiveRole = (isDevUser && devRoleOverride) ? devRoleOverride : userProfile?.role;
  const effectiveProfile = userProfile ? { ...userProfile, role: effectiveRole } : null;

  // ============================================
  // LOGIN SCREEN
  // ============================================
  const LoginScreen = () => {
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', name: '', phone: '' });
    const [errors, setErrors] = useState({});

    const validate = () => {
      const newErrors = {};
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (mode === 'signup') {
        if (!formData.name) newErrors.name = 'Name is required';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!validate()) return;
      if (mode === 'login') handleLogin(formData.email, formData.password);
      else handleSignup(formData);
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${colors.background} 0%, #E8F5E9 100%)` }}>
        <div className="card p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}>
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>FieldSync</h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Agricultural Service Management</p>
          </div>

          <div className="flex mb-6 p-1 rounded-xl" style={{ backgroundColor: colors.background }}>
            <button onClick={() => { setMode('login'); setErrors({}); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white shadow' : ''}`} style={{ color: mode === 'login' ? colors.primary : colors.textSecondary }}>Sign In</button>
            <button onClick={() => { setMode('signup'); setErrors({}); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-white shadow' : ''}`} style={{ color: mode === 'signup' ? colors.primary : colors.textSecondary }}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <Input label="Full Name" placeholder="John Smith" icon={User} value={formData.name} onChange={(e) => { setFormData({...formData, name: e.target.value}); setErrors({...errors, name: ''}); }} error={errors.name} />
                <Input label="Phone Number" placeholder="(555) 123-4567" icon={Phone} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </>
            )}
            <Input label="Email Address" type="email" placeholder="you@example.com" icon={Mail} value={formData.email} onChange={(e) => { setFormData({...formData, email: e.target.value}); setErrors({...errors, email: ''}); }} error={errors.email} />
            <Input label="Password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => { setFormData({...formData, password: e.target.value}); setErrors({...errors, password: ''}); }} error={errors.password} />
            {mode === 'signup' && (
              <Input label="Confirm Password" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => { setFormData({...formData, confirmPassword: e.target.value}); setErrors({...errors, confirmPassword: ''}); }} error={errors.confirmPassword} />
            )}
            <Button type="submit" className="w-full" loading={isLoading}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Button>
          </form>

          {mode === 'signup' && (
            <p className="text-xs text-center mt-4" style={{ color: colors.textSecondary }}>
              New accounts are created as Farmer accounts. Contact your manager to change your role.
            </p>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // NAVIGATION CONFIG
  // ============================================
  const getNavItems = () => {
    const role = effectiveRole;
    let items = [];
    
    if (role === 'farmer') {
      items = [
        { id: 'dashboard', label: 'Home', icon: Home },
        { id: 'equipment', label: 'Equipment', icon: Navigation },
        { id: 'jobs', label: 'History', icon: Clipboard },
        { id: 'map', label: 'Map', icon: Map }
      ];
    } else if (role === 'tech') {
      items = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'myjobs', label: 'My Jobs', icon: Wrench },
        { id: 'jobs', label: 'Open Jobs', icon: Briefcase },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'map', label: 'Field Map', icon: Map }
      ];
    } else if (role === 'office') {
      items = [
        { id: 'jobs', label: 'All Jobs', icon: Briefcase },
        { id: 'callin', label: 'New Call-In', icon: Phone },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'map', label: 'Map', icon: Map }
      ];
    } else {
      // Manager
      items = [
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
    }
    
    // Add dev settings for dev users
    if (isDevUser) {
      items.push({ id: 'dev', label: 'Dev', icon: AlertCircle, isDev: true });
    }
    
    return items;
  };

  // ============================================
  // NOTIFICATIONS DROPDOWN
  // ============================================
  const NotificationsDropdown = () => {
    if (!showNotificationsDropdown) return null;

    return (
      <div 
        className="fixed md:absolute right-2 md:right-0 top-16 md:top-12 w-[calc(100vw-1rem)] md:w-80 bg-white rounded-xl shadow-xl border z-50" 
        style={{ 
          borderColor: colors.border, 
          backgroundColor: colors.cardBg,
          maxWidth: '320px'
        }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
          <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Notifications</h3>
          {jobNotifications.length > 0 && (
            <button 
              className="text-xs px-2 py-1 rounded hover:bg-gray-100"
              style={{ color: colors.textSecondary }}
              onClick={(e) => { e.stopPropagation(); clearAllNotifications(); }}
            >
              Clear All
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {jobNotifications.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm" style={{ color: colors.textSecondary }}>No new notifications</p>
            </div>
          ) : (
            jobNotifications.map(notif => (
              <div key={notif.id} className="p-4 border-b hover:bg-gray-50 group relative" style={{ borderColor: colors.border }}>
                {/* Dismiss button */}
                <button 
                  className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                  title="Dismiss"
                >
                  <X className="w-3 h-3" style={{ color: colors.textSecondary }} />
                </button>
                <div 
                  className="flex items-start space-x-3 cursor-pointer"
                  onClick={() => {
                    const job = jobs.find(j => j.id === notif.id);
                    if (job) {
                      setSelectedJobForAction(job);
                      if (userProfile.role === 'manager' || userProfile.role === 'office') {
                        setShowAssignJobModal(true);
                      } else {
                        setShowJobDetailsModal(true);
                      }
                    }
                    setShowNotificationsDropdown(false);
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.warning + '20' }}>
                    <AlertCircle className="w-4 h-4" style={{ color: colors.warning }} />
                  </div>
                  <div className="flex-1 pr-4">
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
            <button className="w-full text-sm font-medium" style={{ color: colors.primary }} onClick={() => { setSelectedTab('jobs'); setShowNotificationsDropdown(false); }}>
              View All Jobs
            </button>
          </div>
        )}
      </div>
    );
  };


  // ============================================
  // FARMER VIEWS - Simplified & Reassuring
  // ============================================
  const FarmerDashboard = () => {
    const myEquipment = equipment.filter(p => p.farmerId === userProfile?.id);
    const myJobs = jobs.filter(j => j.farmerId === userProfile?.id);
    const activeJobs = myJobs.filter(j => ['pending', 'assigned', 'in-progress', 'waiting-on-parts'].includes(j.status));
    const completedJobs = myJobs.filter(j => ['completed', 'ready-to-bill', 'billed'].includes(j.status));
    
    // Time-aware greeting
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      return 'Good evening';
    };

    // Find the most urgent/recent active job
    const urgentJob = activeJobs.find(j => j.status === 'in-progress') || activeJobs[0];
    const urgentJobTech = urgentJob ? users.find(u => {
      const assigned = urgentJob.assignedTo;
      return Array.isArray(assigned) ? assigned.includes(u.id) : assigned === u.id;
    }) : null;

    return (
      <div className="space-y-6">
        {/* Personalized Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            {getGreeting()}, {userProfile?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {activeJobs.length > 0 
              ? `You have ${activeJobs.length} active service request${activeJobs.length > 1 ? 's' : ''}`
              : "All your equipment is running smooth 🌾"
            }
          </p>
        </div>

        {/* Active Service Alert - Most Important Info First */}
        {urgentJob && (
          <div 
            className="rounded-2xl p-5 cursor-pointer active:scale-99 transition-transform"
            style={{ 
              backgroundColor: urgentJob.status === 'in-progress' ? colors.success + '15' : colors.water + '15',
              borderLeft: `4px solid ${urgentJob.status === 'in-progress' ? colors.success : colors.water}`
            }}
            onClick={() => { setSelectedJobForAction(urgentJob); setShowJobDetailsModal(true); }}
          >
            <div className="flex items-center space-x-2 mb-3">
              {urgentJob.status === 'in-progress' ? (
                <>
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: colors.success }} />
                  <span className="font-bold" style={{ color: colors.success }}>Tech On Site</span>
                </>
              ) : urgentJob.status === 'assigned' ? (
                <>
                  <Clock className="w-4 h-4" style={{ color: colors.water }} />
                  <span className="font-bold" style={{ color: colors.water }}>Tech Assigned</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" style={{ color: colors.warning }} />
                  <span className="font-bold" style={{ color: colors.warning }}>Request Received</span>
                </>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>{urgentJob.title}</h3>
            <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>{urgentJob.pivotName}</p>
            
            {urgentJobTech && (
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: colors.cardBg }}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: colors.primary + '20' }}>
                    {urgentJobTech.avatar || '👷'}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>{urgentJobTech.name}</p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>Your technician</p>
                  </div>
                </div>
                {urgentJobTech.phone && (
                  <a 
                    href={`tel:${urgentJobTech.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-3 rounded-xl active:scale-95 transition-transform"
                    style={{ backgroundColor: colors.success + '20' }}
                  >
                    <Phone className="w-5 h-5" style={{ color: colors.success }} />
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowReportIssueModal(true)}
            className="flex flex-col items-center justify-center p-6 rounded-2xl active:scale-95 transition-transform"
            style={{ backgroundColor: colors.danger + '15' }}
          >
            <Phone className="w-8 h-8 mb-2" style={{ color: colors.danger }} />
            <span className="font-semibold" style={{ color: colors.danger }}>Report Issue</span>
            <span className="text-xs mt-1" style={{ color: colors.textSecondary }}>Need service?</span>
          </button>
          <button
            onClick={() => setShowAddEquipmentModal(true)}
            className="flex flex-col items-center justify-center p-6 rounded-2xl active:scale-95 transition-transform"
            style={{ backgroundColor: colors.primary + '15' }}
          >
            <Plus className="w-8 h-8 mb-2" style={{ color: colors.primary }} />
            <span className="font-semibold" style={{ color: colors.primary }}>Add Equipment</span>
            <span className="text-xs mt-1" style={{ color: colors.textSecondary }}>New system?</span>
          </button>
        </div>

        {/* My Equipment - Simple Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>My Equipment ({myEquipment.length})</h2>
            <button 
              onClick={() => setSelectedTab('equipment')}
              className="text-sm font-medium"
              style={{ color: colors.primary }}
            >
              See All →
            </button>
          </div>
          
          {myEquipment.length === 0 ? (
            <div className="text-center py-8 rounded-xl" style={{ backgroundColor: colors.cardBg }}>
              <Navigation className="w-12 h-12 mx-auto mb-3" style={{ color: colors.muted }} />
              <p style={{ color: colors.textSecondary }}>No equipment added yet</p>
              <Button icon={Plus} className="mt-3" onClick={() => setShowAddEquipmentModal(true)}>Add Equipment</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {myEquipment.slice(0, 3).map(pivot => {
                const hasActiveJob = activeJobs.some(j => j.pivotId === pivot.id);
                return (
                  <div 
                    key={pivot.id}
                    className="flex items-center justify-between p-4 rounded-xl cursor-pointer active:scale-99 transition-transform"
                    style={{ backgroundColor: colors.cardBg }}
                    onClick={() => setSelectedEquipmentProfile(pivot)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: colors.primary + '15' }}>
                        {pivot.type === 'pivot' ? '🌀' : pivot.type === 'drip' ? '💧' : '🚜'}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{pivot.name}</p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{pivot.acres} acres • {pivot.status}</p>
                      </div>
                    </div>
                    {hasActiveJob && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: colors.warning + '20', color: colors.warning }}>
                        Service Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Service History */}
        {completedJobs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Recent Service</h2>
              <button 
                onClick={() => setSelectedTab('jobs')}
                className="text-sm font-medium"
                style={{ color: colors.primary }}
              >
                See All →
              </button>
            </div>
            <div className="space-y-2">
              {completedJobs.slice(0, 2).map(job => (
                <div 
                  key={job.id}
                  className="flex items-center justify-between p-4 rounded-xl cursor-pointer active:scale-99 transition-transform"
                  style={{ backgroundColor: colors.cardBg }}
                  onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
                >
                  <div>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {job.pivotName} • {new Date(job.completedAt || job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {job.rating ? (
                      <div className="flex items-center">
                        <Star className="w-4 h-4" style={{ color: colors.accent, fill: colors.accent }} />
                        <span className="text-sm ml-1" style={{ color: colors.accent }}>{job.rating}</span>
                      </div>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: colors.accent + '20', color: colors.accent }}>
                        Rate
                      </span>
                    )}
                    <CheckCircle className="w-5 h-5" style={{ color: colors.success }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const FarmerEquipmentView = () => {
    const myEquipment = equipment.filter(p => p.farmerId === userProfile?.id);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: colors.primary }}>My Equipment</h2>
          <Button icon={Plus} onClick={() => setShowAddEquipmentModal(true)}>Add Equipment</Button>
        </div>

        {myEquipment.length === 0 ? (
          <EmptyState icon={Navigation} title="No Equipment Yet" description="Add your first equipment to start tracking your irrigation equipment." action={<Button icon={Plus} onClick={() => setShowAddEquipmentModal(true)}>Add Your first equipment</Button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myEquipment.map(pivot => (
              <div key={pivot.id} className="card p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedEquipmentProfile(pivot)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{pivot.name}</h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{formatEquipmentType(pivot.type)} • {pivot.brand || 'Brand N/A'}</p>
                  </div>
                  <Badge variant={getStatusVariant(pivot.status)}>{pivot.status}</Badge>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Acres:</span><span style={{ color: colors.textPrimary }}>{pivot.acres}</span></div>
                  {pivot.length && <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Length:</span><span style={{ color: colors.textPrimary }}>{pivot.length} ft</span></div>}
                  {pivot.powerType && <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Power:</span><span style={{ color: colors.textPrimary }}>{pivot.powerType}</span></div>}
                  {pivot.address && <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Location:</span><span style={{ color: colors.textPrimary }} className="text-right text-xs truncate max-w-32">{pivot.address}</span></div>}
                  <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Last Service:</span><span style={{ color: colors.textPrimary }}>{pivot.lastService || 'Never'}</span></div>
                </div>
                <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                  <Button variant="secondary" size="sm" className="flex-1" icon={Eye} onClick={() => setSelectedEquipmentProfile(pivot)}>View Details</Button>
                  <Button variant="danger" size="sm" className="flex-1" icon={AlertCircle} onClick={() => { setSelectedEquipmentForIssue(pivot); setShowReportIssueModal(true); }}>Report Issue</Button>
                  <button 
                    type="button"
                    onClick={() => handleDeleteEquipment(pivot.id, pivot.name)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    title="delete equipment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const FarmerJobsView = () => {
    const myJobs = jobs.filter(j => j.farmerId === userProfile?.id);
    const [ratingJobId, setRatingJobId] = useState(null);
    const [tempRating, setTempRating] = useState(0);
    const [feedback, setFeedback] = useState('');

    const submitRating = async (jobId) => {
      await handleRateJob(jobId, tempRating, feedback);
      setRatingJobId(null);
      setTempRating(0);
      setFeedback('');
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Service History</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: colors.success + '15', color: colors.success }}>
              {myJobs.filter(j => j.status === 'completed').length} completed
            </span>
            <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: colors.warning + '15', color: colors.warning }}>
              {myJobs.filter(j => j.status === 'pending' || j.status === 'assigned').length} active
            </span>
          </div>
        </div>
        {myJobs.length === 0 ? (
          <EmptyState icon={Clipboard} title="No Service History" description="Your service requests will appear here." />
        ) : (
          <div className="space-y-3">
            {myJobs.map(job => {
              const pivot = equipment.find(p => p.id === job.pivotId);
              const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
              const techNames = assignees.map(id => users.find(u => u.id === id)?.name).filter(Boolean);
              
              return (
                <div key={job.id} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <button 
                          className="font-semibold hover:underline text-left"
                          style={{ color: colors.textPrimary }}
                          onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
                        >
                          {job.title}
                        </button>
                        {job.soNumber && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>SO# {job.soNumber}</span>}
                      </div>
                      
                      {/* Interactive equipment link */}
                      <div className="flex items-center space-x-2 mb-2">
                        {pivot ? (
                          <button 
                            className="text-sm hover:underline flex items-center"
                            style={{ color: colors.primary }}
                            onClick={() => setSelectedEquipmentProfile(pivot)}
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            {job.pivotName}
                          </button>
                        ) : (
                          <span className="text-sm" style={{ color: colors.textSecondary }}>{job.pivotName}</span>
                        )}
                        {techNames.length > 0 && (
                          <>
                            <span style={{ color: colors.muted }}>•</span>
                            <span className="text-sm" style={{ color: colors.water }}>
                              <Wrench className="w-3 h-3 inline mr-1" />
                              {techNames.join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{job.description}</p>
                      <div className="flex items-center space-x-3 text-xs" style={{ color: colors.muted }}>
                        <span>{formatDate(job.createdAt)}</span>
                        {job.completedAt && <span>• Completed {formatDate(job.completedAt)}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant={getStatusVariant(job.status)}>{formatStatus(job.status)}</Badge>
                      <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>{job.priority}</Badge>
                    </div>
                  </div>
                  
                  {/* Rating Section for Completed Jobs */}
                  {job.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
                      {job.rating ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm" style={{ color: colors.textSecondary }}>Your rating:</span>
                            <StarRating rating={job.rating} readonly size="sm" />
                          </div>
                          {job.feedback && <p className="text-xs italic" style={{ color: colors.muted }}>"{job.feedback}"</p>}
                        </div>
                      ) : ratingJobId === job.id ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm" style={{ color: colors.textSecondary }}>Rate this service:</span>
                            <StarRating rating={tempRating} onRate={setTempRating} />
                          </div>
                          <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Add a comment (optional)"
                            className="input text-sm"
                            rows={2}
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => submitRating(job.id)} disabled={tempRating === 0}>Submit</Button>
                            <Button size="sm" variant="secondary" onClick={() => { setRatingJobId(null); setTempRating(0); setFeedback(''); }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setRatingJobId(job.id); }}
                          className="flex items-center space-x-2 text-sm hover:underline"
                          style={{ color: colors.accent }}
                        >
                          <Star className="w-4 h-4" />
                          <span>Rate this service</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // TECH VIEWS - FULLY INTERACTIVE
  // ============================================
  const TechDashboard = () => {
    const myJobs = jobs.filter(j => {
      const assigned = j.assignedTo;
      if (Array.isArray(assigned)) {
        return assigned.includes(userProfile?.id);
      }
      return assigned === userProfile?.id;
    });
    const activeJobs = myJobs.filter(j => j.status === 'assigned' || j.status === 'in-progress');
    const completedJobs = myJobs.filter(j => j.status === 'completed');
    const pendingJobs = jobs.filter(j => j.status === 'pending');

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: colors.primary }}>My Dashboard</h2>
          <div className="flex space-x-2">
            <Button icon={Plus} size="sm" onClick={() => setShowAddEquipmentModal(true)}>Add Equipment</Button>
            <Button icon={AlertCircle} size="sm" variant="secondary" onClick={() => setShowReportIssueModal(true)}>Report Issue</Button>
          </div>
        </div>
        
        {/* CLICKABLE STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ClickableStat 
            colors={colors}
            title="Active Jobs" 
            value={activeJobs.length} 
            icon={Wrench} 
            color={colors.water}
            subtitle="In progress"
            onClick={() => setSelectedTab('jobs')}
          />
          <ClickableStat 
            colors={colors}
            title="Available" 
            value={pendingJobs.length} 
            icon={Clipboard} 
            color={colors.warning}
            subtitle="Grab one!"
            onClick={() => setSelectedTab('jobs')}
          />
          <ClickableStat 
            colors={colors}
            title="Completed" 
            value={completedJobs.length} 
            icon={CheckCircle} 
            color={colors.success}
            subtitle="This period"
            onClick={() => setSelectedTab('jobs')}
          />
          <ClickableStat 
            colors={colors}
            title="Miles" 
            value={completedJobs.reduce((sum, j) => sum + (j.milesDriven || 0), 0)} 
            icon={Navigation} 
            color={colors.primary}
            subtitle="Total driven"
            onClick={() => setSelectedTab('jobs')}
          />
          <ClickableStat 
            colors={colors}
            title="Hours" 
            value={completedJobs.reduce((sum, j) => sum + (j.hoursWorked || 0), 0).toFixed(1)} 
            icon={Clock} 
            color={colors.accent}
            subtitle="Total logged"
            onClick={() => setSelectedTab('jobs')}
          />
        </div>

        {/* ACTIVE JOBS - INTERACTIVE */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Active Jobs</h3>
            <button 
              className="text-sm hover:underline"
              style={{ color: colors.primary }}
              onClick={() => setSelectedTab('jobs')}
            >
              View All →
            </button>
          </div>
          {activeJobs.length === 0 ? (
            <div className="card p-6 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" style={{ color: colors.success }} />
              <p style={{ color: colors.textSecondary }}>All caught up! No active jobs.</p>
              {pendingJobs.length > 0 && (
                <Button 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setSelectedTab('jobs')}
                >
                  Grab an Available Job ({pendingJobs.length})
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map(job => {
                const pivot = equipment.find(p => p.id === job.pivotId);
                const farmer = users.find(u => u.id === job.farmerId);
                return (
                  <div key={job.id} className="card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="font-semibold hover:underline text-left"
                            style={{ color: colors.textPrimary }}
                            onClick={() => { setSelectedJobForAction(job); setShowCompleteJobModal(true); }}
                          >
                            {job.title}
                          </button>
                          {job.soNumber && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>SO# {job.soNumber}</span>}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {pivot ? (
                            <button 
                              className="text-sm hover:underline flex items-center"
                              style={{ color: colors.primary }}
                              onClick={() => setSelectedEquipmentProfile(pivot)}
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              {job.pivotName}
                            </button>
                          ) : (
                            <span className="text-sm" style={{ color: colors.textSecondary }}>{job.pivotName || 'Location TBD'}</span>
                          )}
                          {farmer && (
                            <>
                              <span style={{ color: colors.muted }}>•</span>
                              <span className="text-sm" style={{ color: colors.water }}>{farmer.name}</span>
                              {farmer.phone && (
                                <a 
                                  href={`tel:${farmer.phone}`}
                                  className="text-xs px-2 py-0.5 rounded hover:bg-green-100"
                                  style={{ backgroundColor: colors.success + '15', color: colors.success }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Phone className="w-3 h-3 inline mr-1" />Call
                                </a>
                              )}
                            </>
                          )}
                        </div>
                        <p className="text-xs mt-1" style={{ color: colors.muted }}>{job.description}</p>
                      </div>
                      <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>{job.priority}</Badge>
                    </div>
                    <div className="mt-3 pt-3 border-t flex justify-between items-center" style={{ borderColor: colors.border }}>
                      <div className="flex items-center space-x-2">
                        {pivot?.lat && pivot?.lng && (
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded flex items-center"
                            style={{ backgroundColor: colors.primary, color: 'white' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Navigation className="w-3 h-3 mr-1" />Directions
                          </a>
                        )}
                        <span className="text-xs" style={{ color: colors.muted }}>Est. {job.estimatedHours || 2} hours</span>
                      </div>
                      <Button size="sm" icon={CheckCircle} onClick={() => { setSelectedJobForAction(job); setShowCompleteJobModal(true); }}>Complete</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TechJobsView = () => {
    const [hideCompleted, setHideCompleted] = useState(true);
    const [sortBy, setSortBy] = useState('date');
    const [showPending, setShowPending] = useState(false);
    const [showLunchPrompt, setShowLunchPrompt] = useState(false);
    const [stoppingJobId, setStoppingJobId] = useState(null);

    // Find the job I'm CURRENTLY working on (has active time entry)
    const activeJob = jobs.find(j => {
      const assigned = j.assignedTo;
      const isAssignedToMe = Array.isArray(assigned) ? assigned.includes(userProfile?.id) : assigned === userProfile?.id;
      const hasActiveEntry = j.timeEntries?.some(e => e.techId === userProfile?.id && !e.endTime);
      return isAssignedToMe && hasActiveEntry;
    });

    // Get active time entry duration
    // eslint-disable-next-line no-unused-vars
    const getActiveTimeDuration = (job) => {
      const entry = job?.timeEntries?.find(e => e.techId === userProfile?.id && !e.endTime);
      if (!entry) return null;
      const start = new Date(entry.startTime);
      const now = new Date();
      const diff = Math.floor((now - start) / 1000);
      const hours = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      return `${hours}h ${mins}m`;
    };

    // Filter jobs assigned to me
    const myJobs = jobs.filter(j => {
      const assigned = j.assignedTo;
      const isAssignedToMe = Array.isArray(assigned) ? assigned.includes(userProfile?.id) : assigned === userProfile?.id;
      const isActiveStatus = !['billed', 'canceled'].includes(j.status);
      const passesCompletedFilter = hideCompleted ? !['completed', 'ready-to-bill'].includes(j.status) : true;
      // Don't show active job in the list - it's shown separately
      const isNotActiveJob = !activeJob || j.id !== activeJob.id;
      return isAssignedToMe && isActiveStatus && passesCompletedFilter && isNotActiveJob;
    });

    // Sort: In-progress first, then by date
    const sortedJobs = [...myJobs].sort((a, b) => {
      // In-progress jobs first
      if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
      if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;
      
      if (sortBy === 'so') {
        if (a.soNumber && !b.soNumber) return -1;
        if (!a.soNumber && b.soNumber) return 1;
        if (a.soNumber && b.soNumber) return a.soNumber.localeCompare(b.soNumber);
        return 0;
      } else {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      }
    });

    const pendingJobs = jobs.filter(j => j.status === 'pending');

    const hasActiveTimeEntry = (job) => {
      return job.timeEntries?.some(e => e.techId === userProfile?.id && !e.endTime);
    };

    const handleStopTimeWithLunch = (jobId, tookLunch) => {
      handleStopTime(jobId, tookLunch);
      setShowLunchPrompt(false);
      setStoppingJobId(null);
    };

    const completedCount = jobs.filter(j => {
      const assigned = j.assignedTo;
      const isAssignedToMe = Array.isArray(assigned) ? assigned.includes(userProfile?.id) : assigned === userProfile?.id;
      return isAssignedToMe && ['completed', 'ready-to-bill'].includes(j.status);
    }).length;

    // Get equipment and farmer for a job
    const getJobContext = (job) => {
      const pivot = equipment.find(p => p.id === job.pivotId);
      const farmer = users.find(u => u.id === job.farmerId);
      return { pivot, farmer };
    };

    return (
      <div className="space-y-4">
        {/* ACTIVE JOB SECTION - DISABLED: using manual time entry only
        {activeJob && (() => {
          ...
        })()}
        */}

        {/* Lunch Prompt Modal - DISABLED: using manual time entry only
        <Modal isOpen={showLunchPrompt} title="Did you take lunch?" onClose={() => { setShowLunchPrompt(false); setStoppingJobId(null); }}>
          ...
        </Modal>
        */}

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: colors.cardBg }}>
            <p className="text-2xl font-bold" style={{ color: colors.primary }}>{sortedJobs.length}</p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>Queued</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: colors.cardBg }}>
            <p className="text-2xl font-bold" style={{ color: colors.success }}>{completedCount}</p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>Done</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: colors.cardBg }}>
            <p className="text-2xl font-bold" style={{ color: colors.warning }}>{pendingJobs.length}</p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>Available</p>
          </div>
        </div>

        {/* My Job Queue */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              {activeJob ? 'Up Next' : 'My Jobs'}
            </h2>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1 cursor-pointer text-sm">
                <input type="checkbox" checked={hideCompleted} onChange={(e) => setHideCompleted(e.target.checked)} className="rounded" />
                <span style={{ color: colors.textSecondary }}>Hide Done</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg border"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
              >
                <option value="date">Date</option>
                <option value="so">SO#</option>
              </select>
            </div>
          </div>
          
          {sortedJobs.length === 0 ? (
            <EmptyState icon={Briefcase} title={activeJob ? "You're all caught up!" : "No Jobs"} description={activeJob ? "Focus on your current job." : hideCompleted ? "Uncheck 'Hide Done' to see finished jobs." : "Jobs assigned to you will appear here."} />
          ) : (
            <div className="space-y-3">
              {sortedJobs.map(job => {
                const { pivot, farmer } = getJobContext(job);
                // eslint-disable-next-line no-unused-vars
                const isTracking = hasActiveTimeEntry(job);

                return (
                  <div 
                    key={job.id} 
                    className="card p-4 active:scale-99 transition-transform cursor-pointer"
                    onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
                  >
                    {/* Compact Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {job.soNumber && (
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>
                            {job.soNumber}
                          </span>
                        )}
                        <span className="font-semibold" style={{ color: colors.textPrimary }}>{job.title}</span>
                      </div>
                      <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'} className="text-xs">
                        {job.priority}
                      </Badge>
                    </div>

                    {/* Info Row */}
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span style={{ color: colors.textSecondary }}>{farmer?.name || 'Unknown'} • {job.pivotName}</span>
                      <Badge variant={getStatusVariant(job.status)} className="text-xs">{formatStatus(job.status)}</Badge>
                    </div>

                    {/* Action Buttons - Big Touch Targets */}
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      {/* Complete Job / Fill Out Sheet Button */}
                      <button
                        onClick={() => { setSelectedJobForAction(job); setShowCompleteJobModal(true); }}
                        className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl font-semibold active:scale-95 transition-transform"
                        style={{ backgroundColor: colors.success + '20', color: colors.success }}
                      >
                        <FileText className="w-5 h-5" />
                        <span>Fill Out Sheet</span>
                      </button>
                      
                      {/* View Details Button */}
                      <button
                        onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
                        className="flex items-center justify-center p-3 rounded-xl active:scale-95 transition-transform"
                        style={{ backgroundColor: colors.primary + '20' }}
                      >
                        <Eye className="w-5 h-5" style={{ color: colors.primary }} />
                      </button>
                      
                      {farmer?.phone && (
                        <a
                          href={`tel:${farmer.phone}`}
                          className="flex items-center justify-center p-3 rounded-xl active:scale-95 transition-transform"
                          style={{ backgroundColor: colors.water + '20' }}
                        >
                          <Phone className="w-5 h-5" style={{ color: colors.water }} />
                        </a>
                      )}
                      
                      {pivot?.lat && pivot?.lng && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-3 rounded-xl active:scale-95 transition-transform"
                          style={{ backgroundColor: colors.primary + '20' }}
                        >
                          <Navigation className="w-5 h-5" style={{ color: colors.primary }} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Available Jobs (Self-Assign) */}
        <div>
          <div 
            className="flex items-center justify-between p-3 rounded-xl cursor-pointer active:scale-99 transition-transform"
            style={{ backgroundColor: colors.warning + '15' }}
            onClick={() => setShowPending(!showPending)}
          >
            <div className="flex items-center space-x-2">
              <Clipboard className="w-5 h-5" style={{ color: colors.warning }} />
              <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                Available Jobs ({pendingJobs.length})
              </h3>
            </div>
            {showPending ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          
          {showPending && (
            <div className="mt-3 space-y-3">
              {pendingJobs.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>No pending jobs available</p>
              ) : (
                pendingJobs.map(job => {
                  const pivot = equipment.find(p => p.id === job.pivotId);
                  const farmer = users.find(u => u.id === job.farmerId);
                  return (
                    <div key={job.id} className="card p-4">
                      {/* Header: SO# + Status + Priority */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {job.soNumber ? (
                            <span className="font-mono font-bold text-sm px-2 py-1 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>
                              {job.soNumber}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: colors.muted + '30', color: colors.muted }}>
                              No SO#
                            </span>
                          )}
                          <Badge variant="warning">Pending</Badge>
                        </div>
                        <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>
                          {job.priority}
                        </Badge>
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-center justify-between mb-3 p-2 rounded-lg" style={{ backgroundColor: colors.background }}>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: colors.primary + '20' }}>
                            {farmer?.avatar || '👤'}
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: colors.textPrimary }}>{farmer?.name || 'Unknown Customer'}</p>
                            {farmer?.phone && (
                              <a 
                                href={`tel:${farmer.phone}`}
                                className="text-sm hover:underline"
                                style={{ color: colors.primary }}
                              >
                                {farmer.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Job Title & Description */}
                      <div className="mb-3">
                        <h4 className="font-semibold mb-1" style={{ color: colors.textPrimary }}>{job.title}</h4>
                        <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>{job.description}</p>
                      </div>

                      {/* Location */}
                      <div className="flex items-center justify-between mb-3 p-2 rounded-lg" style={{ backgroundColor: colors.background }}>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" style={{ color: colors.primary }} />
                          <span className="text-sm" style={{ color: colors.textPrimary }}>{job.pivotName || 'Unknown Location'}</span>
                        </div>
                        {pivot?.lat && pivot?.lng && (
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded flex items-center space-x-1"
                            style={{ backgroundColor: colors.water + '20', color: colors.water }}
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Directions</span>
                          </a>
                        )}
                      </div>

                      {/* Created Date */}
                      {job.createdAt && (
                        <p className="text-xs mb-3" style={{ color: colors.muted }}>
                          Created: {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      )}

                      {/* Action Button */}
                      <Button 
                        className="w-full" 
                        icon={UserPlus} 
                        onClick={() => handleSelfAssign(job.id)}
                        loading={isLoading}
                      >
                        Take This Job
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Lunch Prompt Modal */}
        {showLunchPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>Did you take lunch?</h3>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>30 minutes will be deducted if you took a lunch break.</p>
              <div className="flex space-x-3">
                <Button className="flex-1" variant="secondary" onClick={() => handleStopTimeWithLunch(stoppingJobId, false)}>No Lunch</Button>
                <Button className="flex-1" onClick={() => handleStopTimeWithLunch(stoppingJobId, true)}>Yes, Took Lunch</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  // ============================================
  // OFFICE VIEWS
  // ============================================
  const CallInView = () => {
    // Using lifted state: callInFormData, setCallInFormData
    const farmers = users.filter(u => u.role === 'farmer');
    const [showQuickAddEquipment, setShowQuickAddEquipment] = useState(false);
    const [quickEquipment, setQuickEquipment] = useState({ name: '', type: 'pivot', acres: '' });

    const handleSubmit = async (e) => {
      e.preventDefault();
      const pivot = equipment.find(p => p.id === callInFormData.pivotId);
      const result = await createCallInJob({
        title: `Call-in: ${callInFormData.customerName}`,
        description: callInFormData.description,
        priority: callInFormData.priority,
        farmerId: callInFormData.farmerId,
        pivotId: callInFormData.pivotId,
        pivotName: pivot?.name || 'Unknown',
        customerPhone: callInFormData.customerPhone,
        soNumber: callInFormData.soNumber || null,
        location: { lat: pivot?.lat || 40.7614, lng: pivot?.lng || -96.6856 }
      });
      if (result.success) {
        setCallInFormData({ customerName: '', customerPhone: '', pivotId: '', description: '', priority: 'medium', farmerId: '', soNumber: '' });
      }
    };

    const handleQuickAddEquipment = async () => {
      if (!quickEquipment.name || !callInFormData.farmerId) return;
      const result = await handleAddEquipment({
        name: quickEquipment.name,
        type: quickEquipment.type,
        acres: quickEquipment.acres || 0,
        farmerId: callInFormData.farmerId,
        status: 'needs-service'
      });
      if (result?.success) {
        // Auto-select the new equipment
        setCallInFormData({...callInFormData, pivotId: result.id});
        setQuickEquipment({ name: '', type: 'pivot', acres: '' });
        setShowQuickAddEquipment(false);
      }
    };

    const farmerEquipment = callInFormData.farmerId ? equipment.filter(p => p.farmerId === callInFormData.farmerId) : [];

    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-6" style={{ color: colors.primary }}>New Call-In Service Request</h2>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="SO# (Service Order Number)" 
              placeholder="SO-12345" 
              value={callInFormData.soNumber} 
              onChange={e => setCallInFormData({...callInFormData, soNumber: e.target.value})} 
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Customer Name" placeholder="John Smith" value={callInFormData.customerName} onChange={e => setCallInFormData({...callInFormData, customerName: e.target.value})} required />
              <Input label="Phone Number" placeholder="(555) 123-4567" icon={Phone} value={callInFormData.customerPhone} onChange={e => setCallInFormData({...callInFormData, customerPhone: e.target.value})} />
            </div>
            
            {/* Customer Selection with Add New */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>Customer Account</label>
                <button 
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="text-xs font-medium flex items-center space-x-1 hover:underline"
                  style={{ color: colors.primary }}
                >
                  <Plus className="w-3 h-3" />
                  <span>New Customer</span>
                </button>
              </div>
              <SearchableSelect 
                value={callInFormData.farmerId} 
                onChange={e => setCallInFormData({...callInFormData, farmerId: e.target.value, pivotId: ''})} 
                options={[{ value: '', label: 'Select a customer...' }, ...farmers.map(f => ({ value: f.id, label: `${f.name}${f.company ? ` (${f.company})` : ''}` }))]} 
                placeholder="Search customers..." 
                colors={colors} 
              />
            </div>

            {/* Equipment Selection with Quick Add */}
            {callInFormData.farmerId && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>Equipment</label>
                  <button 
                    type="button"
                    onClick={() => setShowQuickAddEquipment(!showQuickAddEquipment)}
                    className="text-xs font-medium flex items-center space-x-1 hover:underline"
                    style={{ color: colors.primary }}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Equipment</span>
                  </button>
                </div>
                
                {/* Quick Add Equipment Inline */}
                {showQuickAddEquipment && (
                  <div className="p-3 rounded-lg mb-3 space-y-3" style={{ backgroundColor: colors.primary + '10', border: `1px solid ${colors.primary}30` }}>
                    <p className="text-xs font-medium" style={{ color: colors.primary }}>Quick Add Equipment</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Input 
                        placeholder="Name (e.g. North Pivot)" 
                        value={quickEquipment.name} 
                        onChange={e => setQuickEquipment({...quickEquipment, name: e.target.value})}
                      />
                      <Select 
                        value={quickEquipment.type} 
                        onChange={e => setQuickEquipment({...quickEquipment, type: e.target.value})}
                        options={[
                          { value: 'pivot', label: 'Pivot' },
                          { value: 'pump', label: 'Pump' },
                          { value: 'well', label: 'Well' },
                          { value: 'panel', label: 'Panel' },
                          { value: 'motor', label: 'Motor' },
                          { value: 'other', label: 'Other' }
                        ]}
                      />
                      <Input 
                        placeholder="Acres" 
                        type="number"
                        value={quickEquipment.acres} 
                        onChange={e => setQuickEquipment({...quickEquipment, acres: e.target.value})}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="button" size="sm" onClick={handleQuickAddEquipment} disabled={!quickEquipment.name}>Add</Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setShowQuickAddEquipment(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                <Select 
                  value={callInFormData.pivotId} 
                  onChange={e => setCallInFormData({...callInFormData, pivotId: e.target.value})} 
                  options={[
                    { value: '', label: farmerEquipment.length === 0 ? 'No equipment - add one above' : 'Select equipment...' }, 
                    ...farmerEquipment.map(p => ({ value: p.id, label: `${p.name} (${p.acres} acres)` }))
                  ]} 
                  required 
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>Issue Description</label>
              <textarea value={callInFormData.description} onChange={e => setCallInFormData({...callInFormData, description: e.target.value})} placeholder="Describe the issue reported by the customer..." className="input min-h-[120px] resize-none" required />
            </div>
            <Select label="Priority" value={callInFormData.priority} onChange={e => setCallInFormData({...callInFormData, priority: e.target.value})} options={[{ value: 'low', label: 'Low - Can wait' }, { value: 'medium', label: 'Medium - Soon' }, { value: 'high', label: 'High - Urgent' }]} />
            <Button type="submit" className="w-full" icon={Phone} loading={isLoading}>Create Service Request</Button>
          </form>
        </div>
      </div>
    );
  };

  // ============================================
  // CALENDAR VIEW
  // ============================================
  const CalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDay = firstDay.getDay();
      
      const days = [];
      
      // Previous month days
      for (let i = startingDay - 1; i >= 0; i--) {
        const prevDate = new Date(year, month, -i);
        days.push({ date: prevDate, isCurrentMonth: false });
      }
      
      // Current month days
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({ date: new Date(year, month, i), isCurrentMonth: true });
      }
      
      // Next month days
      const remainingDays = 42 - days.length;
      for (let i = 1; i <= remainingDays; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
      
      return days;
    };

    const getJobsForDate = (date) => {
      return jobs.filter(job => {
        const jobDate = new Date(job.scheduledDate || job.createdAt);
        return jobDate.toDateString() === date.toDateString();
      });
    };

    const days = getDaysInMonth(currentDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const selectedDateJobs = selectedDate ? getJobsForDate(selectedDate) : [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Job Calendar</h2>
          <Button size="sm" variant="secondary" onClick={goToToday}>Today</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 card p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <ChevronLeft className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </button>
              <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <ChevronRight className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium py-2" style={{ color: colors.textSecondary }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayJobs = getJobsForDate(day.date);
                const isToday = day.date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                      min-h-[80px] p-1 rounded-lg cursor-pointer transition-all border
                      ${!day.isCurrentMonth ? 'opacity-40' : ''}
                      ${isSelected ? 'ring-2 ring-green-500' : ''}
                      ${isToday ? 'border-green-500' : ''}
                    `}
                    style={{ 
                      backgroundColor: isSelected ? colors.primary + '10' : colors.cardBg,
                      borderColor: isToday ? colors.success : colors.border
                    }}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-green-600' : ''}`} style={{ color: isToday ? colors.success : colors.textPrimary }}>
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayJobs.slice(0, 2).map((job, i) => (
                        <div
                          key={i}
                          className="text-xs px-1 py-0.5 rounded truncate"
                          style={{
                            backgroundColor: job.status === 'completed' ? colors.success + '20' : 
                                           job.status === 'assigned' ? colors.water + '20' : colors.warning + '20',
                            color: job.status === 'completed' ? colors.success : 
                                   job.status === 'assigned' ? colors.water : colors.warning
                          }}
                        >
                          {job.title}
                        </div>
                      ))}
                      {dayJobs.length > 2 && (
                        <div className="text-xs" style={{ color: colors.muted }}>+{dayJobs.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Jobs */}
          <div className="card p-4">
            <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>
              {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
            </h3>
            
            {selectedDate ? (
              selectedDateJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-2" style={{ color: colors.muted }} />
                  <p style={{ color: colors.textSecondary }}>No jobs scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateJobs.map(job => {
                    const pivot = equipment.find(p => p.id === job.pivotId);
                    const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
                    const techNames = assignees.map(id => users.find(u => u.id === id)?.name).filter(Boolean);
                    
                    return (
                    <div
                      key={job.id}
                      className="p-3 rounded-lg hover:shadow-md transition-shadow"
                      style={{ backgroundColor: colors.background }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <button 
                          className="font-medium hover:underline text-left"
                          style={{ color: colors.textPrimary }}
                          onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
                        >
                          {job.title}
                        </button>
                        <Badge variant={getStatusVariant(job.status)}>{formatStatus(job.status)}</Badge>
                      </div>
                      
                      {/* Interactive equipment link */}
                      <div className="flex items-center space-x-2 mb-1">
                        {pivot ? (
                          <button 
                            className="text-sm hover:underline flex items-center"
                            style={{ color: colors.primary }}
                            onClick={() => setSelectedEquipmentProfile(pivot)}
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            {job.pivotName}
                          </button>
                        ) : (
                          <span className="text-sm" style={{ color: colors.textSecondary }}>{job.pivotName}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs" style={{ color: colors.muted }}>
                        <span>
                          {techNames.length > 0 ? (
                            <span><Wrench className="w-3 h-3 inline mr-1" />{techNames.join(', ')}</span>
                          ) : 'Unassigned'}
                        </span>
                        {job.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}
                          >
                            Assign
                          </Button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-2" style={{ color: colors.muted }} />
                <p style={{ color: colors.textSecondary }}>Click a date to view jobs</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="card p-4">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.warning + '40' }} />
              <span className="text-sm" style={{ color: colors.textSecondary }}>Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.water + '40' }} />
              <span className="text-sm" style={{ color: colors.textSecondary }}>Assigned</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.success + '40' }} />
              <span className="text-sm" style={{ color: colors.textSecondary }}>Completed</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // SETTINGS VIEW - Pricing & Configuration
  // ============================================
  const SettingsView = () => {
    const [formData, setFormData] = useState({
      hourlyRate: pricingSettings.hourlyRate,
      mileageRate: pricingSettings.mileageRate,
      partsMarkup: pricingSettings.partsMarkup
    });

    const handleSave = async () => {
      setIsLoading(true);
      const result = await fbUpdateSettings(formData);
      if (result.success) {
        addNotification('success', 'Pricing settings updated!');
      } else {
        addNotification('error', 'Failed to update settings');
      }
      setIsLoading(false);
    };

    // Example calculation
    const exampleHours = 2;
    const exampleMiles = 25;
    const exampleParts = 50;
    const exampleTotal = (exampleHours * formData.hourlyRate) + 
                         (exampleMiles * formData.mileageRate) + 
                         (exampleParts * (1 + formData.partsMarkup / 100));

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Settings</h2>
        
        {/* Pricing Settings */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4 flex items-center" style={{ color: colors.textPrimary }}>
            <DollarSign className="w-5 h-5 mr-2" />
            Pricing Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Hourly Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  className="input pl-8"
                  value={formData.hourlyRate}
                  onChange={e => setFormData({...formData, hourlyRate: parseFloat(e.target.value) || 0})}
                  step="0.01"
                />
              </div>
              <p className="text-xs mt-1" style={{ color: colors.muted }}>Per hour of labor</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Mileage Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  className="input pl-8"
                  value={formData.mileageRate}
                  onChange={e => setFormData({...formData, mileageRate: parseFloat(e.target.value) || 0})}
                  step="0.01"
                />
              </div>
              <p className="text-xs mt-1" style={{ color: colors.muted }}>Per mile driven</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Parts Markup</label>
              <div className="relative">
                <input
                  type="number"
                  className="input pr-8"
                  value={formData.partsMarkup}
                  onChange={e => setFormData({...formData, partsMarkup: parseFloat(e.target.value) || 0})}
                  step="1"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
              <p className="text-xs mt-1" style={{ color: colors.muted }}>Added to parts cost</p>
            </div>
          </div>
          
          {/* Example Calculation */}
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            <p className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Example Calculation:</p>
            <p className="text-sm" style={{ color: colors.muted }}>
              {exampleHours} hours × ${formData.hourlyRate}/hr = ${(exampleHours * formData.hourlyRate).toFixed(2)}
            </p>
            <p className="text-sm" style={{ color: colors.muted }}>
              {exampleMiles} miles × ${formData.mileageRate}/mi = ${(exampleMiles * formData.mileageRate).toFixed(2)}
            </p>
            <p className="text-sm" style={{ color: colors.muted }}>
              ${exampleParts} parts + {formData.partsMarkup}% markup = ${(exampleParts * (1 + formData.partsMarkup / 100)).toFixed(2)}
            </p>
            <p className="text-sm font-bold mt-2" style={{ color: colors.primary }}>
              Total: ${exampleTotal.toFixed(2)}
            </p>
          </div>
          
          <div className="mt-6">
            <Button icon={Check} onClick={handleSave} loading={isLoading}>Save Pricing Settings</Button>
          </div>
        </div>
        
        {/* Current Rates Display */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Current Active Rates</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
              <p className="text-2xl font-bold" style={{ color: colors.primary }}>${pricingSettings.hourlyRate}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>per hour</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
              <p className="text-2xl font-bold" style={{ color: colors.secondary }}>${pricingSettings.mileageRate}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>per mile</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
              <p className="text-2xl font-bold" style={{ color: colors.accent }}>{pricingSettings.partsMarkup}%</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>parts markup</p>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // ============================================
  // Equipment Profile VIEW
  // ============================================
  const EquipmentProfileView = () => {
    const pivot = selectedEquipmentProfile;
    
    // Mini map ref - must be called before any conditional returns
    const miniMapRef = React.useRef(null);
    const miniMapInstance = React.useRef(null);

    useEffect(() => {
      if (!pivot) return;
      if (pivot.lat && pivot.lng && window.google && miniMapRef.current && !miniMapInstance.current) {
        miniMapInstance.current = new window.google.maps.Map(miniMapRef.current, {
          center: { lat: parseFloat(pivot.lat), lng: parseFloat(pivot.lng) },
          zoom: 14,
          mapTypeId: 'hybrid',
          disableDefaultUI: true,
          gestureHandling: 'none'
        });
        new window.google.maps.Marker({
          position: { lat: parseFloat(pivot.lat), lng: parseFloat(pivot.lng) },
          map: miniMapInstance.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#2D5016',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        });
      }
      return () => { miniMapInstance.current = null; };
    }, [pivot]);

    // Early return after hooks
    if (!pivot) return null;

    // Get farmer info
    const farmer = users.find(u => u.id === pivot.farmerId);
    
    // Get service history for this pivot
    const equipmentJobs = jobs.filter(j => j.pivotId === pivot.id).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    const canEdit = ['tech', 'manager', 'office'].includes(userProfile?.role) || pivot.farmerId === userProfile?.id;

    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSelectedEquipmentProfile(null)}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="w-6 h-6" style={{ color: colors.textPrimary }} />
            </button>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>{pivot.name}</h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {farmer?.name || 'Unknown Farmer'} • {formatEquipmentType(pivot.type)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={getStatusVariant(pivot.status)}>{pivot.status}</Badge>
            {canEdit && (
              <Button icon={Edit} onClick={() => setShowEditEquipmentModal(true)}>Edit Details</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Equipment & Specs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Equipment Details */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center" style={{ color: colors.textPrimary }}>
                <Wrench className="w-5 h-5 mr-2" style={{ color: colors.primary }} />
                Equipment Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoItem label="Brand" value={pivot.brand || 'Not specified'} />
                <InfoItem label="Model" value={pivot.model || 'Not specified'} />
                <InfoItem label="Serial Number" value={pivot.serialNumber || 'Not specified'} />
                <InfoItem label="Power Type" value={pivot.powerType || 'Not specified'} />
                <InfoItem label="Panel Type" value={pivot.panelType || 'Not specified'} />
                <InfoItem label="Date Installed" value={pivot.dateInstalled || 'Unknown'} />
              </div>
            </div>

            {/* Specifications */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center" style={{ color: colors.textPrimary }}>
                <BarChart3 className="w-5 h-5 mr-2" style={{ color: colors.secondary }} />
                Specifications
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem label="Acres" value={pivot.acres ? `${pivot.acres} acres` : 'N/A'} />
                <InfoItem label="Length" value={pivot.length ? `${pivot.length} ft` : 'N/A'} />
                <InfoItem label="Spans" value={pivot.spans || 'N/A'} />
                <InfoItem label="GPM" value={pivot.gpm || pivot.flow || 'N/A'} />
                <InfoItem label="Nozzles" value={pivot.nozzles || 'N/A'} />
                <InfoItem label="Pressure" value={pivot.pressure ? `${pivot.pressure} PSI` : 'N/A'} />
                <InfoItem label="End Gun" value={pivot.endGun || 'None'} />
                <InfoItem label="Tire Size" value={pivot.tireSize || 'N/A'} />
                <InfoItem label="Nozzle Package" value={pivot.nozzlePackage || 'N/A'} />
                <InfoItem label="Gearbox Ratio" value={pivot.gearboxRatio || 'N/A'} />
                <InfoItem label="Last Service" value={pivot.lastService || 'Never'} />
                <InfoItem label="Drive Type" value={pivot.driveType || 'N/A'} />
              </div>
            </div>

            {/* Notes */}
            {pivot.notes && (
              <div className="card p-6">
                <h3 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
                  <FileText className="w-5 h-5 mr-2" style={{ color: colors.muted }} />
                  Notes
                </h3>
                <p className="text-sm whitespace-pre-wrap" style={{ color: colors.textSecondary }}>{pivot.notes}</p>
              </div>
            )}

            {/* Service History */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center" style={{ color: colors.textPrimary }}>
                  <Clock className="w-5 h-5 mr-2" style={{ color: colors.water }} />
                  Service History ({equipmentJobs.length})
                </h3>
                {equipmentJobs.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => { setFilterStatus('all'); setSelectedEquipmentProfile(null); setSelectedTab('jobs'); }}
                  >
                    View All Jobs
                  </Button>
                )}
              </div>
              {equipmentJobs.length === 0 ? (
                <div className="text-center py-6">
                  <Clipboard className="w-12 h-12 mx-auto mb-2" style={{ color: colors.muted }} />
                  <p className="text-sm" style={{ color: colors.textSecondary }}>No service history yet</p>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    icon={AlertCircle}
                    className="mt-3"
                    onClick={() => { setSelectedEquipmentForIssue(pivot); setShowReportIssueModal(true); }}
                  >
                    Report First Issue
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {equipmentJobs.map(job => {
                    const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
                    const techNames = assignees.map(id => users.find(u => u.id === id)?.name).filter(Boolean);
                    
                    return (
                    <div 
                      key={job.id} 
                      className="p-3 rounded-lg border hover:shadow-md transition-all cursor-pointer" 
                      style={{ borderColor: colors.border, backgroundColor: colors.background }}
                      onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm hover:underline" style={{ color: colors.textPrimary }}>{job.title}</p>
                          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{job.description}</p>
                        </div>
                        <Badge variant={getStatusVariant(job.status)} className="text-xs">{formatStatus(job.status)}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-3 text-xs" style={{ color: colors.muted }}>
                          <span>{formatDate(job.createdAt)}</span>
                          {job.hoursWorked && <span>• {job.hoursWorked} hrs</span>}
                          {techNames.length > 0 && (
                            <span className="flex items-center">
                              • <Wrench className="w-3 h-3 mr-1" /> {techNames.join(', ')}
                            </span>
                          )}
                          {job.rating && (
                            <span className="flex items-center">
                              • <Star className="w-3 h-3 mr-1" style={{ color: colors.accent }} fill={colors.accent} /> {job.rating}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Location & Quick Actions */}
          <div className="space-y-6">
            {/* Location */}
            <div className="card p-6">
              <h3 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
                <MapPin className="w-5 h-5 mr-2" style={{ color: colors.danger }} />
                Location
              </h3>
              {pivot.lat && pivot.lng ? (
                <>
                  <div ref={miniMapRef} className="w-full h-40 rounded-lg mb-3" />
                  <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{pivot.address || 'No address'}</p>
                  <p className="text-xs mb-3" style={{ color: colors.muted }}>
                    {parseFloat(pivot.lat).toFixed(6)}, {parseFloat(pivot.lng).toFixed(6)}
                  </p>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 p-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Get Directions</span>
                  </a>
                </>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>
                  No location set
                </p>
              )}
            </div>

            {/* Farmer Contact */}
            {farmer && (
              <div className="card p-6">
                <h3 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
                  <User className="w-5 h-5 mr-2" style={{ color: colors.water }} />
                  Customer
                </h3>
                <div 
                  className="flex items-center space-x-3 mb-3 p-2 rounded-lg hover:shadow-md transition-all cursor-pointer"
                  style={{ backgroundColor: colors.background }}
                  onClick={() => { setSelectedEquipmentProfile(null); setSelectedTab('customers'); }}
                >
                  <span className="text-3xl">{farmer.avatar || '👤'}</span>
                  <div className="flex-1">
                    <p className="font-medium hover:underline" style={{ color: colors.textPrimary }}>{farmer.name}</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{farmer.company || 'Independent'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
                </div>
                <div className="space-y-2">
                  {farmer.phone && (
                    <a 
                      href={`tel:${farmer.phone}`} 
                      className="flex items-center space-x-2 text-sm p-2 rounded-lg hover:bg-green-50 transition-colors" 
                      style={{ color: colors.success }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-4 h-4" />
                      <span>{farmer.phone}</span>
                    </a>
                  )}
                  {farmer.email && (
                    <a 
                      href={`mailto:${farmer.email}`} 
                      className="flex items-center space-x-2 text-sm p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                      style={{ color: colors.water }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="w-4 h-4" />
                      <span>{farmer.email}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  variant="danger" 
                  className="w-full" 
                  icon={AlertCircle}
                  onClick={() => { setSelectedEquipmentForIssue(pivot); setShowReportIssueModal(true); }}
                >
                  Report Issue
                </Button>
                {canEdit && (
                  <Button 
                    variant="secondary" 
                    className="w-full" 
                    icon={Trash2}
                    onClick={() => handleDeleteEquipment(pivot.id, pivot.name)}
                  >
                    delete equipment
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Info Item Component for Equipment Profile
  const InfoItem = ({ label, value }) => (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.muted }}>{label}</p>
      <p className="font-medium" style={{ color: colors.textPrimary }}>{value}</p>
    </div>
  );


  // ============================================
  // Edit Equipment MODAL
  // ============================================
  const EditEquipmentModal = () => {
    const pivot = selectedEquipmentProfile;
    const [formData, setFormData] = useState({
      name: pivot?.name || '',
      type: pivot?.type || 'center',
      brand: pivot?.brand || '',
      model: pivot?.model || '',
      serialNumber: pivot?.serialNumber || '',
      powerType: pivot?.powerType || '',
      panelType: pivot?.panelType || '',
      dateInstalled: pivot?.dateInstalled || '',
      acres: pivot?.acres || '',
      length: pivot?.length || '',
      spans: pivot?.spans || '',
      gpm: pivot?.gpm || pivot?.flow || '',
      nozzles: pivot?.nozzles || '',
      pressure: pivot?.pressure || '',
      endGun: pivot?.endGun || '',
      tireSize: pivot?.tireSize || '',
      nozzlePackage: pivot?.nozzlePackage || '',
      gearboxRatio: pivot?.gearboxRatio || '',
      driveType: pivot?.driveType || '',
      address: pivot?.address || '',
      lat: pivot?.lat || '',
      lng: pivot?.lng || '',
      notes: pivot?.notes || ''
    });

    useEffect(() => {
      if (pivot) {
        setFormData({
          name: pivot.name || '',
          type: pivot.type || 'center',
          brand: pivot.brand || '',
          model: pivot.model || '',
          serialNumber: pivot.serialNumber || '',
          powerType: pivot.powerType || '',
          panelType: pivot.panelType || '',
          dateInstalled: pivot.dateInstalled || '',
          acres: pivot.acres || '',
          length: pivot.length || '',
          spans: pivot.spans || '',
          gpm: pivot.gpm || pivot.flow || '',
          nozzles: pivot.nozzles || '',
          pressure: pivot.pressure || '',
          endGun: pivot.endGun || '',
          tireSize: pivot.tireSize || '',
          nozzlePackage: pivot.nozzlePackage || '',
          gearboxRatio: pivot.gearboxRatio || '',
          driveType: pivot.driveType || '',
          address: pivot.address || '',
          lat: pivot.lat || '',
          lng: pivot.lng || '',
          notes: pivot.notes || ''
        });
      }
    }, [pivot]);

    const handleSubmit = (e) => {
      e.preventDefault();
      handleUpdateEquipmentDetails(pivot.id, {
        ...formData,
        acres: parseFloat(formData.acres) || 0,
        length: parseFloat(formData.length) || null,
        spans: parseInt(formData.spans) || null,
        gpm: parseFloat(formData.gpm) || null,
        nozzles: parseInt(formData.nozzles) || null,
        pressure: parseFloat(formData.pressure) || null,
        lat: parseFloat(formData.lat) || null,
        lng: parseFloat(formData.lng) || null
      });
    };

    return (
      <Modal isOpen={showEditEquipmentModal} onClose={() => setShowEditEquipmentModal(false)} title="Edit Equipment details" size="2xl">
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Basic Info */}
          <div>
            <h4 className="font-medium mb-3 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.border }}>Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Equipment Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <Select label="Equipment Type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} options={[
                { value: 'center', label: 'Center Pivot' },
                { value: 'linear', label: 'Linear Pivot' },
                { value: 'corner', label: 'Corner System' },
                { value: 'power_unit', label: 'Power Unit' },
                { value: 'generator', label: 'Generator' },
                { value: 'pump', label: 'Pump' },
                { value: 'well', label: 'Well' },
                { value: 'motor', label: 'Motor' },
                { value: 'panel', label: 'Control Panel' },
                { value: 'other', label: 'Other' }
              ]} />
            </div>
          </div>

          {/* Equipment Details */}
          <div>
            <h4 className="font-medium mb-3 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.border }}>Equipment Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Select label="Brand" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} options={[
                { value: '', label: 'Select Brand' },
                { value: 'Valley', label: 'Valley' },
                { value: 'Zimmatic', label: 'Zimmatic' },
                { value: 'Reinke', label: 'Reinke' },
                { value: 'T-L', label: 'T-L' },
                { value: 'Pierce', label: 'Pierce' },
                { value: 'Other', label: 'Other' }
              ]} />
              <Input label="Model" placeholder="e.g. 8000 Series" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
              <Input label="Serial Number" placeholder="S/N" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
              <Select label="Power Type" value={formData.powerType} onChange={e => setFormData({...formData, powerType: e.target.value})} options={[
                { value: '', label: 'Select Power' },
                { value: 'Shore Power', label: 'Shore Power' },
                { value: 'Generator', label: 'Generator' },
                { value: 'Diesel', label: 'Diesel' },
                { value: 'Solar', label: 'Solar' }
              ]} />
              <Select label="Panel Type" value={formData.panelType} onChange={e => setFormData({...formData, panelType: e.target.value})} options={[
                { value: '', label: 'Select Panel' },
                { value: 'Mechanical', label: 'Mechanical' },
                { value: 'Electronic', label: 'Electronic' },
                { value: 'GPS', label: 'GPS Guided' },
                { value: 'VRI', label: 'VRI' }
              ]} />
              <Input label="Date Installed" type="date" value={formData.dateInstalled} onChange={e => setFormData({...formData, dateInstalled: e.target.value})} />
            </div>
          </div>

          {/* Specifications */}
          <div>
            <h4 className="font-medium mb-3 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.border }}>Specifications</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Acres" type="number" placeholder="125" value={formData.acres} onChange={e => setFormData({...formData, acres: e.target.value})} />
              <Input label="Length (ft)" type="number" placeholder="1320" value={formData.length} onChange={e => setFormData({...formData, length: e.target.value})} />
              <Input label="Number of Spans" type="number" placeholder="7" value={formData.spans} onChange={e => setFormData({...formData, spans: e.target.value})} />
              <Input label="GPM" type="number" placeholder="800" value={formData.gpm} onChange={e => setFormData({...formData, gpm: e.target.value})} />
              <Input label="Nozzles" type="number" placeholder="250" value={formData.nozzles} onChange={e => setFormData({...formData, nozzles: e.target.value})} />
              <Input label="Pressure (PSI)" type="number" placeholder="35" value={formData.pressure} onChange={e => setFormData({...formData, pressure: e.target.value})} />
              <Input label="End Gun" placeholder="e.g. Nelson" value={formData.endGun} onChange={e => setFormData({...formData, endGun: e.target.value})} />
              <Input label="Tire Size" placeholder="e.g. 14.9x24" value={formData.tireSize} onChange={e => setFormData({...formData, tireSize: e.target.value})} />
              <Input label="Nozzle Package" placeholder="e.g. Nelson 3000" value={formData.nozzlePackage} onChange={e => setFormData({...formData, nozzlePackage: e.target.value})} />
              <Input label="Gearbox Ratio" placeholder="e.g. 50:1" value={formData.gearboxRatio} onChange={e => setFormData({...formData, gearboxRatio: e.target.value})} />
              <Select label="Drive Type" value={formData.driveType} onChange={e => setFormData({...formData, driveType: e.target.value})} options={[
                { value: '', label: 'Select Drive' },
                { value: 'Electric', label: 'Electric' },
                { value: 'Hydraulic', label: 'Hydraulic' },
                { value: 'Oil', label: 'Oil' }
              ]} />
            </div>
          </div>

          {/* Location */}
          <div>
            <h4 className="font-medium mb-3 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.border }}>Location</h4>
            <div className="space-y-4">
              <Input label="Address" placeholder="123 Farm Road" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Latitude" type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} />
                <Input label="Longitude" type="number" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h4 className="font-medium mb-3 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.border }}>Notes</h4>
            <textarea 
              className="input"
              rows={3}
              placeholder="Any additional notes about this pivot..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t" style={{ borderColor: colors.border }}>
            <Button type="submit" className="flex-1" icon={Check} loading={isLoading}>Save Changes</Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEditEquipmentModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    );
  };


  // ============================================
  // MAP VIEW - Google Maps Integration
  // ============================================
  const MapView = () => {
    const mapRef = React.useRef(null);
    const googleMapRef = React.useRef(null);
    const markersRef = React.useRef([]);
    const infoWindowRef = React.useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedMapPivot, setSelectedMapPivot] = useState(null);
    const [editingPivot, setEditingPivot] = useState(null);
    const [searchAddress, setSearchAddress] = useState('');

    const [_userLocation, setUserLocation] = useState(null); // eslint-disable-line no-unused-vars

    // Filter pivots based on role - farmers only see their own equipment
    const visibleEquipment = effectiveRole === 'farmer'
      ? equipment.filter(p => p.farmerId === userProfile?.id)
      : equipment;

    // Default center (Sikeston, MO area)
    const defaultCenter = { lat: 36.88, lng: -89.59 };

    // Get user's current location
    const handleMyLocation = () => {
      if (!navigator.geolocation) {
        addNotification('error', 'Geolocation is not supported by your browser');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(pos);
          if (googleMapRef.current) {
            googleMapRef.current.panTo(pos);
            googleMapRef.current.setZoom(14);
          }
          addNotification('success', 'Moved to your location');
        },
        (error) => {
          addNotification('error', 'Unable to get your location. Please check permissions.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    // Initialize map (only run once on mount)
    useEffect(() => {
      if (!window.google || !mapRef.current || googleMapRef.current) return;

      // Calculate center from pivots or use default
      let center = defaultCenter;
      const equipmentWithLocation = visibleEquipment.filter(p => p.lat && p.lng);
      if (equipmentWithLocation.length > 0) {
        const avgLat = equipmentWithLocation.reduce((sum, p) => sum + p.lat, 0) / equipmentWithLocation.length;
        const avgLng = equipmentWithLocation.reduce((sum, p) => sum + p.lng, 0) / equipmentWithLocation.length;
        center = { lat: avgLat, lng: avgLng };
      }

      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
        mapTypeId: 'hybrid',
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: window.google.maps.ControlPosition.TOP_RIGHT
        },
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER
        },
        scaleControl: true,
        rotateControl: false,
        gestureHandling: 'greedy',
        scrollwheel: true
      });

      setMapLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update markers when pivots change
    useEffect(() => {
      if (!googleMapRef.current || !mapLoaded) return;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add markers for each pivot
      visibleEquipment.forEach(pivot => {
        if (!pivot.lat || !pivot.lng) return;

        const isNeedsService = pivot.status === 'needs-service';
        const hasActiveJob = jobs.some(j => j.pivotId === pivot.id && (j.status === 'pending' || j.status === 'assigned'));

        const marker = new window.google.maps.Marker({
          position: { lat: pivot.lat, lng: pivot.lng },
          map: googleMapRef.current,
          title: pivot.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: hasActiveJob ? '#FAAD14' : isNeedsService ? '#C73E1D' : '#52C41A',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3
          }
        });

        // Info window content with directions and view profile buttons
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`;
        const farmer = users.find(u => u.id === pivot.farmerId);
        const infoContent = `
          <div style="padding: 12px; max-width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h3 style="margin: 0 0 4px 0; color: #2D5016; font-weight: bold; font-size: 16px;">${pivot.name}</h3>
            <p style="margin: 0 0 8px 0; color: #5C6650; font-size: 13px;">${farmer?.name || 'Unknown Farmer'}</p>
            <p style="margin: 4px 0; color: #5C6650; font-size: 13px;">${formatEquipmentType(pivot.type)} • ${pivot.acres || 0} acres</p>
            ${pivot.address ? `<p style="margin: 4px 0; color: #9CA986; font-size: 12px;">📍 ${pivot.address}</p>` : ''}
            <p style="margin: 8px 0;">
              <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; background: ${isNeedsService ? '#C73E1D20' : hasActiveJob ? '#FAAD1420' : '#52C41A20'}; color: ${isNeedsService ? '#C73E1D' : hasActiveJob ? '#FAAD14' : '#52C41A'};">
                ${hasActiveJob ? '🔧 Active Job' : pivot.status}
              </span>
            </p>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
              <button id="viewProfile_${pivot.id}" style="flex: 1; padding: 10px 12px; background: #2D5016; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;">
                View Profile
              </button>
              <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="padding: 10px 12px; background: #E8F0E1; color: #2D5016; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500; display: flex; align-items: center;">
                📍 Directions
              </a>
            </div>
          </div>
        `;

        // Create or reuse info window
        if (!infoWindowRef.current) {
          infoWindowRef.current = new window.google.maps.InfoWindow();
        }

        marker.addListener('click', () => {
          setSelectedMapPivot(pivot);
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(googleMapRef.current, marker);
          
          // Add click listener for View Profile button after info window opens
          window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
            const btn = document.getElementById(`viewProfile_${pivot.id}`);
            if (btn) {
              btn.addEventListener('click', () => {
                infoWindowRef.current.close();
                setSelectedEquipmentProfile(pivot);
              });
            }
          });
        });

        markersRef.current.push(marker);
      });

      // Fit bounds if we have multiple pivots
      if (visibleEquipment.filter(p => p.lat && p.lng).length > 1) {
        const bounds = new window.google.maps.LatLngBounds();
        visibleEquipment.forEach(p => {
          if (p.lat && p.lng) bounds.extend({ lat: p.lat, lng: p.lng });
        });
        googleMapRef.current.fitBounds(bounds, 50);
      }
    // jobs is needed to update marker colors based on active jobs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleEquipment, jobs, mapLoaded]);

    // Search for address
    const handleAddressSearch = () => {
      if (!window.google || !searchAddress || !editingPivot) return;

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: searchAddress }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          const address = results[0].formatted_address;

          handleUpdateEquipmentLocation(editingPivot.id, lat, lng, address);
          setSearchAddress('');
          setEditingPivot(null);

          // Pan to location
          googleMapRef.current.panTo({ lat, lng });
          googleMapRef.current.setZoom(14);
        } else {
          addNotification('error', 'Address not found. Try a different search.');
        }
      });
    };

    // Click on map to set location
    useEffect(() => {
      if (!googleMapRef.current || !mapLoaded || !editingPivot) return;

      const clickListener = googleMapRef.current.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          const address = status === 'OK' && results[0] ? results[0].formatted_address : '';
          handleUpdateEquipmentLocation(editingPivot.id, lat, lng, address);
          setEditingPivot(null);
        });
      });

      return () => window.google.maps.event.removeListener(clickListener);
    }, [editingPivot, mapLoaded]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
            {userProfile?.role === 'farmer' ? 'My Equipment Map' : 'Field Map'}
          </h2>
          <div className="flex items-center space-x-2">
            <Badge variant="success">{visibleEquipment.filter(p => p.status === 'active').length} Active</Badge>
            <Badge variant="warning">{jobs.filter(j => j.status === 'pending' || j.status === 'assigned').length} Jobs</Badge>
            <Badge variant="danger">{visibleEquipment.filter(p => p.status === 'needs-service').length} Need Service</Badge>
          </div>
        </div>

        {/* Editing Mode Banner */}
        {editingPivot && (
          <div className="p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: colors.accent + '20', border: `2px solid ${colors.accent}` }}>
            <div>
              <p className="font-semibold" style={{ color: colors.textPrimary }}>📍 Setting location for: {editingPivot.name}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Click on the map or search for an address below</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEditingPivot(null)}>Cancel</Button>
          </div>
        )}

        {/* Address Search */}
        {editingPivot && (
          <div className="card p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="Search address (e.g., 123 Farm Road, Nebraska)"
                className="input flex-1"
                value={searchAddress}
                onChange={e => setSearchAddress(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddressSearch()}
              />
              <Button icon={Search} onClick={handleAddressSearch}>Search</Button>
            </div>
          </div>
        )}

        {/* Google Map */}
        <div className="card overflow-hidden">
          {/* Map Controls */}
          <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: colors.border }}>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="secondary" icon={Navigation} onClick={handleMyLocation}>My Location</Button>
              <Button size="sm" variant="secondary" onClick={() => googleMapRef.current?.setZoom((googleMapRef.current?.getZoom() || 12) + 1)}>Zoom +</Button>
              <Button size="sm" variant="secondary" onClick={() => googleMapRef.current?.setZoom((googleMapRef.current?.getZoom() || 12) - 1)}>Zoom -</Button>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm rounded-lg" style={{ backgroundColor: colors.background }} onClick={() => googleMapRef.current?.setMapTypeId('hybrid')}>Satellite</button>
              <button className="px-3 py-1 text-sm rounded-lg" style={{ backgroundColor: colors.background }} onClick={() => googleMapRef.current?.setMapTypeId('roadmap')}>Map</button>
              <button className="px-3 py-1 text-sm rounded-lg" style={{ backgroundColor: colors.background }} onClick={() => googleMapRef.current?.setMapTypeId('terrain')}>Terrain</button>
            </div>
          </div>
          <div ref={mapRef} style={{ height: '500px', width: '100%' }}>
            {!window.google && (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Spinner size="lg" />
                  <p className="mt-2" style={{ color: colors.textSecondary }}>Loading map...</p>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 p-4 border-t" style={{ borderColor: colors.border }}>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-sm" style={{ color: colors.textSecondary }}>Active Pivot</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-sm" style={{ color: colors.textSecondary }}>Needs Service</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <span className="text-sm" style={{ color: colors.textSecondary }}>Active Job</span>
            </div>
          </div>
        </div>

        {/* Selected Equipment Quick Panel */}
        {selectedMapPivot && (
          <div className="card p-4" style={{ borderLeft: `4px solid ${colors.primary}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: colors.primary + '15' }}>
                  {selectedMapPivot.type === 'pivot' ? '🌀' : selectedMapPivot.type === 'drip' ? '💧' : '🚜'}
                </div>
                <div>
                  <h4 className="font-bold" style={{ color: colors.textPrimary }}>{selectedMapPivot.name}</h4>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {users.find(u => u.id === selectedMapPivot.farmerId)?.name || 'Unknown'} • {formatEquipmentType(selectedMapPivot.type)} • {selectedMapPivot.acres || 0} acres
                  </p>
                  {selectedMapPivot.address && (
                    <p className="text-xs" style={{ color: colors.muted }}>{selectedMapPivot.address}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={selectedMapPivot.status === 'needs-service' ? 'danger' : 'success'}>{selectedMapPivot.status}</Badge>
                <Button icon={Eye} onClick={() => setSelectedEquipmentProfile(selectedMapPivot)}>View Profile</Button>
                {selectedMapPivot.lat && selectedMapPivot.lng && (
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMapPivot.lat},${selectedMapPivot.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: colors.background }}
                  >
                    <Navigation className="w-5 h-5" style={{ color: colors.primary }} />
                  </a>
                )}
                <button 
                  onClick={() => setSelectedMapPivot(null)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pivot List with Location Edit */}
        <div className="card p-4">
          <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Equipment Locations</h3>
          {visibleEquipment.length === 0 ? (
            <p className="text-center py-4" style={{ color: colors.textSecondary }}>No Equipment to display</p>
          ) : (
            <div className="space-y-2">
              {visibleEquipment.map(pivot => (
                <div key={pivot.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${pivot.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{pivot.name}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{pivot.address || 'No address set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{pivot.acres} acres</p>
                      {pivot.lat && pivot.lng && (
                        <p className="text-xs" style={{ color: colors.muted }}>{pivot.lat.toFixed(4)}, {pivot.lng.toFixed(4)}</p>
                      )}
                    </div>
                    {(userProfile?.role === 'farmer' && pivot.farmerId === userProfile?.id) || userProfile?.role === 'manager' ? (
                      <Button size="sm" variant={editingPivot?.id === pivot.id ? 'primary' : 'secondary'} icon={MapPin} onClick={() => setEditingPivot(editingPivot?.id === pivot.id ? null : pivot)}>
                        {pivot.lat && pivot.lng ? 'Edit' : 'Set Location'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // WEATHER VIEW
  // ============================================
  const WeatherView = () => {
    const getWeatherEmoji = (conditions) => {
      switch(conditions) {
        case 'sunny': return '☀️';
        case 'cloudy': return '☁️';
        case 'rain': return '🌧️';
        case 'partly-cloudy': return '⛅';
        default: return '🌤️';
      }
    };

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Weather</h2>

        {weatherData && (
          <>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold" style={{ color: colors.textPrimary }}>{weatherData.temp}°F</p>
                  <p className="text-lg" style={{ color: colors.textSecondary }}>{weatherData.conditions}</p>
                </div>
                <span className="text-6xl">⛅</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t" style={{ borderColor: colors.border }}>
                <div className="text-center">
                  <Droplets className="w-5 h-5 mx-auto mb-1" style={{ color: colors.water }} />
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{weatherData.humidity}%</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Humidity</p>
                </div>
                <div className="text-center">
                  <Navigation className="w-5 h-5 mx-auto mb-1" style={{ color: colors.primary }} />
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{weatherData.windSpeed} mph</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Wind</p>
                </div>
                <div className="text-center">
                  <Cloud className="w-5 h-5 mx-auto mb-1" style={{ color: colors.sky }} />
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{weatherData.precipitation}%</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Precip</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>5-Day Forecast</h3>
              <div className="grid grid-cols-5 gap-2">
                {weatherData.forecast.map((day, index) => (
                  <div key={index} className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                    <p className="text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>{day.day}</p>
                    <span className="text-2xl">{getWeatherEmoji(day.conditions)}</span>
                    <div className="mt-2">
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{day.high}°</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>{day.low}°</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };



  // ============================================
  // DEV SETTINGS VIEW - Kill Switches & Debug
  // ============================================
  const DevSettingsView = () => {
    const toggleFeature = (feature) => {
      setFeatureFlags(prev => ({ ...prev, [feature]: !prev[feature] }));
    };

    const killSwitches = [
      { key: 'jobCreation', label: 'Job Creation', description: 'Allow creating new jobs and service calls' },
      { key: 'timeTracking', label: 'Time Tracking', description: 'Allow techs to start/stop time on jobs' },
      { key: 'notifications', label: 'Push Notifications', description: 'Send push notifications to users' },
      { key: 'equipmentEditing', label: 'Equipment Editing', description: 'Allow adding/editing equipment' },
      { key: 'userManagement', label: 'User Management', description: 'Allow adding/editing users' },
      { key: 'mapView', label: 'Map View', description: 'Show map tab and equipment locations' },
      { key: 'calendarView', label: 'Calendar View', description: 'Show calendar tab' },
      { key: 'reportIssue', label: 'Report Issue', description: 'Allow farmers to report issues' }
    ];

    const resetAllFlags = () => {
      const allOn = {};
      killSwitches.forEach(s => allOn[s.key] = true);
      setFeatureFlags(allOn);
    };

    const disableAllFlags = () => {
      const allOff = {};
      killSwitches.forEach(s => allOff[s.key] = false);
      setFeatureFlags(allOff);
    };

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center" style={{ color: colors.danger }}>
              <Settings className="w-6 h-6 mr-2" />
              Dev Settings
            </h2>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Feature kill switches and debug tools. Changes persist across sessions.
            </p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: colors.danger + '20', color: colors.danger }}>
            <AlertCircle className="w-4 h-4" />
            <span>DEV ONLY</span>
          </div>
        </div>

        {/* Current User Info */}
        <div className="card p-4">
          <h3 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
            <User className="w-4 h-4 mr-2" />
            Current Session
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span style={{ color: colors.textSecondary }}>Email:</span>
              <p className="font-medium" style={{ color: colors.textPrimary }}>{currentUser?.email}</p>
            </div>
            <div>
              <span style={{ color: colors.textSecondary }}>Actual Role:</span>
              <p className="font-medium" style={{ color: colors.textPrimary }}>{userProfile?.role}</p>
            </div>
            <div>
              <span style={{ color: colors.textSecondary }}>Effective Role:</span>
              <p className="font-medium" style={{ color: devRoleOverride ? colors.warning : colors.primary }}>
                {effectiveRole} {devRoleOverride && '(overridden)'}
              </p>
            </div>
            <div>
              <span style={{ color: colors.textSecondary }}>User ID:</span>
              <p className="font-mono text-xs" style={{ color: colors.textPrimary }}>{userProfile?.id}</p>
            </div>
          </div>
        </div>

        {/* Kill Switches */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center" style={{ color: colors.textPrimary }}>
              <Power className="w-4 h-4 mr-2" />
              Feature Kill Switches
            </h3>
            <div className="flex space-x-2">
              <button 
                onClick={resetAllFlags}
                className="px-3 py-1 text-xs font-medium rounded-lg transition-colors"
                style={{ backgroundColor: colors.success + '20', color: colors.success }}
              >
                Enable All
              </button>
              <button 
                onClick={disableAllFlags}
                className="px-3 py-1 text-xs font-medium rounded-lg transition-colors"
                style={{ backgroundColor: colors.danger + '20', color: colors.danger }}
              >
                Disable All
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {killSwitches.map(({ key, label, description }) => (
              <div 
                key={key} 
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: featureFlags[key] ? colors.success + '10' : colors.danger + '10' }}
              >
                <div>
                  <p className="font-medium" style={{ color: colors.textPrimary }}>{label}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>{description}</p>
                </div>
                <button
                  onClick={() => toggleFeature(key)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${featureFlags[key] ? 'bg-green-500' : 'bg-red-500'}`}
                >
                  <span 
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${featureFlags[key] ? 'left-7' : 'left-1'}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* System Stats */}
        <div className="card p-4">
          <h3 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
            <BarChart3 className="w-4 h-4 mr-2" />
            System Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
              <p className="text-2xl font-bold" style={{ color: colors.primary }}>{users.length}</p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Users</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
              <p className="text-2xl font-bold" style={{ color: colors.primary }}>{jobs.length}</p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Jobs</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
              <p className="text-2xl font-bold" style={{ color: colors.primary }}>{equipment.length}</p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Equipment</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
              <p className="text-2xl font-bold" style={{ color: colors.primary }}>{parts.length}</p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Parts</p>
            </div>
          </div>
        </div>

        {/* Password Reset - User Management */}
        <div className="card p-4">
          <h3 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
            <Mail className="w-4 h-4 mr-2" />
            Password Reset
          </h3>
          <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
            Send password reset emails to users. They'll receive a link to create a new password.
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {users.map(user => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-2 rounded-lg"
                style={{ backgroundColor: colors.background }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{user.avatar || '👤'}</span>
                  <div>
                    <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>{user.name}</p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>{user.email}</p>
                  </div>
                  <span 
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ 
                      backgroundColor: user.role === 'manager' ? colors.primary + '20' : 
                                       user.role === 'tech' ? colors.water + '20' : 
                                       user.role === 'office' ? colors.accent + '20' : colors.success + '20',
                      color: user.role === 'manager' ? colors.primary : 
                             user.role === 'tech' ? colors.water : 
                             user.role === 'office' ? colors.accent : colors.success
                    }}
                  >
                    {user.role}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={async () => {
                    if (!user.email) {
                      addNotification('error', 'User has no email address');
                      return;
                    }
                    if (window.confirm(`Send password reset email to ${user.email}?`)) {
                      const result = await resetPassword(user.email);
                      if (result.success) {
                        addNotification('success', `Password reset email sent to ${user.email}`);
                      } else {
                        addNotification('error', result.error || 'Failed to send reset email');
                      }
                    }
                  }}
                >
                  Reset Password
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Dev Users List */}
        <div className="card p-4">
          <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Authorized Dev Users</h3>
          <div className="space-y-2">
            {DEV_EMAILS.map(email => (
              <div key={email} className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentUser?.email?.toLowerCase() === email ? colors.success : colors.textSecondary }} />
                <span style={{ color: currentUser?.email?.toLowerCase() === email ? colors.success : colors.textSecondary }}>
                  {email} {currentUser?.email?.toLowerCase() === email && '(you)'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card p-4 border-2" style={{ borderColor: colors.danger }}>
          <h3 className="font-semibold mb-3 flex items-center" style={{ color: colors.danger }}>
            <AlertCircle className="w-4 h-4 mr-2" />
            Danger Zone
          </h3>
          <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
            These actions can affect all users. Use with caution.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => {
                if (window.confirm('Clear all localStorage data and reload?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            >
              Clear Local Storage
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                console.log('=== DEBUG DUMP ===');
                console.log('User count:', users?.length);
                console.log('Job count:', jobs?.length);
                console.log('Equipment count:', equipment?.length);
                console.log('Parts count:', parts?.length);
                console.log('Feature Flags:', featureFlags);
                console.log('User Role:', userProfile?.role);
                // TODO: Remove or secure this debug dump in production
                addNotification('success', 'Debug data logged to console (F12)');
              }}
            >
              Dump to Console
            </Button>
          </div>
        </div>
      </div>
    );
  };


  // ============================================
  // RENDER CURRENT VIEW
  // ============================================
  const renderView = () => {
    // If viewing a Equipment Profile, show that instead
    if (selectedEquipmentProfile) {
      return <EquipmentProfileView />;
    }

    const role = effectiveRole;

    if (role === 'farmer') {
      switch(selectedTab) {
        case 'dashboard': return <FarmerDashboard />;
        case 'equipment': return <FarmerEquipmentView />;
        case 'jobs': return <FarmerJobsView />;
        case 'map': return <MapView 
          colors={colors}
          equipment={equipment}
          jobs={jobs}
          userProfile={userProfile}
          addNotification={addNotification}
          handleUpdateEquipmentLocation={handleUpdateEquipmentLocation}
          formatEquipmentType={formatEquipmentType}
          setSelectedEquipmentProfile={setSelectedEquipmentProfile}
        />;
        case 'weather': return <WeatherView />;
        default: return <FarmerDashboard />;
      }
    }

    if (role === 'tech') {
      switch(selectedTab) {
        case 'dashboard': return <TechDashboard 
          colors={colors}
          jobs={jobs}
          userProfile={userProfile}
          setShowAddEquipmentModal={setShowAddEquipmentModal}
          setShowReportIssueModal={setShowReportIssueModal}
          setSelectedJobForAction={setSelectedJobForAction}
          setShowCompleteJobModal={setShowCompleteJobModal}
        />;
        case 'myjobs': return <TechJobsView 
          colors={colors}
          jobs={jobs}
          users={users}
          equipment={equipment}
          userProfile={userProfile}
          isLoading={isLoading}
          setSelectedEquipmentProfile={setSelectedEquipmentProfile}
          setSelectedJobForAction={setSelectedJobForAction}
          setShowCompleteJobModal={setShowCompleteJobModal}
          setShowJobDetailsModal={setShowJobDetailsModal}
          handleStartTime={handleStartTime}
          handleInitiateClockOut={handleInitiateClockOut}
          handleSelfAssign={handleSelfAssign}
        />;
        case 'jobs': return <TechJobsView 
          colors={colors}
          jobs={jobs}
          users={users}
          equipment={equipment}
          userProfile={userProfile}
          isLoading={isLoading}
          setSelectedEquipmentProfile={setSelectedEquipmentProfile}
          setSelectedJobForAction={setSelectedJobForAction}
          setShowCompleteJobModal={setShowCompleteJobModal}
          handleStartTime={handleStartTime}
          handleInitiateClockOut={handleInitiateClockOut}
          handleSelfAssign={handleSelfAssign}
        />;
        case 'customers': return <CustomersView 
          colors={colors}
          users={users}
          equipment={equipment}
          jobs={jobs}
          userProfile={userProfile}
          customerSearchQuery={customerSearchQuery}
          setCustomerSearchQuery={setCustomerSearchQuery}
          setShowAddUserModal={setShowAddUserModal}
          setShowAddEquipmentModal={setShowAddEquipmentModal}
          setShowReportIssueModal={setShowReportIssueModal}
          setSelectedEquipmentProfile={setSelectedEquipmentProfile}
          setSelectedJobForAction={setSelectedJobForAction}
          setShowJobDetailsModal={setShowJobDetailsModal}
          handleDeleteUser={handleDeleteUser}
          handleDeleteEquipment={handleDeleteEquipment}
          handleDeleteJob={handleDeleteJob}
          updateUser={updateUser}
          addNotification={addNotification}
          isLoading={isLoading}
          formatEquipmentType={formatEquipmentType}
          formatDate={formatDate}
          formatStatus={formatStatus}
          getStatusVariant={getStatusVariant}
        />;
        case 'team': return <TechTeamView
          colors={colors}
          jobs={jobs}
          users={users}
          equipment={equipment}
          userProfile={userProfile}
        />;
        case 'map': return <MapView 
          colors={colors}
          equipment={equipment}
          jobs={jobs}
          userProfile={userProfile}
          addNotification={addNotification}
          handleUpdateEquipmentLocation={handleUpdateEquipmentLocation}
          formatEquipmentType={formatEquipmentType}
          setSelectedEquipmentProfile={setSelectedEquipmentProfile}
        />;
        default: return <TechDashboard 
          colors={colors}
          jobs={jobs}
          userProfile={userProfile}
          setShowAddEquipmentModal={setShowAddEquipmentModal}
          setShowReportIssueModal={setShowReportIssueModal}
          setSelectedJobForAction={setSelectedJobForAction}
          setShowCompleteJobModal={setShowCompleteJobModal}
        />;
      }
    }

    if (role === 'office') {
      switch(selectedTab) {
        case 'jobs': return <ManagerJobsView 
          colors={colors}
          jobs={jobs}
          users={users}
          equipment={equipment}
          userProfile={userProfile}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          setShowAddEquipmentModal={setShowAddEquipmentModal}
          setShowReportIssueModal={setShowReportIssueModal}
          setSelectedJobForAction={setSelectedJobForAction}
          setShowAssignJobModal={setShowAssignJobModal}
          setShowJobDetailsModal={setShowJobDetailsModal}
          setShowEditJobModal={setShowEditJobModal}
          setShowSOModal={setShowSOModal}
          setSelectedEquipmentProfile={setSelectedEquipmentProfile}
          handleDeleteJob={handleDeleteJob}
          handleDownloadJobSheet={handleDownloadJobSheet}
          handleUpdateJobStatus={handleUpdateJobStatus}
          getStatusVariant={getStatusVariant}
          formatStatus={formatStatus}
          formatCurrency={formatCurrency}
          canSeePricing={canSeePricing}
        />;
        case 'callin': return <CallInView />;
        case 'customers': return <CustomersView 
          colors={colors}
          users={users}
          equipment={equipment}
          jobs={jobs}
          userProfile={userProfile}
          customerSearchQuery={customerSearchQuery}
          setCustomerSearchQuery={setCustomerSearchQuery}
          setShowAddUserModal={setShowAddUserModal}
          setShowAddEquipmentModal={setShowAddEquipmentModal}
          setShowReportIssueModal={setShowReportIssueModal}
          setSelectedEquipmentProfile={setSelectedEquipmentProfile}
          setSelectedJobForAction={setSelectedJobForAction}
          setShowJobDetailsModal={setShowJobDetailsModal}
          handleDeleteUser={handleDeleteUser}
          handleDeleteEquipment={handleDeleteEquipment}
          handleDeleteJob={handleDeleteJob}
          updateUser={updateUser}
          addNotification={addNotification}
          isLoading={isLoading}
          formatEquipmentType={formatEquipmentType}
          formatDate={formatDate}
          formatStatus={formatStatus}
          getStatusVariant={getStatusVariant}
        />;
        case 'map': return <MapView 
          colors={colors}
          equipment={equipment}
          jobs={jobs}
          userProfile={userProfile}
          addNotification={addNotification}
          handleUpdateEquipmentLocation={handleUpdateEquipmentLocation}
          formatEquipmentType={formatEquipmentType}
          setSelectedEquipmentProfile={setSelectedEquipmentProfile}
        />;
        default: return <ManagerJobsView 
          colors={colors}
          jobs={jobs}
          users={users}
          equipment={equipment}
          userProfile={userProfile}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          setShowAddEquipmentModal={setShowAddEquipmentModal}
          setShowReportIssueModal={setShowReportIssueModal}
          setSelectedJobForAction={setSelectedJobForAction}
          setShowAssignJobModal={setShowAssignJobModal}
          setShowJobDetailsModal={setShowJobDetailsModal}
          setShowEditJobModal={setShowEditJobModal}
          setShowSOModal={setShowSOModal}
          setSelectedEquipmentProfile={setSelectedEquipmentProfile}
          handleDeleteJob={handleDeleteJob}
          handleDownloadJobSheet={handleDownloadJobSheet}
          handleUpdateJobStatus={handleUpdateJobStatus}
          getStatusVariant={getStatusVariant}
          formatStatus={formatStatus}
          formatCurrency={formatCurrency}
          canSeePricing={canSeePricing}
        />;
      }
    }

    // Manager
    switch(selectedTab) {
      case 'dashboard': return <ManagerDashboard 
        colors={colors}
        jobs={jobs}
        users={users}
        equipment={equipment}
        userProfile={userProfile}
        setShowReportIssueModal={setShowReportIssueModal}
        setShowAddEquipmentModal={setShowAddEquipmentModal}
        setSelectedJobForAction={setSelectedJobForAction}
        setShowAssignJobModal={setShowAssignJobModal}
        setShowJobDetailsModal={setShowJobDetailsModal}
        setShowEditJobModal={setShowEditJobModal}
        setSelectedEquipmentProfile={setSelectedEquipmentProfile}
        setSelectedTab={setSelectedTab}
        setFilterStatus={setFilterStatus}
        handleDeleteJob={handleDeleteJob}
      />;
      case 'myjobs': return <TechJobsView 
        colors={colors}
        jobs={jobs}
        users={users}
        equipment={equipment}
        userProfile={userProfile}
        isLoading={isLoading}
        setSelectedEquipmentProfile={setSelectedEquipmentProfile}
        setSelectedJobForAction={setSelectedJobForAction}
        setShowCompleteJobModal={setShowCompleteJobModal}
        handleStartTime={handleStartTime}
        handleStopTime={handleStopTime}
        handleSelfAssign={handleSelfAssign}
      />;
      case 'jobs': return <ManagerJobsView 
        colors={colors}
        jobs={jobs}
        users={users}
        equipment={equipment}
        userProfile={userProfile}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        setShowAddEquipmentModal={setShowAddEquipmentModal}
        setShowReportIssueModal={setShowReportIssueModal}
        setSelectedJobForAction={setSelectedJobForAction}
        setShowAssignJobModal={setShowAssignJobModal}
        setShowJobDetailsModal={setShowJobDetailsModal}
        setShowEditJobModal={setShowEditJobModal}
        setShowSOModal={setShowSOModal}
        setSelectedEquipmentProfile={setSelectedEquipmentProfile}
        handleDeleteJob={handleDeleteJob}
        handleDownloadJobSheet={handleDownloadJobSheet}
        handleUpdateJobStatus={handleUpdateJobStatus}
        getStatusVariant={getStatusVariant}
        formatStatus={formatStatus}
        formatCurrency={formatCurrency}
        canSeePricing={canSeePricing}
      />;
      case 'calendar': return <CalendarView />;
      case 'customers': return <CustomersView 
        colors={colors}
        users={users}
        equipment={equipment}
        jobs={jobs}
        userProfile={userProfile}
        customerSearchQuery={customerSearchQuery}
        setCustomerSearchQuery={setCustomerSearchQuery}
        setShowAddUserModal={setShowAddUserModal}
        setShowAddEquipmentModal={setShowAddEquipmentModal}
        setShowReportIssueModal={setShowReportIssueModal}
        setSelectedEquipmentProfile={setSelectedEquipmentProfile}
        setSelectedJobForAction={setSelectedJobForAction}
        setShowJobDetailsModal={setShowJobDetailsModal}
        handleDeleteUser={handleDeleteUser}
        handleDeleteEquipment={handleDeleteEquipment}
        handleDeleteJob={handleDeleteJob}
        updateUser={updateUser}
        addNotification={addNotification}
        isLoading={isLoading}
        formatEquipmentType={formatEquipmentType}
        formatDate={formatDate}
        formatStatus={formatStatus}
        getStatusVariant={getStatusVariant}
      />;
      case 'team': return <TeamManagement 
        colors={colors}
        users={users}
        jobs={jobs}
        userProfile={userProfile}
        setShowAddUserModal={setShowAddUserModal}
        handleDeleteUser={handleDeleteUser}
        updateUser={updateUser}
        addNotification={addNotification}
        resetPassword={resetPassword}
      />;
      case 'map': return <MapView 
        colors={colors}
        equipment={equipment}
        jobs={jobs}
        userProfile={userProfile}
        addNotification={addNotification}
        handleUpdateEquipmentLocation={handleUpdateEquipmentLocation}
        formatEquipmentType={formatEquipmentType}
        setSelectedEquipmentProfile={setSelectedEquipmentProfile}
      />;
      case 'analytics': return <AnalyticsView 
        colors={colors}
        jobs={jobs}
        users={users}
        analytics={analytics}
      />;
      case 'settings': return <SettingsView />;
      case 'dev': return isDevUser ? <DevSettingsView /> : <ManagerDashboard 
        colors={colors}
        jobs={jobs}
        users={users}
        equipment={equipment}
        userProfile={userProfile}
        setShowReportIssueModal={setShowReportIssueModal}
        setShowAddEquipmentModal={setShowAddEquipmentModal}
        setSelectedJobForAction={setSelectedJobForAction}
        setShowAssignJobModal={setShowAssignJobModal}
        setShowJobDetailsModal={setShowJobDetailsModal}
        setShowEditJobModal={setShowEditJobModal}
        setSelectedEquipmentProfile={setSelectedEquipmentProfile}
        setSelectedTab={setSelectedTab}
        setFilterStatus={setFilterStatus}
        handleDeleteJob={handleDeleteJob}
      />;
      default: return <ManagerDashboard 
        colors={colors}
        jobs={jobs}
        users={users}
        equipment={equipment}
        userProfile={userProfile}
        setShowReportIssueModal={setShowReportIssueModal}
        setShowAddEquipmentModal={setShowAddEquipmentModal}
        setSelectedJobForAction={setSelectedJobForAction}
        setShowAssignJobModal={setShowAssignJobModal}
        setShowJobDetailsModal={setShowJobDetailsModal}
        setShowEditJobModal={setShowEditJobModal}
        setSelectedEquipmentProfile={setSelectedEquipmentProfile}
        setSelectedTab={setSelectedTab}
        setFilterStatus={setFilterStatus}
        handleDeleteJob={handleDeleteJob}
      />;
    }
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  if (authLoading) return <LoadingScreen />;
  if (currentView === 'login') return <LoginScreen />;

  const navItems = getNavItems();

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <header className="shadow-sm sticky top-0 z-40" style={{ backgroundColor: colors.cardBg, borderBottom: `1px solid ${colors.border}` }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${isDarkMode ? '#8FBC3B' : '#2D5016'} 0%, ${isDarkMode ? '#2D5016' : '#8FBC3B'} 100%)` }}>
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold" style={{ color: isDarkMode ? '#8FBC3B' : '#2D5016' }}>FieldSync</h1>
                {isDevUser ? (
                  <select
                    value={devRoleOverride || userProfile?.role || 'manager'}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setDevRoleOverride(newRole === userProfile?.role ? null : newRole);
                      // Reset to appropriate default tab for the role
                      if (newRole === 'farmer') setSelectedTab('dashboard');
                      else if (newRole === 'office') setSelectedTab('jobs');
                      else setSelectedTab('dashboard');
                    }}
                    className="text-xs px-2 py-0.5 rounded border cursor-pointer"
                    style={{ 
                      backgroundColor: colors.warning + '20', 
                      borderColor: colors.warning,
                      color: colors.warning
                    }}
                  >
                    <option value="manager">🔧 Manager</option>
                    <option value="tech">👷 Technician</option>
                    <option value="office">📋 Office</option>
                    <option value="farmer">🌾 Farmer</option>
                  </select>
                ) : (
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {effectiveRole === 'office' ? 'Office Portal' : 
                     effectiveRole === 'tech' ? 'Technician Portal' : 
                     effectiveRole === 'farmer' ? 'Farmer Portal' : 'Manager Portal'}
                  </p>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              {/* Sync Status */}
              <div className="hidden md:flex items-center space-x-1 px-2 py-1 rounded-lg" style={{ backgroundColor: syncStatus === 'online' ? colors.success + '15' : colors.danger + '15' }}>
                {syncStatus === 'online' ? <Wifi className="w-4 h-4" style={{ color: colors.success }} /> : <WifiOff className="w-4 h-4" style={{ color: colors.danger }} />}
                <span className="text-xs" style={{ color: syncStatus === 'online' ? colors.success : colors.danger }}>{syncStatus}</span>
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
                <button className="relative p-2 rounded-lg transition-colors" style={{ backgroundColor: showNotificationsDropdown ? colors.border : 'transparent' }} onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}>
                  <Bell className="w-5 h-5" style={{ color: colors.textSecondary }} />
                  {jobNotifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: colors.danger }} />
                  )}
                </button>
                <NotificationsDropdown />
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-2 pl-2 border-l cursor-pointer rounded-lg p-1 transition-colors" style={{ borderColor: colors.border }} onClick={() => setShowProfileModal(true)}>
                <span className="text-2xl">{userProfile?.avatar || '👤'}</span>
                <div className="hidden md:block">
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{userProfile?.name || 'User'}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>{userProfile?.email || ''}</p>
                </div>
              </div>

              {/* Logout */}
              <button onClick={handleLogout} className="p-2 rounded-lg transition-colors" title="Logout">
                <LogOut className="w-4 h-4" style={{ color: colors.textSecondary }} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="px-4 flex space-x-1 overflow-x-auto">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setSelectedTab(item.id)} 
              className={`nav-tab ${selectedTab === item.id ? 'active' : ''}`}
              style={item.isDev ? { 
                backgroundColor: selectedTab === item.id ? colors.danger : colors.danger + '20',
                color: selectedTab === item.id ? 'white' : colors.danger,
                borderColor: colors.danger
              } : {}}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        {selectedEquipmentProfile && (
          <div className="flex items-center space-x-2 mb-4 text-sm">
            <button 
              onClick={() => setSelectedEquipmentProfile(null)}
              className="hover:underline"
              style={{ color: colors.primary }}
            >
              {selectedTab === 'map' ? 'Map' : selectedTab === 'equipment' ? 'Equipment' : 'Dashboard'}
            </button>
            <ChevronRight className="w-4 h-4" style={{ color: colors.muted }} />
            <span style={{ color: colors.textPrimary }}>{selectedEquipmentProfile.name}</span>
          </div>
        )}
        
        {renderView()}
      </main>

      {/* Floating Action Button (FAB) */}
      {['manager', 'office', 'tech'].includes(effectiveRole) && !selectedEquipmentProfile && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end space-y-2">
          {/* Quick Actions - shown on hover/tap of main FAB */}
          <div className="fab-menu flex flex-col items-end space-y-2">
            <button
              onClick={() => setShowReportIssueModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105"
              style={{ backgroundColor: colors.danger, color: 'white' }}
              title="Report Issue"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Report Issue</span>
            </button>
            <button
              onClick={() => setShowAddEquipmentModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105"
              style={{ backgroundColor: colors.primary, color: 'white' }}
              title="Add Equipment"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Equipment</span>
            </button>
            {effectiveRole === 'manager' && (
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105"
                style={{ backgroundColor: colors.water, color: 'white' }}
                title="Add Team Member"
              >
                <UserPlus className="w-4 h-4" />
                <span className="text-sm font-medium">Add User</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map(notif => (
          <div key={notif.id} className="card p-4 shadow-lg flex items-center space-x-3 animate-slide-in" style={{ backgroundColor: notif.type === 'error' ? colors.danger + '15' : notif.type === 'success' ? colors.success + '15' : colors.water + '15' }}>
            {notif.type === 'error' ? <AlertCircle className="w-5 h-5" style={{ color: colors.danger }} /> :
             notif.type === 'success' ? <CheckCircle className="w-5 h-5" style={{ color: colors.success }} /> :
             <AlertCircle className="w-5 h-5" style={{ color: colors.water }} />}
            <p className="text-sm" style={{ color: colors.textPrimary }}>{notif.message}</p>
          </div>
        ))}
      </div>

      {/* Modals - Wrapped in Suspense for lazy loading */}
      <React.Suspense fallback={<Spinner />}>
        <AddEquipmentModal
          isOpen={showAddEquipmentModal}
          onClose={() => setShowAddEquipmentModal(false)}
          onAdd={handleAddEquipment}
          users={users}
          userProfile={effectiveProfile}
          isLoading={isLoading}
          colors={colors}
          addNotification={addNotification}
        />
      </React.Suspense>
      <EditEquipmentModal
        isOpen={showEditEquipmentModal}
        onClose={() => setShowEditEquipmentModal(false)}
        equipment={selectedEquipmentProfile}
        onUpdate={handleUpdateEquipmentDetails}
        isLoading={isLoading}
        colors={colors}
      />
      <React.Suspense fallback={<Spinner />}>
        <ReportIssueModal
        isOpen={showReportIssueModal}
        onClose={() => { setShowReportIssueModal(false); setSelectedEquipmentForIssue(null); }}
        colors={colors}
        userProfile={effectiveProfile}
        users={users}
        equipment={equipment}
        selectedEquipmentForIssue={selectedEquipmentForIssue}
        setSelectedEquipmentForIssue={setSelectedEquipmentForIssue}
        createJob={createJob}
        addPivot={fbAddPivot}
        addNotification={addNotification}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
      </React.Suspense>
      <React.Suspense fallback={<Spinner />}>
        <CompleteJobModal
          isOpen={showCompleteJobModal}
          onClose={() => { setShowCompleteJobModal(false); setSelectedJobForAction(null); }}
          colors={colors}
          selectedJobForAction={selectedJobForAction}
          parts={parts}
          pricingSettings={pricingSettings}
          handleCompleteJob={handleCompleteJob}
          isLoading={isLoading}
          canSeePricing={canSeePricing}
          formatCurrency={formatCurrency}
          truckLocations={TRUCK_LOCATIONS}
          users={users}
          userProfile={userProfile}
          onDownloadJobSheet={handleDownloadJobSheet}
          onExportToExcel={handleExportToExcel}
        />
      </React.Suspense>
      <React.Suspense fallback={<Spinner />}>
        <AssignJobModal
          isOpen={showAssignJobModal}
          onClose={() => { setShowAssignJobModal(false); setSelectedJobForAction(null); }}
          colors={colors}
          users={users}
          jobs={jobs}
          userProfile={userProfile}
          selectedJobForAction={selectedJobForAction}
          handleAssignJob={handleAssignJob}
          handleRemoveAssignee={handleRemoveAssignee}
          setShowAddUserModal={setShowAddUserModal}
          isLoading={isLoading}
        />
      </React.Suspense>
      <React.Suspense fallback={<Spinner />}>
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          colors={colors}
          signUp={signUp}
          addNotification={addNotification}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </React.Suspense>
      <React.Suspense fallback={<Spinner />}>
        <JobDetailsModal
        isOpen={showJobDetailsModal}
        onClose={() => { setShowJobDetailsModal(false); setSelectedJobForAction(null); }}
        job={selectedJobForAction}
        users={users}
        equipment={equipment}
        userProfile={userProfile}
        canSeePricing={canSeePricing}
        isLoading={isLoading}
        colors={colors}
        onUpdateJob={async (jobId, data) => {
          const result = await fbUpdateJob(jobId, data);
          if (result.success) {
            addNotification('success', 'Job updated successfully');
          } else {
            addNotification('error', 'Failed to update job');
          }
        }}
        onAddManualTimeEntry={handleAddManualTimeEntry}
        onDeleteTimeEntry={handleDeleteTimeEntry}
        onDownloadJobSheet={handleDownloadJobSheet}
        onExportToExcel={handleExportToExcel}
        onOpenSOModal={() => setShowSOModal(true)}
        onOpenAssignModal={() => setShowAssignJobModal(true)}
        onStartTime={handleStartTime}
        onStopTime={handleStopTime}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        getStatusVariant={getStatusVariant}
        formatStatus={formatStatus}
      />
      </React.Suspense>
      <React.Suspense fallback={<Spinner />}>
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userProfile={userProfile}
          isLoading={isLoading}
          colors={colors}
          onUpdateProfile={(data) => updateUser(userProfile.id, data).then(() => addNotification('success', 'Profile updated'))}
          onUpdateEmail={updateUserEmail}
          onUpdatePassword={updateUserPassword}
          CARRIERS={CARRIERS}
          sendTestNotification={sendTestNotification}
          isEmailJSConfigured={isEmailJSConfigured}
          getSmsEmail={getSmsEmail}
          addNotification={addNotification}
        />
      </React.Suspense>
      <React.Suspense fallback={<Spinner />}>
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          colors={colors}
          pricingSettings={pricingSettings}
          handleUpdateSettings={handleUpdateSettings}
          isLoading={isLoading}
        />
      </React.Suspense>
      <React.Suspense fallback={<Spinner />}>
        <SONumberModal
          isOpen={showSOModal}
          onClose={() => { setShowSOModal(false); setSelectedJobForAction(null); }}
          colors={colors}
          selectedJobForAction={selectedJobForAction}
          handleUpdateSONumber={handleUpdateSONumber}
          isLoading={isLoading}
        />
      </React.Suspense>
      <React.Suspense fallback={<Spinner />}>
        <EditJobModal
          isOpen={showEditJobModal}
          onClose={() => { setShowEditJobModal(false); setSelectedJobForAction(null); }}
          selectedJobForAction={selectedJobForAction}
          parts={parts}
          colors={colors}
          truckLocations={TRUCK_LOCATIONS}
          updateJob={async (jobId, data) => {
            const result = await fbUpdateJob(jobId, data);
            return result;
          }}
          addNotification={addNotification}
          users={users}
          userProfile={userProfile}
          pricingSettings={pricingSettings}
        />
      </React.Suspense>
      <React.Suspense fallback={<Spinner />}>
        <ClockOutSurveyModal
          isOpen={showClockOutSurvey}
          onClose={() => { setShowClockOutSurvey(false); setClockOutJobId(null); }}
          onComplete={handleClockOutSurveyComplete}
          job={jobs.find(j => j.id === clockOutJobId)}
          colors={colors}
          isLoading={isLoading}
        />
      </React.Suspense>

      {/* Floating Clock In Button - DISABLED: using manual time entry only
      <ClockInFAB
        colors={colors}
        jobs={jobs}
        users={users}
        equipment={equipment}
        userProfile={userProfile}
        handleStartTime={handleStartTime}
        handleSelfAssign={handleSelfAssign}
      />
      */}

      {/* Click outside to close notifications dropdown */}
      {showNotificationsDropdown && (
        <div className="fixed inset-0 z-30" onClick={() => setShowNotificationsDropdown(false)} />
      )}
    </div>
  );
};

// App Router - decides whether to show TV Dashboard or Main App
const AppRouter = () => {
  if (isTVRoute()) {
    return <TVDashboardWrapper />;
  }
  return <FieldSyncApp />;
};

export default AppRouter;
