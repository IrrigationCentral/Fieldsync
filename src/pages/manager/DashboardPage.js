// FieldSync v2 - Manager Dashboard Page
// Extracted from App.js ManagerDashboard (~line 1783)
import React from 'react';
import { Clock, Wrench, CheckCircle, Users, Phone, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useJobs } from '../../hooks/useJobs';
import { StatCard, Badge, Button } from '../../components/ui';

const ManagerDashboard = ({ onOpenAssignModal, onOpenReportIssue, onOpenAddEquipment, onOpenJobDetails }) => {
  const { colors } = useTheme();
  const { users, jobs } = useData();
  const { deleteJob } = useJobs();

  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const assignedJobs = jobs.filter(j => ['assigned', 'in-progress', 'needs-followup'].includes(j.status));
  const completedJobs = jobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status));
  const techs = users.filter(u => u.role === 'tech');


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-3" style={{ color: colors.primary }}>Manager Dashboard</h2>
        <div className="flex flex-wrap gap-2">
          <Button icon={Phone} size="sm" onClick={onOpenReportIssue}>New Call In</Button>
          <Button icon={Plus} size="sm" variant="secondary" onClick={onOpenAddEquipment}>Add Equipment</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Pending Jobs" value={pendingJobs.length} icon={Clock} color={colors.warning} />
        <StatCard title="In Progress" value={assignedJobs.length} icon={Wrench} color={colors.water} />
        <StatCard title="Completed" value={completedJobs.length} icon={CheckCircle} color={colors.success} />
        <StatCard title="Technicians" value={techs.length} icon={Users} color={colors.accent} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Jobs */}
        <div className="card p-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Pending Jobs ({pendingJobs.length})</h3>
          {pendingJobs.length === 0 ? (
            <p className="text-center py-6" style={{ color: colors.textSecondary }}>No pending jobs</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pendingJobs.map(job => (
                <div key={job.id} className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: colors.background }}>
                  <div className="flex-1 cursor-pointer" onClick={() => onOpenJobDetails && onOpenJobDetails(job)}>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</p>
                      <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>{job.priority}</Badge>
                    </div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{job.pivotName || 'Location TBD'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); onOpenAssignModal(job); }}>Assign</Button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteJob(job.id, job.title); }}
                      className="p-2 rounded text-red-500 transition-colors"
                      title="Delete job"
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.danger + '15'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Jobs In Progress */}
        <div className="card p-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <h3 className="font-semibold flex items-center mb-4" style={{ color: colors.textPrimary }}>
            <Wrench className="w-5 h-5 mr-2" style={{ color: colors.water }} />
            In Progress ({assignedJobs.length})
          </h3>
          {assignedJobs.length === 0 ? (
            <p className="text-center py-6" style={{ color: colors.textSecondary }}>No jobs in progress</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {assignedJobs.map(job => {
                const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
                const techNames = assignees.map(id => users.find(u => u.id === id)?.name).filter(Boolean);
                return (
                  <div key={job.id} className="p-3 rounded-lg cursor-pointer" style={{ backgroundColor: colors.background }}
                    onClick={() => onOpenJobDetails && onOpenJobDetails(job)}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>{job.title}</p>
                      <Badge variant={job.status === 'needs-followup' ? 'warning' : 'info'}>{job.status}</Badge>
                    </div>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>{job.pivotName}</p>
                    {techNames.length > 0 && (
                      <p className="text-xs mt-1" style={{ color: colors.primary }}>{techNames.join(', ')}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
