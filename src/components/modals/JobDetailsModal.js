// ============================================
// JOB DETAILS MODAL - with manager inline editing
// ============================================
import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, Trash2, Download, FileText, Hash, UserPlus, Image, Pencil, Save, X
} from 'lucide-react';
import { Modal, Button, Input, Select, Badge, StarRating } from '../ui';
import StatusDropdown from '../StatusDropdown';

const JobDetailsModal = ({
  isOpen,
  onClose,
  job,
  users,
  userProfile,
  canSeePricing,
  isLoading,
  colors,
  equipment,
  // Handlers
  onAddManualTimeEntry,
  onDeleteTimeEntry,
  onDownloadJobSheet,
  onExportToExcel,
  onOpenSOModal,
  onOpenAssignModal,
  onStatusChange,
  onUpdateJob,
  // Formatters
  formatDate,
  formatCurrency,
  getStatusVariant
}) => {
  const [showAddTimeEntry, setShowAddTimeEntry] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [manualTimeData, setManualTimeData] = useState({
    techId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    lunchTaken: false,
    notes: ''
  });

  // Reset edit state when job changes or modal opens
  useEffect(() => {
    if (job) {
      setEditData({
        title: job.title || '',
        description: job.description || '',
        priority: job.priority || 'low',
        soNumber: job.soNumber || '',
        pivotId: job.pivotId || '',
        farmerId: job.farmerId || ''
      });
    }
    setEditing(false);
  }, [job]);

  if (!job) return null;

  const isManager = userProfile?.role === 'manager';
  const isOffice = userProfile?.role === 'office';
  const canEdit = (isManager || isOffice) && !!onUpdateJob;

  const assigneeIds = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
  const assignedTechs = assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean);
  const farmer = users.find(u => u.id === (editing ? editData.farmerId : job.farmerId));
  const timeEntries = job.timeEntries || [];
  const techs = users.filter(u => u.role === 'tech' || u.role === 'manager');
  const farmers = users.filter(u => u.role === 'farmer');
  const isStaff = ['tech', 'manager', 'office'].includes(userProfile?.role);
  const pivotEquipment = equipment || [];

  // Get pivot name for display
  const currentPivot = pivotEquipment.find(p => p.id === (editing ? editData.pivotId : job.pivotId));
  const pivotName = currentPivot?.name || job.pivotName || 'N/A';

  const handleSave = async () => {
    setSaving(true);
    const updates = {};
    if (editData.title !== job.title) updates.title = editData.title;
    if (editData.description !== job.description) updates.description = editData.description;
    if (editData.priority !== job.priority) updates.priority = editData.priority;
    if (editData.soNumber !== (job.soNumber || '')) updates.soNumber = editData.soNumber;
    if (editData.farmerId !== job.farmerId) updates.farmerId = editData.farmerId;
    if (editData.pivotId !== job.pivotId) {
      updates.pivotId = editData.pivotId;
      const newPivot = pivotEquipment.find(p => p.id === editData.pivotId);
      if (newPivot) updates.pivotName = newPivot.name;
    }

    if (Object.keys(updates).length > 0) {
      await onUpdateJob(job.id, updates);
    }
    setSaving(false);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditData({
      title: job.title || '',
      description: job.description || '',
      priority: job.priority || 'low',
      soNumber: job.soNumber || '',
      pivotId: job.pivotId || '',
      farmerId: job.farmerId || ''
    });
    setEditing(false);
  };

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

  const handleAddManualTime = async () => {
    if (!manualTimeData.techId) return;
    const tech = users.find(u => u.id === manualTimeData.techId);
    const startDateTime = new Date(`${manualTimeData.date}T${manualTimeData.startTime}`);
    const endDateTime = new Date(`${manualTimeData.date}T${manualTimeData.endTime}`);
    if (endDateTime <= startDateTime) return;

    const result = await onAddManualTimeEntry(
      job.id, manualTimeData.techId, tech?.name || 'Unknown',
      startDateTime.toISOString(), endDateTime.toISOString(),
      manualTimeData.lunchTaken, manualTimeData.notes
    );

    if (result?.success) {
      setShowAddTimeEntry(false);
      setManualTimeData({ techId: '', date: new Date().toISOString().split('T')[0], startTime: '08:00', endTime: '17:00', lunchTaken: false, notes: '' });
    }
  };

  const handleClose = () => {
    setShowAddTimeEntry(false);
    setEditing(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Job Details" size="lg">
      <div className="space-y-4">
        {/* Header with title + status/priority */}
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-4">
            {editing ? (
              <input
                type="text"
                value={editData.title}
                onChange={e => setEditData({...editData, title: e.target.value})}
                className="w-full text-lg font-bold rounded px-2 py-1"
                style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
              />
            ) : (
              <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>{job.title}</h3>
            )}
            {editing ? (
              <input
                type="text"
                value={editData.soNumber}
                onChange={e => setEditData({...editData, soNumber: e.target.value})}
                placeholder="SO Number"
                className="text-sm font-mono rounded px-2 py-1 mt-1"
                style={{ backgroundColor: colors.inputBg, color: colors.primary, border: `1px solid ${colors.border}` }}
              />
            ) : (
              job.soNumber && <p className="text-sm font-mono" style={{ color: colors.primary }}>SO# {job.soNumber}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded transition-colors"
                title="Edit job details"
                style={{ color: colors.water }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.water + '20'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {editing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-1.5 rounded transition-colors"
                  title="Save changes"
                  style={{ color: colors.success }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.success + '20'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 rounded transition-colors"
                  title="Cancel editing"
                  style={{ color: colors.danger }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.danger + '20'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
            <StatusDropdown jobId={job.id} currentStatus={job.status} onStatusChange={onStatusChange} />
            {editing ? (
              <select
                value={editData.priority}
                onChange={e => setEditData({...editData, priority: e.target.value})}
                className="text-xs rounded px-2 py-1"
                style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            ) : (
              <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>
                {job.priority}
              </Badge>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: colors.background }}>
          <div className="flex justify-between items-center">
            <span style={{ color: colors.textSecondary }}>Location:</span>
            {editing ? (
              <select
                value={editData.pivotId}
                onChange={e => setEditData({...editData, pivotId: e.target.value})}
                className="text-sm rounded px-2 py-1"
                style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
              >
                <option value="">Select equipment...</option>
                {pivotEquipment.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <span style={{ color: colors.textPrimary }}>{pivotName}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span style={{ color: colors.textSecondary }}>Reported:</span>
            <span style={{ color: colors.textPrimary }}>{formatDate(job.createdAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: colors.textSecondary }}>Customer:</span>
            {editing ? (
              <select
                value={editData.farmerId}
                onChange={e => setEditData({...editData, farmerId: e.target.value})}
                className="text-sm rounded px-2 py-1"
                style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
              >
                <option value="">Select customer...</option>
                {farmers.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            ) : (
              <span style={{ color: colors.textPrimary }}>{farmer?.name || 'Unknown'}</span>
            )}
          </div>
          {assignedTechs.length > 0 && (
            <div className="flex justify-between">
              <span style={{ color: colors.textSecondary }}>Assigned To:</span>
              <span style={{ color: colors.textPrimary }}>{assignedTechs.map(t => t.name).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <h4 className="font-medium mb-2" style={{ color: colors.textPrimary }}>Description</h4>
          {editing ? (
            <textarea
              value={editData.description}
              onChange={e => setEditData({...editData, description: e.target.value})}
              rows={4}
              className="w-full text-sm rounded px-3 py-2"
              style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, border: `1px solid ${colors.border}`, resize: 'vertical' }}
            />
          ) : (
            <p className="text-sm" style={{ color: colors.textSecondary }}>{job.description}</p>
          )}
        </div>

        {job.leavePivotRunning && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.warning + '15' }}>
            <p className="text-sm font-medium" style={{ color: colors.warning }}>
              ⚠️ Pivot left running: {job.pivotDirection} at {job.pivotPercentage}%
            </p>
          </div>
        )}

        {/* Time Tracking Section */}
        {isStaff && (
          <div className="border-t pt-4" style={{ borderColor: colors.border }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center" style={{ color: colors.textPrimary }}>
                <Clock className="w-4 h-4 mr-2" /> Time Tracking
              </h4>
              {(isManager || isOffice) && (
                <Button size="sm" icon={Plus} onClick={() => setShowAddTimeEntry(!showAddTimeEntry)}>
                  Add Time
                </Button>
              )}
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
                  <Input label="Start Time" type="time" value={manualTimeData.startTime} onChange={e => setManualTimeData({...manualTimeData, startTime: e.target.value})} />
                  <Input label="End Time" type="time" value={manualTimeData.endTime} onChange={e => setManualTimeData({...manualTimeData, endTime: e.target.value})} />
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={manualTimeData.lunchTaken} onChange={e => setManualTimeData({...manualTimeData, lunchTaken: e.target.checked})} className="rounded" />
                  <span className="text-sm" style={{ color: colors.textPrimary }}>Lunch taken (30 min)</span>
                </label>
                <Input label="Notes (optional)" placeholder="Travel time, special circumstances, etc." value={manualTimeData.notes} onChange={e => setManualTimeData({...manualTimeData, notes: e.target.value})} />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleAddManualTime} loading={isLoading}>Save Entry</Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowAddTimeEntry(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Time Entries by Technician */}
            {Object.keys(byTech).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(byTech).map(([techId, data]) => (
                  <div key={techId} className="p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium" style={{ color: colors.textPrimary }}>{data.techName}</span>
                      <span className="font-bold" style={{ color: colors.primary }}>{data.totalHours.toFixed(2)} hrs</span>
                    </div>
                    <div className="space-y-1">
                      {data.entries.map((entry, idx) => (
                        <div key={entry.id || idx} className="flex items-center justify-between text-xs p-2 rounded" style={{ backgroundColor: colors.cardBg }}>
                          <div className="flex items-center space-x-3">
                            <span style={{ color: colors.textSecondary }}>{formatDateDisplay(entry.startTime)}</span>
                            <span style={{ color: colors.textPrimary }}>
                              {formatTimeDisplay(entry.startTime)} - {formatTimeDisplay(entry.endTime)}
                            </span>
                            {entry.lunchTaken && <span className="px-1 rounded text-xs" style={{ backgroundColor: colors.warning + '20', color: colors.warning }}>-30m lunch</span>}
                            {entry.manualEntry && <span className="px-1 rounded text-xs" style={{ backgroundColor: colors.water + '20', color: colors.water }}>manual</span>}
                            {!entry.endTime && <span className="px-1 rounded text-xs" style={{ backgroundColor: colors.success + '20', color: colors.success }}>active</span>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium" style={{ color: colors.textPrimary }}>{entry.hours.toFixed(2)}h</span>
                            {(isManager || isOffice) && entry.endTime && (
                              <button onClick={() => onDeleteTimeEntry(job.id, entry.id)} className="p-1 rounded" title="Delete entry"
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.danger + '15'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}>
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
                  <span className="font-bold" style={{ color: colors.primary }}>Total Time (All Techs)</span>
                  <span className="text-lg font-bold" style={{ color: colors.primary }}>{grandTotal.toFixed(2)} hours</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>No time entries recorded yet</p>
            )}
          </div>
        )}

        {/* Service Entry History — full timeline from creation to completion */}
        {(job.serviceEntries?.length > 0) && (
          <div className="border-t pt-4" style={{ borderColor: colors.border }}>
            <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
              Service History ({job.serviceEntries.length} {job.serviceEntries.length === 1 ? 'entry' : 'entries'})
            </h4>
            <div className="space-y-3">
              {job.serviceEntries.map((entry, idx) => {
                const entryDate = entry.date ? new Date(entry.date) : null;
                const techName = entry.completedBy
                  ? (typeof entry.completedBy === 'object'
                    ? (entry.completedBy.name || users.find(u => u.id === entry.completedBy.id)?.name || 'Unknown')
                    : (users.find(u => u.id === entry.completedBy)?.name || 'Unknown'))
                  : '';
                const isFinal = idx === job.serviceEntries.length - 1 && !entry.needsFollowUp;
                return (
                  <div key={entry.id || idx} className="p-3 rounded-lg" style={{ backgroundColor: isFinal ? colors.success + '10' : colors.background, border: `1px solid ${isFinal ? colors.success + '30' : colors.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: isFinal ? colors.success + '20' : colors.warning + '20', color: isFinal ? colors.success : colors.warning }}>
                          {isFinal ? 'COMPLETED' : `DAY ${idx + 1}`}
                        </span>
                        {entryDate && <span className="text-xs" style={{ color: colors.textSecondary }}>{entryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                      </div>
                      {techName && <span className="text-xs" style={{ color: colors.textSecondary }}>{techName}</span>}
                    </div>
                    {entry.workDescription && (
                      <p className="text-sm mb-2 whitespace-pre-line" style={{ color: colors.textPrimary }}>{entry.workDescription}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: colors.textSecondary }}>
                      {entry.hoursWorked > 0 && <span>{entry.hoursWorked.toFixed?.(2) || entry.hoursWorked} hrs</span>}
                      {entry.milesDriven > 0 && <span>{entry.milesDriven} mi</span>}
                      {entry.vehicleNumber && <span>Truck #{entry.vehicleNumber}</span>}
                      {entry.partsUsed?.length > 0 && (
                        <span>{entry.partsUsed.length} part{entry.partsUsed.length > 1 ? 's' : ''}</span>
                      )}
                      {entry.timeEntries?.length > 0 && (
                        <span>{entry.timeEntries.length} time {entry.timeEntries.length === 1 ? 'entry' : 'entries'}</span>
                      )}
                    </div>
                    {entry.partsUsed?.length > 0 && (
                      <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        Parts: {entry.partsUsed.map(p => typeof p === 'object' ? `${p.partNumber} x${p.quantity}${p.truckLocationName ? ' [' + p.truckLocationName + ']' : ''}` : p).join(', ')}
                      </p>
                    )}
                    {entry.needsFollowUp && entry.followUpNotes && (
                      <p className="text-xs mt-1 italic" style={{ color: colors.warning }}>Follow-up: {entry.followUpNotes}</p>
                    )}
                    {(entry.beforePhotos?.length > 0 || entry.afterPhotos?.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(entry.beforePhotos || []).map((url, i) => (
                          <a key={`b${i}`} href={url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded overflow-hidden border" style={{ borderColor: colors.border }}>
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </a>
                        ))}
                        {(entry.afterPhotos || []).map((url, i) => (
                          <a key={`a${i}`} href={url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded overflow-hidden border" style={{ borderColor: colors.success + '40' }}>
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Running totals across all entries */}
            {job.serviceEntries.length > 1 && (() => {
              const totalHrs = job.serviceEntries.reduce((s, e) => s + (e.hoursWorked || 0), 0);
              const totalMi = job.serviceEntries.reduce((s, e) => s + (e.milesDriven || 0), 0);
              const totalParts = job.serviceEntries.reduce((s, e) => s + (e.partsUsed?.length || 0), 0);
              return (
                <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: colors.primary + '10', border: `1px solid ${colors.primary}30` }}>
                  <p className="text-xs font-bold mb-1" style={{ color: colors.primary }}>RUNNING TOTALS</p>
                  <div className="flex flex-wrap gap-4 text-sm" style={{ color: colors.textPrimary }}>
                    <span>{totalHrs.toFixed(2)} total hrs</span>
                    <span>{totalMi} total miles</span>
                    <span>{totalParts} parts used</span>
                    <span>{job.serviceEntries.length} visits</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        {/* Legacy completion details for jobs completed before service entries existed */}
        {!job.serviceEntries?.length && job.status === 'completed' && job.workDescription && (
          <div className="border-t pt-4" style={{ borderColor: colors.border }}>
            <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>Completion Details</h4>
            <div className="p-4 rounded-lg space-y-2" style={{ backgroundColor: colors.success + '10' }}>
              <p className="text-sm"><strong>Work Done:</strong> {job.workDescription}</p>
              {job.partsUsed?.length > 0 && (
                <p className="text-sm">
                  <strong>Parts:</strong> {Array.isArray(job.partsUsed) 
                    ? job.partsUsed.map(p => typeof p === 'object' ? `${p.partNumber} (${p.quantity})${p.truckLocationName ? ' [' + p.truckLocationName + ']' : ''}` : p).join(', ')
                    : job.partsUsed}
                </p>
              )}
              <div className="flex justify-between text-sm">
                <span>Hours: {job.hoursWorked}</span>
                <span>Miles: {job.milesDriven}</span>
              </div>
            </div>
          </div>
        )}
        {/* Customer Rating */}
        {job.rating && (
          <div className="border-t pt-4" style={{ borderColor: colors.border }}>
            <div className="p-3 rounded-lg" style={{ backgroundColor: colors.accent + '10' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Customer Rating:</span>
                <StarRating rating={job.rating} readonly size="sm" />
              </div>
              {job.feedback && <p className="text-sm italic mt-2" style={{ color: colors.textSecondary }}>"{job.feedback}"</p>}
            </div>
          </div>
        )}

        {/* Photos */}
        {(job.photos?.length > 0 || job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && (
          <div className="border-t pt-4" style={{ borderColor: colors.border }}>
            <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
              <Image className="w-4 h-4 inline mr-1" /> Photos
            </h4>
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

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-4">
          {job.status === 'completed' && (isManager || isOffice) && (
            <>
              <Button variant="secondary" icon={Download} onClick={() => onDownloadJobSheet(job)}>Download PDF</Button>
              <Button variant="secondary" icon={FileText} onClick={() => onExportToExcel(job)}>Export Excel</Button>
            </>
          )}
          {(isManager || isOffice) && !job.soNumber && !editing && (
            <Button variant="secondary" icon={Hash} onClick={onOpenSOModal}>Add SO#</Button>
          )}
          {job.status === 'pending' && (isManager || isOffice) && (
            <Button icon={UserPlus} onClick={onOpenAssignModal}>Assign</Button>
          )}
          <Button variant="secondary" className="flex-1" onClick={handleClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default JobDetailsModal;