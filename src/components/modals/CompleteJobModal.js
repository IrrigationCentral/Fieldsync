// ============================================
// COMPLETE JOB MODAL
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Navigation, Camera, X, Wrench, Search,
  Trash2, CheckCircle
} from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { uploadJobPhoto, compressImage } from '../../firebase';

const CompleteJobModal = ({
  isOpen,
  onClose,
  colors,
  selectedJobForAction,
  parts,
  pricingSettings,
  handleCompleteJob,
  isLoading,
  canSeePricing,
  formatCurrency
}) => {
  const [formData, setFormData] = useState({ 
    workDescription: '', 
    partsCost: '', 
    hoursWorked: '', 
    milesDriven: '',
    vehicleNumber: '',
    odometerBegin: '',
    odometerEnd: ''
  });
  const [selectedParts, setSelectedParts] = useState([]);
  const [partSearch, setPartSearch] = useState('');
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const partSearchRef = useRef(null);
  const partDropdownRef = useRef(null);

  const job = selectedJobForAction;
  const timeEntries = job?.timeEntries || [];
  const calculatedHours = timeEntries.reduce((total, entry) => {
    if (entry.startTime && entry.endTime) {
      const start = new Date(entry.startTime);
      const end = new Date(entry.endTime);
      const hours = (end - start) / (1000 * 60 * 60);
      const lunchDeduction = entry.lunchTaken ? 0.5 : 0;
      return total + Math.max(0, hours - lunchDeduction);
    }
    return total;
  }, 0);

  const filteredParts = parts.filter(p => 
    partSearch.length > 0 && (
      p.partNumber?.toLowerCase().includes(partSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(partSearch.toLowerCase())
    )
  ).slice(0, 10);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (partDropdownRef.current && !partDropdownRef.current.contains(e.target) &&
          partSearchRef.current && !partSearchRef.current.contains(e.target)) {
        setShowPartDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (calculatedHours > 0 && !formData.hoursWorked) {
      setFormData(prev => ({ ...prev, hoursWorked: calculatedHours.toFixed(2) }));
    }
  }, [calculatedHours, formData.hoursWorked]);

  const addPart = (part) => {
    const existingIndex = selectedParts.findIndex(p => p.partId === part.id);
    if (existingIndex >= 0) {
      const updated = [...selectedParts];
      updated[existingIndex].quantity += 1;
      setSelectedParts(updated);
    } else {
      setSelectedParts([...selectedParts, {
        partId: part.id,
        partNumber: part.partNumber,
        description: part.description,
        quantity: 1
      }]);
    }
    setPartSearch('');
    setShowPartDropdown(false);
  };

  const updatePartQuantity = (index, quantity) => {
    const updated = [...selectedParts];
    updated[index].quantity = Math.max(1, parseInt(quantity) || 1);
    setSelectedParts(updated);
  };

  const removePart = (index) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const handlePhotoSelect = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingPhotos(true);
    const newPhotos = [];
    
    for (const file of files.slice(0, 3)) {
      try {
        const compressed = await compressImage(file);
        const reader = new FileReader();
        const preview = await new Promise(resolve => {
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(compressed);
        });
        newPhotos.push({ file: compressed, preview, name: file.name });
      } catch (err) {
        console.error('Photo compression error:', err);
      }
    }
    
    if (type === 'before') {
      setBeforePhotos(prev => [...prev, ...newPhotos].slice(0, 3));
    } else {
      setAfterPhotos(prev => [...prev, ...newPhotos].slice(0, 3));
    }
    setUploadingPhotos(false);
  };

  const removePhoto = (type, index) => {
    if (type === 'before') {
      setBeforePhotos(prev => prev.filter((_, i) => i !== index));
    } else {
      setAfterPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateCost = () => {
    const hours = parseFloat(formData.hoursWorked) || 0;
    const miles = parseFloat(formData.milesDriven) || 0;
    const partsCost = parseFloat(formData.partsCost) || 0;
    return (hours * pricingSettings.hourlyRate) + (miles * pricingSettings.mileageRate) + (partsCost * (1 + pricingSettings.partsMarkup / 100));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedJobForAction) {
      setUploadingPhotos(true);
      
      let beforePhotoUrls = [];
      for (const photo of beforePhotos) {
        const result = await uploadJobPhoto(photo.file, selectedJobForAction.id, 'before');
        if (result.success) beforePhotoUrls.push(result.url);
      }
      
      let afterPhotoUrls = [];
      for (const photo of afterPhotos) {
        const result = await uploadJobPhoto(photo.file, selectedJobForAction.id, 'after');
        if (result.success) afterPhotoUrls.push(result.url);
      }
      
      setUploadingPhotos(false);

      const partsUsedFormatted = selectedParts.map(p => ({
        partNumber: p.partNumber,
        description: p.description,
        quantity: p.quantity
      }));
      
      handleCompleteJob(selectedJobForAction.id, {
        workDescription: formData.workDescription,
        partsUsed: partsUsedFormatted,
        partsCost: parseFloat(formData.partsCost) || 0,
        hoursWorked: parseFloat(formData.hoursWorked) || 0,
        milesDriven: parseFloat(formData.milesDriven) || 0,
        vehicleNumber: formData.vehicleNumber,
        odometerBegin: parseFloat(formData.odometerBegin) || 0,
        odometerEnd: parseFloat(formData.odometerEnd) || 0,
        beforePhotos: beforePhotoUrls,
        afterPhotos: afterPhotoUrls
      });
      
      // Reset form
      setFormData({ workDescription: '', partsCost: '', hoursWorked: '', milesDriven: '', vehicleNumber: '', odometerBegin: '', odometerEnd: '' });
      setSelectedParts([]);
      setBeforePhotos([]);
      setAfterPhotos([]);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({ workDescription: '', partsCost: '', hoursWorked: '', milesDriven: '', vehicleNumber: '', odometerBegin: '', odometerEnd: '' });
    setSelectedParts([]);
    setBeforePhotos([]);
    setAfterPhotos([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Complete Job" size="lg">
      {selectedJobForAction && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold mb-1">{selectedJobForAction.title}</p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>{selectedJobForAction.pivotName || 'Unknown location'}</p>
              </div>
              {selectedJobForAction.soNumber && (
                <span className="px-2 py-1 rounded text-sm" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>SO# {selectedJobForAction.soNumber}</span>
              )}
            </div>
            {selectedJobForAction.leavePivotRunning && (
              <div className="mt-3 p-2 rounded" style={{ backgroundColor: colors.warning + '15' }}>
                <p className="text-sm" style={{ color: colors.warning }}>⚠️ Pivot was left running: {selectedJobForAction.pivotDirection} at {selectedJobForAction.pivotPercentage}%</p>
              </div>
            )}
            {timeEntries.length > 0 && (
              <div className="mt-3 p-2 rounded" style={{ backgroundColor: colors.water + '15' }}>
                <p className="text-sm font-medium" style={{ color: colors.water }}>
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time Tracked: {calculatedHours.toFixed(2)} hours ({timeEntries.length} entries)
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>Work Performed</label>
            <textarea value={formData.workDescription} onChange={(e) => setFormData({...formData, workDescription: e.target.value})} placeholder="Describe the work you performed..." className="input min-h-[100px] resize-none" required />
          </div>

          {/* Vehicle Information */}
          <div className="p-3 rounded-lg border" style={{ borderColor: colors.border }}>
            <p className="text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
              <Navigation className="w-4 h-4 inline mr-1" /> Vehicle Information
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Vehicle #" placeholder="Truck 1" value={formData.vehicleNumber} onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})} />
              <Input label="Odometer Begin" type="number" placeholder="45230" value={formData.odometerBegin} onChange={(e) => setFormData({...formData, odometerBegin: e.target.value})} />
              <Input label="Odometer End" type="number" placeholder="45400" value={formData.odometerEnd} onChange={(e) => setFormData({...formData, odometerEnd: e.target.value})} />
            </div>
          </div>


          {/* Before/After Photos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                <Camera className="w-4 h-4 inline mr-1" /> Before Photos
              </label>
              <div className="flex flex-wrap gap-2">
                {beforePhotos.map((photo, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
                    <img src={photo.preview} alt={`Before ${index + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto('before', index)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.danger }}>
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {beforePhotos.length < 3 && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer" style={{ borderColor: colors.border }}>
                    <Camera className="w-5 h-5" style={{ color: colors.muted }} />
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoSelect(e, 'before')} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                <Camera className="w-4 h-4 inline mr-1" /> After Photos
              </label>
              <div className="flex flex-wrap gap-2">
                {afterPhotos.map((photo, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
                    <img src={photo.preview} alt={`After ${index + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto('after', index)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.danger }}>
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {afterPhotos.length < 3 && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer" style={{ borderColor: colors.border }}>
                    <Camera className="w-5 h-5" style={{ color: colors.muted }} />
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoSelect(e, 'after')} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Parts Used Section */}
          <div className="p-3 rounded-lg border" style={{ borderColor: colors.border }}>
            <p className="text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
              <Wrench className="w-4 h-4 inline mr-1" /> Parts Used
            </p>
            
            <div className="relative mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textSecondary }} />
                <input
                  ref={partSearchRef}
                  type="text"
                  placeholder="Search parts by number or description..."
                  value={partSearch}
                  onChange={(e) => { setPartSearch(e.target.value); setShowPartDropdown(true); }}
                  onFocus={() => setShowPartDropdown(true)}
                  className="input pl-9 w-full"
                  style={{ fontSize: '16px' }}
                />
              </div>
              
              {showPartDropdown && filteredParts.length > 0 && (
                <div 
                  ref={partDropdownRef}
                  className="absolute z-50 w-full mt-1 rounded-lg shadow-xl border overflow-hidden"
                  style={{ backgroundColor: colors.cardBg, borderColor: colors.border, maxHeight: '200px', overflowY: 'auto' }}
                >
                  {filteredParts.map(part => (
                    <div
                      key={part.id}
                      className="px-3 py-2 cursor-pointer text-sm hover:bg-opacity-50"
                      style={{ backgroundColor: colors.cardBg }}
                      onClick={() => addPart(part)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.cardBg}
                    >
                      <span className="font-mono font-medium" style={{ color: colors.primary }}>{part.partNumber}</span>
                      <span className="ml-2" style={{ color: colors.textPrimary }}>{part.description}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {showPartDropdown && partSearch.length > 0 && filteredParts.length === 0 && (
                <div 
                  className="absolute z-50 w-full mt-1 rounded-lg shadow-xl border p-3 text-center text-sm"
                  style={{ backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textSecondary }}
                >
                  No parts found matching "{partSearch}"
                </div>
              )}
            </div>


            {/* Selected Parts List */}
            {selectedParts.length > 0 && (
              <div className="space-y-2">
                {selectedParts.map((part, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: colors.background }}>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-sm font-medium" style={{ color: colors.primary }}>{part.partNumber}</span>
                      <p className="text-sm truncate" style={{ color: colors.textSecondary }}>{part.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      <label className="text-xs" style={{ color: colors.textSecondary }}>Qty:</label>
                      <input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) => updatePartQuantity(index, e.target.value)}
                        className="w-16 px-2 py-1 text-center rounded border text-sm"
                        style={{ borderColor: colors.border, backgroundColor: colors.cardBg, color: colors.textPrimary }}
                      />
                      <button type="button" onClick={() => removePart(index)} className="p-1 rounded hover:bg-red-100">
                        <Trash2 className="w-4 h-4" style={{ color: colors.danger }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedParts.length === 0 && (
              <p className="text-sm text-center py-2" style={{ color: colors.textSecondary }}>
                Search and add parts above
              </p>
            )}
          </div>

          <Input label="Parts Cost ($)" type="number" step="0.01" placeholder="150.00" value={formData.partsCost} onChange={(e) => setFormData({...formData, partsCost: e.target.value})} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Hours Worked" type="number" step="0.5" placeholder="4.5" value={formData.hoursWorked} onChange={(e) => setFormData({...formData, hoursWorked: e.target.value})} required />
            <Input label="Miles Driven" type="number" placeholder="45" value={formData.milesDriven} onChange={(e) => setFormData({...formData, milesDriven: e.target.value})} required />
          </div>

          {canSeePricing && formData.hoursWorked && formData.milesDriven && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.success}10` }}>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Estimated Total:</p>
              <p className="text-xl font-bold" style={{ color: colors.success }}>{formatCurrency(calculateCost())}</p>
              <p className="text-xs mt-1" style={{ color: colors.muted }}>
                {formData.hoursWorked}hrs × ${pricingSettings.hourlyRate}/hr + {formData.milesDriven}mi × ${pricingSettings.mileageRate}/mi
                {formData.partsCost && ` + $${formData.partsCost} parts`}
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1" icon={CheckCircle} loading={isLoading || uploadingPhotos}>Complete Job</Button>
            <Button type="button" variant="warning" className="flex-1" onClick={(e) => {
              e.preventDefault();
              if (selectedJobForAction) {
                handleCompleteJob(selectedJobForAction.id, {
                  workDescription: formData.workDescription,
                  partsUsed: selectedParts.map(p => ({ partNumber: p.partNumber, description: p.description, quantity: p.quantity })),
                  partsCost: parseFloat(formData.partsCost) || 0,
                  hoursWorked: parseFloat(formData.hoursWorked) || 0,
                  milesDriven: parseFloat(formData.milesDriven) || 0,
                  vehicleNumber: formData.vehicleNumber,
                  odometerBegin: parseFloat(formData.odometerBegin) || 0,
                  odometerEnd: parseFloat(formData.odometerEnd) || 0,
                  needsFollowUp: true
                });
                setFormData({ workDescription: '', partsCost: '', hoursWorked: '', milesDriven: '', vehicleNumber: '', odometerBegin: '', odometerEnd: '' });
                setSelectedParts([]);
                setBeforePhotos([]);
                setAfterPhotos([]);
              }
            }} loading={isLoading}>Needs Follow-up</Button>
            <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default CompleteJobModal;
