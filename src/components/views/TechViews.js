import React, { useState } from 'react';
import { 
  Plus, AlertCircle, Wrench, CheckCircle, Navigation, Clock,
  Briefcase, Play, Square, Phone, MapPin, Clipboard, ChevronUp, ChevronDown, UserPlus
} from 'lucide-react';
import { Button, Badge } from '../ui';

// Stat Card Component (local)
const StatCard = ({ title, value, icon: Icon, color = '#2D5016' }) => (
  <div className="card p-4">
    <div className="flex items-center justify-between mb-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
  </div>
);

// Empty State Component (local)
const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#9CA98620' }}>
      <Icon className="w-8 h-8" style={{ color: '#9CA986' }} />
    </div>
    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
    <p className="text-sm mb-4 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
  </div>
);

export const TechDashboard = ({
  colors,
  jobs,
  userProfile,
  setShowAddEquipmentModal,
  setShowReportIssueModal,
  setSelectedJobForAction,
  setShowCompleteJobModal
}) => {
  const myJobs = jobs.filter(j => {
    const assigned = j.assignedTo;
    if (Array.isArray(assigned)) {
      return assigned.includes(userProfile?.id);
    }
    return assigned === userProfile?.id;
  });
  const activeJobs = myJobs.filter(j => j.status === 'assigned' || j.status === 'in-progress');
  const completedJobs = myJobs.filter(j => j.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>My Dashboard</h2>
        <div className="flex space-x-2">
          <Button icon={Plus} size="sm" onClick={() => setShowAddEquipmentModal(true)}>Add Equipment</Button>
          <Button icon={AlertCircle} size="sm" variant="secondary" onClick={() => setShowReportIssueModal(true)}>Report Issue</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Active Jobs" value={activeJobs.length} icon={Wrench} color={colors.water} />
        <StatCard title="Completed" value={completedJobs.length} icon={CheckCircle} color={colors.success} />
        <StatCard title="Total Miles" value={completedJobs.reduce((sum, j) => sum + (j.milesDriven || 0), 0)} icon={Navigation} color={colors.primary} />
        <StatCard title="Total Hours" value={completedJobs.reduce((sum, j) => sum + (j.hoursWorked || 0), 0).toFixed(1)} icon={Clock} color={colors.accent} />
      </div>

      <div>
        <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Active Jobs</h3>
        {activeJobs.length === 0 ? (
          <div className="card p-6 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-2" style={{ color: colors.success }} />
            <p style={{ color: colors.textSecondary }}>All caught up! No active jobs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeJobs.map(job => (
              <div key={job.id} className="card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedJobForAction(job); setShowCompleteJobModal(true); }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold" style={{ color: colors.textPrimary }}>{job.title}</h4>
                      {job.soNumber && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>SO# {job.soNumber}</span>}
                    </div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{job.pivotName || 'Location TBD'}</p>
                    <p className="text-xs mt-1" style={{ color: colors.muted }}>{job.description}</p>
                  </div>
                  <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>{job.priority}</Badge>
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between items-center" style={{ borderColor: colors.border }}>
                  <span className="text-xs" style={{ color: colors.muted }}>Est. {job.estimatedHours || 2} hours</span>
                  <Button size="sm" icon={CheckCircle}>Complete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const TechJobsView = ({
  colors,
  jobs,
  users,
  equipment,
  userProfile,
  isLoading,
  setSelectedEquipmentProfile,
  setSelectedJobForAction,
  setShowCompleteJobModal,
  handleStartTime,
  handleStopTime,
  handleSelfAssign
}) => {
  const myJobs = jobs.filter(j => {
    const assigned = j.assignedTo;
    const isAssignedToMe = Array.isArray(assigned) ? assigned.includes(userProfile?.id) : assigned === userProfile?.id;
    // Show all jobs assigned to me EXCEPT billed/canceled (they stay until fully closed out)
    const isActiveStatus = !['billed', 'canceled'].includes(j.status);
    return isAssignedToMe && isActiveStatus;
  });
  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const [showPending, setShowPending] = useState(false);
  const [showLunchPrompt, setShowLunchPrompt] = useState(false);
  const [stoppingJobId, setStoppingJobId] = useState(null);

  const hasActiveTimeEntry = (job) => {
    return job.timeEntries?.some(e => e.techId === userProfile?.id && !e.endTime);
  };

  const handleStopTimeWithLunch = (jobId, tookLunch) => {
    handleStopTime(jobId, tookLunch);
    setShowLunchPrompt(false);
    setStoppingJobId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>My Jobs</h2>
        {myJobs.length === 0 ? (
          <EmptyState icon={Briefcase} title="No Active Jobs" description="Jobs assigned to you will appear here." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myJobs.map(job => {
              const pivot = equipment.find(p => p.id === job.pivotId);
              const farmer = users.find(u => u.id === job.farmerId);
              const isTracking = hasActiveTimeEntry(job);
              const timeEntries = job.timeEntries || [];
              const totalTrackedTime = timeEntries.reduce((total, e) => {
                if (e.startTime && e.endTime) {
                  return total + (new Date(e.endTime) - new Date(e.startTime)) / (1000 * 60 * 60);
                }
                return total;
              }, 0);

              return (
                <div key={job.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{job.title}</h3>
                        {job.soNumber && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>SO# {job.soNumber}</span>}
                      </div>
                      <button 
                        onClick={() => pivot && setSelectedEquipmentProfile(pivot)}
                        className="text-sm hover:underline flex items-center"
                        style={{ color: colors.primary }}
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        {job.pivotName}
                      </button>
                    </div>
                    <Badge variant={job.priority === 'high' ? 'danger' : 'warning'}>{job.priority}</Badge>
                  </div>
                  <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{job.description}</p>
                  
                  {(isTracking || timeEntries.length > 0) && (
                    <div className="p-2 rounded-lg mb-3" style={{ backgroundColor: isTracking ? colors.success + '15' : colors.water + '15' }}>
                      {isTracking ? (
                        <p className="text-xs font-medium flex items-center" style={{ color: colors.success }}>
                          <Play className="w-3 h-3 mr-1 animate-pulse" /> Time tracking active...
                        </p>
                      ) : (
                        <p className="text-xs" style={{ color: colors.water }}>
                          <Clock className="w-3 h-3 inline mr-1" /> {totalTrackedTime.toFixed(1)} hrs tracked ({timeEntries.length} entries)
                        </p>
                      )}
                    </div>
                  )}
                  
                  {farmer && (
                    <div className="p-2 rounded-lg mb-3 flex items-center justify-between" style={{ backgroundColor: colors.background }}>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{farmer.avatar || '👨‍🌾'}</span>
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{farmer.name}</p>
                          {farmer.phone && (
                            <a href={`tel:${farmer.phone}`} className="text-xs flex items-center" style={{ color: colors.primary }}>
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
                    <div className="p-2 rounded-lg mb-3" style={{ backgroundColor: colors.warning + '15' }}>
                      <p className="text-xs font-medium" style={{ color: colors.warning }}>⚠️ Pivot left running: {job.pivotDirection} at {job.pivotPercentage}%</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      {!isTracking ? (
                        <Button className="flex-1" variant="secondary" icon={Play} onClick={() => handleStartTime(job.id)} loading={isLoading}>Start Time</Button>
                      ) : (
                        <Button className="flex-1" variant="danger" icon={Square} onClick={() => { setStoppingJobId(job.id); setShowLunchPrompt(true); }}>Stop Time</Button>
                      )}
                    </div>
                    <Button className="w-full" icon={CheckCircle} onClick={() => { setSelectedJobForAction(job); setShowCompleteJobModal(true); }}>Complete Job</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div 
          className="flex items-center justify-between p-3 rounded-lg cursor-pointer"
          style={{ backgroundColor: colors.background }}
          onClick={() => setShowPending(!showPending)}
        >
          <div className="flex items-center space-x-2">
            <Clipboard className="w-5 h-5" style={{ color: colors.warning }} />
            <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Available Jobs ({pendingJobs.length})</h3>
          </div>
          {showPending ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
        
        {showPending && (
          <div className="mt-3 space-y-3">
            {pendingJobs.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>No pending jobs available</p>
            ) : (
              pendingJobs.map(job => {
                const pivot = equipment.find(p => p.id === job.pivotId);
                const farmer = users.find(u => u.id === job.farmerId);
                return (
                  <div key={job.id} className="card p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</h4>
                        <div className="flex items-center space-x-2 text-sm">
                          {pivot ? (
                            <button 
                              className="hover:underline flex items-center"
                              style={{ color: colors.primary }}
                              onClick={() => setSelectedEquipmentProfile(pivot)}
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              {job.pivotName}
                            </button>
                          ) : (
                            <span style={{ color: colors.muted }}>{job.pivotName}</span>
                          )}
                          {farmer && (
                            <>
                              <span style={{ color: colors.muted }}>•</span>
                              <span style={{ color: colors.textSecondary }}>{farmer.name}</span>
                              {farmer.phone && (
                                <a 
                                  href={`tel:${farmer.phone}`}
                                  className="px-2 py-0.5 rounded text-xs hover:bg-green-100"
                                  style={{ backgroundColor: colors.success + '15', color: colors.success }}
                                >
                                  <Phone className="w-3 h-3 inline" />
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={job.priority === 'high' ? 'danger' : 'warning'}>{job.priority}</Badge>
                    </div>
                    <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>{job.description}</p>
                    <div className="flex space-x-2">
                      <Button className="flex-1" icon={UserPlus} onClick={() => handleSelfAssign(job.id)} loading={isLoading}>Take This Job</Button>
                      {pivot?.lat && pivot?.lng && (
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-lg flex items-center hover:shadow-md transition-all"
                          style={{ backgroundColor: colors.primary, color: 'white' }}
                        >
                          <Navigation className="w-4 h-4 mr-1" />
                          <span className="text-sm">Go</span>
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

      {showLunchPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>Did you take lunch?</h3>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>30 minutes will be deducted if you took a lunch break.</p>
            <div className="flex space-x-3">
              <Button className="flex-1" variant="secondary" onClick={() => handleStopTimeWithLunch(stoppingJobId, false)}>No Lunch</Button>
              <Button className="flex-1" onClick={() => handleStopTimeWithLunch(stoppingJobId, true)}>Yes, Took Lunch</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
