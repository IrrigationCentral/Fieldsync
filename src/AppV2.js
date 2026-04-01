// FieldSync v2 - New App Entry Point
// Slim wrapper: Providers → Auth gate → Layout → Tab-based views
// Feature flag: REACT_APP_USE_V2=true activates this
import React, { useState, useCallback } from 'react';
import AppProviders from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './context/AuthContextV2';
import { useData } from './context/DataContext';
import { useTheme } from './context/ThemeContext';
import { useNotifications } from './context/NotificationContext';
import { useJobs } from './hooks/useJobs';
import { useEquipment } from './hooks/useEquipment';
import { useTimeTracking } from './hooks/useTimeTracking';
import { useSettings } from './hooks/useSettings';
import { getDefaultTab } from './constants/roles';
import { AppLayout } from './components/layout';
import { LoadingScreen } from './components/ui';
import { formatDate } from './utils/formatters';
import { formatCurrency } from './utils/formatters';
import { getStatusVariant } from './constants/statusMaps';

// Pages
import LoginPage from './pages/shared/LoginPage';
import FarmerEquipmentPage from './pages/farmer/EquipmentPage';
import FarmerServiceHistoryPage from './pages/farmer/ServiceHistoryPage';
import TechDashboardPage from './pages/tech/DashboardPage';
import ManagerDashboardPage from './pages/manager/DashboardPage';
import ManagerJobsPage from './pages/manager/JobsPage';
import TeamPage from './pages/manager/TeamPage';
import CallInPage from './pages/office/CallInPage';
import CustomersPage from './pages/shared/CustomersPage';
import WeatherPage from './pages/shared/WeatherPage';
import AnalyticsPage from './pages/manager/AnalyticsPage';
import CalendarPage from './pages/manager/CalendarPage';
import SettingsPage from './pages/manager/SettingsPage';
import EquipmentProfilePage from './pages/shared/EquipmentProfilePage';
import MapPage from './pages/shared/MapPage';

// Modals (re-used from existing codebase)
import {
  ReportIssueModal, CompleteJobModal, AddUserModal,
  AssignJobModal, SettingsModal, SONumberModal,
  AddEquipmentModal, EditEquipmentModal, JobDetailsModal, ProfileModal
} from './components/modals';

import {
  signUp, updateUserEmail, updateUserPassword, updateUser,
  addPivot as fbAddPivot
} from './firebase';
import { CARRIERS, sendTestNotification, isEmailJSConfigured, getSmsEmail } from './services/sms';

// ============================================
// AUTH GATE - Renders login or app based on auth state
// ============================================
const AuthGate = () => {
  const { isAuthenticated, authLoading, role, logout } = useAuth();
  const { addNotification } = useNotifications();
  const [selectedTab, setSelectedTab] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedJobForNotification, setSelectedJobForNotification] = useState(null);
  const [showJobDetailsFromNotif, setShowJobDetailsFromNotif] = useState(false);

  if (authLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <LoginPage />;

  const currentTab = selectedTab || getDefaultTab(role);

  const handleLogout = async () => {
    await logout();
    addNotification('info', 'Logged out successfully');
  };

  const handleOpenJobDetails = (job) => {
    setSelectedJobForNotification(job);
    setShowJobDetailsFromNotif(true);
    setSelectedTab('jobs');
  };

  return (
    <AppLayout
      selectedTab={currentTab}
      onSelectTab={setSelectedTab}
      onOpenProfile={() => setShowProfileModal(true)}
      onLogout={handleLogout}
      onOpenJobDetails={handleOpenJobDetails}
    >
      <ModalManager
        selectedTab={currentTab}
        onSelectTab={setSelectedTab}
        showProfileModal={showProfileModal}
        setShowProfileModal={setShowProfileModal}
        selectedJobForNotification={selectedJobForNotification}
        showJobDetailsFromNotif={showJobDetailsFromNotif}
        setShowJobDetailsFromNotif={setShowJobDetailsFromNotif}
        setSelectedJobForNotification={setSelectedJobForNotification}
      />
    </AppLayout>
  );
};

