import React, { useState } from 'react';
import {
  CheckCircle, Clock, Wrench, Navigation, Plus, AlertCircle,
  Briefcase, Clipboard, ChevronUp, ChevronDown, UserPlus,
  MapPin, Phone
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContextV2';
import { useData } from '../../context/DataContext';
import { useNotifications } from '../../context/NotificationContext';
import { useJobs } from '../../hooks/useJobs';
import { StatCard, EmptyState, Badge, Button } from '../../components/ui';

const DashboardPage = ({
  onOpenCompleteModal,
  onAddEquipmentClick,
  onReportIssueClick,
  onViewEquipment
}) => {
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const { users, equipment, jobs } = useData();
  const { addNotification } = useNotifications();
  const { selfAssign } = useJobs();
  const [showPending, setShowPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter jobs assigned to current user
  const myJobs = jobs.filter(j => {
    const assigned = j.assignedTo;
    if (Array.isArray(assigned)) {
      return assigned.includes(userProfile?.id);
    }
    return assigned === userProfile?.id;
  });

  const activeJobs = myJobs.filter(j => ['assigned', 'in-progress', 'needs-followup'].includes(j.status));
  const completedJobs = myJobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status));
  const pendingJobs = jobs.filter(j => j.status === 'pending');

  const handleSelfAssign = async (jobId) => {
    setIsLoading(true);
    const result = await selfAssign(jobId);
    if (result?.success) {
      addNotification('success', 'Job assigned to you');
    } else {
      addNotification('error', 'Failed to assign job');
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>My Dashboard</h2>
        <div className="flex space-x-2">
          <Button
            icon={Plus}
            size="sm"
            onClick={onAddEquipmentClick}
          >
            Add Equipment
          </Button>
          <Button
            icon={AlertCircle}
            size="sm"
            variant="secondary"
            onClick={onReportIssueClick}
          >
            Report Issue
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Jobs"
          value={activeJobs.length}
          icon={Wrench}
          color={colors.water}
        />
        <StatCard
          title="Completed"
          value={completedJobs.length}
          icon={CheckCircle}
          color={colors.success}
        />
        <StatCard
          title="Total Miles"
          value={completedJobs.reduce((sum, j) => sum + (j.milesDriven || 0), 0)}
          icon={Navigation}
          color={colors.primary}
        />
        <StatCard
          title="Total Hours"
          value={completedJobs.reduce((sum, j) => sum + (j.hoursWorked || 0), 0).toFixed(1)}
          icon={Clock}
          color={colors.accent}
        />
      </div>

      {/* My Active Jobs */}
      <div>
        <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>My Jobs</h3>
        {activeJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No Active Jobs"
            description="Jobs assigned to you will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJobs.map(job => {
              const pivot = equipment.find(p => p.id === job.pivotId);
              const farmer = users.find(u => u.id === job.farmerId);
              return (
                <div key={job.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{job.title}</h3>
                        {job.soNumber && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: colors.primary + '15', color: colors.primary }}
                          >
                            SO# {job.soNumber}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => pivot && onViewEquipment && onViewEquipment(pivot)}
                        className="text-sm hover:underline flex items-center"
                        style={{ color: colors.primary }}
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        {job.pivotName}
                      </button>
                    </div>
                    <Badge variant={job.priority === 'high' ? 'danger' : 'warning'}>
                      {job.priority}
                    </Badge>
                  </div>

                  <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                    {job.description}
                  </p>

                  {/* Farmer Contact */}
                  {farmer && (
                    <div
                      className="p-2 rounded-lg mb-3 flex items-center justify-between"
                      style={{ backgroundColor: colors.background }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{farmer.avatar || '👨‍🌾'}</span>
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                            {farmer.name}
                          </p>
                          {farmer.phone && (
                            <a
                              href={`tel:${farmer.phone}`}
                              className="text-xs flex items-center"
                              style={{ color: colors.primary }}
                            >
                              <Phone className="w-3 h-3 mr-1" />{farmer.phone}
                            </a>
                          )}
                        </div>
                      </div>
                      {pivot?.lat && pivot?.lng && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded flex items-center"
                          style={{ backgroundColor: colors.primary, color: 'white' }}
                        >
                          <MapPin className="w-3 h-3 mr-1" />Directions
                        </a>
                      )}
                    </div>
                  )}

                  {job.leavePivotRunning && (
                    <div
                      className="p-2 rounded-lg mb-3"
                      style={{ backgroundColor: colors.warning + '15' }}
                    >
                      <p className="text-xs font-medium" style={{ color: colors.warning }}>
                        ⚠️ Pivot left running: {job.pivotDirection} at {job.pivotPercentage}%
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      icon={CheckCircle}
                      onClick={() => onOpenCompleteModal && onOpenCompleteModal(job)}
                    >
                      Complete Job
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Jobs (Self-Assign) */}
      <div>
        <div
          className="flex items-center justify-between p-3 rounded-lg cursor-pointer"
          style={{ backgroundColor: colors.background }}
          onClick={() => setShowPending(!showPending)}
        >
          <div className="flex items-center space-x-2">
            <Clipboard className="w-5 h-5" style={{ color: colors.warning }} />
            <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
              Available Jobs ({pendingJobs.length})
            </h3>
          </div>
          {showPending ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>

        {showPending && (
          <div className="mt-3 space-y-3">
            {pendingJobs.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>
                No pending jobs available
              </p>
            ) : (
              pendingJobs.map(job => {
                const pivot = equipment.find(p => p.id === job.pivotId);
                const farmer = users.find(u => u.id === job.farmerId);
                return (
                  <div key={job.id} className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium" style={{ color: colors.textPrimary }}>
                          {job.title}
                        </h4>
                        <p className="text-sm" style={{ color: colors.muted }}>
                          {job.pivotName} • {farmer?.name || 'Unknown'}
                        </p>
                      </div>
                      <Badge variant={job.priority === 'high' ? 'danger' : 'warning'}>
                        {job.priority}
                      </Badge>
                    </div>
                    <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                      {job.description}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        className="flex-1"
                        icon={UserPlus}
                        onClick={() => handleSelfAssign(job.id)}
                        loading={isLoading}
                      >
                        Take This Job
                      </Button>
                      {pivot?.lat && pivot?.lng && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-lg flex items-center"
                          style={{ backgroundColor: colors.background }}
                        >
                          <MapPin className="w-4 h-4" style={{ color: colors.primary }} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
