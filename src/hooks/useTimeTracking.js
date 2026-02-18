// FieldSync v2 - Time Tracking Hook
// Extracted from App.js lines 551-586
import { useState, useCallback } from 'react';
import {
  stopTimeEntry as fbStopTimeEntry,
  addManualTimeEntry as fbAddManualTimeEntry,
  deleteTimeEntry as fbDeleteTimeEntry
} from '../firebase';
import { useAuth } from '../context/AuthContextV2';
import { useNotifications } from '../context/NotificationContext';

export const useTimeTracking = () => {
  const { userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const stopTime = useCallback(async (jobId, lunchTaken = false) => {
    setIsLoading(true);
    const result = await fbStopTimeEntry(jobId, userProfile.id, lunchTaken);
    if (result.success) {
      addNotification('success', 'Time tracking stopped');
    } else {
      addNotification('error', result.error || 'Failed to stop time tracking');
    }
    setIsLoading(false);
    return result;
  }, [userProfile, addNotification]);

  const addManualEntry = useCallback(async (jobId, techId, techName, startTime, endTime, lunchTaken, notes) => {
    setIsLoading(true);
    const result = await fbAddManualTimeEntry(jobId, techId, techName, startTime, endTime, lunchTaken, notes);
    if (result.success) {
      addNotification('success', 'Time entry added');
    } else {
      addNotification('error', result.error || 'Failed to add time entry');
    }
    setIsLoading(false);
    return result;
  }, [addNotification]);

  const deleteEntry = useCallback(async (jobId, entryId) => {
    setIsLoading(true);
    const result = await fbDeleteTimeEntry(jobId, entryId);
    if (result.success) {
      addNotification('success', 'Time entry deleted');
    } else {
      addNotification('error', result.error || 'Failed to delete time entry');
    }
    setIsLoading(false);
    return result;
  }, [addNotification]);

  return {
    isLoading,
    stopTime,
    addManualEntry,
    deleteEntry
  };
};

export default useTimeTracking;
