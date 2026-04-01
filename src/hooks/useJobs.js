// FieldSync v2 - Job Management Hook
// Extracted from App.js lines 432-676
// Note: Context values (users, equipment, jobs, etc.) are included in useCallback
// dependency arrays. Callbacks are recreated when context values change, which is
// correct behavior - React re-renders on context change and provides fresh closures.
import { useState, useCallback } from 'react';
import {
  addJob as fbAddJob,
  updateJob as fbUpdateJob,
  assignJob as fbAssignJob,
  addAssigneeToJob as fbAddAssignee,
  removeAssigneeFromJob as fbRemoveAssignee,
  completeJob as fbCompleteJob,
  deleteJob as fbDeleteJob
} from '../firebase';
import { notifications } from '../services/notifications';
import { exportJobToExcel } from '../services/excelExport';
import { downloadJobSheetPDF } from '../services/pdfGenerator';
import { useAuth } from '../context/AuthContextV2';
import { useData } from '../context/DataContext';
import { useNotifications } from '../context/NotificationContext';

export const useJobs = () => {
  const { userProfile } = useAuth();
  const { users, equipment, jobs, pricingSettings } = useData();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const createJob = useCallback(async (pivotId, description, priority, pivotOptions) => {
    const pivot = equipment.find(p => p.id === pivotId);
    if (!pivot) return;

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
      leavePivotRunning: pivotOptions?.leavePivotRunning || false,
      pivotDirection: pivotOptions?.pivotDirection || '',
      pivotPercentage: pivotOptions?.pivotPercentage || 0,
      farmerAcknowledgedResponsibility: pivotOptions?.acknowledged || false,
      reportedBy: pivotOptions?.reportedBy || null,
      reportedByRole: pivotOptions?.reportedByRole || null,
      soNumber: pivotOptions?.soNumber || ''
    };

    const result = await fbAddJob(jobData);
    if (result.success) {
      addNotification('success', 'Issue reported successfully');
      const managers = users.filter(u => u.role === 'manager');
      const officeStaff = users.filter(u => u.role === 'office');
      const reporterName = pivotOptions?.reportedBy || userProfile?.name || 'Customer';
      notifications.newIssue(managers, officeStaff, jobData, reporterName);
      if (priority === 'high') {
        notifications.urgentIssue(managers, jobData, reporterName);
      }
    } else {
      addNotification('error', 'Failed to report issue');
    }
    setIsLoading(false);
    return result;
  }, [equipment, userProfile, users, addNotification]);

  const createCallInJob = useCallback(async (jobData) => {
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
      const managers = users.filter(u => u.role === 'manager');
      const reporterName = userProfile?.name || 'Office';
      notifications.newIssue(managers, [], fullJobData, reporterName);
    } else {
      addNotification('error', 'Failed to create job');
    }
    setIsLoading(false);
    return result;
  }, [userProfile, users, addNotification]);

  const assignJob = useCallback(async (jobId, techId) => {
    setIsLoading(true);
    const result = await fbAssignJob(jobId, techId);
    if (result.success) {
      const tech = users.find(u => u.id === techId);
      addNotification('success', `Job assigned to ${tech?.name || 'technician'}`);
      const job = jobs.find(j => j.id === jobId);
      if (tech && job) notifications.jobAssigned(tech, job);
    } else {
      addNotification('error', 'Failed to assign job');
    }
    setIsLoading(false);
    return result;
  }, [users, jobs, addNotification]);

  const selfAssign = useCallback(async (jobId) => {
    setIsLoading(true);
    const result = await fbAssignJob(jobId, userProfile.id);
    if (result.success) {
      addNotification('success', 'Job assigned to you');
    } else {
      addNotification('error', 'Failed to assign job');
    }
    setIsLoading(false);
    return result;
  }, [userProfile, addNotification]);

  const completeJob = useCallback(async (jobId, completionData) => {
    setIsLoading(true);
    try {
      const totalCost = (completionData.hoursWorked * pricingSettings.hourlyRate) +
                        (completionData.milesDriven * pricingSettings.mileageRate) +
                        (completionData.partsCost || 0) * (1 + pricingSettings.partsMarkup / 100);

      const result = await fbCompleteJob(jobId, {
        ...completionData,
        completedBy: { id: userProfile.id, name: userProfile.name || 'Unknown' },
        totalCost,
        hourlyRate: pricingSettings.hourlyRate,
        mileageRate: pricingSettings.mileageRate
      });

      if (result.success) {
        const isFollowUp = completionData.needsFollowUp;
        addNotification('success', isFollowUp ? 'Service entry saved — job marked for follow-up' : 'Job completed successfully!');
        try {
          const job = jobs.find(j => j.id === jobId);
          const completedByName = userProfile?.name || 'Technician';
          if (job && !isFollowUp) {
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
      return result;
    } catch (err) {
      console.error('Complete job error:', err);
      addNotification('error', 'Failed to complete job');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [pricingSettings, userProfile, jobs, users, addNotification]);

  // Check if an SO number is already used by another job
  const isSONumberDuplicate = useCallback((soNumber, excludeJobId = null) => {
    if (!soNumber || !soNumber.trim()) return false;
    const trimmed = soNumber.trim().toUpperCase();
    return jobs.some(j => {
      if (excludeJobId && j.id === excludeJobId) return false;
      return j.soNumber && j.soNumber.trim().toUpperCase() === trimmed;
    });
  }, [jobs]);

  const updateSONumber = useCallback(async (jobId, soNumber) => {
    // Validate no duplicates
    if (soNumber && isSONumberDuplicate(soNumber, jobId)) {
      addNotification('error', `SO# ${soNumber} is already assigned to another job`);
      return { success: false, error: 'Duplicate SO number' };
    }
    setIsLoading(true);
    const result = await fbUpdateJob(jobId, { soNumber: soNumber.trim() });
    if (result.success) {
      addNotification('success', 'SO Number updated');
    } else {
      addNotification('error', 'Failed to update SO Number');
    }
    setIsLoading(false);
    return result;
  }, [addNotification, isSONumberDuplicate]);

  const rateJob = useCallback(async (jobId, rating, feedback) => {
    setIsLoading(true);
    try {
      const result = await fbUpdateJob(jobId, {
        rating,
        feedback,
        ratedAt: new Date().toISOString()
      });
      if (result.success) {
        addNotification('success', 'Thank you for your feedback!');
      } else {
        addNotification('error', 'Failed to submit rating');
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const deleteJob = useCallback(async (jobId, jobTitle) => {
    // TODO: Replace with custom confirmation modal
    if (!window.confirm(`Are you sure you want to delete "${jobTitle}"? This cannot be undone.`)) return;
    setIsLoading(true);
    const result = await fbDeleteJob(jobId);
    if (result.success) {
      addNotification('success', 'Job deleted successfully');
    } else {
      addNotification('error', 'Failed to delete job');
    }
    setIsLoading(false);
    return result;
  }, [addNotification]);

  const addAssignee = useCallback(async (jobId, userId) => {
    setIsLoading(true);
    const result = await fbAddAssignee(jobId, userId);
    if (result.success) {
      const user = users.find(u => u.id === userId);
      addNotification('success', `${user?.name || 'User'} added to job`);
    } else {
      addNotification('error', 'Failed to add assignee');
    }
    setIsLoading(false);
    return result;
  }, [users, addNotification]);

  const removeAssignee = useCallback(async (jobId, userId) => {
    const user = users.find(u => u.id === userId);
    // TODO: Replace with custom confirmation modal
    if (!window.confirm(`Remove ${user?.name || 'this person'} from this job?`)) return;
    setIsLoading(true);
    const result = await fbRemoveAssignee(jobId, userId);
    if (result.success) {
      addNotification('success', `${user?.name || 'User'} removed from job`);
    } else {
      addNotification('error', 'Failed to remove assignee');
    }
    setIsLoading(false);
    return result;
  }, [users, addNotification]);

  const exportToExcel = useCallback(async (job) => {
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
  }, [equipment, users, pricingSettings, addNotification]);

  const exportToPDF = useCallback((job) => {
    try {
      const pivot = equipment.find(p => p.id === job.pivotId);
      const farmer = users.find(u => u.id === job.farmerId);
      const assignedIds = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
      const tech = users.find(u => assignedIds.includes(u.id));
      downloadJobSheetPDF(job, pivot, farmer, tech, pricingSettings);
      addNotification('success', 'PDF downloaded');
    } catch (error) {
      console.error('PDF export error:', error);
      addNotification('error', 'Failed to generate PDF');
    }
  }, [equipment, users, pricingSettings, addNotification]);

  const updateJobFields = useCallback(async (jobId, fields) => {
    setIsLoading(true);
    const result = await fbUpdateJob(jobId, fields);
    if (result.success) {
      addNotification('success', 'Job updated');
    } else {
      addNotification('error', 'Failed to update job');
    }
    setIsLoading(false);
    return result;
  }, [addNotification]);

  const updateJobStatus = useCallback(async (jobId, status) => {
    const validStatuses = ['pending', 'assigned', 'in-progress', 'completed', 'ready-to-bill', 'billed', 'needs-followup'];
    if (!validStatuses.includes(status)) {
      addNotification('error', `Invalid status: ${status}`);
      return { success: false, error: 'Invalid status' };
    }
    setIsLoading(true);
    const result = await fbUpdateJob(jobId, { status });
    if (result.success) {
      addNotification('success', `Job status updated to ${status}`);
    } else {
      addNotification('error', 'Failed to update job status');
    }
    setIsLoading(false);
    return result;
  }, [addNotification]);

  return {
    isLoading,
    createJob,
    createCallInJob,
    assignJob,
    selfAssign,
    completeJob,
    updateSONumber,
    isSONumberDuplicate,
    updateJobFields,
    rateJob,
    deleteJob,
    addAssignee,
    removeAssignee,
    exportToExcel,
    exportToPDF,
    updateJobStatus
  };
};

export default useJobs;
