// FieldSync v2 - Settings Hook
// Extracted from App.js lines 417-427
import { useState, useCallback } from 'react';
import { updateSettings as fbUpdateSettings } from '../firebase';
import { useNotifications } from '../context/NotificationContext';

export const useSettings = () => {
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const updateSettings = useCallback(async (settings) => {
    setIsLoading(true);
    const result = await fbUpdateSettings(settings);
    if (result.success) {
      addNotification('success', 'Settings updated successfully');
    } else {
      addNotification('error', 'Failed to update settings');
    }
    setIsLoading(false);
    return result;
  }, [addNotification]);

  return {
    isLoading,
    updateSettings
  };
};

export default useSettings;
