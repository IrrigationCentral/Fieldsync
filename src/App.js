import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Users, CheckCircle, AlertCircle, Clock, Wrench,
  Navigation, Droplets, Phone, Mail, Calendar, FileText,
  LogOut, ChevronRight, ChevronDown, ChevronUp,
  Plus, Edit, Trash2, X, Search,
  Bell, User, DollarSign, Briefcase, BarChart3,
  Home, Map, Clipboard, UserPlus, Cloud, Wifi,
  WifiOff, Eye, Check, Settings, Moon, Sun,
  Star, ChevronLeft, Play, Square, FileSpreadsheet
} from 'lucide-react';

// Charts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
// eslint-disable-next-line no-unused-vars
import { notifications } from './services/notifications';

// Excel Export
import { exportJobToExcel } from './services/excelExport';

// UI Components
import { Modal, Button, Input, Select, SearchableSelect, Badge, StarRating, Spinner } from './components/ui';

// Modal Components
import {
  ReportIssueModal,
  CompleteJobModal,
  AddUserModal,
  AssignJobModal,
  SettingsModal,
  SONumberModal,
  AddEquipmentModal,
  EditEquipmentModal, // eslint-disable-line no-unused-vars
  JobDetailsModal,
  ProfileModal
} from './components/modals';


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

// ============================================
// LOCAL COMPONENTS (StatCard, EmptyState, LoadingScreen)
// ============================================

