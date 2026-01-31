import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button } from '../ui';
import { Trash2, Wrench, Package, Clock, Navigation, Edit2, Save, Search } from 'lucide-react';

export const EditJobModal = ({
  isOpen,
  onClose,
  selectedJobForAction,
  parts,
  colors,
  truckLocations = [],
  updateJob,
  addNotification,
  users,
  userProfile,
  pricingSettings
}) => {
  const [workPerformed, setWorkPerformed] = useState('');
  const [jobParts, setJobParts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Parts search state
  const [partSearch, setPartSearch] = useState('');
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const partSearchRef = useRef(null);
  const partDropdownRef = useRef(null);
  
  // Time tracking state
  const [timeEntries, setTimeEntries] = useState([]);
  const [editingTimeEntry, setEditingTimeEntry] = useState(null);
  
  // Mileage state
  const [mileage, setMileage] = useState({
    vehicleNumber: '',
    odometerBegin: '',
    odometerEnd: '',
    milesDriven: ''
  });

  // Filter parts based on search
  const filteredParts = parts.filter(p => 
    partSearch.length > 0 && (
      p.partNumber?.toLowerCase().includes(partSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(partSearch.toLowerCase()) ||
      p.name?.toLowerCase().includes(partSearch.toLowerCase())
    )
  ).slice(0, 15);

  useEffect(() => {
    if (selectedJobForAction) {
      setWorkPerformed(selectedJobForAction.workPerformed || '');
      setJobParts(selectedJobForAction.partsUsed || []);
      setTimeEntries(selectedJobForAction.timeEntries || []);
      setMileage({
        vehicleNumber: selectedJobForAction.vehicleNumber || '',
        odometerBegin: selectedJobForAction.odometerBegin || '',
        odometerEnd: selectedJobForAction.odometerEnd || '',
        milesDriven: selectedJobForAction.milesDriven || ''
      });
      setPartSearch('');
      setShowPartDropdown(false);
    }
  }, [selectedJobForAction]);

  // Click outside to close dropdown
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

  // Auto-calculate mileage when odometer values change
  useEffect(() => {
    const begin = parseFloat(mileage.odometerBegin) || 0;
    const end = parseFloat(mileage.odometerEnd) || 0;
    if (begin > 0 && end > 0 && end > begin) {
      setMileage(prev => ({ ...prev, milesDriven: (end - begin).toString() }));
    }
  }, [mileage.odometerBegin, mileage.odometerEnd]);

  const handleAddPart = (part) => {
    const existingIndex = jobParts.findIndex(p => p.partId === part.id);
    if (existingIndex >= 0) {
      const updated = [...jobParts];
      updated[existingIndex].quantity += 1;
      setJobParts(updated);
    } else {
      setJobParts([...jobParts, {
        partId: part.id,
        partNumber: part.partNumber,
        name: part.name || part.description,
        quantity: 1,
        cost: part.cost,
        truckLocationId: '',
        truckLocationName: ''
      }]);
    }
    setPartSearch('');
    setShowPartDropdown(false);
  };

  const handleRemovePart = (index) => {
    setJobParts(jobParts.filter((_, i) => i !== index));
  };

  const handleUpdatePartQuantity = (index, quantity) => {
    const updated = [...jobParts];
    updated[index].quantity = quantity === '' ? '' : Math.max(1, parseInt(quantity) || 1);
    setJobParts(updated);
  };

  const handleUpdatePartTruck = (index, truckId) => {
    const updated = [...jobParts];
    const truck = truckLocations.find(t => t.id === truckId);
    updated[index].truckLocationId = truckId;
    updated[index].truckLocationName = truck?.name || '';
    setJobParts(updated);
  };

  // Time entry editing
  const handleEditTimeEntry = (index) => {
    const entry = timeEntries[index];
    setEditingTimeEntry({
      index,
      startTime: entry.startTime ? new Date(entry.startTime).toISOString().slice(0, 16) : '',
      endTime: entry.endTime ? new Date(entry.endTime).toISOString().slice(0, 16) : '',
      lunchTaken: entry.lunchTaken || false
    });
  };

  const handleSaveTimeEntry = () => {
    if (editingTimeEntry === null) return;
    
    const updated = [...timeEntries];
    updated[editingTimeEntry.index] = {
      ...updated[editingTimeEntry.index],
      startTime: editingTimeEntry.startTime ? new Date(editingTimeEntry.startTime).toISOString() : null,
      endTime: editingTimeEntry.endTime ? new Date(editingTimeEntry.endTime).toISOString() : null,
      lunchTaken: editingTimeEntry.lunchTaken
    };
    setTimeEntries(updated);
    setEditingTimeEntry(null);
  };

  const handleDeleteTimeEntry = (index) => {
    if (window.confirm('Delete this time entry?')) {
      setTimeEntries(timeEntries.filter((_, i) => i !== index));
    }
  };

  const formatTimeEntry = (entry) => {
    if (!entry.startTime) return 'No start time';
    const start = new Date(entry.startTime);
    const end = entry.endTime ? new Date(entry.endTime) : null;
    
    const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (end) {
      const hours = ((end - start) / (1000 * 60 * 60)).toFixed(2);
      const lunchDeduct = entry.lunchTaken ? ' (-0.5 lunch)' : '';
      return `${formatDate(start)} ${formatTime(start)} - ${formatTime(end)} (${hours}h${lunchDeduct})`;
    }
    return `${formatDate(start)} ${formatTime(start)} - In Progress`;
  };

  const getTechName = (techId) => {
    const tech = users?.find(u => u.id === techId);
    return tech?.name || 'Unknown';
  };

  // Calculate total hours
  const totalHours = timeEntries.reduce((total, entry) => {
    if (entry.startTime && entry.endTime) {
      const hours = (new Date(entry.endTime) - new Date(entry.startTime)) / (1000 * 60 * 60);
      const lunch = entry.lunchTaken ? 0.5 : 0;
      return total + Math.max(0, hours - lunch);
    }
    return total;
  }, 0);

  const handleSave = async () => {
    if (!selectedJobForAction) return;
    setIsLoading(true);
    
    try {
      const partsToSave = jobParts.map(p => ({
        ...p,
        quantity: parseInt(p.quantity) || 1
      }));
      
      const result = await updateJob(selectedJobForAction.id, {
        workPerformed,
        partsUsed: partsToSave,
        timeEntries,
        vehicleNumber: mileage.vehicleNumber,
        odometerBegin: parseFloat(mileage.odometerBegin) || null,
        odometerEnd: parseFloat(mileage.odometerEnd) || null,
        milesDriven: parseFloat(mileage.milesDriven) || null,
        updatedAt: new Date().toISOString()
      });
      
      if (result.success) {
        addNotification('success', 'Job updated successfully');
        onClose();
      } else {
        addNotification('error', result.error || 'Failed to update job');
      }
    } catch (error) {
      addNotification('error', 'Failed to update job');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedJobForAction) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Job Details" size="xl">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Job Info Header */}
        <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
          <p className="font-semibold" style={{ color: colors.textPrimary }}>{selectedJobForAction.title}</p>
          <p className="text-sm" style={{ color: colors.textSecondary }}>{selectedJobForAction.pivotName}</p>
          {selectedJobForAction.soNumber && (
            <span className="text-xs font-mono px-2 py-0.5 rounded mt-1 inline-block" 
              style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>
              SO# {selectedJobForAction.soNumber}
            </span>
          )}
        </div>

        {/* Work Performed */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center" style={{ color: colors.textPrimary }}>
            <Wrench className="w-4 h-4 mr-2" />
            Work Performed
          </label>
          <textarea
            value={workPerformed}
            onChange={(e) => setWorkPerformed(e.target.value)}
            placeholder="Describe the work performed..."
            className="input min-h-[100px] resize-none w-full"
            style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>

        {/* Time Tracking Section */}
        <div className="p-3 rounded-lg border" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium flex items-center" style={{ color: colors.textPrimary }}>
              <Clock className="w-4 h-4 mr-2" />
              Time Entries
            </label>
            <span className="text-sm font-bold px-2 py-1 rounded" style={{ backgroundColor: colors.success + '15', color: colors.success }}>
              Total: {totalHours.toFixed(2)} hrs
            </span>
          </div>
          
          {timeEntries.length === 0 ? (
            <p className="text-sm text-center py-3" style={{ color: colors.textSecondary }}>No time entries</p>
          ) : (
            <div className="space-y-2">
              {timeEntries.map((entry, index) => (
                <div key={index} className="p-2 rounded-lg" style={{ backgroundColor: colors.background }}>
                  {editingTimeEntry?.index === index ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs" style={{ color: colors.textSecondary }}>Start</label>
                          <input
                            type="datetime-local"
                            value={editingTimeEntry.startTime}
                            onChange={(e) => setEditingTimeEntry({ ...editingTimeEntry, startTime: e.target.value })}
                            className="input w-full text-sm"
                            style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                          />
                        </div>
                        <div>
                          <label className="text-xs" style={{ color: colors.textSecondary }}>End</label>
                          <input
                            type="datetime-local"
                            value={editingTimeEntry.endTime}
                            onChange={(e) => setEditingTimeEntry({ ...editingTimeEntry, endTime: e.target.value })}
                            className="input w-full text-sm"
                            style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingTimeEntry.lunchTaken}
                            onChange={(e) => setEditingTimeEntry({ ...editingTimeEntry, lunchTaken: e.target.checked })}
                            className="rounded"
                          />
                          <span style={{ color: colors.textSecondary }}>Lunch taken (-30min)</span>
                        </label>
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleSaveTimeEntry} icon={Save}>Save</Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingTimeEntry(null)}>Cancel</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {formatTimeEntry(entry)}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {getTechName(entry.techId)}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditTimeEntry(index)}
                          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <Edit2 className="w-4 h-4" style={{ color: colors.primary }} />
                        </button>
                        <button
                          onClick={() => handleDeleteTimeEntry(index)}
                          className="p-1.5 rounded hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mileage Section */}
        <div className="p-3 rounded-lg border" style={{ borderColor: colors.border }}>
          <label className="block text-sm font-medium mb-3 flex items-center" style={{ color: colors.textPrimary }}>
            <Navigation className="w-4 h-4 mr-2" />
            Mileage & Vehicle
          </label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs" style={{ color: colors.textSecondary }}>Vehicle #</label>
              <input
                type="text"
                value={mileage.vehicleNumber}
                onChange={(e) => setMileage({ ...mileage, vehicleNumber: e.target.value })}
                placeholder="Truck 1"
                className="input w-full text-sm"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
              />
            </div>
            <div>
              <label className="text-xs flex items-center justify-between" style={{ color: colors.textSecondary }}>
                Miles Driven
                <span className="text-xs" style={{ color: colors.success }}>(auto)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={mileage.milesDriven}
                onChange={(e) => setMileage({ ...mileage, milesDriven: e.target.value })}
                placeholder="50"
                className="input w-full text-sm"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs" style={{ color: colors.textSecondary }}>Odometer Start</label>
              <input
                type="text"
                inputMode="numeric"
                value={mileage.odometerBegin}
                onChange={(e) => setMileage({ ...mileage, odometerBegin: e.target.value })}
                placeholder="145230"
                className="input w-full text-sm"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary, fontSize: '16px' }}
              />
            </div>
            <div>
              <label className="text-xs" style={{ color: colors.textSecondary }}>Odometer End</label>
              <input
                type="text"
                inputMode="numeric"
                value={mileage.odometerEnd}
                onChange={(e) => setMileage({ ...mileage, odometerEnd: e.target.value })}
                placeholder="145280"
                className="input w-full text-sm"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary, fontSize: '16px' }}
              />
            </div>
          </div>
          {pricingSettings?.mileageRate > 0 && mileage.milesDriven && (
            <p className="text-xs mt-2" style={{ color: colors.success }}>
              Mileage cost: ${(parseFloat(mileage.milesDriven) * pricingSettings.mileageRate).toFixed(2)} 
              @ ${pricingSettings.mileageRate}/mi
            </p>
          )}
        </div>

        {/* Parts Used - Searchable */}
        <div className="p-3 rounded-lg border" style={{ borderColor: colors.border }}>
          <label className="block text-sm font-medium mb-3 flex items-center" style={{ color: colors.textPrimary }}>
            <Package className="w-4 h-4 mr-2" />
            Parts Used
          </label>
          
          {/* Search Parts */}
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
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary, fontSize: '16px' }}
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
                    onClick={() => handleAddPart(part)}
                    className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-b-0"
                    style={{ borderColor: colors.border }}
                  >
                    <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>
                      {part.partNumber}
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {part.description || part.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {showPartDropdown && partSearch.length > 0 && filteredParts.length === 0 && (
              <div 
                className="absolute z-50 w-full mt-1 rounded-lg shadow-xl border p-3 text-center"
                style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
              >
                <p className="text-sm" style={{ color: colors.textSecondary }}>No parts found for "{partSearch}"</p>
              </div>
            )}
          </div>

          {/* Parts List */}
          {jobParts.length === 0 ? (
            <p className="text-sm text-center py-3" style={{ color: colors.textSecondary }}>No parts added yet</p>
          ) : (
            <div className="space-y-2">
              {jobParts.map((part, index) => (
                <div key={index} className="p-2 rounded-lg" style={{ backgroundColor: colors.background }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>{part.name || part.description}</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>{part.partNumber}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) => handleUpdatePartQuantity(index, e.target.value)}
                        className="input w-16 text-center text-sm"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                      />
                      <button
                        onClick={() => handleRemovePart(index)}
                        className="p-1.5 rounded hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  {/* Truck Location Dropdown */}
                  <select
                    value={part.truckLocationId || ''}
                    onChange={(e) => handleUpdatePartTruck(index, e.target.value)}
                    className="input w-full text-sm"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                  >
                    <option value="">Select truck/location...</option>
                    {truckLocations.map(truck => (
                      <option key={truck.id} value={truck.id}>{truck.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-800" style={{ borderColor: colors.border }}>
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} loading={isLoading}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditJobModal;
