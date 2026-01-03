// ============================================
// SO NUMBER MODAL
// ============================================
import React, { useState, useEffect } from 'react';
import { Hash, Check } from 'lucide-react';
import { Modal, Button, Input } from '../ui';

const SONumberModal = ({
  isOpen,
  onClose,
  colors,
  selectedJobForAction,
  handleUpdateSONumber,
  isLoading
}) => {
  const [soNumber, setSoNumber] = useState(selectedJobForAction?.soNumber || '');

  useEffect(() => {
    if (isOpen) {
      setSoNumber(selectedJobForAction?.soNumber || '');
    }
  }, [selectedJobForAction, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedJobForAction && soNumber) {
      handleUpdateSONumber(selectedJobForAction.id, soNumber);
      setSoNumber('');
    }
  };

  const handleClose = () => {
    onClose();
    setSoNumber('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Enter SO Number" size="sm">
      {selectedJobForAction && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
            <p className="font-medium" style={{ color: colors.textPrimary }}>{selectedJobForAction.title}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>{selectedJobForAction.pivotName}</p>
          </div>
          <Input label="NetSuite SO Number" placeholder="SO-12345" icon={Hash} value={soNumber} onChange={e => setSoNumber(e.target.value)} required />
          <p className="text-xs" style={{ color: colors.muted }}>Enter the Sales Order number from NetSuite to track this job.</p>
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1" icon={Check} loading={isLoading}>Save</Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>Cancel</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default SONumberModal;
