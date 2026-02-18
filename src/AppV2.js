// FieldSync v2 - New App Entry Point
// Slim wrapper: Providers → Auth gate → Layout → Tab-based views
// Feature flag: REACT_APP_USE_V2=true activates this
import React, { useState } from 'react';
import AppProviders from './context/AppContext';
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

  if (authLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <LoginPage />;

  const currentTab = selectedTab || getDefaultTab(role);

  const handleLogout = async () => {
    await logout();
    addNotification('info', 'Logged out successfully');
  };

  return (
    <AppLayout
      selectedTab={currentTab}
      onSelectTab={setSelectedTab}
      onOpenProfile={() => {/* handled by ModalManager */}}
      onLogout={handleLogout}
    >
      <ModalManager selectedTab={currentTab} onSelectTab={setSelectedTab} />
    </AppLayout>
  );
};

// ============================================
// MODAL MANAGER - Handles all modals + routes views
// ============================================
const ModalManager = ({ selectedTab, onSelectTab }) => {
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const { users, equipment, jobs, parts, pricingSettings } = useData();
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showSOModal, setShowSOModal] = useState(false);
  const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(false);
  const [selectedEquipmentForIssue, setSelectedEquipmentForIssue] = useState(null);
  const [selectedJobForAction, setSelectedJobForAction] = useState(null);
  const [selectedEquipmentProfile, setSelectedEquipmentProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSeePricing = false;

  // View routing
  const renderView = () => {
    const role = userProfile?.role;

    // Equipment profile overlay
    if (selectedEquipmentProfile) {
      return (
        <EquipmentProfilePage
          equipment={selectedEquipmentProfile}
          onBack={() => setSelectedEquipmentProfile(null)}
          onReportIssue={(pivot) => { setSelectedEquipmentForIssue(pivot); setShowReportIssueModal(true); }}
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
              onReportIssue={(pivot) => { setSelectedEquipmentForIssue(pivot); setShowReportIssueModal(true); }}
              onAddEquipment={() => setShowAddEquipmentModal(true)}
            />
          );
        case 'jobs':
          return (
            <FarmerServiceHistoryPage
              onViewJob={(job) => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
            />
          );
        case 'weather': return <WeatherPage />;
        case 'map': return <MapPage />;
        default: return <FarmerEquipmentPage onViewEquipment={setSelectedEquipmentProfile} onReportIssue={(pivot) => { setSelectedEquipmentForIssue(pivot); setShowReportIssueModal(true); }} onAddEquipment={() => setShowAddEquipmentModal(true)} />;
      }
    }

    if (role === 'tech') {
      switch (selectedTab) {
        case 'dashboard':
          return (
            <TechDashboardPage
              onOpenAssignModal={(job) => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}
              onOpenCompleteModal={(job) => { setSelectedJobForAction(job); setShowCompleteJobModal(true); }}
              onOpenJobDetails={(job) => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
              onViewEquipment={setSelectedEquipmentProfile}
            />
          );
        case 'jobs':
          return (
            <TechDashboardPage
              onOpenAssignModal={(job) => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}
              onOpenCompleteModal={(job) => { setSelectedJobForAction(job); setShowCompleteJobModal(true); }}
              onOpenJobDetails={(job) => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
              onViewEquipment={setSelectedEquipmentProfile}
            />
          );
        case 'customers': return <CustomersPage onViewEquipment={setSelectedEquipmentProfile} onReportIssue={(pivot) => { setSelectedEquipmentForIssue(pivot); setShowReportIssueModal(true); }} />;
        case 'map': return <MapPage />;
        default: return <TechDashboardPage onOpenAssignModal={(job) => { setSelectedJobForAction(job); setShowAssignJobModal(true); }} onOpenCompleteModal={(job) => { setSelectedJobForAction(job); setShowCompleteJobModal(true); }} onOpenJobDetails={(job) => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }} onViewEquipment={setSelectedEquipmentProfile} />;
      }
    }

    if (role === 'office') {
      switch (selectedTab) {
        case 'jobs':
          return (
            <ManagerJobsPage
              onOpenAssignModal={(job) => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}
              onOpenJobDetails={(job) => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
              onOpenSOModal={(job) => { setSelectedJobForAction(job); setShowSOModal(true); }}
              onOpenReportIssue={() => setShowReportIssueModal(true)}
              onOpenAddEquipment={() => setShowAddEquipmentModal(true)}
            />
          );
        case 'callin': return <CallInPage />;
        case 'customers': return <CustomersPage onViewEquipment={setSelectedEquipmentProfile} onReportIssue={(pivot) => { setSelectedEquipmentForIssue(pivot); setShowReportIssueModal(true); }} />;
        case 'map': return <MapPage />;
        default: return <ManagerJobsPage onOpenAssignModal={(job) => { setSelectedJobForAction(job); setShowAssignJobModal(true); }} onOpenJobDetails={(job) => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }} onOpenSOModal={(job) => { setSelectedJobForAction(job); setShowSOModal(true); }} onOpenReportIssue={() => setShowReportIssueModal(true)} onOpenAddEquipment={() => setShowAddEquipmentModal(true)} />;
      }
    }

    // Manager
    switch (selectedTab) {
      case 'dashboard':
        return (
          <ManagerDashboardPage
            onOpenAssignModal={(job) => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}
            onOpenReportIssue={() => setShowReportIssueModal(true)}
            onOpenAddEquipment={() => setShowAddEquipmentModal(true)}
          />
        );
      case 'myjobs':
        return (
          <TechDashboardPage
            onOpenAssignModal={(job) => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}
            onOpenCompleteModal={(job) => { setSelectedJobForAction(job); setShowCompleteJobModal(true); }}
            onOpenJobDetails={(job) => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
            onViewEquipment={setSelectedEquipmentProfile}
          />
        );
      case 'jobs':
        return (
          <ManagerJobsPage
            onOpenAssignModal={(job) => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}
            onOpenJobDetails={(job) => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
            onOpenSOModal={(job) => { setSelectedJobForAction(job); setShowSOModal(true); }}
            onOpenReportIssue={() => setShowReportIssueModal(true)}
            onOpenAddEquipment={() => setShowAddEquipmentModal(true)}
          />
        );
      case 'calendar': return <CalendarPage onOpenJobDetails={(job) => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }} />;
      case 'customers': return <CustomersPage onViewEquipment={setSelectedEquipmentProfile} onReportIssue={(pivot) => { setSelectedEquipmentForIssue(pivot); setShowReportIssueModal(true); }} />;
      case 'team': return <TeamPage onOpenAddUser={() => setShowAddUserModal(true)} />;
      case 'map': return <MapPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'settings': return <SettingsPage />;
      default: return <ManagerDashboardPage onOpenAssignModal={(job) => { setSelectedJobForAction(job); setShowAssignJobModal(true); }} onOpenReportIssue={() => setShowReportIssueModal(true)} onOpenAddEquipment={() => setShowAddEquipmentModal(true)} />;
    }
  };

  return (
    <>
      {renderView()}

      {/* All Modals */}
      <AddEquipmentModal
        isOpen={showAddEquipmentModal}
        onClose={() => setShowAddEquipmentModal(false)}
        onAdd={(data) => { equipActions.addEquipment(data).then(() => setShowAddEquipmentModal(false)); }}
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
        onUpdate={(id, data) => { equipActions.updateDetails(id, data).then(() => setShowEditEquipmentModal(false)); }}
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
        createJob={jobActions.createJob}
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
        handleCompleteJob={(id, data) => jobActions.completeJob(id, data).then(() => { setShowCompleteJobModal(false); setSelectedJobForAction(null); })}
        isLoading={isLoading}
        canSeePricing={canSeePricing}
        formatCurrency={formatCurrency}
        users={users}
        userProfile={userProfile}
        onDownloadJobSheet={jobActions.exportToExcel}
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
        handleAssignJob={(id, techId) => jobActions.assignJob(id, techId).then(() => { setShowAssignJobModal(false); setSelectedJobForAction(null); })}
        handleRemoveAssignee={jobActions.removeAssignee}
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
        onAddManualTimeEntry={timeActions.addManualEntry}
        onDeleteTimeEntry={timeActions.deleteEntry}
        onDownloadJobSheet={jobActions.exportToExcel}
        onExportToExcel={jobActions.exportToExcel}
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
        handleUpdateSettings={(s) => settingsActions.updateSettings(s).then(() => setShowSettingsModal(false))}
        isLoading={isLoading}
      />
      <SONumberModal
        isOpen={showSOModal}
        onClose={() => { setShowSOModal(false); setSelectedJobForAction(null); }}
        colors={colors}
        selectedJobForAction={selectedJobForAction}
        handleUpdateSONumber={(id, so) => jobActions.updateSONumber(id, so).then(() => { setShowSOModal(false); setSelectedJobForAction(null); })}
        isLoading={isLoading}
      />
    </>
  );
};


// ============================================
// APP V2 - Top-level with providers
// ============================================
const AppV2 = () => (
  <AppProviders>
    <AuthGate />
  </AppProviders>
);

export default AppV2;
