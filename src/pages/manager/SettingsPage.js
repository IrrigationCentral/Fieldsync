// FieldSync v2 - Settings Page
// Extracted from App.js SettingsView (~line 2575)
import React, { useState } from 'react';
import { DollarSign, Check, Truck, Plus, Trash2, MapPin } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../hooks/useSettings';
import { addTruckLocation, deleteTruckLocation } from '../../firebase';
import { Button } from '../../components/ui';

const SettingsPage = () => {
  const { colors } = useTheme();
  const { pricingSettings, truckLocations } = useData();
  const { updateSettings, isLoading } = useSettings();
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState('truck');
  const [locationLoading, setLocationLoading] = useState(false);
  const [formData, setFormData] = useState({
    hourlyRate: Number(pricingSettings?.hourlyRate) || 0,
    mileageRate: Number(pricingSettings?.mileageRate) || 0,
    partsMarkup: Number(pricingSettings?.partsMarkup) || 0
  });

  const handleSave = async () => {
    await updateSettings(formData);
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;
    setLocationLoading(true);
    await addTruckLocation({ name: newLocationName.trim(), type: newLocationType });
    setNewLocationName('');
    setNewLocationType('truck');
    setLocationLoading(false);
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Remove this location?')) return;
    await deleteTruckLocation(id);
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
            <p className="text-2xl font-bold" style={{ color: colors.primary }}>${pricingSettings?.hourlyRate ?? 0}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>per hour</p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            <p className="text-2xl font-bold" style={{ color: colors.secondary }}>${pricingSettings?.mileageRate ?? 0}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>per mile</p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            <p className="text-2xl font-bold" style={{ color: colors.accent }}>{pricingSettings?.partsMarkup ?? 0}%</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>parts markup</p>
          </div>
        </div>
      </div>
      {/* Truck / Parts Locations */}
      <div className="card p-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <h3 className="font-semibold mb-4 flex items-center" style={{ color: colors.textPrimary }}>
          <Truck className="w-5 h-5 mr-2" />
          Truck / Parts Locations
        </h3>
        <p className="text-sm mb-4" style={{ color: colors.muted }}>
          Manage where parts come from. These show up when completing jobs so techs can track which truck or location each part was pulled from.
        </p>

        {/* Add new location */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Location name (e.g. Truck 5, Shop)"
            value={newLocationName}
            onChange={e => setNewLocationName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddLocation()}
            className="input flex-1"
            style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary, fontSize: '16px' }}
          />
          <select
            value={newLocationType}
            onChange={e => setNewLocationType(e.target.value)}
            className="px-3 py-2 rounded border"
            style={{ borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.textPrimary, fontSize: '16px' }}
          >
            <option value="truck">Truck</option>
            <option value="hq">HQ / Shop</option>
          </select>
          <Button icon={Plus} onClick={handleAddLocation} loading={locationLoading} disabled={!newLocationName.trim()}>
            Add
          </Button>
        </div>

        {/* Location list */}
        {truckLocations.length === 0 ? (
          <div className="text-center py-6" style={{ color: colors.muted }}>
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No locations added yet. Add your trucks and HQ location above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {truckLocations.map(loc => (
              <div key={loc.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                <div className="flex items-center gap-3">
                  {loc.type === 'hq' ? (
                    <MapPin className="w-5 h-5" style={{ color: colors.accent }} />
                  ) : (
                    <Truck className="w-5 h-5" style={{ color: colors.secondary }} />
                  )}
                  <span className="font-medium" style={{ color: colors.textPrimary }}>{loc.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    backgroundColor: loc.type === 'hq' ? colors.accent + '20' : colors.secondary + '20',
                    color: loc.type === 'hq' ? colors.accent : colors.secondary
                  }}>
                    {loc.type === 'hq' ? 'HQ' : 'Truck'}
                  </span>
                </div>
                <button onClick={() => handleDeleteLocation(loc.id)} className="p-2 rounded hover:opacity-70">
                  <Trash2 className="w-4 h-4" style={{ color: colors.danger }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
