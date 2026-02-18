// FieldSync v2 - Settings Page
// Extracted from App.js SettingsView (~line 2575)
import React, { useState } from 'react';
import { DollarSign, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../hooks/useSettings';
import { Button } from '../../components/ui';

const SettingsPage = () => {
  const { colors } = useTheme();
  const { pricingSettings } = useData();
  const { updateSettings, isLoading } = useSettings();
  const [formData, setFormData] = useState({
    hourlyRate: pricingSettings.hourlyRate,
    mileageRate: pricingSettings.mileageRate,
    partsMarkup: pricingSettings.partsMarkup
  });

  const handleSave = async () => {
    await updateSettings(formData);
  };

  const exampleHours = 2;
  const exampleMiles = 25;
  const exampleParts = 50;
  const exampleTotal = (exampleHours * formData.hourlyRate) +
                       (exampleMiles * formData.mileageRate) +
                       (exampleParts * (1 + formData.partsMarkup / 100));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Settings</h2>

      <div className="card p-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <h3 className="font-semibold mb-4 flex items-center" style={{ color: colors.textPrimary }}>
          <DollarSign className="w-5 h-5 mr-2" />
          Pricing Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Hourly Rate</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input type="number" className="input pl-8" value={formData.hourlyRate}
                onChange={e => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })} step="0.01"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }} />
            </div>
            <p className="text-xs mt-1" style={{ color: colors.muted }}>Per hour of labor</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Mileage Rate</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input type="number" className="input pl-8" value={formData.mileageRate}
                onChange={e => setFormData({ ...formData, mileageRate: parseFloat(e.target.value) || 0 })} step="0.01"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }} />
            </div>
            <p className="text-xs mt-1" style={{ color: colors.muted }}>Per mile driven</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Parts Markup</label>
            <div className="relative">
              <input type="number" className="input pr-8" value={formData.partsMarkup}
                onChange={e => setFormData({ ...formData, partsMarkup: parseFloat(e.target.value) || 0 })} step="1"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
            <p className="text-xs mt-1" style={{ color: colors.muted }}>Added to parts cost</p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
          <p className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Example Calculation:</p>
          <p className="text-sm" style={{ color: colors.muted }}>{exampleHours} hours x ${formData.hourlyRate}/hr = ${(exampleHours * formData.hourlyRate).toFixed(2)}</p>
          <p className="text-sm" style={{ color: colors.muted }}>{exampleMiles} miles x ${formData.mileageRate}/mi = ${(exampleMiles * formData.mileageRate).toFixed(2)}</p>
          <p className="text-sm" style={{ color: colors.muted }}>${exampleParts} parts + {formData.partsMarkup}% markup = ${(exampleParts * (1 + formData.partsMarkup / 100)).toFixed(2)}</p>
          <p className="text-sm font-bold mt-2" style={{ color: colors.primary }}>Total: ${exampleTotal.toFixed(2)}</p>
        </div>

        <div className="mt-6">
          <Button icon={Check} onClick={handleSave} loading={isLoading}>Save Pricing Settings</Button>
        </div>
      </div>

      <div className="card p-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Current Active Rates</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            <p className="text-2xl font-bold" style={{ color: colors.primary }}>${pricingSettings.hourlyRate}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>per hour</p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            <p className="text-2xl font-bold" style={{ color: colors.secondary }}>${pricingSettings.mileageRate}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>per mile</p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            <p className="text-2xl font-bold" style={{ color: colors.accent }}>{pricingSettings.partsMarkup}%</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>parts markup</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
