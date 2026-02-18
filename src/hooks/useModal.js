// FieldSync v2 - Modal State Hook
// Replaces 12+ individual useState booleans from App.js lines 226-241
import { useState, useCallback } from 'react';

export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState(null);

  const open = useCallback((modalData = null) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
    if (isOpen) setData(null);
  }, [isOpen]);

  return { isOpen, data, open, close, toggle };
};

// Multi-modal manager for pages that need several modals
export const useModals = (modalNames) => {
  const [modals, setModals] = useState(() => {
    const initial = {};
    modalNames.forEach(name => {
      initial[name] = { isOpen: false, data: null };
    });
    return initial;
  });

  const open = useCallback((name, data = null) => {
    setModals(prev => ({
      ...prev,
      [name]: { isOpen: true, data }
    }));
  }, []);

  const close = useCallback((name) => {
    setModals(prev => ({
      ...prev,
      [name]: { isOpen: false, data: null }
    }));
  }, []);

  const closeAll = useCallback(() => {
    setModals(prev => {
      const next = {};
      Object.keys(prev).forEach(name => {
        next[name] = { isOpen: false, data: null };
      });
      return next;
    });
  }, []);

  const isOpen = useCallback((name) => modals[name]?.isOpen || false, [modals]);
  const getData = useCallback((name) => modals[name]?.data || null, [modals]);

  return { modals, open, close, closeAll, isOpen, getData };
};

export default useModal;
