// FieldSync v2 - Manager/Office All Jobs Page (Table View)
// Extracted from App.js ManagerJobsView (~line 1877)
import React, { useState, useMemo } from 'react';
import { Search, Plus, AlertCircle, Briefcase, Trash2, FileSpreadsheet, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContextV2';
import { useData } from '../../context/DataContext';
import { useJobs } from '../../hooks/useJobs';
import { Badge, Button, EmptyState } from '../../components/ui';
import StatusDropdown from '../../components/StatusDropdown';
import { formatCurrency } from '../../utils/formatters';

const ManagerJobsPage = ({ onOpenAssignModal, onOpenJobDetails, onOpenSOModal, onOpenReportIssue, onOpenAddEquipment }) => {
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const { users, jobs } = useData();
  const { deleteJob, exportToExcel, updateJobStatus } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [sortField, setSortField] = useState('soNumber'); // 'date' or 'soNumber'
  const [sortDir, setSortDir] = useState('asc');

  const canSeePricing = false; // Pricing disabled for now
  const isManager = userProfile?.role === 'manager';

  const INACTIVE = ['ready-to-bill', 'billed', 'canceled'];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const farmerName = users.find(u => u.id === job.farmerId)?.name || job.farmerName || '';
    const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.soNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmerName.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter;
    if (filterStatus === 'all') matchesFilter = true;
    else if (filterStatus === 'active') matchesFilter = !INACTIVE.includes(job.status);
    else if (filterStatus === 'inactive') matchesFilter = INACTIVE.includes(job.status);
    else matchesFilter = job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const sortedJobs = useMemo(() => {
    const sorted = [...filteredJobs].sort((a, b) => {
      if (sortField === 'soNumber') {
        const aHas = !!a.soNumber?.trim();
        const bHas = !!b.soNumber?.trim();
        // Jobs with no SO# always at top
        if (!aHas && bHas) return -1;
        if (aHas && !bHas) return 1;
        if (!aHas && !bHas) return 0;
        const cmp = a.soNumber.localeCompare(b.soNumber, undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      }
      if (sortField === 'date') {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return sortDir === 'asc' ? aDate - bDate : bDate - aDate;
      }
      return 0;
    });
    return sorted;
  }, [filteredJobs, sortField, sortDir]);

  const SortArrow = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 ml-1 opacity-30 inline" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1 inline" style={{ color: colors.primary }} />
      : <ChevronDown className="w-3 h-3 ml-1 inline" style={{ color: colors.primary }} />;
  };

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
            <option value="active">Active Jobs</option>
            <option value="inactive">Inactive Jobs</option>
            <option value="all">All Jobs</option>
            <option disabled>───────────</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="needs-followup">Needs Follow-up</option>
            <option value="ready-to-bill">Ready to Bill</option>
            <option value="billed">Billed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No Jobs Found" description="No jobs match your search criteria." />
      ) : (
        <div className="card overflow-hidden" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <p className="text-xs sm:hidden mb-2 px-4 pt-4" style={{ color: colors.textSecondary }}>
            Swipe to see more columns →
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: colors.background }}>
                <tr>
                  <th className="text-left p-4 text-sm font-semibold cursor-pointer select-none" style={{ color: colors.textSecondary }} onClick={() => handleSort('soNumber')}>SO # <SortArrow field="soNumber" /></th>
                  <th className="text-left p-4 text-sm font-semibold cursor-pointer select-none" style={{ color: colors.textSecondary }} onClick={() => handleSort('date')}>Date <SortArrow field="date" /></th>
                  <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Customer</th>
                  <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Job</th>
                  <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Status</th>
                  <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Priority</th>
                  <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Assigned To</th>
                  {canSeePricing && <th className="text-left p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Cost</th>}
                  <th className="text-right p-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedJobs.map(job => (
                  <tr
                    key={job.id}
                    className="border-t cursor-pointer"
                    style={{ borderColor: colors.border }}
                    onClick={() => onOpenJobDetails(job)}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.inputBg; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
                  >
                    <td className="p-4">
                      {job.soNumber ? (
                        <span className="text-sm font-mono" style={{ color: colors.primary }}>{job.soNumber}</span>
                      ) : (
                        isManager ? (
                          <button className="text-sm underline" style={{ color: colors.water }} onClick={(e) => { e.stopPropagation(); onOpenSOModal(job); }}>Add SO#</button>
                        ) : (
                          <span className="text-xs" style={{ color: colors.muted }}>—</span>
                        )
                      )}
                    </td>
                    <td className="p-4 text-sm" style={{ color: colors.textSecondary }}>
                      {(() => {
                        const d = job.createdAt?.toDate ? job.createdAt.toDate() : job.createdAt ? new Date(job.createdAt) : null;
                        return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                      })()}
                    </td>
                    <td className="p-4 text-sm" style={{ color: colors.textSecondary }}>
                      {(() => {
                        const farmer = users.find(u => u.id === job.farmerId);
                        return farmer?.name || job.farmerName || '-';
                      })()}
                    </td>
                    <td className="p-4">
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{job.pivotName}</p>
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      {isManager ? (
                        <StatusDropdown jobId={job.id} currentStatus={job.status} onStatusChange={updateJobStatus} />
                      ) : (
                        <Badge variant={
                          ['completed', 'ready-to-bill', 'billed'].includes(job.status) ? 'success' :
                          job.status === 'in-progress' ? 'water' :
                          job.status === 'needs-followup' ? 'warning' :
                          job.status === 'canceled' ? 'danger' : 'default'
                        }>{job.status?.replace(/-/g, ' ')}</Badge>
                      )}
                    </td>
                    <td className="p-4"><Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>{job.priority}</Badge></td>
                    <td className="p-4 text-sm" style={{ color: colors.textSecondary }}>
                      {(() => {
                        const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
                        if (assignees.length === 0) return '-';
                        return assignees.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ') || '-';
                      })()}
                    </td>
                    {canSeePricing && <td className="p-4 text-sm font-medium" style={{ color: colors.textPrimary }}>{job.totalCost ? formatCurrency(job.totalCost) : '-'}</td>}
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        {isManager && job.status === 'pending' ? (
                          <Button size="sm" onClick={() => onOpenAssignModal(job)}>Assign</Button>
                        ) : isManager && ['assigned', 'in-progress', 'needs-followup'].includes(job.status) ? (
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
                        {isManager && (
                          <button
                            onClick={() => deleteJob(job.id, job.title)}
                            className="p-2 rounded text-red-500 transition-colors"
                            title="Delete job"
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.danger + '15'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
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
