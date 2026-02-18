// FieldSync v2 - Manager Dashboard Page
// Extracted from App.js ManagerDashboard (~line 1783)
import React from 'react';
import { Clock, Wrench, CheckCircle, Users, Phone, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useJobs } from '../../hooks/useJobs';
import { StatCard, Badge, Button } from '../../components/ui';

const ManagerDashboard = ({ onOpenAssignModal, onOpenReportIssue, onOpenAddEquipment }) => {
  const { colors } = useTheme();
  const { users, jobs } = useData();
  const { deleteJob } = useJobs();

  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const assignedJobs = jobs.filter(j => ['assigned', 'in-progress'].includes(j.status));
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
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</p>
                      <Badge variant={job.priority === 'high' ? 'danger' : 'warning'}>{job.priority}</Badge>
                    </div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{job.pivotName || 'Location TBD'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" onClick={() => onOpenAssignModal(job)}>Assign</Button>
                    <button
                      onClick={() => deleteJob(job.id, job.title)}
                      className="p-2 rounded text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Performance */}
        <div className="card p-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Team Performance</h3>
          {techs.length === 0 ? (
            <p className="text-center py-6" style={{ color: colors.textSecondary }}>No technicians added yet</p>
          ) : (
            <div className="space-y-3">
              {techs.map(tech => {
                const techJobs = jobs.filter(j => {
                  const assigned = j.assignedTo;
                  return Array.isArray(assigned) ? assigned.includes(tech.id) : assigned === tech.id;
                });
                const active = techJobs.filter(j => ['assigned', 'in-progress'].includes(j.status)).length;
                const completed = techJobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status)).length;
                return (
                  <div key={tech.id} className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: colors.background }}>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{tech.avatar || '\uD83D\uDC77'}</span>
                      <div>
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{tech.name}</p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{tech.phone || tech.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" style={{ color: colors.water }}>{active} active</p>
                      <p className="text-xs" style={{ color: colors.success }}>{completed} completed</p>
                    </div>
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