// Stat Card Component
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
  
  // App State
  const [currentView, setCurrentView] = useState('login');
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [syncStatus, setSyncStatus] = useState('online');
  // searchQuery and filterStatus moved into ManagerJobsView to avoid full App re-renders
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showSOModal, setShowSOModal] = useState(false);
  const [selectedEquipmentForIssue, setSelectedEquipmentForIssue] = useState(null);
  const [selectedJobForAction, setSelectedJobForAction] = useState(null);
  
  // Equipment Profile States
  const [selectedEquipmentProfile, setSelectedEquipmentProfile] = useState(null);
  const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(false);
  // const [viewingFarmerProfile, setViewingFarmerProfile] = useState(null); // TODO: Implement farmer profile viewing

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
          if (role === 'farmer') setSelectedTab('equipment');
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

  // Get pending job notifications for dropdown
  const jobNotifications = jobs.filter(j => j.status === 'pending').map(j => ({
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
      notifications.newIssue(managers, officeStaff, jobData, reporterName);
      
      // If high priority, send urgent notification
      if (priority === 'high') {
        notifications.urgentIssue(managers, jobData, reporterName);
      }
    } else {
      addNotification('error', 'Failed to report issue');
    }
    setIsLoading(false);
  };

  // Create job for office call-ins
  const createCallInJob = async (jobData) => {
    setIsLoading(true);
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
      notifications.newIssue(managers, [], fullJobData, reporterName);
      
      setIsLoading(false);
      return { success: true };
    } else {
      addNotification('error', 'Failed to create job');
      setIsLoading(false);
      return { success: false };
    }
  };

  const handleAssignJob = async (jobId, techId) => {
    setIsLoading(true);
    const result = await fbAssignJob(jobId, techId);
    if (result.success) {
      const tech = users.find(u => u.id === techId);
      addNotification('success', `Job assigned to ${tech?.name || 'technician'}`);

      // Send notification to assigned tech
      const job = jobs.find(j => j.id === jobId);
      if (tech && job) {
        notifications.jobAssigned(tech, job);
      }

      setShowAssignJobModal(false);
      setSelectedJobForAction(null);
    } else {
      addNotification('error', 'Failed to assign job');
    }
    setIsLoading(false);
  };

  // Self-assign job (for techs and managers)
  const handleSelfAssign = async (jobId) => {
    setIsLoading(true);
    const result = await fbAssignJob(jobId, userProfile.id);
    if (result.success) {
      addNotification('success', 'Job assigned to you');
      // No need to notify yourself, but log for debugging
      console.log('Self-assigned job:', jobId);
    } else {
      addNotification('error', 'Failed to assign job');
    }
    setIsLoading(false);
  };

  // Stop time tracking
  const handleStopTime = async (jobId, lunchTaken = false) => {
    setIsLoading(true);
    const result = await fbStopTimeEntry(jobId, userProfile.id, lunchTaken);
    if (result.success) {
      addNotification('success', 'Time tracking stopped ⏹️');
    } else {
      addNotification('error', result.error || 'Failed to stop time tracking');
    }
    setIsLoading(false);
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
        addNotification('success', 'Job completed successfully!');
        setShowCompleteJobModal(false);
        setSelectedJobForAction(null);

        // Send notifications (don't block UI)
        try {
          const job = jobs.find(j => j.id === jobId);
          const completedByName = userProfile?.name || 'Technician';
          if (job) {
            const farmer = users.find(u => u.id === job.farmerId);
            if (farmer) notifications.jobCompletedFarmer(farmer, job);
            const managers = users.filter(u => u.role === 'manager');
            const officeStaff = users.filter(u => u.role === 'office');
            notifications.jobCompletedStaff(managers, officeStaff, job, completedByName);
          }
        } catch (notifErr) {
          console.error('Notification error:', notifErr);
        }
      } else {
        addNotification('error', 'Failed to complete job');
      }
    } catch (err) {
      console.error('Complete job error:', err);
      addNotification('error', 'Failed to complete job');
    } finally {
      setIsLoading(false);
    }
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
    const result = await fbAddPivot({
      ...equipmentData,
      farmerId: equipmentData.farmerId || userProfile.id,
      status: 'active',
      lastService: new Date().toISOString().split('T')[0]
    });

    if (result.success) {
      addNotification('success', 'Equipment added successfully');
      setShowAddEquipmentModal(false);
    } else {
      addNotification('error', 'Failed to add equipment');
    }
    setIsLoading(false);
  };

  const handleUpdateEquipmentLocation = async (equipmentId, lat, lng, address) => {
    const result = await fbUpdatePivot(equipmentId, { lat, lng, address });
    if (result.success) {
      addNotification('success', 'Equipment location updated');
    } else {
      addNotification('error', 'Failed to update location');
    }
  };

  const handleDeleteEquipment = async (equipmentId, equipmentName) => {
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
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
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
  };

  // Delete user (customer or team member) - Manager only
  const handleDeleteUser = async (userId, userName, userRole) => {
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
  };

  // Add assignee to job
  const handleAddAssignee = async (jobId, userId) => { // eslint-disable-line no-unused-vars
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
      case 'in-progress': return 'water';
      case 'completed': return 'success';
      case 'billed': return 'success';
      case 'ready-to-bill': return 'accent';
      case 'needs-followup': return 'danger';
      case 'active': return 'success';
      case 'needs-service': return 'danger';
      default: return 'default';
    }
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
    const role = userProfile?.role;
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

  // ============================================
  // NOTIFICATIONS DROPDOWN
  // ============================================
  const NotificationsDropdown = () => {
    if (!showNotificationsDropdown) return null;

    return (
      <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border z-50" style={{ borderColor: colors.border }}>
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
              <div key={notif.id} className="p-4 border-b hover:bg-gray-50 cursor-pointer" style={{ borderColor: colors.border }}
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
            <button className="w-full text-sm font-medium" style={{ color: colors.primary }} onClick={() => { setSelectedTab('jobs'); setShowNotificationsDropdown(false); }}>
              View All Jobs
            </button>
          </div>
        )}
      </div>
    );
  };


  // ============================================
  // FARMER VIEWS
  // ============================================
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
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Service History</h2>
        {myJobs.length === 0 ? (
          <EmptyState icon={Clipboard} title="No Service History" description="Your service requests will appear here." />
        ) : (
          <div className="space-y-3">
            {myJobs.map(job => (
              <div key={job.id} className="card p-4">
                <div className="flex items-start justify-between cursor-pointer" onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{job.title}</h3>
                      {job.soNumber && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>SO# {job.soNumber}</span>}
                    </div>
                    <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{job.description}</p>
                    <div className="flex items-center space-x-3 text-xs" style={{ color: colors.muted }}>
                      <span>{formatDate(job.createdAt)}</span>
                      {job.assignedTo && (() => {
                        const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
                        const names = assignees.map(id => users.find(u => u.id === id)?.name).filter(Boolean);
                        return names.length > 0 ? <span>• Assigned to {names.join(', ')}</span> : null;
                      })()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                    <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>{job.priority}</Badge>
                  </div>
                </div>
                
                {/* Rating Section for Completed Jobs */}
                {['completed', 'billed', 'ready-to-bill'].includes(job.status) && (
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
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // TECH VIEWS
  // ============================================
  const TechDashboard = () => {
    const myJobs = jobs.filter(j => {
      const assigned = j.assignedTo;
      if (Array.isArray(assigned)) {
        return assigned.includes(userProfile?.id);
      }
      return assigned === userProfile?.id;
    });
    const activeJobs = myJobs.filter(j => ['assigned', 'in-progress', 'needs-followup'].includes(j.status));
    const completedJobs = myJobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: colors.primary }}>My Dashboard</h2>
          <div className="flex space-x-2">
            <Button icon={Plus} size="sm" onClick={() => setShowAddEquipmentModal(true)}>Add Equipment</Button>
            <Button icon={AlertCircle} size="sm" variant="secondary" onClick={() => setShowReportIssueModal(true)}>Report Issue</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Active Jobs" value={activeJobs.length} icon={Wrench} color={colors.water} />
          <StatCard title="Completed" value={completedJobs.length} icon={CheckCircle} color={colors.success} />
          <StatCard title="Total Miles" value={completedJobs.reduce((sum, j) => sum + (j.milesDriven || 0), 0)} icon={Navigation} color={colors.primary} />
          <StatCard title="Total Hours" value={completedJobs.reduce((sum, j) => sum + (j.hoursWorked || 0), 0).toFixed(1)} icon={Clock} color={colors.accent} />
        </div>

        <div>
          <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Active Jobs</h3>
          {activeJobs.length === 0 ? (
            <div className="card p-6 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" style={{ color: colors.success }} />
              <p style={{ color: colors.textSecondary }}>All caught up! No active jobs.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map(job => (
                <div key={job.id} className="card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedJobForAction(job); setShowCompleteJobModal(true); }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold" style={{ color: colors.textPrimary }}>{job.title}</h4>
                        {job.soNumber && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>SO# {job.soNumber}</span>}
                      </div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{job.pivotName || 'Location TBD'}</p>
                      <p className="text-xs mt-1" style={{ color: colors.muted }}>{job.description}</p>
                    </div>
                    <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>{job.priority}</Badge>
                  </div>
                  <div className="mt-3 pt-3 border-t flex justify-between items-center" style={{ borderColor: colors.border }}>
                    <span className="text-xs" style={{ color: colors.muted }}>Est. {job.estimatedHours || 2} hours</span>
                    <Button size="sm" icon={CheckCircle}>Complete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TechJobsView = () => {
    const myJobs = jobs.filter(j => {
      const assigned = j.assignedTo;
      const isAssignedToMe = Array.isArray(assigned) ? assigned.includes(userProfile?.id) : assigned === userProfile?.id;
      return isAssignedToMe && ['assigned', 'in-progress', 'needs-followup'].includes(j.status);
    });
    const pendingJobs = jobs.filter(j => j.status === 'pending');
    const [showPending, setShowPending] = useState(false);
    const [showLunchPrompt, setShowLunchPrompt] = useState(false);
    const [stoppingJobId, setStoppingJobId] = useState(null);

    // Check if user has active time entry on a job
    const hasActiveTimeEntry = (job) => {
      return job.timeEntries?.some(e => e.techId === userProfile?.id && !e.endTime);
    };

    const handleStopTimeWithLunch = (jobId, tookLunch) => {
      handleStopTime(jobId, tookLunch);
      setShowLunchPrompt(false);
      setStoppingJobId(null);
    };

    return (
      <div className="space-y-6">
        {/* My Active Jobs */}
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>My Jobs</h2>
          {myJobs.length === 0 ? (
            <EmptyState icon={Briefcase} title="No Active Jobs" description="Jobs assigned to you will appear here." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myJobs.map(job => {
                const pivot = equipment.find(p => p.id === job.pivotId);
                const farmer = users.find(u => u.id === job.farmerId);
                const isTracking = hasActiveTimeEntry(job);
                const timeEntries = job.timeEntries || [];
                const totalTrackedTime = timeEntries.reduce((total, e) => {
                  if (e.startTime && e.endTime) {
                    return total + (new Date(e.endTime) - new Date(e.startTime)) / (1000 * 60 * 60);
                  }
                  return total;
                }, 0);

                return (
                  <div key={job.id} className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{job.title}</h3>
                          {job.soNumber && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>SO# {job.soNumber}</span>}
                        </div>
                        <button 
                          onClick={() => pivot && setSelectedEquipmentProfile(pivot)}
                          className="text-sm hover:underline flex items-center"
                          style={{ color: colors.primary }}
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          {job.pivotName}
                        </button>
                      </div>
                      <Badge variant={job.priority === 'high' ? 'danger' : 'warning'}>{job.priority}</Badge>
                    </div>
                    <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{job.description}</p>
                    
                    {/* Time Tracking Status */}
                    {(isTracking || timeEntries.length > 0) && (
                      <div className="p-2 rounded-lg mb-3" style={{ backgroundColor: isTracking ? colors.success + '15' : colors.water + '15' }}>
                        {isTracking ? (
                          <p className="text-xs font-medium flex items-center" style={{ color: colors.success }}>
                            <Play className="w-3 h-3 mr-1 animate-pulse" /> Time tracking active...
                          </p>
                        ) : (
                          <p className="text-xs" style={{ color: colors.water }}>
                            <Clock className="w-3 h-3 inline mr-1" /> {totalTrackedTime.toFixed(1)} hrs tracked ({timeEntries.length} entries)
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Farmer Contact */}
                    {farmer && (
                      <div className="p-2 rounded-lg mb-3 flex items-center justify-between" style={{ backgroundColor: colors.background }}>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{farmer.avatar || '👨‍🌾'}</span>
                          <div>
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{farmer.name}</p>
                            {farmer.phone && (
                              <a href={`tel:${farmer.phone}`} className="text-xs flex items-center" style={{ color: colors.primary }}>
                                <Phone className="w-3 h-3 mr-1" />{farmer.phone}
                              </a>
                            )}
                          </div>
                        </div>
                        {pivot?.lat && pivot?.lng && (
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded flex items-center"
                            style={{ backgroundColor: colors.primary, color: 'white' }}
                          >
                            <MapPin className="w-3 h-3 mr-1" />Directions
                          </a>
                        )}
                      </div>
                    )}
                    
                    {job.leavePivotRunning && (
                      <div className="p-2 rounded-lg mb-3" style={{ backgroundColor: colors.warning + '15' }}>
                        <p className="text-xs font-medium" style={{ color: colors.warning }}>⚠️ Pivot left running: {job.pivotDirection} at {job.pivotPercentage}%</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {isTracking && (
                        <Button
                          className="w-full"
                          variant="danger"
                          icon={Square}
                          onClick={() => { setStoppingJobId(job.id); setShowLunchPrompt(true); }}
                        >
                          Stop Time
                        </Button>
                      )}
                      <Button
                        className="w-full"
                        icon={CheckCircle}
                        onClick={() => { setSelectedJobForAction(job); setShowCompleteJobModal(true); }}
                      >
                        Complete Job
                      </Button>
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
            className="flex items-center justify-between p-3 rounded-lg cursor-pointer"
            style={{ backgroundColor: colors.background }}
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
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</h4>
                          <p className="text-sm" style={{ color: colors.muted }}>{job.pivotName} • {farmer?.name || 'Unknown'}</p>
                        </div>
                        <Badge variant={job.priority === 'high' ? 'danger' : 'warning'}>{job.priority}</Badge>
                      </div>
                      <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>{job.description}</p>
                      <div className="flex space-x-2">
                        <Button 
                          className="flex-1" 
                          icon={UserPlus} 
                          onClick={() => handleSelfAssign(job.id)}
                          loading={isLoading}
                        >
                          Take This Job
                        </Button>
                        {pivot?.lat && pivot?.lng && (
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg flex items-center"
                            style={{ backgroundColor: colors.background }}
                          >
                            <MapPin className="w-4 h-4" style={{ color: colors.primary }} />
                          </a>
                        )}
                      </div>
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
    const [formData, setFormData] = useState({ customerName: '', customerPhone: '', pivotId: '', description: '', priority: 'medium', farmerId: '' });
    const farmers = users.filter(u => u.role === 'farmer');

    const handleSubmit = async (e) => {
      e.preventDefault();
      const pivot = equipment.find(p => p.id === formData.pivotId);
      const result = await createCallInJob({
        title: `Call-in: ${formData.customerName}`,
        description: formData.description,
        priority: formData.priority,
        farmerId: formData.farmerId,
        pivotId: formData.pivotId,
        pivotName: pivot?.name || 'Unknown',
        customerPhone: formData.customerPhone,
        location: { lat: pivot?.lat || 40.7614, lng: pivot?.lng || -96.6856 }
      });
      if (result.success) {
        setFormData({ customerName: '', customerPhone: '', pivotId: '', description: '', priority: 'medium', farmerId: '' });
      }
    };

    const farmerEquipment = formData.farmerId ? equipment.filter(p => p.farmerId === formData.farmerId) : [];

    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-6" style={{ color: colors.primary }}>New Call-In Service Request</h2>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Customer Name" placeholder="John Smith" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required />
              <Input label="Phone Number" placeholder="(555) 123-4567" icon={Phone} value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
            </div>
            <SearchableSelect label="Select Customer Account" value={formData.farmerId} onChange={e => setFormData({...formData, farmerId: e.target.value, pivotId: ''})} options={[{ value: '', label: 'Select a customer...' }, ...farmers.map(f => ({ value: f.id, label: `${f.name}${f.company ? ` (${f.company})` : ''}` }))]} placeholder="Search customers..." colors={colors} />
            {formData.farmerId && (
              <Select label="Select Pivot" value={formData.pivotId} onChange={e => setFormData({...formData, pivotId: e.target.value})} options={[{ value: '', label: 'Select a pivot...' }, ...farmerEquipment.map(p => ({ value: p.id, label: `${p.name} (${p.acres} acres)` }))]} required />
            )}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>Issue Description</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the issue reported by the customer..." className="input min-h-[120px] resize-none" required />
            </div>
            <Select label="Priority" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} options={[{ value: 'low', label: 'Low - Can wait' }, { value: 'medium', label: 'Medium - Soon' }, { value: 'high', label: 'High - Urgent' }]} />
            <Button type="submit" className="w-full" icon={Phone} loading={isLoading}>Create Service Request</Button>
          </form>
        </div>
      </div>
    );
  };

  // ============================================
  // MANAGER/OFFICE - CUSTOMERS VIEW
  // ============================================
  const CustomersView = () => {
    const [customerSearch, setCustomerSearch] = useState('');
    const [editingUserRole, setEditingUserRole] = useState(null);
    const [selectedCustomerProfile, setSelectedCustomerProfile] = useState(null);
    
    // Filter by search and sort alphabetically
    const farmers = users
      .filter(u => u.role === 'farmer')
      .filter(u => {
        if (!customerSearch.trim()) return true;
        const search = customerSearch.toLowerCase();
        return (
          u.name?.toLowerCase().includes(search) ||
          u.company?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search) ||
          u.phone?.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const handleRoleChange = async (userId, newRole) => {
      const result = await updateUser(userId, { role: newRole });
      if (result.success) {
        addNotification('success', 'User role updated successfully');
        setEditingUserRole(null);
      } else {
        addNotification('error', result.error || 'Failed to update role');
      }
    };

    // Get data for selected customer
    const selectedFarmerEquipment = selectedCustomerProfile ? equipment.filter(p => p.farmerId === selectedCustomerProfile.id) : [];
    const selectedFarmerJobs = selectedCustomerProfile ? jobs.filter(j => j.farmerId === selectedCustomerProfile.id) : [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Customers</h2>
          <div className="flex space-x-2">
            <Button icon={UserPlus} size="sm" variant="secondary" onClick={() => setShowAddUserModal(true)}>Add Customer</Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.textSecondary }} />
          <input
            type="text"
            placeholder="Search customers by name, company, email, or phone..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="input pl-10 w-full"
            style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}
          />
          />
          {customerSearch && (
            <button
              onClick={() => setCustomerSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200"
            >
              <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
            </button>
          )}
        </div>

        {/* Results count */}
        {customerSearch && (
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Found {farmers.length} customer{farmers.length !== 1 ? 's' : ''} matching "{customerSearch}"
          </p>
        )}

        {/* Role Edit Modal */}
        <Modal isOpen={!!editingUserRole} title="Change User Role" onClose={() => setEditingUserRole(null)}>
          {editingUserRole && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                <span className="text-3xl">{editingUserRole.avatar || '👤'}</span>
                <div>
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>{editingUserRole.name}</p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{editingUserRole.email}</p>
                </div>
              </div>
              <Select
                label="Select Role"
                value={editingUserRole.role}
                onChange={(e) => setEditingUserRole({ ...editingUserRole, role: e.target.value })}
                options={[
                  { value: 'farmer', label: '👩‍🌾 Customer (Farmer)' },
                  { value: 'tech', label: '👨‍🔧 Technician' },
                  { value: 'office', label: '👤 Office Staff' },
                  { value: 'manager', label: '👨‍💼 Manager' }
                ]}
              />
              <div className="flex space-x-3">
                <Button 
                  className="flex-1" 
                  onClick={() => handleRoleChange(editingUserRole.id, editingUserRole.role)}
                  loading={isLoading}
                >
                  Save Changes
                </Button>
                <Button className="flex-1" variant="secondary" onClick={() => setEditingUserRole(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Customer Profile Modal */}
        <Modal isOpen={!!selectedCustomerProfile} title="Customer Profile" onClose={() => setSelectedCustomerProfile(null)} size="lg">
          {selectedCustomerProfile && (
            <div className="space-y-6">
              {/* Customer Header */}
              <div className="flex items-center space-x-4 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                <span className="text-5xl">{selectedCustomerProfile.avatar || '👨‍🌾'}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>{selectedCustomerProfile.name}</h3>
                  {selectedCustomerProfile.company && <p className="text-sm" style={{ color: colors.textSecondary }}>{selectedCustomerProfile.company}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCustomerProfile.phone && (
                      <a href={`tel:${selectedCustomerProfile.phone}`} className="text-sm flex items-center px-2 py-1 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>
                        <Phone className="w-3 h-3 mr-1" /> {selectedCustomerProfile.phone}
                      </a>
                    )}
                    {selectedCustomerProfile.email && (
                      <a href={`mailto:${selectedCustomerProfile.email}`} className="text-sm flex items-center px-2 py-1 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>
                        <Mail className="w-3 h-3 mr-1" /> {selectedCustomerProfile.email}
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>{selectedFarmerEquipment.length}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Equipment</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" icon={Plus} onClick={() => { setSelectedCustomerProfile(null); setShowAddEquipmentModal(true); }}>Add Equipment</Button>
                <Button size="sm" variant="danger" icon={AlertCircle} onClick={() => { setSelectedCustomerProfile(null); setShowReportIssueModal(true); }}>Report Issue</Button>
                {userProfile?.role === 'manager' && (
                  <>
                    <Button size="sm" variant="secondary" icon={Settings} onClick={() => { setSelectedCustomerProfile(null); setEditingUserRole(selectedCustomerProfile); }}>Edit Role</Button>
                    <Button size="sm" variant="secondary" icon={Trash2} onClick={async () => { await handleDeleteUser(selectedCustomerProfile.id, selectedCustomerProfile.name, 'farmer'); setSelectedCustomerProfile(null); }}>Delete Customer</Button>
                  </>
                )}
              </div>

              {/* Equipment Section */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
                  <Wrench className="w-4 h-4 mr-2" /> Equipment ({selectedFarmerEquipment.length})
                </h4>
                {selectedFarmerEquipment.length === 0 ? (
                  <div className="text-center py-6 rounded-lg" style={{ backgroundColor: colors.background }}>
                    <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>No equipment registered</p>
                    <Button size="sm" icon={Plus} onClick={() => { setSelectedCustomerProfile(null); setShowAddEquipmentModal(true); }}>Add Equipment</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedFarmerEquipment.map(pivot => (
                      <div 
                        key={pivot.id} 
                        className="p-3 rounded-lg hover:shadow-md transition-all" 
                        style={{ backgroundColor: colors.background }}
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => { setSelectedCustomerProfile(null); setSelectedEquipmentProfile(pivot); }}
                          >
                            <p className="font-medium" style={{ color: colors.textPrimary }}>{pivot.name}</p>
                            <p className="text-sm" style={{ color: colors.textSecondary }}>{formatEquipmentType(pivot.type)} • {pivot.acres} acres</p>
                            {pivot.brand && <p className="text-xs" style={{ color: colors.muted }}>{pivot.brand} {pivot.model || ''}</p>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getStatusVariant(pivot.status)}>{pivot.status}</Badge>
                            {['manager', 'office'].includes(userProfile?.role) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteEquipment(pivot.id, pivot.name); }}
                                className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete equipment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Jobs Section */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
                  <Clipboard className="w-4 h-4 mr-2" /> Service History ({selectedFarmerJobs.length})
                </h4>
                {selectedFarmerJobs.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>No service history</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedFarmerJobs.map(job => (
                      <div key={job.id} className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: colors.background }}>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{job.title}</p>
                          <p className="text-xs" style={{ color: colors.textSecondary }}>{formatDate(job.createdAt)} • {job.pivotName}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {job.soNumber && <span className="text-xs" style={{ color: colors.primary }}>SO# {job.soNumber}</span>}
                          <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                          {['manager', 'office'].includes(userProfile?.role) && (
                            <button
                              onClick={() => handleDeleteJob(job.id, job.title)}
                              className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>

        {farmers.length === 0 && !customerSearch ? (
          <EmptyState icon={Users} title="No Customers Yet" description="Add your first customer to get started." action={<Button icon={UserPlus} onClick={() => setShowAddUserModal(true)}>Add Customer</Button>} />
        ) : farmers.length === 0 && customerSearch ? (
          <EmptyState icon={Search} title="No Results" description={`No customers found matching "${customerSearch}"`} action={<Button variant="secondary" onClick={() => setCustomerSearch('')}>Clear Search</Button>} />
        ) : (
          <div className="space-y-2">
            {farmers.map(farmer => {
              const farmerEquipment = equipment.filter(p => p.farmerId === farmer.id);
              const farmerJobs = jobs.filter(j => j.farmerId === farmer.id);

              return (
                <div 
                  key={farmer.id} 
                  className="card p-4 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setSelectedCustomerProfile(farmer)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{farmer.avatar || '👨‍🌾'}</span>
                      <div>
                        <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{farmer.name}</h3>
                        {farmer.company && <p className="text-sm" style={{ color: colors.muted }}>{farmer.company}</p>}
                        <p className="text-sm" style={{ color: colors.textSecondary }}>{farmer.phone || farmer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{farmerEquipment.length} Equipment</p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{farmerJobs.length} Jobs</p>
                      </div>
                      <ChevronRight className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };


  // ============================================
  // MANAGER VIEWS
  // ============================================
  const ManagerDashboard = () => {
    const pendingJobs = jobs.filter(j => j.status === 'pending');
    const assignedJobs = jobs.filter(j => ['assigned', 'in-progress', 'needs-followup'].includes(j.status));
    const completedJobs = jobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status));
    const techs = users.filter(u => u.role === 'tech');

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-3" style={{ color: colors.primary }}>Manager Dashboard</h2>
          <div className="flex flex-wrap gap-2">
            <Button icon={Phone} size="sm" onClick={() => setShowReportIssueModal(true)}>New Call In</Button>
            <Button icon={Plus} size="sm" variant="secondary" onClick={() => setShowAddEquipmentModal(true)}>Add Equipment</Button>
            {/* <Button icon={Settings} size="sm" variant="secondary" onClick={() => setShowSettingsModal(true)}>Settings</Button> */}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Pending Jobs" value={pendingJobs.length} icon={Clock} color={colors.warning} />
          <StatCard title="In Progress" value={assignedJobs.length} icon={Wrench} color={colors.water} />
          <StatCard title="Completed" value={completedJobs.length} icon={CheckCircle} color={colors.success} />
          {/* <StatCard title="Monthly Revenue" value={formatCurrency(analytics?.monthlyRevenue || 0)} icon={DollarSign} color={colors.accent} /> */}
          <StatCard title="Technicians" value={techs.length} icon={Users} color={colors.accent} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-4">
            <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Pending Jobs ({pendingJobs.length})</h3>
            {pendingJobs.length === 0 ? (
              <p className="text-center py-6" style={{ color: colors.textSecondary }}>No pending jobs</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {pendingJobs.map(job => (
                  <div key={job.id} className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: colors.background }}>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</p>
                        <Badge variant={job.priority === 'high' ? 'danger' : 'warning'}>{job.priority}</Badge>
                      </div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{job.pivotName || 'Location TBD'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" onClick={() => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}>Assign</Button>
                      <button
                        onClick={() => handleDeleteJob(job.id, job.title)}
                        className="p-2 rounded text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Team Performance</h3>
            {techs.length === 0 ? (
              <p className="text-center py-6" style={{ color: colors.textSecondary }}>No technicians added yet</p>
            ) : (
              <div className="space-y-3">
                {techs.map(tech => {
                  const techJobs = jobs.filter(j => {
                    const assigned = j.assignedTo;
                    return Array.isArray(assigned) ? assigned.includes(tech.id) : assigned === tech.id;
                  });
                  const active = techJobs.filter(j => ['assigned', 'in-progress', 'needs-followup'].includes(j.status)).length;
                  const completed = techJobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status)).length;
                  return (
                    <div key={tech.id} className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: colors.background }}>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{tech.avatar || '👷'}</span>
                        <div>
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{tech.name}</p>
                          <p className="text-xs" style={{ color: colors.textSecondary }}>{tech.phone || tech.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium" style={{ color: colors.water }}>{active} active</p>
                        <p className="text-xs" style={{ color: colors.success }}>{completed} completed</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ManagerJobsView = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const filteredJobs = jobs.filter(job => {
      const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) || job.description?.toLowerCase().includes(searchQuery.toLowerCase()) || job.soNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || job.status === filterStatus;
      return matchesSearch && matchesFilter;
    });

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold" style={{ color: colors.primary }}>All Jobs</h2>
          <div className="flex items-center space-x-3">
            <Button icon={Plus} size="sm" onClick={() => setShowAddEquipmentModal(true)}>Add Equipment</Button>
            <Button icon={AlertCircle} size="sm" variant="danger" onClick={() => { console.log('Report Issue clicked'); setShowReportIssueModal(true); }}>Report Issue</Button>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textSecondary }} />
              <input type="text" placeholder="Search jobs or SO#..." className="input pl-9 py-2 text-sm" style={{ width: '200px' }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select className="input py-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="ready-to-bill">Ready to Bill</option>
              <option value="billed">Billed</option>
              <option value="needs-followup">Needs Follow-up</option>
            </select>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <EmptyState icon={Briefcase} title="No Jobs Found" description="No jobs match your search criteria." />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: colors.background }}>
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Job</th>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>SO #</th>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Status</th>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Priority</th>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Assigned To</th>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Rating</th>
                    {canSeePricing && <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Cost</th>}
                    <th className="text-right p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => (
                    <tr key={job.id} className="border-t hover:bg-gray-50" style={{ borderColor: colors.border }}>
                      <td className="p-4">
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>{job.pivotName}</p>
                      </td>
                      <td className="p-4">
                        {job.soNumber ? (
                          <span className="text-sm font-mono" style={{ color: colors.primary }}>{job.soNumber}</span>
                        ) : (
                          <button className="text-sm underline" style={{ color: colors.water }} onClick={() => { setSelectedJobForAction(job); setShowSOModal(true); }}>Add SO#</button>
                        )}
                      </td>
                      <td className="p-4"><Badge variant={getStatusVariant(job.status)}>{job.status}</Badge></td>
                      <td className="p-4"><Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>{job.priority}</Badge></td>
                      <td className="p-4 text-sm" style={{ color: colors.textSecondary }}>
                        {(() => {
                          const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
                          if (assignees.length === 0) return '-';
                          return assignees.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ') || '-';
                        })()}
                      </td>
                      <td className="p-4">
                        {job.rating ? (
                          <StarRating rating={job.rating} readonly size="sm" />
                        ) : (
                          <span className="text-sm" style={{ color: colors.muted }}>-</span>
                        )}
                      </td>
                      {canSeePricing && <td className="p-4 text-sm font-medium" style={{ color: colors.textPrimary }}>{job.totalCost ? formatCurrency(job.totalCost) : '-'}</td>}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {job.status === 'pending' ? (
                            <Button size="sm" onClick={() => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}>Assign</Button>
                          ) : ['assigned', 'in-progress', 'needs-followup'].includes(job.status) ? (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}>Edit Team</Button>
                              <Button size="sm" variant="secondary" onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}>View</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}>View</Button>
                              {['completed', 'billed', 'ready-to-bill'].includes(job.status) && (
                                <Button size="sm" variant="secondary" icon={FileSpreadsheet} onClick={() => handleDownloadJobSheet(job)} title="Export to Excel" />
                              )}
                            </>
                          )}
                          {['manager', 'office'].includes(userProfile?.role) && (
                            <button
                              onClick={() => handleDeleteJob(job.id, job.title)}
                              className="p-2 rounded text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TeamManagement = () => {
    const teamMembers = users.filter(u => u.role !== 'farmer');
    const [editingMemberRole, setEditingMemberRole] = useState(null);

    const handleRoleChange = async (userId, newRole) => {
      const result = await updateUser(userId, { role: newRole });
      if (result.success) {
        addNotification('success', 'Role updated successfully');
        setEditingMemberRole(null);
      } else {
        addNotification('error', result.error || 'Failed to update role');
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Team Members</h2>
          <Button icon={UserPlus} onClick={() => setShowAddUserModal(true)}>Add Team Member</Button>
        </div>

        {/* Role Edit Modal */}
        <Modal isOpen={!!editingMemberRole} title="Change Team Member Role" onClose={() => setEditingMemberRole(null)}>
          {editingMemberRole && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                <span className="text-3xl">{editingMemberRole.avatar || '👤'}</span>
                <div>
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>{editingMemberRole.name}</p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{editingMemberRole.email}</p>
                </div>
              </div>
              <Select
                label="Role"
                value={editingMemberRole.role}
                onChange={(e) => setEditingMemberRole({ ...editingMemberRole, role: e.target.value })}
                options={[
                  { value: 'tech', label: 'Technician - Field service worker' },
                  { value: 'office', label: 'Office - Can manage jobs and customers' },
                  { value: 'manager', label: 'Manager - Full access' }
                ]}
              />
              <div className="flex space-x-3">
                <Button className="flex-1" onClick={() => handleRoleChange(editingMemberRole.id, editingMemberRole.role)}>Save Changes</Button>
                <Button variant="secondary" className="flex-1" onClick={() => setEditingMemberRole(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </Modal>

        {teamMembers.length === 0 ? (
          <EmptyState icon={Users} title="No Team Members" description="Add technicians and office staff to your team." action={<Button icon={UserPlus} onClick={() => setShowAddUserModal(true)}>Add Team Member</Button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map(member => {
              const memberJobs = jobs.filter(j => {
                const assigned = j.assignedTo;
                const assignedArr = Array.isArray(assigned) ? assigned : [assigned];
                return assignedArr.includes(member.id);
              });
              const isSelf = member.id === userProfile?.id;
              return (
                <div key={member.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{member.avatar || '👤'}</span>
                      <div>
                        <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                          {member.name}
                          {isSelf && <span className="text-xs ml-1" style={{ color: colors.primary }}>(You)</span>}
                        </h3>
                        <Badge variant={member.role === 'manager' ? 'accent' : member.role === 'office' ? 'water' : 'default'}>{member.role}</Badge>
                      </div>
                    </div>
                    {userProfile?.role === 'manager' && !isSelf && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingMemberRole(member)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit role"
                        >
                          <Settings className="w-4 h-4" style={{ color: colors.textSecondary }} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(member.id, member.name, member.role)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete team member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p style={{ color: colors.textSecondary }}>{member.email}</p>
                    {member.phone && <p style={{ color: colors.textSecondary }}>{member.phone}</p>}
                  </div>
                  {(member.role === 'tech' || member.role === 'manager') && (
                    <div className="mt-3 pt-3 border-t flex justify-between" style={{ borderColor: colors.border }}>
                      <span className="text-sm" style={{ color: colors.textSecondary }}>Active: <strong>{memberJobs.filter(j => ['assigned', 'in-progress', 'needs-followup'].includes(j.status)).length}</strong></span>
                      <span className="text-sm" style={{ color: colors.textSecondary }}>Completed: <strong>{memberJobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status)).length}</strong></span>
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

  const AnalyticsView = () => {
    // Calculate monthly data for charts
    const getMonthlyData = () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();
      
      return months.map((month, index) => {
        const monthJobs = jobs.filter(j => {
          const date = new Date(j.completedAt || j.createdAt);
          return date.getMonth() === index && date.getFullYear() === currentYear;
        });
        const completed = monthJobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status));
        const revenue = completed.reduce((sum, j) => sum + (j.totalCost || 0), 0);
        
        return { name: month, jobs: monthJobs.length, completed: completed.length, revenue };
      });
    };

    // Tech performance data
    const getTechPerformance = () => {
      return users.filter(u => u.role === 'tech').map(tech => {
        const techJobs = jobs.filter(j => {
          const assigned = j.assignedTo;
          return Array.isArray(assigned) ? assigned.includes(tech.id) : assigned === tech.id;
        });
        const completed = techJobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status));
        // const revenue = completed.reduce((sum, j) => sum + (j.totalCost || 0), 0); // Pricing disabled
        const avgRating = completed.length > 0 
          ? completed.reduce((sum, j) => sum + (j.rating || 0), 0) / completed.filter(j => j.rating).length 
          : 0;
        
        // Calculate total hours from time entries
        const totalHours = techJobs.reduce((sum, job) => {
          if (job.timeEntries && Array.isArray(job.timeEntries)) {
            const techEntries = job.timeEntries.filter(e => e.techId === tech.id && e.endTime);
            const jobHours = techEntries.reduce((h, entry) => {
              const start = new Date(entry.startTime);
              const end = new Date(entry.endTime);
              const hours = (end - start) / (1000 * 60 * 60);
              const lunchDeduction = entry.lunchTaken ? 0.5 : 0;
              return h + Math.max(0, hours - lunchDeduction);
            }, 0);
            return sum + jobHours;
          }
          // Fallback to hoursWorked if no time entries
          return sum + (job.hoursWorked || 0);
        }, 0);
        
        return { name: tech.name.split(' ')[0], fullName: tech.name, jobs: completed.length, hours: totalHours, rating: avgRating || 0 };
      });
    };

    // Job status pie chart data
    const statusData = [
      { name: 'Pending', value: analytics?.pendingJobs || 0, color: colors.warning },
      { name: 'Assigned', value: analytics?.assignedJobs || 0, color: colors.water },
      { name: 'In Progress', value: analytics?.inProgressJobs || 0, color: '#1890FF' },
      { name: 'Completed', value: analytics?.completedJobs || 0, color: colors.success },
      { name: 'Ready to Bill', value: analytics?.readyToBillJobs || 0, color: colors.accent || '#722ED1' },
      { name: 'Billed', value: analytics?.billedJobs || 0, color: '#13C2C2' },
      { name: 'Needs Follow-up', value: analytics?.needsFollowupJobs || 0, color: '#C73E1D' }
    ].filter(d => d.value > 0);

    const monthlyData = getMonthlyData();
    const techData = getTechPerformance();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Analytics Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="success">{analytics?.completedJobs || 0} Completed</Badge>
            {/* <Badge variant="accent">{formatCurrency(analytics?.totalRevenue || 0)} Revenue</Badge> */}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Jobs" value={analytics?.totalJobs || 0} icon={Briefcase} color={colors.primary} />
          <StatCard title="This Month" value={analytics?.completedThisMonth || 0} icon={Calendar} color={colors.water} />
          <StatCard title="Total Hours" value={techData.reduce((sum, t) => sum + t.hours, 0).toFixed(1)} icon={Clock} color={colors.success} />
          <StatCard title="Avg Rating" value={(techData.reduce((sum, t) => sum + t.rating, 0) / (techData.length || 1)).toFixed(1)} icon={Star} color={colors.accent} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Jobs Chart */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Jobs by Month</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="name" tick={{ fill: colors.textSecondary, fontSize: 12 }} />
                <YAxis tick={{ fill: colors.textSecondary, fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px' }}
                  labelStyle={{ color: colors.textPrimary }}
                />
                <Bar dataKey="completed" fill={colors.success} radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="jobs" fill={colors.primary} radius={[4, 4, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Job Status Pie Chart */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Job Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-2">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm" style={{ color: colors.textSecondary }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tech Hours Billed */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Hours Billed by Technician</h3>
            {techData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center">
                <p style={{ color: colors.textSecondary }}>No technician data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={techData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis type="number" tick={{ fill: colors.textSecondary, fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: colors.textSecondary, fontSize: 12 }} width={60} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px' }}
                    formatter={(value) => [`${value.toFixed(1)} hrs`, 'Hours']}
                  />
                  <Bar dataKey="hours" fill={colors.water} radius={[0, 4, 4, 0]} name="Hours Billed" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tech Performance - Jobs Completed */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Jobs Completed by Technician</h3>
            {techData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center">
                <p style={{ color: colors.textSecondary }}>No technician data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={techData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis type="number" tick={{ fill: colors.textSecondary, fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: colors.textSecondary, fontSize: 12 }} width={60} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px' }}
                  />
                  <Bar dataKey="jobs" fill={colors.primary} radius={[0, 4, 4, 0]} name="Jobs Completed" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tech Hours Summary Table */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Technician Hours Summary</h3>
          {techData.length === 0 ? (
            <p className="text-center py-4" style={{ color: colors.textSecondary }}>No technician data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: colors.background }}>
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Technician</th>
                    <th className="text-center p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Jobs Completed</th>
                    <th className="text-center p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Hours Billed</th>
                    <th className="text-center p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Avg Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {techData.map((tech, index) => (
                    <tr key={index} className="border-t" style={{ borderColor: colors.border }}>
                      <td className="p-3 font-medium" style={{ color: colors.textPrimary }}>{tech.fullName || tech.name}</td>
                      <td className="p-3 text-center" style={{ color: colors.textSecondary }}>{tech.jobs}</td>
                      <td className="p-3 text-center font-semibold" style={{ color: colors.water }}>{tech.hours.toFixed(1)} hrs</td>
                      <td className="p-3 text-center">
                        {tech.rating > 0 ? (
                          <span className="flex items-center justify-center">
                            <Star className="w-4 h-4 mr-1" style={{ color: colors.accent, fill: colors.accent }} />
                            <span style={{ color: colors.textPrimary }}>{tech.rating.toFixed(1)}</span>
                          </span>
                        ) : (
                          <span style={{ color: colors.muted }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="border-t-2" style={{ borderColor: colors.primary, backgroundColor: colors.background }}>
                    <td className="p-3 font-bold" style={{ color: colors.primary }}>TOTAL</td>
                    <td className="p-3 text-center font-bold" style={{ color: colors.primary }}>{techData.reduce((sum, t) => sum + t.jobs, 0)}</td>
                    <td className="p-3 text-center font-bold" style={{ color: colors.primary }}>{techData.reduce((sum, t) => sum + t.hours, 0).toFixed(1)} hrs</td>
                    <td className="p-3 text-center font-bold" style={{ color: colors.primary }}>
                      {techData.filter(t => t.rating > 0).length > 0 
                        ? (techData.reduce((sum, t) => sum + t.rating, 0) / techData.filter(t => t.rating > 0).length).toFixed(1)
                        : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>System Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.background }}>
              <p className="text-3xl font-bold" style={{ color: colors.primary }}>{analytics?.totalUsers || 0}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Total Users</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.background }}>
              <p className="text-3xl font-bold" style={{ color: colors.secondary }}>{analytics?.totalPivots || 0}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Total Equipment</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.background }}>
              <p className="text-3xl font-bold" style={{ color: colors.water }}>{analytics?.techs || 0}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Technicians</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.background }}>
              <p className="text-3xl font-bold" style={{ color: colors.accent }}>{users.filter(u => u.role === 'farmer').length}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Customers</p>
            </div>
          </div>
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
                            backgroundColor: ['completed', 'billed', 'ready-to-bill'].includes(job.status) ? colors.success + '20' :
                                           ['assigned', 'in-progress'].includes(job.status) ? colors.water + '20' :
                                           job.status === 'needs-followup' ? '#C73E1D20' : colors.warning + '20',
                            color: ['completed', 'billed', 'ready-to-bill'].includes(job.status) ? colors.success :
                                   ['assigned', 'in-progress'].includes(job.status) ? colors.water :
                                   job.status === 'needs-followup' ? '#C73E1D' : colors.warning
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
                  {selectedDateJobs.map(job => (
                    <div
                      key={job.id}
                      className="p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                      style={{ backgroundColor: colors.background }}
                      onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</h4>
                        <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                      </div>
                      <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>{job.pivotName}</p>
                      <p className="text-xs" style={{ color: colors.muted }}>
                        {Array.isArray(job.assignedTo)
                          ? job.assignedTo.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ') || 'Unassigned'
                          : users.find(u => u.id === job.assignedTo)?.name || 'Unassigned'}
                      </p>
                    </div>
                  ))}
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
              <h3 className="font-semibold mb-4 flex items-center" style={{ color: colors.textPrimary }}>
                <Clock className="w-5 h-5 mr-2" style={{ color: colors.water }} />
                Service History ({equipmentJobs.length})
              </h3>
              {equipmentJobs.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>No service history yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {equipmentJobs.map(job => (
                    <div key={job.id} className="p-3 rounded-lg border" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>{job.title}</p>
                          <p className="text-xs" style={{ color: colors.textSecondary }}>{job.description}</p>
                        </div>
                        <Badge variant={getStatusVariant(job.status)} className="text-xs">{job.status}</Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-xs" style={{ color: colors.muted }}>
                        <span>{formatDate(job.createdAt)}</span>
                        {job.hoursWorked && <span>• {job.hoursWorked} hrs</span>}
                        {job.techName && <span>• {job.techName}</span>}
                        {job.rating && (
                          <span className="flex items-center">
                            • <Star className="w-3 h-3 mr-1" style={{ color: colors.accent }} /> {job.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
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
                  Farmer Contact
                </h3>
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-3xl">{farmer.avatar || '👤'}</span>
                  <div>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>{farmer.name}</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{farmer.company || 'Independent'}</p>
                  </div>
                </div>
                {farmer.phone && (
                  <a href={`tel:${farmer.phone}`} className="flex items-center space-x-2 text-sm mb-2" style={{ color: colors.primary }}>
                    <Phone className="w-4 h-4" />
                    <span>{farmer.phone}</span>
                  </a>
                )}
                {farmer.email && (
                  <a href={`mailto:${farmer.email}`} className="flex items-center space-x-2 text-sm" style={{ color: colors.primary }}>
                    <Mail className="w-4 h-4" />
                    <span>{farmer.email}</span>
                  </a>
                )}
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
    const [mapLoaded, setMapLoaded] = useState(false);
    const [_selectedPivot, setSelectedPivot] = useState(null); // eslint-disable-line no-unused-vars
    const [editingPivot, setEditingPivot] = useState(null);
    const [searchAddress, setSearchAddress] = useState('');

    const [_userLocation, setUserLocation] = useState(null); // eslint-disable-line no-unused-vars

    // Filter pivots based on role
    const visibleEquipment = userProfile?.role === 'farmer'
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
        const hasActiveJob = jobs.some(j => j.pivotId === pivot.id && ['pending', 'assigned', 'in-progress', 'needs-followup'].includes(j.status));

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

        // Info window content with directions link
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`;
        const infoContent = `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #2D5016; font-weight: bold;">${pivot.name}</h3>
            <p style="margin: 4px 0; color: #5C6650;">${formatEquipmentType(pivot.type)} • ${pivot.acres} acres</p>
            ${pivot.address ? `<p style="margin: 4px 0; color: #9CA986; font-size: 12px;">${pivot.address}</p>` : ''}
            <p style="margin: 8px 0 0 0;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; background: ${isNeedsService ? '#C73E1D20' : '#52C41A20'}; color: ${isNeedsService ? '#C73E1D' : '#52C41A'};">
                ${pivot.status}
              </span>
            </p>
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #2D5016; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">
              📍 Get Directions
            </a>
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({ content: infoContent });

        marker.addListener('click', () => {
          setSelectedPivot(pivot);
          infoWindow.open(googleMapRef.current, marker);
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
            <Badge variant="warning">{jobs.filter(j => ['pending', 'assigned', 'in-progress', 'needs-followup'].includes(j.status)).length} Jobs</Badge>
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
  // RENDER CURRENT VIEW
  // ============================================
  const renderView = () => {
    // If viewing a Equipment Profile, show that instead
    if (selectedEquipmentProfile) {
      return <EquipmentProfileView />;
    }

    const role = userProfile?.role;

    if (role === 'farmer') {
      switch(selectedTab) {
        case 'equipment': return <FarmerEquipmentView />;
        case 'jobs': return <FarmerJobsView />;
        case 'map': return <MapView />;
        case 'weather': return <WeatherView />;
        default: return <FarmerEquipmentView />;
      }
    }

    if (role === 'tech') {
      switch(selectedTab) {
        case 'dashboard': return <TechDashboard />;
        case 'jobs': return <TechJobsView />;
        case 'customers': return <CustomersView />;
        case 'map': return <MapView />;
        default: return <TechDashboard />;
      }
    }

    if (role === 'office') {
      switch(selectedTab) {
        case 'jobs': return <ManagerJobsView />;
        case 'callin': return <CallInView />;
        case 'customers': return <CustomersView />;
        case 'map': return <MapView />;
        default: return <ManagerJobsView />;
      }
    }

    // Manager
    switch(selectedTab) {
      case 'dashboard': return <ManagerDashboard />;
      case 'myjobs': return <TechJobsView />;
      case 'jobs': return <ManagerJobsView />;
      case 'calendar': return <CalendarView />;
      case 'customers': return <CustomersView />;
      case 'team': return <TeamManagement />;
      case 'map': return <MapView />;
      case 'analytics': return <AnalyticsView />;
      case 'settings': return <SettingsView />;
      default: return <ManagerDashboard />;
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
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {userProfile?.role === 'office' ? 'Office Portal' : 
                   userProfile?.role === 'tech' ? 'Technician Portal' : 
                   userProfile?.role === 'farmer' ? 'Farmer Portal' : 'Manager Portal'}
                </p>
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
            <button key={item.id} onClick={() => setSelectedTab(item.id)} className={`nav-tab ${selectedTab === item.id ? 'active' : ''}`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-7xl mx-auto">
        {renderView()}
      </main>

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

      {/* Modals */}
      <AddEquipmentModal 
        isOpen={showAddEquipmentModal}
        onClose={() => setShowAddEquipmentModal(false)}
        onAdd={handleAddEquipment}
        users={users}
        userProfile={userProfile}
        isLoading={isLoading}
        colors={colors}
        addNotification={addNotification}
      />
      <EditEquipmentModal
        isOpen={showEditEquipmentModal}
        onClose={() => setShowEditEquipmentModal(false)}
        equipment={selectedEquipmentProfile}
        onUpdate={handleUpdateEquipmentDetails}
        isLoading={isLoading}
        colors={colors}
      />
      <ReportIssueModal
        isOpen={showReportIssueModal}
        onClose={() => { setShowReportIssueModal(false); setSelectedEquipmentForIssue(null); }}
        colors={colors}
        userProfile={userProfile}
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
        users={users}
        userProfile={userProfile}
        onDownloadJobSheet={handleDownloadJobSheet}
        onExportToExcel={handleExportToExcel}
      />
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
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        colors={colors}
        signUp={signUp}
        addNotification={addNotification}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
      <JobDetailsModal
        isOpen={showJobDetailsModal}
        onClose={() => { setShowJobDetailsModal(false); setSelectedJobForAction(null); }}
        job={selectedJobForAction}
        users={users}
        userProfile={userProfile}
        canSeePricing={canSeePricing}
        isLoading={isLoading}
        colors={colors}
        onAddManualTimeEntry={handleAddManualTimeEntry}
        onDeleteTimeEntry={handleDeleteTimeEntry}
        onDownloadJobSheet={handleDownloadJobSheet}
        onExportToExcel={handleExportToExcel}
        onOpenSOModal={() => setShowSOModal(true)}
        onOpenAssignModal={() => setShowAssignJobModal(true)}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        getStatusVariant={getStatusVariant}
      />
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
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        colors={colors}
        pricingSettings={pricingSettings}
        handleUpdateSettings={handleUpdateSettings}
        isLoading={isLoading}
      />
      <SONumberModal
        isOpen={showSOModal}
        onClose={() => { setShowSOModal(false); setSelectedJobForAction(null); }}
        colors={colors}
        selectedJobForAction={selectedJobForAction}
        handleUpdateSONumber={handleUpdateSONumber}
        isLoading={isLoading}
      />

      {/* Click outside to close notifications dropdown */}
      {showNotificationsDropdown && (
        <div className="fixed inset-0 z-30" onClick={() => setShowNotificationsDropdown(false)} />
      )}
    </div>
  );
};

export default FieldSyncApp;