// ============================================
// MODAL MANAGER - Handles all modals + routes views
// ============================================
const ModalManager = ({ selectedTab, onSelectTab, showProfileModal, setShowProfileModal, selectedJobForNotification, showJobDetailsFromNotif, setShowJobDetailsFromNotif, setSelectedJobForNotification }) => {
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const { users, equipment, jobs, parts, pricingSettings, truckLocations } = useData();
  const { addNotification } = useNotifications();
  const jobActions = useJobs();
  const equipActions = useEquipment();
  const timeActions = useTimeTracking();
  const settingsActions = useSettings();

  // Modal states
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [showCompleteJobModal, setShowCompleteJobModal] = useState(false);
  const [showAssignJobModal, setShowAssignJobModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showSOModal, setShowSOModal] = useState(false);
  const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(false);
  const [selectedEquipmentForIssue, setSelectedEquipmentForIssue] = useState(null);
  const [selectedJobForAction, setSelectedJobForAction] = useState(null);
  const [selectedEquipmentProfile, setSelectedEquipmentProfile] = useState(null);

  // Per-modal loading states to prevent cross-contamination
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);

  // Pricing disabled for now - match v1 behavior. Enable later:
  // const canSeePricing = ['manager', 'office'].includes(userProfile?.role);
  const canSeePricing = false;

  // Memoized callbacks to prevent re-renders
  const handleOpenReportIssue = useCallback((pivot) => {
    setSelectedEquipmentForIssue(pivot);
    setShowReportIssueModal(true);
  }, []);

  const handleOpenAddEquipment = useCallback(() => {
    setShowAddEquipmentModal(true);
  }, []);

  const handleOpenJobDetails = useCallback((job) => {
    setSelectedJobForAction(job);
    setShowJobDetailsModal(true);
  }, []);

  const handleOpenAssignModal = useCallback((job) => {
    setSelectedJobForAction(job);
    setShowAssignJobModal(true);
  }, []);

  const handleOpenSOModal = useCallback((job) => {
    setSelectedJobForAction(job);
    setShowSOModal(true);
  }, []);

  const handleOpenCompleteModal = useCallback((job) => {
    setSelectedJobForAction(job);
    setShowCompleteJobModal(true);
  }, []);

  // Scroll to top when tab changes
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedTab]);

  // View routing
  const renderView = () => {
    const role = userProfile?.role;

    // Equipment profile overlay
    if (selectedEquipmentProfile) {
      return (
        <EquipmentProfilePage
          equipment={selectedEquipmentProfile}
          onBack={() => setSelectedEquipmentProfile(null)}
          onReportIssue={handleOpenReportIssue}
          onEditEquipment={() => setShowEditEquipmentModal(true)}
        />
      );
    }

    if (role === 'farmer') {
      switch (selectedTab) {
        case 'equipment':
          return (
            <FarmerEquipmentPage
              onViewEquipment={setSelectedEquipmentProfile}
              onReportIssue={handleOpenReportIssue}
              onAddEquipment={handleOpenAddEquipment}
            />
          );
        case 'jobs':
          return (
            <FarmerServiceHistoryPage
              onViewJob={handleOpenJobDetails}
            />
          );
        case 'weather': return <WeatherPage />;
        case 'map': return <MapPage />;
        default: return <FarmerEquipmentPage onViewEquipment={setSelectedEquipmentProfile} onReportIssue={handleOpenReportIssue} onAddEquipment={handleOpenAddEquipment} />;
      }
    }

    if (role === 'tech') {
      switch (selectedTab) {
        case 'dashboard':
          return (
            <TechDashboardPage
              onOpenAssignModal={handleOpenAssignModal}
              onOpenCompleteModal={handleOpenCompleteModal}
              onOpenJobDetails={handleOpenJobDetails}
              onViewEquipment={setSelectedEquipmentProfile}
              onAddEquipmentClick={handleOpenAddEquipment}
              onReportIssueClick={() => setShowReportIssueModal(true)}
            />
          );
        case 'jobs':
          return (
            <TechDashboardPage
              onOpenAssignModal={handleOpenAssignModal}
              onOpenCompleteModal={handleOpenCompleteModal}
              onOpenJobDetails={handleOpenJobDetails}
              onViewEquipment={setSelectedEquipmentProfile}
              onAddEquipmentClick={handleOpenAddEquipment}
              onReportIssueClick={() => setShowReportIssueModal(true)}
            />
          );
        case 'alljobs':
          return (
            <ManagerJobsPage
              onOpenAssignModal={handleOpenAssignModal}
              onOpenJobDetails={handleOpenJobDetails}
              onOpenSOModal={handleOpenSOModal}
              onOpenReportIssue={() => setShowReportIssueModal(true)}
              onOpenAddEquipment={handleOpenAddEquipment}
            />
          );
        case 'customers':
          return (
            <CustomersPage
              onViewEquipment={setSelectedEquipmentProfile}
              onAddUserClick={() => setShowAddUserModal(true)}
              onAddEquipmentClick={handleOpenAddEquipment}
              onReportIssueClick={() => setShowReportIssueModal(true)}
              onEquipmentClick={setSelectedEquipmentProfile}
              onDeleteEquipment={(id, name) => equipActions.deleteEquipment(id, name)}
              onDeleteJob={(id, title) => jobActions.deleteJob(id, title)}
            />
          );
        case 'map': return <MapPage />;
        default:
          return (
            <TechDashboardPage
              onOpenAssignModal={handleOpenAssignModal}
              onOpenCompleteModal={handleOpenCompleteModal}
              onOpenJobDetails={handleOpenJobDetails}
              onViewEquipment={setSelectedEquipmentProfile}
              onAddEquipmentClick={handleOpenAddEquipment}
              onReportIssueClick={() => setShowReportIssueModal(true)}
            />
          );
      }
    }

    if (role === 'office') {
      switch (selectedTab) {
        case 'jobs':
          return (
            <ManagerJobsPage
              onOpenAssignModal={handleOpenAssignModal}
              onOpenJobDetails={handleOpenJobDetails}
              onOpenSOModal={handleOpenSOModal}
              onOpenReportIssue={() => setShowReportIssueModal(true)}
              onOpenAddEquipment={handleOpenAddEquipment}
            />
          );
        case 'callin': return <CallInPage />;
        case 'customers':
          return (
            <CustomersPage
              onViewEquipment={setSelectedEquipmentProfile}
              onAddUserClick={() => setShowAddUserModal(true)}
              onAddEquipmentClick={handleOpenAddEquipment}
              onReportIssueClick={() => setShowReportIssueModal(true)}
              onEquipmentClick={setSelectedEquipmentProfile}
              onDeleteEquipment={(id, name) => equipActions.deleteEquipment(id, name)}
              onDeleteJob={(id, title) => jobActions.deleteJob(id, title)}
            />
          );
        case 'map': return <MapPage />;
        default:
          return (
            <ManagerJobsPage
              onOpenAssignModal={handleOpenAssignModal}
              onOpenJobDetails={handleOpenJobDetails}
              onOpenSOModal={handleOpenSOModal}
              onOpenReportIssue={() => setShowReportIssueModal(true)}
              onOpenAddEquipment={handleOpenAddEquipment}
            />
          );
      }
    }

    // Manager
    switch (selectedTab) {
      case 'dashboard':
        return (
          <ManagerDashboardPage
            onOpenAssignModal={handleOpenAssignModal}
            onOpenJobDetails={handleOpenJobDetails}
            onOpenReportIssue={() => setShowReportIssueModal(true)}
            onOpenAddEquipment={handleOpenAddEquipment}
          />
        );
      case 'myjobs':
        return (
          <TechDashboardPage
            onOpenAssignModal={handleOpenAssignModal}
            onOpenCompleteModal={handleOpenCompleteModal}
            onOpenJobDetails={handleOpenJobDetails}
            onViewEquipment={setSelectedEquipmentProfile}
            onAddEquipmentClick={handleOpenAddEquipment}
            onReportIssueClick={() => setShowReportIssueModal(true)}
          />
        );
      case 'jobs':
        return (
          <ManagerJobsPage
            onOpenAssignModal={handleOpenAssignModal}
            onOpenJobDetails={handleOpenJobDetails}
            onOpenSOModal={handleOpenSOModal}
            onOpenReportIssue={() => setShowReportIssueModal(true)}
            onOpenAddEquipment={handleOpenAddEquipment}
          />
        );
      case 'calendar': return <CalendarPage onOpenJobDetails={handleOpenJobDetails} />;
      case 'customers':
        return (
          <CustomersPage
            onViewEquipment={setSelectedEquipmentProfile}
            onAddUserClick={() => setShowAddUserModal(true)}
            onAddEquipmentClick={handleOpenAddEquipment}
            onReportIssueClick={() => setShowReportIssueModal(true)}
            onEquipmentClick={setSelectedEquipmentProfile}
            onDeleteEquipment={(id, name) => equipActions.deleteEquipment(id, name)}
            onDeleteJob={(id, title) => jobActions.deleteJob(id, title)}
          />
        );
      case 'team': return <TeamPage onOpenAddUser={() => setShowAddUserModal(true)} />;
      case 'map': return <MapPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'settings': return <SettingsPage />;
      default:
        return (
          <ManagerDashboardPage
            onOpenAssignModal={handleOpenAssignModal}
            onOpenJobDetails={handleOpenJobDetails}
            onOpenReportIssue={() => setShowReportIssueModal(true)}
            onOpenAddEquipment={handleOpenAddEquipment}
          />
        );
    }
  };

  return (
    <>
      {renderView()}

      {/* All Modals */}
      <AddEquipmentModal
        isOpen={showAddEquipmentModal}
        onClose={() => setShowAddEquipmentModal(false)}
        onAdd={async (data) => { const result = await equipActions.addEquipment(data); if (result?.success) setShowAddEquipmentModal(false); }}
        users={users}
        userProfile={userProfile}
        isLoading={equipmentLoading}
        setIsLoading={setEquipmentLoading}
        colors={colors}
        addNotification={addNotification}
      />
      <EditEquipmentModal
        isOpen={showEditEquipmentModal}
        onClose={() => setShowEditEquipmentModal(false)}
        equipment={selectedEquipmentProfile}
        onUpdate={async (id, data) => { const result = await equipActions.updateDetails(id, data); if (result?.success) setShowEditEquipmentModal(false); }}
        isLoading={equipmentLoading}
        setIsLoading={setEquipmentLoading}
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
        createJob={jobActions.createJob}
        addPivot={fbAddPivot}
        addNotification={addNotification}
        isLoading={issueLoading}
        setIsLoading={setIssueLoading}
      />
      <CompleteJobModal
        isOpen={showCompleteJobModal}
        onClose={() => { setShowCompleteJobModal(false); setSelectedJobForAction(null); }}
        colors={colors}
        selectedJobForAction={selectedJobForAction}
        parts={parts}
        pricingSettings={pricingSettings}
        handleCompleteJob={async (id, data) => { const result = await jobActions.completeJob(id, data); if (result?.success) { setShowCompleteJobModal(false); setSelectedJobForAction(null); } }}
        isLoading={false}
        canSeePricing={canSeePricing}
        formatCurrency={formatCurrency}
        truckLocations={truckLocations}
        users={users}
        userProfile={userProfile}
        addNotification={addNotification}
        onDownloadJobSheet={jobActions.exportToPDF}
        onExportToExcel={jobActions.exportToExcel}
      />
      <AssignJobModal
        isOpen={showAssignJobModal}
        onClose={() => { setShowAssignJobModal(false); setSelectedJobForAction(null); }}
        colors={colors}
        users={users}
        jobs={jobs}
        userProfile={userProfile}
        selectedJobForAction={selectedJobForAction}
        handleAssignJob={async (id, techId) => { const result = await jobActions.assignJob(id, techId); if (result?.success) { setShowAssignJobModal(false); setSelectedJobForAction(null); } }}
        handleRemoveAssignee={jobActions.removeAssignee}
        setShowAddUserModal={setShowAddUserModal}
        isLoading={false}
      />
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        colors={colors}
        signUp={signUp}
        addNotification={addNotification}
        isLoading={userLoading}
        setIsLoading={setUserLoading}
      />
      {/* Consolidated Job Details Modal - handles both action and notification flows */}
      <JobDetailsModal
        isOpen={showJobDetailsModal || showJobDetailsFromNotif}
        onClose={() => {
          setShowJobDetailsModal(false);
          setShowJobDetailsFromNotif(false);
          setSelectedJobForAction(null);
          setSelectedJobForNotification(null);
        }}
        job={selectedJobForAction || selectedJobForNotification}
        users={users}
        userProfile={userProfile}
        canSeePricing={canSeePricing}
        isLoading={false}
        colors={colors}
        equipment={equipment}
        onAddManualTimeEntry={timeActions.addManualEntry}
        onDeleteTimeEntry={timeActions.deleteEntry}
        onDownloadJobSheet={jobActions.exportToPDF}
        onExportToExcel={jobActions.exportToExcel}
        onOpenSOModal={() => setShowSOModal(true)}
        onOpenAssignModal={() => setShowAssignJobModal(true)}
        onStatusChange={jobActions.updateJobStatus}
        onUpdateJob={jobActions.updateJobFields}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        getStatusVariant={getStatusVariant}
      />
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userProfile={userProfile}
        isLoading={false}
        colors={colors}
        onUpdateProfile={async (data) => { try { await updateUser(userProfile.id, data); addNotification('success', 'Profile updated'); } catch (err) { addNotification('error', 'Failed to update profile'); } }}
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
        handleUpdateSettings={async (s) => { const result = await settingsActions.updateSettings(s); if (result?.success) setShowSettingsModal(false); }}
        isLoading={false}
      />
      <SONumberModal
        isOpen={showSOModal}
        onClose={() => { setShowSOModal(false); setSelectedJobForAction(null); }}
        colors={colors}
        selectedJobForAction={selectedJobForAction}
        handleUpdateSONumber={async (id, so) => { const result = await jobActions.updateSONumber(id, so); if (result?.success) { setShowSOModal(false); setSelectedJobForAction(null); } }}
        isLoading={false}
      />
    </>
  );
};


// ============================================
// APP V2 - Top-level with providers
// ============================================
const AppV2 = () => (
  <ErrorBoundary>
    <AppProviders>
      <AuthGate />
    </AppProviders>
  </ErrorBoundary>
);

export default AppV2;
