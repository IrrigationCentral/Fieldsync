// ============================================
// COMPLETE JOB MODAL - WIZARD STYLE (FIXED)
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation, Camera, X, Wrench, Search, Download, Image,
  Trash2, CheckCircle, ChevronRight, ChevronLeft, AlertCircle, Plus, Users
} from 'lucide-react';
import { Modal, Button } from '../ui';
import { uploadJobPhoto, compressImage } from '../../firebase';

// ============================================
// STEP COMPONENTS - DEFINED OUTSIDE TO PREVENT RE-RENDERS
// ============================================

const StepIndicator = ({ currentStep, colors }) => (
  <div className="flex items-center justify-center mb-4">
    {[1,2,3,4,5,6].map((step, idx) => (
      <React.Fragment key={step}>
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
          style={{ 
            backgroundColor: currentStep >= step ? colors.primary : colors.border, 
            color: currentStep >= step ? 'white' : colors.textSecondary 
          }}
        >
          {step}
        </div>
        {idx < 5 && (
          <div 
            className="w-6 h-1 mx-1" 
            style={{ backgroundColor: currentStep > step ? colors.primary : colors.border }} 
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

const NavButtons = ({ 
  currentStep, 
  totalSteps, 
  canContinue = true, 
  showBack = true, 
  nextLabel = 'Next', 
  onNext, 
  onBack,
  isLoading,
  colors 
}) => (
  <div className="flex space-x-3 mt-6">
    {showBack && currentStep > 1 && (
      <Button variant="secondary" className="flex-1" onClick={onBack} icon={ChevronLeft}>
        Back
      </Button>
    )}
    <Button 
      className="flex-1" 
      onClick={onNext} 
      disabled={!canContinue} 
      icon={currentStep === totalSteps ? CheckCircle : ChevronRight} 
      loading={isLoading}
    >
      {nextLabel}
    </Button>
  </div>
);

// Step 1: Problem Description
const Step1Problem = ({ 
  problemDescription, 
  setProblemDescription, 
  colors, 
  onNext, 
  isLoading 
}) => (
  <div className="space-y-4">
    <div className="text-center mb-4">
      <AlertCircle className="w-10 h-10 mx-auto mb-2" style={{ color: colors.warning }} />
      <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>What was the problem?</h3>
      <p className="text-sm" style={{ color: colors.textSecondary }}>Describe what was wrong</p>
    </div>
    <textarea 
      value={problemDescription} 
      onChange={(e) => setProblemDescription(e.target.value)} 
      placeholder="Example: Pivot wasn't moving..." 
      className="input min-h-[150px] resize-none w-full" 
      style={{ fontSize: '16px' }} 
    />
    <NavButtons 
      currentStep={1} 
      totalSteps={6} 
      canContinue={problemDescription.trim().length > 0} 
      showBack={false} 
      onNext={onNext}
      isLoading={isLoading}
      colors={colors}
    />
  </div>
);

// Step 2: Work Description
const Step2Work = ({ 
  workDescription, 
  setWorkDescription, 
  colors, 
  onNext, 
  onBack,
  isLoading 
}) => (
  <div className="space-y-4">
    <div className="text-center mb-4">
      <Wrench className="w-10 h-10 mx-auto mb-2" style={{ color: colors.primary }} />
      <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>What did you do to fix it?</h3>
    </div>
    <textarea 
      value={workDescription} 
      onChange={(e) => setWorkDescription(e.target.value)} 
      placeholder="Example: Replaced gearbox motor..." 
      className="input min-h-[150px] resize-none w-full" 
      style={{ fontSize: '16px' }} 
    />
    <NavButtons 
      currentStep={2} 
      totalSteps={6} 
      canContinue={workDescription.trim().length > 0} 
      onNext={onNext}
      onBack={onBack}
      isLoading={isLoading}
      colors={colors}
    />
  </div>
);

// Step 3: Time Entries with actual start/end times
const Step3Time = ({ 
  timeEntries, 
  setTimeEntries,
  techs,
  colors, 
  onNext, 
  onBack,
  isLoading 
}) => {
  const [showAddTime, setShowAddTime] = useState(false);
  const [newTimeEntry, setNewTimeEntry] = useState({ 
    techId: '', 
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00', 
    endTime: '17:00',
    lunchTaken: false 
  });

  const calculateHours = (start, end, lunch) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    // Handle midnight crossover (e.g., 9PM to 1AM)
    if (endMins < startMins) {
      endMins += 24 * 60;
    }
    const diff = (endMins - startMins) / 60;
    return Math.max(0, diff - (lunch ? 0.5 : 0));
  };

  const addTimeEntry = () => {
    if (!newTimeEntry.techId || !newTimeEntry.startTime || !newTimeEntry.endTime) return;
    const tech = techs.find(t => t.id === newTimeEntry.techId);
    const hours = calculateHours(newTimeEntry.startTime, newTimeEntry.endTime, newTimeEntry.lunchTaken);
    
    // Build ISO date strings
    const dateStr = newTimeEntry.date;
    const startISO = `${dateStr}T${newTimeEntry.startTime}:00`;
    const endISO = `${dateStr}T${newTimeEntry.endTime}:00`;

    setTimeEntries(prev => [...prev, {
      id: Date.now().toString(),
      techId: newTimeEntry.techId,
      techName: tech?.name || 'Unknown',
      startTime: startISO,
      endTime: endISO,
      hours,
      lunchTaken: newTimeEntry.lunchTaken,
      manualEntry: true
    }]);
    setNewTimeEntry({ 
      techId: '', 
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00', 
      endTime: '17:00',
      lunchTaken: false 
    });
    setShowAddTime(false);
  };

  const removeTimeEntry = (id) => setTimeEntries(prev => prev.filter(e => e.id !== id));

  const totalHours = timeEntries.reduce((sum, e) => {
    if (e.hours) return sum + e.hours;
    if (e.startTime && e.endTime) {
      const start = new Date(e.startTime);
      const end = new Date(e.endTime);
      const h = (end - start) / (1000 * 60 * 60);
      return sum + Math.max(0, h - (e.lunchTaken ? 0.5 : 0));
    }
    return sum;
  }, 0);

  const formatTimeDisplay = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <Users className="w-10 h-10 mx-auto mb-2" style={{ color: colors.water }} />
        <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Who worked on this job?</h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>Add time for each tech</p>
      </div>

      {timeEntries.length > 0 && (
        <div className="space-y-2">
          {timeEntries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
              <div>
                <p className="font-medium" style={{ color: colors.textPrimary }}>{entry.techName}</p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {formatTimeDisplay(entry.startTime)} - {formatTimeDisplay(entry.endTime)}
                  {entry.lunchTaken && ' (lunch)'}
                </p>
                <p className="text-sm font-bold" style={{ color: colors.primary }}>{(entry.hours || 0).toFixed(2)} hrs</p>
              </div>
              <button onClick={() => removeTimeEntry(entry.id)} className="p-2">
                <Trash2 className="w-5 h-5" style={{ color: colors.danger }} />
              </button>
            </div>
          ))}
          <div className="p-3 rounded-lg text-center" style={{ backgroundColor: colors.success + '15' }}>
            <p className="font-bold" style={{ color: colors.success }}>Total: {totalHours.toFixed(2)} hours</p>
          </div>
        </div>
      )}

      {showAddTime ? (
        <div className="p-4 rounded-lg border space-y-3" style={{ borderColor: colors.border }}>
          <select 
            value={newTimeEntry.techId} 
            onChange={(e) => setNewTimeEntry(prev => ({...prev, techId: e.target.value}))} 
            className="input w-full" 
            style={{ fontSize: '16px' }}
          >
            <option value="">Select Tech...</option>
            {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <div>
            <label className="text-sm" style={{ color: colors.textSecondary }}>Date</label>
            <input 
              type="date" 
              value={newTimeEntry.date}
              onChange={(e) => setNewTimeEntry(prev => ({...prev, date: e.target.value}))}
              className="input w-full" 
              style={{ fontSize: '16px' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm" style={{ color: colors.textSecondary }}>Start Time</label>
              <input 
                type="time" 
                value={newTimeEntry.startTime}
                onChange={(e) => setNewTimeEntry(prev => ({...prev, startTime: e.target.value}))}
                className="input w-full" 
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <label className="text-sm" style={{ color: colors.textSecondary }}>End Time</label>
              <input 
                type="time" 
                value={newTimeEntry.endTime}
                onChange={(e) => setNewTimeEntry(prev => ({...prev, endTime: e.target.value}))}
                className="input w-full" 
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={newTimeEntry.lunchTaken}
              onChange={(e) => setNewTimeEntry(prev => ({...prev, lunchTaken: e.target.checked}))}
              className="w-5 h-5"
            />
            <span style={{ color: colors.textSecondary }}>Took 30-min lunch?</span>
          </label>

          {newTimeEntry.startTime && newTimeEntry.endTime && (
            <div className="p-2 rounded text-center" style={{ backgroundColor: colors.primary + '15' }}>
              <span style={{ color: colors.primary, fontWeight: 'bold' }}>
                = {calculateHours(newTimeEntry.startTime, newTimeEntry.endTime, newTimeEntry.lunchTaken).toFixed(2)} hours
              </span>
            </div>
          )}

          <div className="flex space-x-2">
            <Button onClick={addTimeEntry} disabled={!newTimeEntry.techId} className="flex-1">Add</Button>
            <Button variant="secondary" onClick={() => setShowAddTime(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setShowAddTime(true)} icon={Plus} className="w-full">
          Add Tech Time
        </Button>
      )}

      <NavButtons 
        currentStep={3} 
        totalSteps={6} 
        canContinue={true} 
        nextLabel={timeEntries.length === 0 ? 'Skip' : 'Next'} 
        onNext={onNext}
        onBack={onBack}
        isLoading={isLoading}
        colors={colors}
      />
    </div>
  );
};

// Step 4: Parts
const Step4Parts = ({
  selectedParts,
  setSelectedParts,
  parts,
  truckLocations,
  colors,
  onNext,
  onBack,
  isLoading
}) => {
  const [partSearch, setPartSearch] = useState('');
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const partSearchRef = useRef(null);
  const partDropdownRef = useRef(null);

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

  const addPart = (part) => {
    const existingIndex = selectedParts.findIndex(p => p.partId === part.id);
    if (existingIndex >= 0) {
      const updated = [...selectedParts];
      updated[existingIndex].quantity += 1;
      setSelectedParts(updated);
    } else {
      setSelectedParts([...selectedParts, {
        partId: part.id, partNumber: part.partNumber, description: part.description,
        quantity: 1, truckLocationId: '', truckLocationName: ''
      }]);
    }
    setPartSearch('');
    setShowPartDropdown(false);
  };

  const updatePartQuantity = (index, quantity) => {
    const updated = [...selectedParts];
    updated[index].quantity = quantity === '' ? '' : Math.max(1, parseInt(quantity) || 1);
    setSelectedParts(updated);
  };

  const updatePartTruck = (index, truckId) => {
    const updated = [...selectedParts];
    const truck = truckLocations.find(t => t.id === truckId);
    updated[index].truckLocationId = truckId;
    updated[index].truckLocationName = truck?.name || '';
    setSelectedParts(updated);
  };

  const removePart = (index) => setSelectedParts(selectedParts.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <Wrench className="w-10 h-10 mx-auto mb-2" style={{ color: colors.accent }} />
        <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Parts used?</h3>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textSecondary }} />
        <input 
          ref={partSearchRef}
          type="text" 
          placeholder="Search parts..." 
          value={partSearch} 
          onChange={(e) => { setPartSearch(e.target.value); setShowPartDropdown(true); }} 
          onFocus={() => setShowPartDropdown(true)} 
          className="input pl-10 w-full" 
          style={{ fontSize: '16px' }} 
        />
        {showPartDropdown && filteredParts.length > 0 && (
          <div 
            ref={partDropdownRef}
            className="absolute z-50 w-full mt-1 rounded-lg shadow-xl border" 
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border, maxHeight: '200px', overflowY: 'auto' }}
          >
            {filteredParts.map(part => (
              <div 
                key={part.id} 
                className="px-4 py-3 cursor-pointer border-b hover:bg-gray-50" 
                style={{ borderColor: colors.border }} 
                onClick={() => addPart(part)}
              >
                <span className="font-mono" style={{ color: colors.primary }}>{part.partNumber}</span>
                <p className="text-sm" style={{ color: colors.textSecondary }}>{part.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedParts.map((part, index) => (
        <div key={index} className="p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-mono text-sm" style={{ color: colors.primary }}>{part.partNumber}</span>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{part.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="number" 
                min="1" 
                value={part.quantity} 
                onChange={(e) => updatePartQuantity(index, e.target.value)} 
                className="w-16 px-2 py-1 text-center rounded border" 
                style={{ borderColor: colors.border }} 
              />
              <button onClick={() => removePart(index)}>
                <Trash2 className="w-5 h-5" style={{ color: colors.danger }} />
              </button>
            </div>
          </div>
          <select 
            value={part.truckLocationId || ''} 
            onChange={(e) => updatePartTruck(index, e.target.value)} 
            className="w-full px-3 py-2 rounded border" 
            style={{ borderColor: colors.border, fontSize: '16px' }}
          >
            <option value="">Where from?</option>
            {truckLocations.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      ))}

      <NavButtons 
        currentStep={4} 
        totalSteps={6} 
        canContinue={true}
        nextLabel={selectedParts.length === 0 ? 'Skip' : 'Next'} 
        onNext={onNext}
        onBack={onBack}
        isLoading={isLoading}
        colors={colors}
      />
    </div>
  );
};

// Step 5: Vehicle & Photos (FIXED - no capture attribute = allows gallery)
const Step5Vehicle = ({
  vehicleInfo,
  setVehicleInfo,
  beforePhotos,
  setBeforePhotos,
  afterPhotos,
  setAfterPhotos,
  uploadingPhotos,
  setUploadingPhotos,
  compressImage,
  colors,
  onNext,
  onBack,
  isLoading,
  addNotification
}) => {
  useEffect(() => {
    const begin = parseFloat(vehicleInfo.odometerBegin) || 0;
    const end = parseFloat(vehicleInfo.odometerEnd) || 0;
    if (begin > 0 && end > 0 && end > begin) {
      setVehicleInfo(prev => ({ ...prev, milesDriven: (end - begin).toString() }));
    }
  }, [vehicleInfo.odometerBegin, vehicleInfo.odometerEnd, setVehicleInfo]);

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
        addNotification?.('error', `Failed to process photo ${file.name}: ${err.message}`);
        // Fallback to original file if compression fails
        try {
          const reader = new FileReader();
          const preview = await new Promise(resolve => {
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsDataURL(file);
          });
          newPhotos.push({ file, preview, name: file.name });
        } catch (fallbackErr) {
          console.error('Photo fallback error:', fallbackErr);
          addNotification?.('error', `Cannot load photo ${file.name}`);
          // Skip this photo only if both compression and fallback fail
        }
      }
    }
    if (type === 'before') setBeforePhotos(prev => [...prev, ...newPhotos].slice(0, 3));
    else setAfterPhotos(prev => [...prev, ...newPhotos].slice(0, 3));
    setUploadingPhotos(false);
  };

  const removePhoto = (type, index) => {
    if (type === 'before') setBeforePhotos(prev => prev.filter((_, i) => i !== index));
    else setAfterPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <Navigation className="w-10 h-10 mx-auto mb-2" style={{ color: colors.water }} />
        <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Vehicle & Photos</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm" style={{ color: colors.textSecondary }}>Truck #</label>
          <input 
            type="text" 
            value={vehicleInfo.vehicleNumber} 
            onChange={(e) => setVehicleInfo(prev => ({...prev, vehicleNumber: e.target.value}))} 
            placeholder="57" 
            className="input w-full" 
            style={{ fontSize: '16px' }} 
          />
        </div>
        <div>
          <label className="text-sm" style={{ color: colors.textSecondary }}>Start</label>
          <input 
            type="number" 
            value={vehicleInfo.odometerBegin} 
            onChange={(e) => setVehicleInfo(prev => ({...prev, odometerBegin: e.target.value}))} 
            className="input w-full" 
            style={{ fontSize: '16px' }} 
          />
        </div>
        <div>
          <label className="text-sm" style={{ color: colors.textSecondary }}>End</label>
          <input 
            type="number" 
            value={vehicleInfo.odometerEnd} 
            onChange={(e) => setVehicleInfo(prev => ({...prev, odometerEnd: e.target.value}))} 
            className="input w-full" 
            style={{ fontSize: '16px' }} 
          />
        </div>
      </div>

      {vehicleInfo.milesDriven && (
        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: colors.success + '15' }}>
          <p className="font-bold" style={{ color: colors.success }}>{vehicleInfo.milesDriven} miles</p>
        </div>
      )}

      {/* PHOTOS - NO capture attribute so user can choose camera OR gallery */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border" style={{ borderColor: colors.border }}>
          <p className="text-sm font-medium mb-2">Before Photos</p>
          <div className="flex flex-wrap gap-2">
            {beforePhotos.map((p, i) => (
              <div key={i} className="relative w-16 h-16 rounded overflow-hidden">
                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removePhoto('before', i)} 
                  className="absolute top-0 right-0 w-5 h-5 rounded-full flex items-center justify-center" 
                  style={{ backgroundColor: colors.danger }}
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {beforePhotos.length < 3 && (
              <label className="w-16 h-16 rounded border-2 border-dashed flex flex-col items-center justify-center cursor-pointer" style={{ borderColor: colors.border }}>
                <Camera className="w-4 h-4" style={{ color: colors.textMuted }} />
                <Image className="w-4 h-4" style={{ color: colors.textMuted }} />
                {/* NO capture attribute = allows camera OR gallery selection */}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handlePhotoSelect(e, 'before')} 
                  className="hidden" 
                />
              </label>
            )}
          </div>
        </div>

        <div className="p-3 rounded-lg border" style={{ borderColor: colors.border }}>
          <p className="text-sm font-medium mb-2">After Photos</p>
          <div className="flex flex-wrap gap-2">
            {afterPhotos.map((p, i) => (
              <div key={i} className="relative w-16 h-16 rounded overflow-hidden">
                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removePhoto('after', i)} 
                  className="absolute top-0 right-0 w-5 h-5 rounded-full flex items-center justify-center" 
                  style={{ backgroundColor: colors.danger }}
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {afterPhotos.length < 3 && (
              <label className="w-16 h-16 rounded border-2 border-dashed flex flex-col items-center justify-center cursor-pointer" style={{ borderColor: colors.border }}>
                <Camera className="w-4 h-4" style={{ color: colors.textMuted }} />
                <Image className="w-4 h-4" style={{ color: colors.textMuted }} />
                {/* NO capture attribute = allows camera OR gallery selection */}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handlePhotoSelect(e, 'after')} 
                  className="hidden" 
                />
              </label>
            )}
          </div>
        </div>
      </div>

      <NavButtons 
        currentStep={5} 
        totalSteps={6} 
        canContinue={true}
        onNext={onNext}
        onBack={onBack}
        isLoading={isLoading || uploadingPhotos}
        colors={colors}
      />
    </div>
  );
};

// Step 6: Review & Complete (WITH EXPORT BUTTONS)
const Step6Review = ({
  jobComplete,
  setJobComplete,
  followUpNotes,
  setFollowUpNotes,
  additionalNotes,
  setAdditionalNotes,
  totalHours,
  timeEntries,
  selectedParts,
  vehicleInfo,
  colors,
  onNext,
  onBack,
  isLoading,
  uploadingPhotos,
  onDownloadJobSheet,
  onExportToExcel,
  job
}) => (
  <div className="space-y-4">
    <div className="text-center mb-4">
      <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: colors.success }} />
      <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Review & Complete</h3>
    </div>

    <div className="p-3 rounded-lg border" style={{ borderColor: colors.border }}>
      <p className="font-medium mb-3" style={{ color: colors.textPrimary }}>Is this job complete?</p>
      <div className="flex space-x-3">
        <button 
          onClick={() => setJobComplete(true)} 
          className="flex-1 py-3 rounded-lg border-2 font-medium" 
          style={{ 
            borderColor: jobComplete ? colors.success : colors.border, 
            backgroundColor: jobComplete ? colors.success + '15' : 'transparent', 
            color: jobComplete ? colors.success : colors.textSecondary 
          }}
        >
          ✓ Complete
        </button>
        <button 
          onClick={() => setJobComplete(false)} 
          className="flex-1 py-3 rounded-lg border-2 font-medium" 
          style={{ 
            borderColor: !jobComplete ? colors.warning : colors.border, 
            backgroundColor: !jobComplete ? colors.warning + '15' : 'transparent', 
            color: !jobComplete ? colors.warning : colors.textSecondary 
          }}
        >
          ⚠ Follow-up
        </button>
      </div>
      {!jobComplete && (
        <textarea 
          value={followUpNotes} 
          onChange={(e) => setFollowUpNotes(e.target.value)} 
          placeholder="What's needed?" 
          className="input w-full mt-3 min-h-[60px]" 
          style={{ fontSize: '16px' }} 
        />
      )}
    </div>

    <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: colors.background }}>
      <p><strong>Time:</strong> {totalHours.toFixed(2)} hrs ({timeEntries.length} entries)</p>
      <p><strong>Parts:</strong> {selectedParts.length || 'None'}</p>
      <p><strong>Miles:</strong> {vehicleInfo.milesDriven || '0'}</p>
    </div>

    <textarea 
      value={additionalNotes} 
      onChange={(e) => setAdditionalNotes(e.target.value)} 
      placeholder="Other notes? (optional)" 
      className="input w-full min-h-[60px]" 
      style={{ fontSize: '16px' }} 
    />

    {/* EXPORT BUTTONS - RESTORED */}
    {(onDownloadJobSheet || onExportToExcel) && (
      <div className="flex space-x-2">
        {onDownloadJobSheet && (
          <Button 
            variant="secondary" 
            icon={Download} 
            onClick={() => onDownloadJobSheet(job)} 
            className="flex-1"
          >
            PDF
          </Button>
        )}
        {onExportToExcel && (
          <Button 
            variant="secondary" 
            icon={Download} 
            onClick={() => onExportToExcel(job)} 
            className="flex-1"
          >
            Excel
          </Button>
        )}
      </div>
    )}

    <NavButtons 
      currentStep={6} 
      totalSteps={6} 
      canContinue={jobComplete || followUpNotes.trim()}
      nextLabel={jobComplete ? 'Complete Job' : 'Save'} 
      onNext={onNext}
      onBack={onBack}
      isLoading={isLoading || uploadingPhotos}
      colors={colors}
    />
  </div>
);

// ============================================
// MAIN MODAL COMPONENT
// ============================================
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
  formatCurrency,
  truckLocations = [],
  users = [],
  userProfile,
  onDownloadJobSheet,
  onExportToExcel,
  addNotification
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 6;

  const [problemDescription, setProblemDescription] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);
  const [vehicleInfo, setVehicleInfo] = useState({ vehicleNumber: '', odometerBegin: '', odometerEnd: '', milesDriven: '' });
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [jobComplete, setJobComplete] = useState(true);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [timeEntries, setTimeEntries] = useState([]);

  // eslint-disable-next-line no-unused-vars
  const job = selectedJobForAction;
  const techs = users.filter(u => u.role === 'tech' || u.role === 'manager');

  // Reset form only when modal opens (not when job data changes)
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && selectedJobForAction) {
      // Only reset when modal opens (transition from closed to open)
      setCurrentStep(1);
      setProblemDescription('');
      setWorkDescription('');
      setSelectedParts([]);
      setVehicleInfo({ vehicleNumber: '', odometerBegin: '', odometerEnd: '', milesDriven: '' });
      setBeforePhotos([]);
      setAfterPhotos([]);
      setAdditionalNotes('');
      setJobComplete(true);
      setFollowUpNotes('');
      setTimeEntries(selectedJobForAction.timeEntries || []);
    }
    prevIsOpenRef.current = isOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedJobForAction?.id]);

  const totalHours = timeEntries.reduce((sum, e) => {
    if (e.hours) return sum + e.hours;
    if (e.startTime && e.endTime) {
      const start = new Date(e.startTime);
      const end = new Date(e.endTime);
      const h = (end - start) / (1000 * 60 * 60);
      return sum + Math.max(0, h - (e.lunchTaken ? 0.5 : 0));
    }
    return sum;
  }, 0);

  const compileWorkPerformed = () => {
    let compiled = '';
    if (problemDescription) compiled += `PROBLEM: ${problemDescription}\n\n`;
    if (workDescription) compiled += `WORK PERFORMED: ${workDescription}\n\n`;
    if (!jobComplete && followUpNotes) compiled += `FOLLOW-UP NEEDED: ${followUpNotes}\n\n`;
    if (additionalNotes) compiled += `NOTES: ${additionalNotes}`;
    return compiled.trim();
  };

  const handleSubmit = async () => {
    if (!selectedJobForAction) return;
    try {
      setUploadingPhotos(true);
      let beforePhotoUrls = [], afterPhotoUrls = [];
      for (const photo of beforePhotos) {
        try {
          const result = await uploadJobPhoto(photo.file, selectedJobForAction.id, 'before');
          if (result.success) beforePhotoUrls.push(result.url);
        } catch (err) { console.error(err); }
      }
      for (const photo of afterPhotos) {
        try {
          const result = await uploadJobPhoto(photo.file, selectedJobForAction.id, 'after');
          if (result.success) afterPhotoUrls.push(result.url);
        } catch (err) { console.error(err); }
      }
      setUploadingPhotos(false);
      await handleCompleteJob(selectedJobForAction.id, {
        workDescription: compileWorkPerformed(),
        partsUsed: selectedParts.map(p => ({ 
          partNumber: p.partNumber, 
          description: p.description, 
          quantity: parseInt(p.quantity) || 1, 
          truckLocationId: p.truckLocationId || '', 
          truckLocationName: p.truckLocationName || '' 
        })),
        partsCost: 0, 
        hoursWorked: totalHours || 0, 
        milesDriven: parseFloat(vehicleInfo.milesDriven) || 0,
        vehicleNumber: vehicleInfo.vehicleNumber, 
        odometerBegin: parseFloat(vehicleInfo.odometerBegin) || 0,
        odometerEnd: parseFloat(vehicleInfo.odometerEnd) || 0, 
        beforePhotos: beforePhotoUrls, 
        afterPhotos: afterPhotoUrls,
        needsFollowUp: !jobComplete, 
        followUpNotes, 
        timeEntries
      });
    } catch (err) { 
      console.error(err); 
      setUploadingPhotos(false); 
    }
  };

  const handleClose = () => { onClose(); setCurrentStep(1); };
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const titles = ['Problem', 'Work Done', 'Time', 'Parts', 'Vehicle', 'Complete'];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Step ${currentStep}: ${titles[currentStep - 1]}`} size="lg">
      {selectedJobForAction && (
        <div>
          <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: colors.background }}>
            <p className="font-semibold" style={{ color: colors.textPrimary }}>{selectedJobForAction.title}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>{selectedJobForAction.pivotName}</p>
            {selectedJobForAction.soNumber && (
              <span 
                className="text-xs font-mono px-2 py-0.5 rounded mt-1 inline-block" 
                style={{ backgroundColor: colors.primary + '15', color: colors.primary }}
              >
                SO# {selectedJobForAction.soNumber}
              </span>
            )}
          </div>

          <StepIndicator currentStep={currentStep} colors={colors} />

          <div className="min-h-[300px]">
            {currentStep === 1 && (
              <Step1Problem 
                problemDescription={problemDescription}
                setProblemDescription={setProblemDescription}
                colors={colors}
                onNext={nextStep}
                isLoading={isLoading}
              />
            )}
            {currentStep === 2 && (
              <Step2Work 
                workDescription={workDescription}
                setWorkDescription={setWorkDescription}
                colors={colors}
                onNext={nextStep}
                onBack={prevStep}
                isLoading={isLoading}
              />
            )}
            {currentStep === 3 && (
              <Step3Time
                timeEntries={timeEntries}
                setTimeEntries={setTimeEntries}
                techs={techs}
                colors={colors}
                onNext={nextStep}
                onBack={prevStep}
                isLoading={isLoading}
              />
            )}
            {currentStep === 4 && (
              <Step4Parts
                selectedParts={selectedParts}
                setSelectedParts={setSelectedParts}
                parts={parts}
                truckLocations={truckLocations}
                colors={colors}
                onNext={nextStep}
                onBack={prevStep}
                isLoading={isLoading}
              />
            )}
            {currentStep === 5 && (
              <Step5Vehicle
                vehicleInfo={vehicleInfo}
                setVehicleInfo={setVehicleInfo}
                beforePhotos={beforePhotos}
                setBeforePhotos={setBeforePhotos}
                afterPhotos={afterPhotos}
                setAfterPhotos={setAfterPhotos}
                uploadingPhotos={uploadingPhotos}
                setUploadingPhotos={setUploadingPhotos}
                compressImage={compressImage}
                colors={colors}
                onNext={nextStep}
                onBack={prevStep}
                isLoading={isLoading}
                addNotification={addNotification}
              />
            )}
            {currentStep === 6 && (
              <Step6Review
                jobComplete={jobComplete}
                setJobComplete={setJobComplete}
                followUpNotes={followUpNotes}
                setFollowUpNotes={setFollowUpNotes}
                additionalNotes={additionalNotes}
                setAdditionalNotes={setAdditionalNotes}
                totalHours={totalHours}
                timeEntries={timeEntries}
                selectedParts={selectedParts}
                vehicleInfo={vehicleInfo}
                colors={colors}
                onNext={handleSubmit}
                onBack={prevStep}
                isLoading={isLoading}
                uploadingPhotos={uploadingPhotos}
                onDownloadJobSheet={onDownloadJobSheet}
                onExportToExcel={onExportToExcel}
                job={selectedJobForAction}
              />
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CompleteJobModal;
