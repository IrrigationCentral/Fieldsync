// FieldSync v2 - User Management Hook
// Extracted from App.js lines 742-756
import { useState, useCallback } from 'react';
import { deleteUser as fbDeleteUser } from '../firebase';
import { useNotifications } from '../context/NotificationContext';

export const useUsers = () => {
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const deleteUser = useCallback(async (userId, userName, userRole) => {
    const roleLabel = userRole === 'farmer' ? 'customer' : 'team member';
    if (!window.confirm(`Are you sure you want to delete ${roleLabel} "${userName}"? This cannot be undone.`)) return;
    setIsLoading(true);
    const result = await fbDeleteUser(userId);
    if (result.success) {
      addNotification('success', `${roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)} deleted successfully`);
    } else {
      addNotification('error', `Failed to delete ${roleLabel}`);
    }
    setIsLoading(false);
    return result;
  }, [addNotification]);

  return {
    isLoading,
    deleteUser
  };
};

export default useUsers;
