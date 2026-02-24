// ============================================
// SETTINGS MODAL
// ============================================
import React, { useState, useEffect } from 'react';
import { DollarSign, Navigation, Check } from 'lucide-react';
import { Modal, Button, Input } from '../ui';

const SettingsModal = ({
  isOpen,
  onClose,
  colors,
  pricingSettings,
  handleUpdateSettings,
  isLoading
}) => {
  const [formData, setFormData] = useState({ 
    hourlyRate: pricingSettings.hourlyRate, 
    mileageRate: pricingSettings.mileageRate, 
    partsMarkup: pricingSettings.partsMarkup 
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ 
        hourlyRate: pricingSettings.hourlyRate, 
        mileageRate: pricingSettings.mileageRate, 
        partsMarkup: pricingSettings.partsMarkup 
      });
    }
  }, [pricingSettings, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate negative values
    const hourlyRate = parseFloat(formData.hourlyRate) || 75;
    const mileageRate = parseFloat(formData.mileageRate) || 0.65;
    const partsMarkup = parseFloat(formData.partsMarkup) || 0;

    if (hourlyRate < 0 || mileageRate < 0 || partsMarkup < 0) {
      return; // Validation handled by HTML5 min attribute
    }

    handleUpdateSettings({
      hourlyRate,
      mileageRate,
      partsMarkup
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pricing Settings">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
          <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>Configure your service pricing rates</p>
        </div>
        <Input label="Hourly Rate ($)" type="number" step="0.01" min="0" value={formData.hourlyRate} onChange={e => setFormData(prev => ({...prev, hourlyRate: e.target.value}))} icon={DollarSign} />
        <Input label="Mileage Rate ($/mile)" type="number" step="0.01" min="0" value={formData.mileageRate} onChange={e => setFormData(prev => ({...prev, mileageRate: e.target.value}))} icon={Navigation} />
        <Input label="Parts Markup (%)" type="number" step="1" min="0" value={formData.partsMarkup} onChange={e => setFormData(prev => ({...prev, partsMarkup: e.target.value}))} placeholder="0" />
        <div className="p-3 rounded-lg" style={{ backgroundColor: colors.success + '10' }}>
          <p className="text-sm" style={{ color: colors.textSecondary }}>Example Job Cost:</p>
          <p className="text-sm">4 hours × ${formData.hourlyRate}/hr = ${(4 * formData.hourlyRate).toFixed(2)}</p>
          <p className="text-sm">30 miles × ${formData.mileageRate}/mi = ${(30 * formData.mileageRate).toFixed(2)}</p>
          <p className="text-sm font-bold mt-1" style={{ color: colors.success }}>Total: ${((4 * formData.hourlyRate) + (30 * formData.mileageRate)).toFixed(2)}</p>
        </div>
        <div className="flex space-x-3 pt-4">
          <Button type="submit" className="flex-1" icon={Check} loading={isLoading}>Save Settings</Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
};

export default SettingsModal;
