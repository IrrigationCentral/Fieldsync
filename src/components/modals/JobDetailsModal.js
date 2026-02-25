// ============================================
// JOB DETAILS MODAL
// ============================================
import React, { useState } from 'react';
import { 
  Clock, Plus, Trash2, Download, FileText, Hash, UserPlus, Image
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
  // Handlers
  onAddManualTimeEntry,
  onDeleteTimeEntry,
  onDownloadJobSheet,
  onExportToExcel,
  onOpenSOModal,
  onOpenAssignModal,
  onStatusChange,
  // Formatters
  formatDate,
  formatCurrency,
  getStatusVariant
}) => {
  const [showAddTimeEntry, setShowAddTimeEntry] = useState(false);
  const [manualTimeData, setManualTimeData] = useState({
    techId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    lunchTaken: false,
    notes: ''
  });

  if (!job) return null;

  const assigneeIds = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
  const assignedTechs = assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean);
  const farmer = users.find(u => u.id === job.farmerId);
  const timeEntries = job.timeEntries || [];
  const techs = users.filter(u => u.role === 'tech' || u.role === 'manager');
  const isStaff = ['tech', 'manager', 'office'].includes(userProfile?.role);

  // Calculate hours for a single entry
  const calculateEntryHours = (entry) => {
    if (!entry.startTime || !entry.endTime) return 0;
    const start = new Date(entry.startTime);
    const end = new Date(entry.endTime);
    const hours = (end - start) / (1000 * 60 * 60);
    const lunchDeduction = entry.lunchTaken ? 0.5 : 0;
    return Math.max(0, hours - lunchDeduction);
  };

  // Group time entries by tech and calculate totals
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

  // Format time for display
  const formatTimeDisplay = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDisplay = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle adding manual time entry
  const handleAddManualTime = async () => {
    if (!manualTimeData.techId) {
      return; // Should show notification
    }
    const tech = users.find(u => u.id === manualTimeData.techId);
    const startDateTime = new Date(`${manualTimeData.date}T${manualTimeData.startTime}`);
    const endDateTime = new Date(`${manualTimeData.date}T${manualTimeData.endTime}`);
    
    if (endDateTime <= startDateTime) {
      return; // Should show notification
    }

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
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Job Details" size="lg">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>{job.title}</h3>
            {job.soNumber && <p className="text-sm font-mono" style={{ color: colors.primary }}>SO# {job.soNumber}</p>}
          </div>
          <div className="flex space-x-2">
            <StatusDropdown jobId={job.id} currentStatus={job.status} onStatusChange={onStatusChange} />
            <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>
              {job.priority}
            </Badge>
          </div>
        </div>

        <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: colors.background }}>
          <div className="flex justify-between">
            <span style={{ color: colors.textSecondary }}>Location:</span>
            <span style={{ color: colors.textPrimary }}>{job.pivotName || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: colors.textSecondary }}>Reported:</span>
            <span style={{ color: colors.textPrimary }}>{formatDate(job.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: colors.textSecondary }}>Customer:</span>
            <span style={{ color: colors.textPrimary }}>{farmer?.name || 'Unknown'}</span>
          </div>
          {assignedTechs.length > 0 && (
            <div className="flex justify-between">
              <span style={{ color: colors.textSecondary }}>Assigned To:</span>
              <span style={{ color: colors.textPrimary }}>{assignedTechs.map(t => t.name).join(', ')}</span>
            </div>
          )}
        </div>

        <div>
          <h4 className="font-medium mb-2" style={{ color: colors.textPrimary }}>Description</h4>
          <p className="text-sm" style={{ color: colors.textSecondary }}>{job.description}</p>
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
              {(userProfile?.role === 'manager' || userProfile?.role === 'office') && (
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
                  <Input
                    label="Date"
                    type="date"
                    value={manualTimeData.date}
                    onChange={e => setManualTimeData({...manualTimeData, date: e.target.value})}
                  />
                  <Input
                    label="Start Time"
                    type="time"
                    value={manualTimeData.startTime}
                    onChange={e => setManualTimeData({...manualTimeData, startTime: e.target.value})}
                  />
                  <Input
                    label="End Time"
                    type="time"
                    value={manualTimeData.endTime}
                    onChange={e => setManualTimeData({...manualTimeData, endTime: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualTimeData.lunchTaken}
                      onChange={e => setManualTimeData({...manualTimeData, lunchTaken: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm" style={{ color: colors.textPrimary }}>Lunch taken (30 min)</span>
                  </label>
                </div>
                <Input
                  label="Notes (optional)"
                  placeholder="Travel time, special circumstances, etc."
                  value={manualTimeData.notes}
                  onChange={e => setManualTimeData({...manualTimeData, notes: e.target.value})}
                />
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
                            {entry.lunchTaken && (
                              <span className="px-1 rounded text-xs" style={{ backgroundColor: colors.warning + '20', color: colors.warning }}>
                                -30m lunch
                              </span>
                            )}
                            {entry.manualEntry && (
                              <span className="px-1 rounded text-xs" style={{ backgroundColor: colors.water + '20', color: colors.water }}>
                                manual
                              </span>
                            )}
                            {!entry.endTime && (
                              <span className="px-1 rounded text-xs" style={{ backgroundColor: colors.success + '20', color: colors.success }}>
                                active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium" style={{ color: colors.textPrimary }}>{entry.hours.toFixed(2)}h</span>
                            {(userProfile?.role === 'manager' || userProfile?.role === 'office') && entry.endTime && (
                              <button
                                onClick={() => onDeleteTimeEntry(job.id, entry.id)}
                                className="p-1 rounded hover:bg-red-100"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3 h-3" style={{ color: colors.danger }} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Grand Total */}
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: colors.primary + '15' }}>
                  <span className="font-bold" style={{ color: colors.primary }}>Total Time (All Techs)</span>
                  <span className="text-lg font-bold" style={{ color: colors.primary }}>{grandTotal.toFixed(2)} hours</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>
                No time entries recorded yet
              </p>
            )}
          </div>
        )}

        {job.status === 'completed' && (
          <div className="border-t pt-4" style={{ borderColor: colors.border }}>
            <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>Completion Details</h4>
            <div className="p-4 rounded-lg space-y-2" style={{ backgroundColor: colors.success + '10' }}>
              <p className="text-sm"><strong>Work Done:</strong> {job.workDescription}</p>
              {job.partsUsed?.length > 0 && (
                <p className="text-sm">
                  <strong>Parts:</strong> {Array.isArray(job.partsUsed) 
                    ? job.partsUsed.map(p => typeof p === 'object' ? `${p.partNumber} (${p.quantity})` : p).join(', ')
                    : job.partsUsed}
                </p>
              )}
              <div className="flex justify-between text-sm">
                <span>Hours: {job.hoursWorked}</span>
                <span>Miles: {job.milesDriven}</span>
              </div>
              {canSeePricing && (
                <p className="text-lg font-bold mt-2" style={{ color: colors.success }}>
                  Total: {formatCurrency(job.totalCost)}
                </p>
              )}
            </div>
            
            {/* Customer Rating */}
            {job.rating && (
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.accent + '10' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Customer Rating:</span>
                  <StarRating rating={job.rating} readonly size="sm" />
                </div>
                {job.feedback && (
                  <p className="text-sm italic mt-2" style={{ color: colors.textSecondary }}>"{job.feedback}"</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Photos Section */}
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

        <div className="flex flex-wrap gap-2 pt-4">
          {job.status === 'completed' && (userProfile?.role === 'manager' || userProfile?.role === 'office') && (
            <>
              <Button variant="secondary" icon={Download} onClick={() => onDownloadJobSheet(job)}>
                Download PDF
              </Button>
              <Button variant="secondary" icon={FileText} onClick={() => onExportToExcel(job)}>
                Export Excel
              </Button>
            </>
          )}
          {(userProfile?.role === 'manager' || userProfile?.role === 'office') && !job.soNumber && (
            <Button variant="secondary" icon={Hash} onClick={onOpenSOModal}>
              Add SO#
            </Button>
          )}
          {job.status === 'pending' && (userProfile?.role === 'manager' || userProfile?.role === 'office') && (
            <Button icon={UserPlus} onClick={onOpenAssignModal}>
              Assign
            </Button>
          )}
          <Button variant="secondary" className="flex-1" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default JobDetailsModal;
