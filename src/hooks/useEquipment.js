// FieldSync v2 - Equipment Management Hook
// Extracted from App.js lines 686-801
import { useState, useCallback } from 'react';
import {
  addPivot as fbAddPivot,
  updatePivot as fbUpdatePivot,
  deletePivot as fbDeletePivot
} from '../firebase';
import { useAuth } from '../context/AuthContextV2';
import { useNotifications } from '../context/NotificationContext';

export const useEquipment = () => {
  const { userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const addEquipment = useCallback(async (equipmentData) => {
    setIsLoading(true);
    const result = await fbAddPivot({
      ...equipmentData,
      farmerId: equipmentData.farmerId || userProfile.id,
      status: 'active',
      lastService: new Date().toISOString().split('T')[0]
    });
    if (result.success) {
      addNotification('success', 'Equipment added successfully');
    } else {
      addNotification('error', 'Failed to add equipment');
    }
    setIsLoading(false);
    return result;
  }, [userProfile, addNotification]);

  const updateLocation = useCallback(async (equipmentId, lat, lng, address) => {
    const result = await fbUpdatePivot(equipmentId, { lat, lng, address });
    if (result.success) {
      addNotification('success', 'Equipment location updated');
    } else {
      addNotification('error', 'Failed to update location');
    }
    return result;
  }, [addNotification]);

  const updateDetails = useCallback(async (equipmentId, equipmentData) => {
    setIsLoading(true);
    const result = await fbUpdatePivot(equipmentId, equipmentData);
    if (result.success) {
      addNotification('success', 'Equipment details updated successfully');
    } else {
      addNotification('error', 'Failed to update equipment details');
    }
    setIsLoading(false);
    return result;
  }, [addNotification]);

  const deleteEquipment = useCallback(async (equipmentId, equipmentName) => {
    if (!window.confirm(`Are you sure you want to delete "${equipmentName}"? This cannot be undone.`)) return;
    setIsLoading(true);
    const result = await fbDeletePivot(equipmentId);
    if (result.success) {
      addNotification('success', 'Equipment deleted successfully');
    } else {
      addNotification('error', 'Failed to delete equipment');
    }
    setIsLoading(false);
    return result;
  }, [addNotification]);

  return {
    isLoading,
    addEquipment,
    updateLocation,
    updateDetails,
    deleteEquipment
  };
};

export default useEquipment;
