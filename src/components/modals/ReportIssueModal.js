// ============================================
// REPORT ISSUE / CALL-IN MODAL
// ============================================
import React, { useState, useMemo, useCallback } from 'react';
import {
  User, UserPlus, Plus, AlertCircle, Camera, X,
  RefreshCw, Power, Check
} from 'lucide-react';
import { Modal, Button, Input, Select, SearchableSelect } from '../ui';
import { uploadJobPhoto, compressImage } from '../../firebase';

const ReportIssueModal = ({
  isOpen,
  onClose,
  colors,
  userProfile,
  users = [],
  equipment = [],
  selectedEquipmentForIssue,
  setSelectedEquipmentForIssue,
  createJob,
  addPivot,
  addNotification,
  isLoading,
  setIsLoading
}) => {
  // Early return if not open - don't compute anything
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedPivotId, setSelectedPivotId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [leavePivotRunning, setLeavePivotRunning] = useState(false);
  const [pivotDirection, setPivotDirection] = useState('forward');
  const [pivotPercentage, setPivotPercentage] = useState('50');
  const [acknowledged, setAcknowledged] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  // Inline customer creation
  const [showInlineAddCustomer, setShowInlineAddCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', email: '', phone: '', company: '', address: '' });
  
  // Inline equipment creation
  const [showInlineAddEquipment, setShowInlineAddEquipment] = useState(false);
  const [newEquipmentData, setNewEquipmentData] = useState({ name: '', type: 'center_pivot', acres: '', address: '', lat: '', lng: '' });

  // Memoized computations to prevent re-renders
  const isStaff = useMemo(() => 
    ['tech', 'manager', 'office'].includes(userProfile?.role), 
    [userProfile?.role]
  );
  
  const farmers = useMemo(() => 
    users.filter(u => u.role === 'farmer'), 
    [users]
  );

  const availableEquipment = useMemo(() => {
    if (!isStaff || selectedEquipmentForIssue) return [];
    return equipment.filter(p => p.farmerId === selectedFarmerId);
  }, [isStaff, selectedEquipmentForIssue, equipment, selectedFarmerId]);
  
  const pivotToReport = useMemo(() => 
    selectedEquipmentForIssue || equipment.find(p => p.id === selectedPivotId),
    [selectedEquipmentForIssue, equipment, selectedPivotId]
  );

  // Memoized handlers
  const handleClose = useCallback(() => {
    onClose();
    setSelectedEquipmentForIssue(null);
    setSelectedFarmerId('');
    setSelectedPivotId('');
    setShowInlineAddEquipment(false);
    setNewEquipmentData({ name: '', type: 'center_pivot', acres: '', address: '', lat: '', lng: '' });
    setShowInlineAddCustomer(false);
    setNewCustomerData({ name: '', email: '', phone: '', company: '', address: '' });
  }, [onClose, setSelectedEquipmentForIssue]);

  // Handle inline customer creation
  const handleInlineAddCustomer = useCallback(async () => {
    if (!newCustomerData.name) {
      addNotification('error', 'Customer name is required');
      return;
    }
    
    setIsLoading(true);
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');
      
      const docRef = await addDoc(collection(db, 'users'), {
        name: newCustomerData.name,
        email: newCustomerData.email || '',
        phone: newCustomerData.phone || '',
        company: newCustomerData.company || '',
        address: newCustomerData.address || '',
        role: 'farmer',
        createdAt: serverTimestamp(),
        avatar: '🌾'
      });
      
      addNotification('success', 'Customer added successfully');
      setSelectedFarmerId(docRef.id);
      setShowInlineAddCustomer(false);
      setNewCustomerData({ name: '', email: '', phone: '', company: '', address: '' });
    } catch (error) {
      console.error('Error creating customer:', error);
      addNotification('error', error.message || 'Failed to add customer');
    }
    setIsLoading(false);
  }, [newCustomerData, addNotification, setIsLoading]);

  // Handle inline equipment creation
  const handleInlineAddEquipment = useCallback(async () => {
    if (!newEquipmentData.name || !selectedFarmerId) return;
    
    setIsLoading(true);
    const result = await addPivot({
      name: newEquipmentData.name,
      type: newEquipmentData.type,
      acres: parseFloat(newEquipmentData.acres) || 0,
      farmerId: selectedFarmerId,
      status: 'active',
      lastService: new Date().toISOString().split('T')[0],
      location: {
        address: newEquipmentData.address || '',
        lat: parseFloat(newEquipmentData.lat) || 0,
        lng: parseFloat(newEquipmentData.lng) || 0
      }
    });
    setIsLoading(false);
    
    if (result.success) {
      addNotification('success', 'Equipment added successfully');
      setSelectedPivotId(result.id);
      setShowInlineAddEquipment(false);
      setNewEquipmentData({ name: '', type: 'center_pivot', acres: '', address: '', lat: '', lng: '' });
    } else {
      addNotification('error', result.error || 'Failed to add equipment');
    }
  }, [newEquipmentData, selectedFarmerId, addPivot, addNotification, setIsLoading]);

  const handlePhotoSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingPhotos(true);
    const newPhotos = [];
    
    for (const file of files.slice(0, 3)) {
      try {
        const compressed = await compressImage(file);
        const reader = new FileReader();
        const preview = await new Promise(resolve => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(compressed);
        });
        newPhotos.push({ file: compressed, preview, name: file.name });
      } catch (err) {
        console.error('Photo compression error:', err);
      }
    }
    
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 3));
    setUploadingPhotos(false);
  }, []);

  const removePhoto = useCallback((index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (pivotToReport && description) {
      if (leavePivotRunning && !acknowledged) {
        return;
      }
      
      let photoUrls = [];
      if (photos.length > 0) {
        setUploadingPhotos(true);
        for (const photo of photos) {
          const result = await uploadJobPhoto(photo.file, `temp_${Date.now()}`, 'issue');
          if (result.success) {
            photoUrls.push(result.url);
          }
        }
        setUploadingPhotos(false);
      }
      
      createJob(pivotToReport.id, description, priority, {
        leavePivotRunning,
        pivotDirection: leavePivotRunning ? pivotDirection : '',
        pivotPercentage: leavePivotRunning ? parseInt(pivotPercentage) : 0,
        acknowledged: leavePivotRunning ? acknowledged : false,
        photos: photoUrls,
        reportedBy: isStaff ? userProfile?.name : null,
        reportedByRole: isStaff ? userProfile?.role : null
      });
      
      // Reset form
      setDescription('');
      setPriority('medium');
      setLeavePivotRunning(false);
      setPivotDirection('forward');
      setPivotPercentage('50');
      setAcknowledged(false);
      setPhotos([]);
      setSelectedFarmerId('');
      setSelectedPivotId('');
    }
  }, [pivotToReport, description, leavePivotRunning, acknowledged, photos, priority, pivotDirection, pivotPercentage, createJob, isStaff, userProfile]);

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isStaff ? "New Call In" : "Report an Issue"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Staff: Select Customer and Pivot */}
        {isStaff && !selectedEquipmentForIssue && !showInlineAddCustomer && (
          <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: colors.water + '15', border: `1px solid ${colors.water}` }}>
            <h4 className="font-medium flex items-center justify-between" style={{ color: colors.textPrimary }}>
              <span className="flex items-center">
                <User className="w-4 h-4 mr-2" style={{ color: colors.water }} />
                Select Customer & Equipment
              </span>
              <Button type="button" size="sm" variant="secondary" icon={UserPlus} onClick={() => setShowInlineAddCustomer(true)}>
                New Customer
              </Button>
            </h4>
            <SearchableSelect 
              label="Customer" 
              value={selectedFarmerId} 
              onChange={e => { setSelectedFarmerId(e.target.value); setSelectedPivotId(''); }}
              options={[
                { value: '', label: 'Select a customer...' },
                ...farmers.map(f => ({ value: f.id, label: `${f.name}${f.company ? ` (${f.company})` : ''}` }))
              ]}
              placeholder="Search customers..."
              colors={colors}
            />
            {selectedFarmerId && (
              <Select 
                label="Equipment" 
                value={selectedPivotId} 
                onChange={e => setSelectedPivotId(e.target.value)}
                options={[
                  { value: '', label: 'Select equipment...' },
                  { value: 'add_new', label: '➕ Add New Equipment...' },
                  ...availableEquipment.map(p => ({ value: p.id, label: `${p.name}${p.acres ? ` (${p.acres} acres)` : ''}` }))
                ]}
              />
            )}
            {selectedFarmerId && availableEquipment.length === 0 && !showInlineAddEquipment && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.warning + '15' }}>
                <p className="text-sm mb-2" style={{ color: colors.warning }}>
                  This customer has no equipment on file.
                </p>
                <Button type="button" size="sm" icon={Plus} onClick={() => setShowInlineAddEquipment(true)}>
                  Add Equipment Now
                </Button>
              </div>
            )}

            {/* Inline Add Equipment Form */}
            {(showInlineAddEquipment || selectedPivotId === 'add_new') && (
              <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: colors.success + '15', border: `1px solid ${colors.success}` }}>
                <h5 className="font-medium flex items-center" style={{ color: colors.success }}>
                  <Plus className="w-4 h-4 mr-2" /> Add New Equipment
                </h5>
                <Input 
                  label="Equipment Name" 
                  placeholder="e.g., North Field Pivot" 
                  value={newEquipmentData.name} 
                  onChange={e => setNewEquipmentData({...newEquipmentData, name: e.target.value})} 
                  required
                />
                <Select 
                  label="Equipment Type" 
                  value={newEquipmentData.type} 
                  onChange={e => setNewEquipmentData({...newEquipmentData, type: e.target.value})}
                  options={[
                    { value: 'center_pivot', label: 'Center Pivot' },
                    { value: 'linear_pivot', label: 'Linear Pivot' },
                    { value: 'corner_system', label: 'Corner System' },
                    { value: 'pump', label: 'Pump' },
                    { value: 'well', label: 'Well' },
                    { value: 'motor', label: 'Motor' },
                    { value: 'generator', label: 'Generator' },
                    { value: 'power_unit', label: 'Power Unit' },
                    { value: 'control_panel', label: 'Control Panel' },
                    { value: 'other', label: 'Other' }
                  ]}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    label="Acres (optional)" 
                    type="number" 
                    placeholder="120" 
                    value={newEquipmentData.acres} 
                    onChange={e => setNewEquipmentData({...newEquipmentData, acres: e.target.value})} 
                  />
                  <Input 
                    label="Address (optional)" 
                    placeholder="123 Farm Rd" 
                    value={newEquipmentData.address} 
                    onChange={e => setNewEquipmentData({...newEquipmentData, address: e.target.value})} 
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="button" size="sm" icon={Check} onClick={handleInlineAddEquipment} loading={isLoading}>
                    Add & Select
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => { setShowInlineAddEquipment(false); setSelectedPivotId(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inline Add Customer Form */}
        {isStaff && showInlineAddCustomer && (
          <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: colors.accent + '15', border: `1px solid ${colors.accent}` }}>
            <h4 className="font-medium flex items-center" style={{ color: colors.textPrimary }}>
              <UserPlus className="w-4 h-4 mr-2" style={{ color: colors.accent }} />
              Add New Customer
            </h4>
            <Input 
              label="Customer Name *" 
              placeholder="John Smith" 
              value={newCustomerData.name} 
              onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} 
              required
            />
            <Input 
              label="Company (optional)" 
              placeholder="Smith Farms LLC" 
              value={newCustomerData.company} 
              onChange={e => setNewCustomerData({...newCustomerData, company: e.target.value})} 
            />
            <div className="grid grid-cols-2 gap-3">
              <Input 
                label="Phone" 
                placeholder="(573) 555-1234" 
                value={newCustomerData.phone} 
                onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})} 
              />
              <Input 
                label="Email (optional)" 
                type="email"
                placeholder="john@example.com" 
                value={newCustomerData.email} 
                onChange={e => setNewCustomerData({...newCustomerData, email: e.target.value})} 
              />
            </div>
            <Input 
              label="Address (optional)" 
              placeholder="123 Farm Road, County, MO" 
              value={newCustomerData.address} 
              onChange={e => setNewCustomerData({...newCustomerData, address: e.target.value})} 
            />
            <div className="flex space-x-2 pt-2">
              <Button type="button" size="sm" icon={Check} onClick={handleInlineAddCustomer} loading={isLoading}>
                Add Customer
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowInlineAddCustomer(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}


        {/* Farmer without pre-selected equipment - show guidance */}
        {!isStaff && !selectedEquipmentForIssue && (
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.warning + '15', border: `1px solid ${colors.warning}` }}>
            <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: colors.warning }} />
            <p className="font-medium" style={{ color: colors.textPrimary }}>No Equipment Selected</p>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Please go to your Equipment tab and click "Report Issue" on the specific piece of equipment you need serviced.
            </p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={handleClose}>
              Go Back
            </Button>
          </div>
        )}

        {/* Show selected pivot info */}
        {pivotToReport && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Reporting issue for:</p>
            <p className="font-semibold" style={{ color: colors.textPrimary }}>{pivotToReport.name}</p>
            {isStaff && (
              <p className="text-xs" style={{ color: colors.muted }}>
                Owner: {users.find(u => u.id === pivotToReport.farmerId)?.name || 'Unknown'}
              </p>
            )}
          </div>
        )}

        {/* Only show rest of form if pivot is selected */}
        {pivotToReport && (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>Describe the Issue</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please describe the issue in detail..." className="input min-h-[120px] resize-none" required />
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                <Camera className="w-4 h-4 inline mr-1" /> Add Photos (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
                    <img src={photo.preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(index)} className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.danger }}>
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" style={{ borderColor: colors.border }}>
                    {uploadingPhotos ? (
                      <RefreshCw className="w-6 h-6 animate-spin" style={{ color: colors.muted }} />
                    ) : (
                      <>
                        <Camera className="w-6 h-6" style={{ color: colors.muted }} />
                        <span className="text-xs mt-1" style={{ color: colors.muted }}>Add</span>
                      </>
                    )}
                    <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" disabled={uploadingPhotos} />
                  </label>
                )}
              </div>
              <p className="text-xs" style={{ color: colors.muted }}>Up to 3 photos. Tap to add.</p>
            </div>

            <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} options={[
              { value: 'low', label: 'Low - Can wait a few days' },
              { value: 'medium', label: 'Medium - Needs attention soon' },
              { value: 'high', label: 'High - Urgent, needs immediate attention' }
            ]} />


            {/* Pivot Running Options */}
            <div className="border-t pt-4" style={{ borderColor: colors.border }}>
              <div className="flex items-center space-x-3 mb-4">
                <input type="checkbox" id="leavePivotRunning" checked={leavePivotRunning} onChange={e => setLeavePivotRunning(e.target.checked)} className="w-4 h-4 rounded" />
                <label htmlFor="leavePivotRunning" className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  <Power className="w-4 h-4 inline mr-1" /> Leave pivot running during service?
                </label>
              </div>

              {leavePivotRunning && (
                <div className="p-4 rounded-lg space-y-4" style={{ backgroundColor: colors.warning + '10', border: `1px solid ${colors.warning}` }}>
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Direction" value={pivotDirection} onChange={e => setPivotDirection(e.target.value)} options={[
                      { value: 'forward', label: 'Forward' },
                      { value: 'reverse', label: 'Reverse' }
                    ]} />
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Speed (%)</label>
                      <input type="range" min="10" max="100" step="10" value={pivotPercentage} onChange={e => setPivotPercentage(e.target.value)} className="w-full" />
                      <p className="text-center text-sm font-medium" style={{ color: colors.primary }}>{pivotPercentage}%</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg" style={{ backgroundColor: colors.danger + '15' }}>
                    <div className="flex items-start space-x-3">
                      <input type="checkbox" id="acknowledged" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="w-4 h-4 rounded mt-0.5" required={leavePivotRunning} />
                      <label htmlFor="acknowledged" className="text-sm" style={{ color: colors.danger }}>
                        <strong>⚠️ I understand:</strong> By leaving the pivot running, I (the farmer) am responsible for monitoring its operation and shutting it off if needed. The service technician is not responsible for any issues arising from the pivot running during service.
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" variant="danger" className="flex-1" icon={AlertCircle} loading={isLoading} disabled={leavePivotRunning && !acknowledged}>Report Issue</Button>
              <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>Cancel</Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default ReportIssueModal;
