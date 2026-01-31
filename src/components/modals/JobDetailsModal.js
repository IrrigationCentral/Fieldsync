// ============================================
// JOB DETAILS MODAL - FULLY EDITABLE
// ============================================
import React, { useState, useEffect } from 'react';
import {
  Clock, Plus, Trash2, Download, FileText, Hash, UserPlus, Image,
  Edit2, Save, X, User, Wrench, AlertCircle, MapPin, Calendar,
  Phone
} from 'lucide-react';
import { Modal, Button, Input, Select, Badge, StarRating } from '../ui';

const JobDetailsModal = ({
  isOpen,
  onClose,
  job,
  users,
  equipment,
  userProfile,
  canSeePricing,
  isLoading,
  colors,
  // Handlers
  onUpdateJob,
  onAddManualTimeEntry,
  onDeleteTimeEntry,
  onDownloadJobSheet,
  onExportToExcel,
  onOpenSOModal,
  onOpenAssignModal,
  onStartTime,
  onStopTime,
  // Formatters
  formatDate,
  formatCurrency,
  getStatusVariant,
  formatStatus
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showAddTimeEntry, setShowAddTimeEntry] = useState(false);
  const [manualTimeData, setManualTimeData] = useState({
    techId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    lunchTaken: false,
    notes: ''
  });

  // Reset edit data when job changes
  useEffect(() => {
    if (job) {
      setEditData({
        title: job.title || '',
        description: job.description || '',
        soNumber: job.soNumber || '',
        priority: job.priority || 'medium',
        status: job.status || 'pending',
        pivotId: job.pivotId || '',
        farmerId: job.farmerId || ''
      });
    }
  }, [job]);

  if (!job) return null;

  const assigneeIds = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
  const assignedTechs = assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean);
  const farmer = users.find(u => u.id === job.farmerId);
  const pivot = equipment?.find(p => p.id === job.pivotId);
  const timeEntries = job.timeEntries || [];
  const techs = users.filter(u => u.role === 'tech' || u.role === 'manager');
  const farmers = users.filter(u => u.role === 'farmer');
  const isStaff = ['tech', 'manager', 'office'].includes(userProfile?.role);
  const isManager = userProfile?.role === 'manager' || userProfile?.role === 'office';
  
  // Can edit until ready-to-bill, billed, or canceled
  const canEdit = isManager && !['ready-to-bill', 'billed', 'canceled'].includes(job.status);

  // Calculate hours for a single entry
  const calculateEntryHours = (entry) => {
    if (!entry.startTime || !entry.endTime) return 0;
    const start = new Date(entry.startTime);
    const end = new Date(entry.endTime);
    const hours = (end - start) / (1000 * 60 * 60);
    const lunchDeduction = entry.lunchTaken ? 0.5 : 0;
    return Math.max(0, hours - lunchDeduction);
  };

  // Group time entries by tech
  const getTimeBreakdown = () => {
    const byTech = {};
    let grandTotal = 0;
    timeEntries.forEach(entry => {
      const techId = entry.techId;
      const techName = entry.techName || users.find(u => u.id === techId)?.name || 'Unknown';
      const hours = calculateEntryHours(entry);
      grandTotal += hours;
      if (!byTech[techId]) {
        byTech[techId] = { techName, entries: [], totalHours: 0 };
      }
      byTech[techId].entries.push({ ...entry, hours });
      byTech[techId].totalHours += hours;
    });
    return { byTech, grandTotal };
  };

  const { byTech, grandTotal } = getTimeBreakdown();

  const formatTimeDisplay = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDisplay = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Save edits
  const handleSaveEdits = async () => {
    if (onUpdateJob) {
      await onUpdateJob(job.id, editData);
    }
    setIsEditing(false);
  };

  // Cancel edits
  const handleCancelEdits = () => {
    setEditData({
      title: job.title || '',
      description: job.description || '',
      soNumber: job.soNumber || '',
      priority: job.priority || 'medium',
      status: job.status || 'pending',
      pivotId: job.pivotId || '',
      farmerId: job.farmerId || ''
    });
    setIsEditing(false);
  };

  // Handle adding manual time entry
  const handleAddManualTime = async () => {
    if (!manualTimeData.techId) return;
    const tech = users.find(u => u.id === manualTimeData.techId);
    const startDateTime = new Date(`${manualTimeData.date}T${manualTimeData.startTime}`);
    const endDateTime = new Date(`${manualTimeData.date}T${manualTimeData.endTime}`);
    if (endDateTime <= startDateTime) return;

    const result = await onAddManualTimeEntry(
      job.id,
      manualTimeData.techId,
      tech?.name || 'Unknown',
      startDateTime.toISOString(),
      endDateTime.toISOString(),
      manualTimeData.lunchTaken,
      manualTimeData.notes
    );

    if (result?.success) {
      setShowAddTimeEntry(false);
      setManualTimeData({
        techId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '17:00',
        lunchTaken: false,
        notes: ''
      });
    }
  };

  const handleClose = () => {
    setShowAddTimeEntry(false);
    setIsEditing(false);
    onClose();
  };

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'waiting-on-parts', label: 'Waiting on Parts' },
    { value: 'completed', label: 'Completed' },
    { value: 'ready-to-bill', label: 'Ready to Bill' },
    { value: 'billed', label: 'Billed' },
    { value: 'canceled', label: 'Canceled' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? "Edit Job" : "Job Details"} size="xl">
      <div className="space-y-4 max-h-[80vh] overflow-y-auto">
        
        {/* Header with Edit Toggle */}
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center space-x-3">
            <Badge variant={getStatusVariant(job.status)}>{formatStatus ? formatStatus(job.status) : job.status}</Badge>
            <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>
              {job.priority}
            </Badge>
          </div>
          {canEdit && !isEditing && (
            <Button size="sm" variant="secondary" icon={Edit2} onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
          {isEditing && (
            <div className="flex space-x-2">
              <Button size="sm" icon={Save} onClick={handleSaveEdits} loading={isLoading}>Save</Button>
              <Button size="sm" variant="secondary" icon={X} onClick={handleCancelEdits}>Cancel</Button>
            </div>
          )}
        </div>

        {/* ===== MAIN INFO - NEW ORDER ===== */}
        <div className="space-y-4">
          
          {/* 1. SO Number */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.primary + '10' }}>
            <div className="flex items-center space-x-2">
              <Hash className="w-5 h-5" style={{ color: colors.primary }} />
              <span className="font-medium" style={{ color: colors.textPrimary }}>SO #</span>
            </div>
            {isEditing ? (
              <Input
                value={editData.soNumber}
                onChange={e => setEditData({...editData, soNumber: e.target.value})}
                placeholder="Enter SO#"
                className="w-40 text-right"
              />
            ) : (
              <span className="font-mono font-bold" style={{ color: colors.primary }}>
                {job.soNumber || <button onClick={onOpenSOModal} className="text-sm underline" style={{ color: colors.water }}>+ Add SO#</button>}
              </span>
            )}
          </div>

          {/* 2. Customer Name */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" style={{ color: colors.soil }} />
              <span className="font-medium" style={{ color: colors.textPrimary }}>Customer</span>
            </div>
            {isEditing ? (
              <Select
                value={editData.farmerId}
                onChange={e => setEditData({...editData, farmerId: e.target.value})}
                options={[
                  { value: '', label: 'Select customer...' },
                  ...farmers.map(f => ({ value: f.id, label: f.name }))
                ]}
                className="w-48"
              />
            ) : (
              <div className="text-right">
                <span className="font-medium" style={{ color: colors.textPrimary }}>{farmer?.name || 'Unknown'}</span>
                {farmer?.phone && (
                  <a href={`tel:${farmer.phone}`} className="ml-2 text-sm" style={{ color: colors.primary }}>
                    <Phone className="w-3 h-3 inline" /> {farmer.phone}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 3. Job Title & Description */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-5 h-5" style={{ color: colors.warning }} />
              <span className="font-medium" style={{ color: colors.textPrimary }}>Issue</span>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  label="Title"
                  value={editData.title}
                  onChange={e => setEditData({...editData, title: e.target.value})}
                  placeholder="Job title"
                />
                <textarea
                  className="input w-full"
                  rows={3}
                  value={editData.description}
                  onChange={e => setEditData({...editData, description: e.target.value})}
                  placeholder="Description..."
                  style={{ backgroundColor: colors.inputBg }}
                />
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>{job.title}</h3>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>{job.description}</p>
              </div>
            )}
          </div>

          {/* 4. Assigned To */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.water + '10' }}>
            <div className="flex items-center space-x-2">
              <Wrench className="w-5 h-5" style={{ color: colors.water }} />
              <span className="font-medium" style={{ color: colors.textPrimary }}>Assigned To</span>
            </div>
            <div className="flex items-center space-x-2">
              {assignedTechs.length > 0 ? (
                <span style={{ color: colors.textPrimary }}>{assignedTechs.map(t => t.name).join(', ')}</span>
              ) : (
                <span className="text-sm" style={{ color: colors.textSecondary }}>Unassigned</span>
              )}
              {isManager && (
                <Button size="sm" variant="secondary" icon={UserPlus} onClick={onOpenAssignModal}>
                  {assignedTechs.length > 0 ? 'Change' : 'Assign'}
                </Button>
              )}
            </div>
          </div>

          {/* 5. Equipment/Location */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" style={{ color: colors.success }} />
              <span className="font-medium" style={{ color: colors.textPrimary }}>Equipment</span>
            </div>
            {isEditing ? (
              <Select
                value={editData.pivotId}
                onChange={e => setEditData({...editData, pivotId: e.target.value})}
                options={[
                  { value: '', label: 'Select equipment...' },
                  ...(equipment || []).map(p => ({ value: p.id, label: p.name }))
                ]}
                className="w-48"
              />
            ) : (
              <span style={{ color: colors.textPrimary }}>{pivot?.name || job.pivotName || 'N/A'}</span>
            )}
          </div>

          {/* 6. Priority & Status (editable) */}
          {isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Priority"
                value={editData.priority}
                onChange={e => setEditData({...editData, priority: e.target.value})}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' }
                ]}
              />
              <Select
                label="Status"
                value={editData.status}
                onChange={e => setEditData({...editData, status: e.target.value})}
                options={statusOptions}
              />
            </div>
          )}

          {/* 7. Date Info */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" style={{ color: colors.muted }} />
              <span className="font-medium" style={{ color: colors.textPrimary }}>Reported</span>
            </div>
            <span style={{ color: colors.textSecondary }}>{formatDate(job.createdAt)}</span>
          </div>
        </div>

        {/* Pivot Running Warning */}
        {job.leavePivotRunning && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.warning + '15' }}>
            <p className="text-sm font-medium" style={{ color: colors.warning }}>
              ⚠️ Pivot left running: {job.pivotDirection} at {job.pivotPercentage}%
            </p>
          </div>
        )}

        {/* ===== TIME TRACKING ===== */}
        {isStaff && (
          <div className="border-t pt-4" style={{ borderColor: colors.border }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center" style={{ color: colors.textPrimary }}>
                <Clock className="w-4 h-4 mr-2" /> Time Tracking
              </h4>
              <div className="flex space-x-2">
                {/* Manual time entry button - available to managers and assigned techs */}
                {(isManager || assigneeIds.includes(userProfile?.id)) && (
                  <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowAddTimeEntry(!showAddTimeEntry)}>
                    Add Time
                  </Button>
                )}
              </div>
            </div>

            {/* Add Manual Time Entry Form */}
            {showAddTimeEntry && (
              <div className="p-4 mb-4 rounded-lg space-y-3" style={{ backgroundColor: colors.water + '15', border: `1px solid ${colors.water}` }}>
                <h5 className="font-medium text-sm" style={{ color: colors.water }}>Add Manual Time Entry</h5>
                <Select
                  label="Technician"
                  value={manualTimeData.techId}
                  onChange={e => setManualTimeData({...manualTimeData, techId: e.target.value})}
                  options={[
                    { value: '', label: 'Select technician...' },
                    ...techs.map(t => ({ value: t.id, label: t.name }))
                  ]}
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Date" type="date" value={manualTimeData.date} onChange={e => setManualTimeData({...manualTimeData, date: e.target.value})} />
                  <Input label="Start" type="time" value={manualTimeData.startTime} onChange={e => setManualTimeData({...manualTimeData, startTime: e.target.value})} />
                  <Input label="End" type="time" value={manualTimeData.endTime} onChange={e => setManualTimeData({...manualTimeData, endTime: e.target.value})} />
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={manualTimeData.lunchTaken} onChange={e => setManualTimeData({...manualTimeData, lunchTaken: e.target.checked})} className="rounded" />
                  <span className="text-sm" style={{ color: colors.textPrimary }}>Lunch taken (30 min)</span>
                </label>
                <Input label="Notes" placeholder="Optional notes..." value={manualTimeData.notes} onChange={e => setManualTimeData({...manualTimeData, notes: e.target.value})} />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleAddManualTime} loading={isLoading}>Save Entry</Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowAddTimeEntry(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Time Entries */}
            {Object.keys(byTech).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(byTech).map(([techId, data]) => (
                  <div key={techId} className="p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium" style={{ color: colors.textPrimary }}>{data.techName}</span>
                      <span className="font-bold" style={{ color: colors.primary }}>{data.totalHours.toFixed(2)} hrs</span>
                    </div>
                    <div className="space-y-1">
                      {data.entries.map((entry, idx) => (
                        <div key={entry.id || idx} className="flex items-center justify-between text-xs p-2 rounded" style={{ backgroundColor: colors.cardBg }}>
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span style={{ color: colors.textSecondary }}>{formatDateDisplay(entry.startTime)}</span>
                            <span style={{ color: colors.textPrimary }}>{formatTimeDisplay(entry.startTime)} - {formatTimeDisplay(entry.endTime)}</span>
                            {entry.lunchTaken && <span className="px-1 rounded" style={{ backgroundColor: colors.warning + '20', color: colors.warning }}>-30m</span>}
                            {entry.manualEntry && <span className="px-1 rounded" style={{ backgroundColor: colors.water + '20', color: colors.water }}>manual</span>}
                            {!entry.endTime && <span className="px-1 rounded animate-pulse" style={{ backgroundColor: colors.success + '20', color: colors.success }}>active</span>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium" style={{ color: colors.textPrimary }}>{entry.hours.toFixed(2)}h</span>
                            {isManager && entry.endTime && (
                              <button onClick={() => onDeleteTimeEntry(job.id, entry.id)} className="p-1 rounded hover:bg-red-100" title="Delete">
                                <Trash2 className="w-3 h-3" style={{ color: colors.danger }} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: colors.primary + '15' }}>
                  <span className="font-bold" style={{ color: colors.primary }}>Total Time</span>
                  <span className="text-lg font-bold" style={{ color: colors.primary }}>{grandTotal.toFixed(2)} hours</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>No time entries yet</p>
            )}
          </div>
        )}

        {/* Completion Details */}
        {job.status === 'completed' && (
          <div className="border-t pt-4" style={{ borderColor: colors.border }}>
            <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>Completion Details</h4>
            <div className="p-4 rounded-lg space-y-2" style={{ backgroundColor: colors.success + '10' }}>
              <p className="text-sm"><strong>Work Done:</strong> {job.workDescription}</p>
              {job.partsUsed?.length > 0 && (
                <p className="text-sm"><strong>Parts:</strong> {Array.isArray(job.partsUsed) ? job.partsUsed.map(p => typeof p === 'object' ? `${p.partNumber} (${p.quantity})` : p).join(', ') : job.partsUsed}</p>
              )}
              <div className="flex justify-between text-sm">
                <span>Hours: {job.hoursWorked}</span>
                <span>Miles: {job.milesDriven}</span>
              </div>
              {canSeePricing && (
                <p className="text-lg font-bold mt-2" style={{ color: colors.success }}>Total: {formatCurrency(job.totalCost)}</p>
              )}
            </div>
            {job.rating && (
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.accent + '10' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Customer Rating:</span>
                  <StarRating rating={job.rating} readonly size="sm" />
                </div>
                {job.feedback && <p className="text-sm italic mt-2" style={{ color: colors.textSecondary }}>"{job.feedback}"</p>}
              </div>
            )}
          </div>
        )}

        {/* Photos */}
        {(job.photos?.length > 0 || job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && (
          <div className="border-t pt-4" style={{ borderColor: colors.border }}>
            <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}><Image className="w-4 h-4 inline mr-1" /> Photos</h4>
            <div className="space-y-3">
              {job.photos?.length > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>Issue Photos:</p>
                  <div className="flex flex-wrap gap-2">
                    {job.photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-20 h-20 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
                        <img src={url} alt={`Issue ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {job.beforePhotos?.length > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>Before:</p>
                  <div className="flex flex-wrap gap-2">
                    {job.beforePhotos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-20 h-20 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
                        <img src={url} alt={`Before ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {job.afterPhotos?.length > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>After:</p>
                  <div className="flex flex-wrap gap-2">
                    {job.afterPhotos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-20 h-20 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
                        <img src={url} alt={`After ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t" style={{ borderColor: colors.border }}>
          {isManager && (
            <>
              <Button variant="secondary" icon={Download} onClick={() => onDownloadJobSheet(job)}>PDF</Button>
              <Button variant="secondary" icon={FileText} onClick={() => onExportToExcel(job)}>Excel</Button>
            </>
          )}
          <Button variant="secondary" className="flex-1" onClick={handleClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default JobDetailsModal;
