// FieldSync v2 - Manager/Office All Jobs Page (Table View)
// Extracted from App.js ManagerJobsView (~line 1877)
import React, { useState } from 'react';
import { Search, Plus, AlertCircle, Briefcase, Trash2, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContextV2';
import { useData } from '../../context/DataContext';
import { useJobs } from '../../hooks/useJobs';
import { Badge, Button, EmptyState, StarRating } from '../../components/ui';
import { getStatusVariant } from '../../constants/statusMaps';
import { formatCurrency } from '../../utils/formatters';

const ManagerJobsPage = ({ onOpenAssignModal, onOpenJobDetails, onOpenSOModal, onOpenReportIssue, onOpenAddEquipment }) => {
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const { users, jobs } = useData();
  const { deleteJob, exportToExcel } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const canSeePricing = false; // Pricing disabled for now

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.soNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>All Jobs</h2>
        <div className="flex items-center space-x-3">
          <Button icon={Plus} size="sm" onClick={onOpenAddEquipment}>Add Equipment</Button>
          <Button icon={AlertCircle} size="sm" variant="danger" onClick={onOpenReportIssue}>Report Issue</Button>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textSecondary }} />
            <input
              type="text" placeholder="Search jobs or SO#..."
              className="input pl-9 py-2 text-sm" style={{ width: '200px' }}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="input py-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="ready-to-bill">Ready to Bill</option>
            <option value="billed">Billed</option>
            <option value="needs-followup">Needs Follow-up</option>
          </select>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No Jobs Found" description="No jobs match your search criteria." />
      ) : (
        <div className="card overflow-hidden" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: colors.background }}>
                <tr>
                  <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Job</th>
                  <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>SO #</th>
                  <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Status</th>
                  <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Priority</th>
                  <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Assigned To</th>
                  <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Rating</th>
                  {canSeePricing && <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Cost</th>}
                  <th className="text-right p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => (
                  <tr key={job.id} className="border-t hover:bg-gray-50" style={{ borderColor: colors.border }}>
                    <td className="p-4">
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{job.pivotName}</p>
                    </td>
                    <td className="p-4">
                      {job.soNumber ? (
                        <span className="text-sm font-mono" style={{ color: colors.primary }}>{job.soNumber}</span>
                      ) : (
                        <button className="text-sm underline" style={{ color: colors.water }} onClick={() => onOpenSOModal(job)}>Add SO#</button>
                      )}
                    </td>
                    <td className="p-4"><Badge variant={getStatusVariant(job.status)}>{job.status}</Badge></td>
                    <td className="p-4"><Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>{job.priority}</Badge></td>
                    <td className="p-4 text-sm" style={{ color: colors.textSecondary }}>
                      {(() => {
                        const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
                        if (assignees.length === 0) return '-';
                        return assignees.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ') || '-';
                      })()}
                    </td>
                    <td className="p-4">
                      {job.rating ? <StarRating rating={job.rating} readonly size="sm" /> : <span className="text-sm" style={{ color: colors.muted }}>-</span>}
                    </td>
                    {canSeePricing && <td className="p-4 text-sm font-medium" style={{ color: colors.textPrimary }}>{job.totalCost ? formatCurrency(job.totalCost) : '-'}</td>}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {job.status === 'pending' ? (
                          <Button size="sm" onClick={() => onOpenAssignModal(job)}>Assign</Button>
                        ) : ['assigned', 'in-progress'].includes(job.status) ? (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => onOpenAssignModal(job)}>Edit Team</Button>
                            <Button size="sm" variant="secondary" onClick={() => onOpenJobDetails(job)}>View</Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => onOpenJobDetails(job)}>View</Button>
                            {['completed', 'billed', 'ready-to-bill'].includes(job.status) && (
                              <Button size="sm" variant="secondary" icon={FileSpreadsheet} onClick={() => exportToExcel(job)} title="Export to Excel" />
                            )}
                          </>
                        )}
                        {['manager', 'office'].includes(userProfile?.role) && (
                          <button
                            onClick={() => deleteJob(job.id, job.title)}
                            className="p-2 rounded text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete job"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerJobsPage;
