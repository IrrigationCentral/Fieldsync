// ============================================
// EDIT EQUIPMENT MODAL
// ============================================
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Modal, Button, Input, Select } from '../ui';

const EditEquipmentModal = ({
  isOpen,
  onClose,
  equipment,
  onUpdate,
  isLoading,
  colors
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'center',
    brand: '',
    model: '',
    serialNumber: '',
    powerType: '',
    panelType: '',
    dateInstalled: '',
    acres: '',
    length: '',
    spans: '',
    gpm: '',
    nozzles: '',
    pressure: '',
    endGun: '',
    tireSize: '',
    nozzlePackage: '',
    gearboxRatio: '',
    driveType: '',
    address: '',
    lat: '',
    lng: '',
    notes: ''
  });

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || '',
        type: equipment.type || 'center',
        brand: equipment.brand || '',
        model: equipment.model || '',
        serialNumber: equipment.serialNumber || '',
        powerType: equipment.powerType || '',
        panelType: equipment.panelType || '',
        dateInstalled: equipment.dateInstalled || '',
        acres: equipment.acres || '',
        length: equipment.length || '',
        spans: equipment.spans || '',
        gpm: equipment.gpm || equipment.flow || '',
        nozzles: equipment.nozzles || '',
        pressure: equipment.pressure || '',
        endGun: equipment.endGun || '',
        tireSize: equipment.tireSize || '',
        nozzlePackage: equipment.nozzlePackage || '',
        gearboxRatio: equipment.gearboxRatio || '',
        driveType: equipment.driveType || '',
        address: equipment.address || '',
        lat: equipment.lat || '',
        lng: equipment.lng || '',
        notes: equipment.notes || ''
      });
    }
  }, [equipment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!equipment) return;
    
    onUpdate(equipment.id, {
      ...formData,
      acres: parseFloat(formData.acres) || 0,
      length: parseFloat(formData.length) || null,
      spans: parseInt(formData.spans) || null,
      gpm: parseFloat(formData.gpm) || null,
      nozzles: parseInt(formData.nozzles) || null,
      pressure: parseFloat(formData.pressure) || null,
      lat: parseFloat(formData.lat) || null,
      lng: parseFloat(formData.lng) || null
    });
  };

  const equipmentTypeOptions = [
    { value: 'center', label: 'Center Pivot' },
    { value: 'linear', label: 'Linear Pivot' },
    { value: 'corner', label: 'Corner System' },
    { value: 'power_unit', label: 'Power Unit' },
    { value: 'generator', label: 'Generator' },
    { value: 'pump', label: 'Pump' },
    { value: 'well', label: 'Well' },
    { value: 'motor', label: 'Motor' },
    { value: 'panel', label: 'Control Panel' },
    { value: 'other', label: 'Other' }
  ];

  const brandOptions = [
    { value: '', label: 'Select Brand' },
    { value: 'Valley', label: 'Valley' },
    { value: 'Zimmatic', label: 'Zimmatic' },
    { value: 'Reinke', label: 'Reinke' },
    { value: 'T-L', label: 'T-L' },
    { value: 'Pierce', label: 'Pierce' },
    { value: 'Other', label: 'Other' }
  ];

  const powerTypeOptions = [
    { value: '', label: 'Select Power' },
    { value: 'Shore Power', label: 'Shore Power' },
    { value: 'Generator', label: 'Generator' },
    { value: 'Diesel', label: 'Diesel' },
    { value: 'Solar', label: 'Solar' }
  ];

  const panelTypeOptions = [
    { value: '', label: 'Select Panel' },
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'Electronic', label: 'Electronic' },
    { value: 'GPS', label: 'GPS Guided' },
    { value: 'VRI', label: 'VRI' }
  ];

  const driveTypeOptions = [
    { value: '', label: 'Select Drive' },
    { value: 'Electric', label: 'Electric' },
    { value: 'Hydraulic', label: 'Hydraulic' },
    { value: 'Oil', label: 'Oil' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Equipment Details" size="2xl">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Basic Info */}
        <div>
          <h4 className="font-medium mb-3 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.border }}>
            Basic Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Equipment Name" 
              value={formData.name} 
              onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} 
              required 
            />
            <Select 
              label="Equipment Type" 
              value={formData.type} 
              onChange={e => setFormData(prev => ({...prev, type: e.target.value}))} 
              options={equipmentTypeOptions} 
            />
          </div>
        </div>

        {/* Equipment Details */}
        <div>
          <h4 className="font-medium mb-3 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.border }}>
            Equipment Details
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Select 
              label="Brand" 
              value={formData.brand} 
              onChange={e => setFormData(prev => ({...prev, brand: e.target.value}))} 
              options={brandOptions} 
            />
            <Input 
              label="Model" 
              placeholder="e.g. 8000 Series" 
              value={formData.model} 
              onChange={e => setFormData(prev => ({...prev, model: e.target.value}))} 
            />
            <Input 
              label="Serial Number" 
              placeholder="S/N" 
              value={formData.serialNumber} 
              onChange={e => setFormData(prev => ({...prev, serialNumber: e.target.value}))} 
            />
            <Select 
              label="Power Type" 
              value={formData.powerType} 
              onChange={e => setFormData(prev => ({...prev, powerType: e.target.value}))} 
              options={powerTypeOptions} 
            />
            <Select 
              label="Panel Type" 
              value={formData.panelType} 
              onChange={e => setFormData(prev => ({...prev, panelType: e.target.value}))} 
              options={panelTypeOptions} 
            />
            <Input 
              label="Date Installed" 
              type="date" 
              value={formData.dateInstalled} 
              onChange={e => setFormData(prev => ({...prev, dateInstalled: e.target.value}))} 
            />
          </div>
        </div>

        {/* Specifications */}
        <div>
          <h4 className="font-medium mb-3 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.border }}>
            Specifications
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input 
              label="Acres" 
              type="number" 
              placeholder="125" 
              value={formData.acres} 
              onChange={e => setFormData(prev => ({...prev, acres: e.target.value}))} 
            />
            <Input 
              label="Length (ft)" 
              type="number" 
              placeholder="1320" 
              value={formData.length} 
              onChange={e => setFormData(prev => ({...prev, length: e.target.value}))} 
            />
            <Input 
              label="Number of Spans" 
              type="number" 
              placeholder="7" 
              value={formData.spans} 
              onChange={e => setFormData(prev => ({...prev, spans: e.target.value}))} 
            />
            <Input 
              label="GPM" 
              type="number" 
              placeholder="800" 
              value={formData.gpm} 
              onChange={e => setFormData(prev => ({...prev, gpm: e.target.value}))} 
            />
            <Input 
              label="Nozzles" 
              type="number" 
              placeholder="250" 
              value={formData.nozzles} 
              onChange={e => setFormData(prev => ({...prev, nozzles: e.target.value}))} 
            />
            <Input 
              label="Pressure (PSI)" 
              type="number" 
              placeholder="35" 
              value={formData.pressure} 
              onChange={e => setFormData(prev => ({...prev, pressure: e.target.value}))} 
            />
            <Input 
              label="End Gun" 
              placeholder="e.g. Nelson" 
              value={formData.endGun} 
              onChange={e => setFormData(prev => ({...prev, endGun: e.target.value}))} 
            />
            <Input 
              label="Tire Size" 
              placeholder="e.g. 14.9x24" 
              value={formData.tireSize} 
              onChange={e => setFormData(prev => ({...prev, tireSize: e.target.value}))} 
            />
            <Input 
              label="Nozzle Package" 
              placeholder="e.g. Nelson 3000" 
              value={formData.nozzlePackage} 
              onChange={e => setFormData(prev => ({...prev, nozzlePackage: e.target.value}))} 
            />
            <Input 
              label="Gearbox Ratio" 
              placeholder="e.g. 50:1" 
              value={formData.gearboxRatio} 
              onChange={e => setFormData(prev => ({...prev, gearboxRatio: e.target.value}))} 
            />
            <Select 
              label="Drive Type" 
              value={formData.driveType} 
              onChange={e => setFormData(prev => ({...prev, driveType: e.target.value}))} 
              options={driveTypeOptions} 
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <h4 className="font-medium mb-3 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.border }}>
            Location
          </h4>
          <div className="space-y-4">
            <Input 
              label="Address" 
              placeholder="123 Farm Road" 
              value={formData.address} 
              onChange={e => setFormData(prev => ({...prev, address: e.target.value}))} 
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Latitude" 
                type="number" 
                step="any" 
                value={formData.lat} 
                onChange={e => setFormData(prev => ({...prev, lat: e.target.value}))} 
              />
              <Input 
                label="Longitude" 
                type="number" 
                step="any" 
                value={formData.lng} 
                onChange={e => setFormData(prev => ({...prev, lng: e.target.value}))} 
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h4 className="font-medium mb-3 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.border }}>
            Notes
          </h4>
          <textarea 
            className="input"
            rows={3}
            placeholder="Any additional notes about this equipment..."
            value={formData.notes}
            onChange={e => setFormData(prev => ({...prev, notes: e.target.value}))}
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t" style={{ borderColor: colors.border }}>
          <Button type="submit" className="flex-1" icon={Check} loading={isLoading}>
            Save Changes
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditEquipmentModal;
