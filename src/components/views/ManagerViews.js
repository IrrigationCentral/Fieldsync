import React, { useState, useMemo } from 'react';
import {
  Clock, Wrench, CheckCircle, Users, Phone, Plus,
  Briefcase, UserPlus, Settings, Trash2, Search,
  Calendar, Star, FileSpreadsheet, ChevronRight, MapPin, FileText,
  Mail, AlertCircle, Edit, XCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

import { Modal, Button, Select, Badge, StarRating } from '../ui';

// Shared StatCard component
const StatCard = ({ title, value, icon: Icon, trend, color = '#2D5016' }) => (
  <div className="card p-4" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
    <div className="flex items-center justify-between mb-2">
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: color + '15' }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      {trend && (
        <span className="text-xs font-medium" style={{ color: trend > 0 ? '#52C41A' : '#C73E1D' }}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
  </div>
);

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div 
      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
      style={{ backgroundColor: '#9CA98620' }}
    >
      <Icon className="w-8 h-8" style={{ color: '#9CA986' }} />
    </div>
    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
    <p className="text-sm mb-4 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
    {action}
  </div>
);

// Clickable stat card - MUST be outside component to prevent re-renders
const ClickableStatCard = ({ title, value, icon: Icon, color, onClick, subtitle, colors }) => (
  <div 
    className="card p-4 cursor-pointer hover:shadow-lg transition-all transform hover:scale-[1.02]" 
    style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
    </div>
    <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
    {subtitle && <p className="text-xs mt-1" style={{ color: colors.muted }}>{subtitle}</p>}
  </div>
);

// ============================================
// MANAGER DASHBOARD - FULLY INTERACTIVE
// ============================================
export const ManagerDashboard = ({
  colors,
  jobs,
  users,
  equipment,
  userProfile,
  setShowReportIssueModal,
  setShowAddEquipmentModal,
  setSelectedJobForAction,
  setShowAssignJobModal,
  setShowJobDetailsModal,
  setShowEditJobModal,
  setSelectedEquipmentProfile,
  setSelectedTab,
  setFilterStatus,
  handleDeleteJob
}) => {
  // Memoize expensive filter operations to prevent recalculation on every render
  const pendingJobs = useMemo(() => jobs.filter(j => j.status === 'pending'), [jobs]);
  const inProgressJobs = useMemo(() => jobs.filter(j => j.status === 'assigned' || j.status === 'in-progress'), [jobs]);
  const completedJobs = useMemo(() => jobs.filter(j => j.status === 'completed'), [jobs]);
  const readyToBillJobs = useMemo(() => jobs.filter(j => j.status === 'ready-to-bill'), [jobs]);
  const techs = useMemo(() => users.filter(u => u.role === 'tech'), [users]);
  const customers = useMemo(() => users.filter(u => u.role === 'farmer'), [users]);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Find techs currently on the clock - memoized to prevent O(n*m) recalculation
  const techsOnClock = useMemo(() =>
    techs.filter(tech =>
      jobs.some(j => j.timeEntries?.some(e => e.techId === tech.id && !e.endTime))
    ), [techs, jobs]
  );

  return (
    <div className="space-y-6">
      {/* Personalized Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            {getGreeting()}, {userProfile?.name?.split(' ')[0] || 'Boss'} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {pendingJobs.length > 0 
              ? `${pendingJobs.length} job${pendingJobs.length > 1 ? 's' : ''} waiting for assignment`
              : techsOnClock.length > 0 
                ? `${techsOnClock.length} tech${techsOnClock.length > 1 ? 's' : ''} on the clock`
                : "All caught up! 🎉"
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={Phone} onClick={() => setShowReportIssueModal(true)}>
            New Service Call
          </Button>
          <Button icon={Plus} variant="secondary" onClick={() => setShowAddEquipmentModal(true)}>
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Priority Alert - Pending Jobs */}
      {pendingJobs.length > 0 && (
        <div 
          className="p-4 rounded-xl cursor-pointer active:scale-99 transition-transform"
          style={{ backgroundColor: colors.warning + '15', borderLeft: `4px solid ${colors.warning}` }}
          onClick={() => { setFilterStatus('active'); setSelectedTab('jobs'); }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.warning + '30' }}>
                <AlertCircle className="w-5 h-5" style={{ color: colors.warning }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: colors.textPrimary }}>
                  {pendingJobs.length} Unassigned Job{pendingJobs.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Tap to view and assign
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: colors.warning }} />
          </div>
        </div>
      )}

      {/* CLICKABLE STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <ClickableStatCard 
          colors={colors}
          title="Pending" 
          value={pendingJobs.length} 
          icon={Clock} 
          color={colors.warning}
          subtitle="Needs assignment"
          onClick={() => { setFilterStatus('active'); setSelectedTab('jobs'); }}
        />
        <ClickableStatCard 
          colors={colors}
          title="In Progress" 
          value={inProgressJobs.length} 
          icon={Wrench} 
          color={colors.water}
          subtitle="Being worked"
          onClick={() => { setFilterStatus('active'); setSelectedTab('jobs'); }}
        />
        <ClickableStatCard 
          colors={colors}
          title="Completed" 
          value={completedJobs.length} 
          icon={CheckCircle} 
          color={colors.success}
          subtitle="This period"
          onClick={() => { setFilterStatus('complete'); setSelectedTab('jobs'); }}
        />
        <ClickableStatCard 
          colors={colors}
          title="Ready to Bill" 
          value={readyToBillJobs.length} 
          icon={FileText} 
          color={colors.accent}
          subtitle="Awaiting invoice"
          onClick={() => { setFilterStatus('complete'); setSelectedTab('jobs'); }}
        />
        <ClickableStatCard 
          colors={colors}
          title="Technicians" 
          value={techs.length} 
          icon={Users} 
          color={colors.primary}
          subtitle={`${techs.filter(t => inProgressJobs.some(j => j.assignedTo?.includes?.(t.id) || j.assignedTo === t.id)).length} active`}
          onClick={() => setSelectedTab('team')}
        />
        <ClickableStatCard 
          colors={colors}
          title="Customers" 
          value={customers.length} 
          icon={Users} 
          color={colors.soil}
          subtitle={`${equipment.length} equipment`}
          onClick={() => setSelectedTab('customers')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PENDING JOBS - FULLY INTERACTIVE */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Pending Jobs ({pendingJobs.length})</h3>
            {pendingJobs.length > 0 && (
              <button 
                className="text-sm hover:underline"
                style={{ color: colors.primary }}
                onClick={() => { setFilterStatus('active'); setSelectedTab('jobs'); }}
              >
                View All →
              </button>
            )}
          </div>
          {pendingJobs.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" style={{ color: colors.success }} />
              <p style={{ color: colors.textSecondary }}>All caught up! No pending jobs.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pendingJobs.slice(0, 5).map(job => {
                const pivot = equipment?.find(p => p.id === job.pivotId);
                const farmer = users.find(u => u.id === job.farmerId);
                return (
                  <div key={job.id} className="p-3 rounded-lg hover:shadow-md transition-all" style={{ backgroundColor: colors.background }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="font-medium hover:underline text-left"
                            style={{ color: colors.textPrimary }}
                            onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
                          >
                            {job.title}
                          </button>
                          <Badge variant={job.priority === 'high' ? 'danger' : 'warning'}>{job.priority}</Badge>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {pivot ? (
                            <button 
                              className="text-sm hover:underline flex items-center"
                              style={{ color: colors.primary }}
                              onClick={() => setSelectedEquipmentProfile(pivot)}
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              {job.pivotName}
                            </button>
                          ) : (
                            <span className="text-sm" style={{ color: colors.textSecondary }}>{job.pivotName || 'Location TBD'}</span>
                          )}
                          {farmer && (
                            <>
                              <span style={{ color: colors.muted }}>•</span>
                              <button
                                className="text-sm hover:underline"
                                style={{ color: colors.water }}
                                onClick={() => setSelectedTab('customers')}
                              >
                                {farmer.name}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <button
                          onClick={() => { setSelectedJobForAction(job); setShowEditJobModal(true); }}
                          className="p-2 rounded hover:bg-yellow-50 transition-colors"
                          title="Edit job"
                          style={{ color: colors.accent }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <Button size="sm" onClick={() => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}>Assign</Button>
                        <button
                          onClick={() => handleDeleteJob(job.id, job.title)}
                          className="p-2 rounded text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {pendingJobs.length > 5 && (
                <button 
                  className="w-full text-center py-2 text-sm font-medium hover:underline"
                  style={{ color: colors.primary }}
                  onClick={() => { setFilterStatus('active'); setSelectedTab('jobs'); }}
                >
                  +{pendingJobs.length - 5} more pending jobs
                </button>
              )}
            </div>
          )}
        </div>

        {/* TEAM PERFORMANCE - FULLY INTERACTIVE */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Team Activity</h3>
            {techs.length > 0 && (
              <button 
                className="text-sm hover:underline"
                style={{ color: colors.primary }}
                onClick={() => setSelectedTab('team')}
              >
                Manage Team →
              </button>
            )}
          </div>
          {techs.length === 0 ? (
            <div className="text-center py-6">
              <Users className="w-12 h-12 mx-auto mb-2" style={{ color: colors.muted }} />
              <p style={{ color: colors.textSecondary }}>No technicians added yet</p>
              <Button size="sm" className="mt-2" onClick={() => setSelectedTab('team')}>Add Team Member</Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {techs.map(tech => {
                const techJobs = jobs.filter(j => {
                  const assigned = j.assignedTo;
                  return Array.isArray(assigned) ? assigned.includes(tech.id) : assigned === tech.id;
                });
                const activeJobs = techJobs.filter(j => j.status === 'assigned' || j.status === 'in-progress');
                const completedCount = techJobs.filter(j => j.status === 'completed').length;
                const currentJob = activeJobs[0];
                const currentPivot = currentJob ? equipment?.find(p => p.id === currentJob.pivotId) : null;
                
                return (
                  <div 
                    key={tech.id} 
                    className="p-3 rounded-lg hover:shadow-md transition-all cursor-pointer" 
                    style={{ backgroundColor: colors.background }}
                    onClick={() => setSelectedTab('team')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <span className="text-2xl">{tech.avatar || '👷'}</span>
                          {activeJobs.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{tech.name}</p>
                          {currentJob ? (
                            <button
                              className="text-xs hover:underline flex items-center"
                              style={{ color: colors.water }}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (currentPivot) setSelectedEquipmentProfile(currentPivot);
                              }}
                            >
                              <Wrench className="w-3 h-3 mr-1" />
                              Working on: {currentJob.pivotName}
                            </button>
                          ) : (
                            <p className="text-xs" style={{ color: colors.muted }}>Available</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium" style={{ color: activeJobs.length > 0 ? colors.water : colors.muted }}>
                          {activeJobs.length} active
                        </p>
                        <p className="text-xs" style={{ color: colors.success }}>{completedCount} completed</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RECENT ACTIVITY FEED */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Recent Completions</h3>
          <button 
            className="text-sm hover:underline"
            style={{ color: colors.primary }}
            onClick={() => { setFilterStatus('complete'); setSelectedTab('jobs'); }}
          >
            View All →
          </button>
        </div>
        {completedJobs.length === 0 ? (
          <p className="text-center py-4" style={{ color: colors.textSecondary }}>No completed jobs yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedJobs.slice(0, 6).map(job => {
              const pivot = equipment?.find(p => p.id === job.pivotId);
              const tech = users.find(u => u.id === job.completedBy);
              return (
                <div 
                  key={job.id} 
                  className="p-3 rounded-lg hover:shadow-md transition-all cursor-pointer"
                  style={{ backgroundColor: colors.background }}
                  onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className="w-4 h-4" style={{ color: colors.success }} />
                    <span className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{job.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    {pivot ? (
                      <button
                        className="hover:underline truncate"
                        style={{ color: colors.primary }}
                        onClick={(e) => { e.stopPropagation(); setSelectedEquipmentProfile(pivot); }}
                      >
                        {job.pivotName}
                      </button>
                    ) : (
                      <span style={{ color: colors.textSecondary }}>{job.pivotName}</span>
                    )}
                    {tech && <span style={{ color: colors.muted }}>by {tech.name}</span>}
                  </div>
                  {job.rating && (
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3" style={{ color: i < job.rating ? colors.accent : colors.muted }} fill={i < job.rating ? colors.accent : 'none'} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// MANAGER JOBS VIEW
// ============================================
export const ManagerJobsView = ({
  colors,
  jobs,
  users,
  equipment,
  userProfile,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  setShowAddEquipmentModal,
  setShowReportIssueModal,
  setSelectedJobForAction,
  setShowAssignJobModal,
  setShowJobDetailsModal,
  setShowEditJobModal,
  setShowSOModal,
  setSelectedEquipmentProfile,
  handleDeleteJob,
  handleDownloadJobSheet,
  handleUpdateJobStatus,
  getStatusVariant,
  formatStatus,
  formatCurrency,
  canSeePricing
}) => {
  // Memoize expensive job filtering to prevent recalculation on every render
  const filteredJobs = useMemo(() =>
    jobs.filter(job => {
      const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.soNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        users?.find(u => u.id === job.farmerId)?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category-based filtering
      let matchesFilter = false;
      if (filterStatus === 'all') {
        matchesFilter = true;
      } else if (filterStatus === 'active') {
        matchesFilter = ['pending', 'assigned', 'in-progress', 'waiting-on-parts'].includes(job.status);
      } else if (filterStatus === 'complete') {
        matchesFilter = ['completed', 'ready-to-bill'].includes(job.status);
      } else if (filterStatus === 'billed') {
        matchesFilter = job.status === 'billed';
      } else if (filterStatus === 'canceled') {
        matchesFilter = job.status === 'canceled';
      }

      return matchesSearch && matchesFilter;
    }),
    [jobs, searchQuery, filterStatus, users]
  );

  // Job Card Component for mobile
  const JobCard = ({ job }) => {
    const pivot = equipment?.find(p => p.id === job.pivotId);
    const farmer = users?.find(u => u.id === job.farmerId);
    const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
    const assignedNames = assignees.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ');

    return (
      <div 
        className="card p-4 cursor-pointer hover:shadow-lg transition-all"
        onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
      >
        {/* Header: SO# + Status + Priority */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {job.soNumber ? (
              <span className="font-mono font-bold text-sm px-2 py-1 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>
                {job.soNumber}
              </span>
            ) : (
              <button 
                className="text-xs px-2 py-1 rounded underline"
                style={{ color: colors.water }}
                onClick={(e) => { e.stopPropagation(); setSelectedJobForAction(job); setShowSOModal(true); }}
              >
                + Add SO#
              </button>
            )}
            <Badge variant={getStatusVariant ? getStatusVariant(job.status) : 'default'}>
              {formatStatus ? formatStatus(job.status) : job.status}
            </Badge>
          </div>
          <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>
            {job.priority}
          </Badge>
        </div>

        {/* Customer */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-semibold" style={{ color: colors.textPrimary }}>{farmer?.name || 'Unknown'}</p>
            {farmer?.phone && (
              <a 
                href={`tel:${farmer.phone}`}
                className="text-sm hover:underline"
                style={{ color: colors.primary }}
                onClick={(e) => e.stopPropagation()}
              >
                {farmer.phone}
              </a>
            )}
          </div>
          {pivot && (
            <button
              className="text-xs px-2 py-1 rounded"
              style={{ backgroundColor: colors.primary + '15', color: colors.primary }}
              onClick={(e) => { e.stopPropagation(); setSelectedEquipmentProfile(pivot); }}
            >
              {job.pivotName}
            </button>
          )}
        </div>

        {/* Title & Description */}
        <p className="font-medium mb-1" style={{ color: colors.textPrimary }}>{job.title}</p>
        <p className="text-sm mb-3 line-clamp-2" style={{ color: colors.textSecondary }}>{job.description}</p>

        {/* Assigned To */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm" style={{ color: colors.textSecondary }}>
            Assigned: {assignedNames || <span style={{ color: colors.warning }}>Unassigned</span>}
          </span>
          {canSeePricing && job.totalCost && (
            <span className="text-sm font-medium" style={{ color: colors.success }}>{formatCurrency(job.totalCost)}</span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: colors.border }} onClick={(e) => e.stopPropagation()}>
          <select 
            className="text-xs px-2 py-1 rounded border flex-1 mr-2" 
            style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
            value={job.status}
            onChange={(e) => handleUpdateJobStatus && handleUpdateJobStatus(job.id, e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
            <option value="waiting-on-parts">Waiting on Parts</option>
            <option value="completed">Completed</option>
            <option value="ready-to-bill">Ready to Bill</option>
            <option value="billed">Billed</option>
            <option value="canceled">Canceled</option>
          </select>
          
          <div className="flex space-x-2">
            <button
              onClick={() => { setSelectedJobForAction(job); setShowEditJobModal(true); }}
              className="p-2 rounded hover:bg-yellow-50 transition-colors"
              title="Edit job"
              style={{ color: colors.accent }}
            >
              <Edit className="w-4 h-4" />
            </button>
            {job.status === 'pending' || !assignees.length ? (
              <Button size="sm" onClick={() => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}>Assign</Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}>Team</Button>
            )}
            {['manager', 'office'].includes(userProfile?.role) && job.status !== 'canceled' && (
              <button
                onClick={() => {
                  if (window.confirm(`Cancel job "${job.title}"?`)) {
                    handleUpdateJobStatus && handleUpdateJobStatus(job.id, 'canceled');
                  }
                }}
                className="p-2 rounded hover:bg-orange-50 transition-colors"
                title="Cancel job"
                style={{ color: '#F59E0B' }}
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
            {['manager', 'office'].includes(userProfile?.role) && (
              <button
                onClick={() => handleDeleteJob(job.id, job.title)}
                className="p-2 rounded text-red-500 hover:bg-red-50"
                title="Delete job"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: colors.primary }}>All Jobs ({filteredJobs.length})</h2>
          <div className="hidden sm:flex items-center space-x-2">
            <Button icon={Plus} size="sm" onClick={() => setShowAddEquipmentModal(true)}>Add Equipment</Button>
            <Button icon={Phone} size="sm" variant="danger" onClick={() => setShowReportIssueModal(true)}>Report Issue</Button>
          </div>
        </div>
        
        {/* Search and Filter - stacked on mobile */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textSecondary }} />
            <input 
              type="text" 
              placeholder="Search jobs, SO#, customer..." 
              className="input pl-9 py-2 text-sm w-full" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>
          <select 
            className="input py-2 text-sm"
            style={{ minWidth: '160px' }}
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Jobs</option>
            <option value="active">Active</option>
            <option value="complete">Complete</option>
            <option value="billed">Billed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {/* Mobile action buttons */}
        <div className="flex sm:hidden gap-2">
          <Button icon={Plus} size="sm" className="flex-1" onClick={() => setShowAddEquipmentModal(true)}>Add Equipment</Button>
          <Button icon={Phone} size="sm" variant="danger" className="flex-1" onClick={() => setShowReportIssueModal(true)}>Report Issue</Button>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No Jobs Found" description="No jobs match your search criteria." />
      ) : (
        <>
          {/* Mobile: Card Layout */}
          <div className="block md:hidden space-y-3">
            {filteredJobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: colors.background }}>
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>SO #</th>
                    <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Customer</th>
                    <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Description</th>
                    <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Assigned</th>
                    <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Status</th>
                    <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Priority</th>
                    {canSeePricing && <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Cost</th>}
                    <th className="text-right p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => {
                    const pivot = equipment?.find(p => p.id === job.pivotId);
                    const farmer = users?.find(u => u.id === job.farmerId);
                    const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
                    const assignedNames = assignees.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ') || '-';
                    
                    return (
                    <tr key={job.id} className="border-t hover:bg-gray-50 cursor-pointer" style={{ borderColor: colors.border }} onClick={() => { setSelectedJobForAction(job); setShowJobDetailsModal(true); }}>
                      <td className="p-3">
                        {job.soNumber ? (
                          <span className="font-mono font-bold" style={{ color: colors.primary }}>{job.soNumber}</span>
                        ) : (
                          <button className="text-sm underline" style={{ color: colors.water }} onClick={(e) => { e.stopPropagation(); setSelectedJobForAction(job); setShowSOModal(true); }}>+ Add</button>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>{farmer?.name || 'Unknown'}</p>
                        {farmer?.phone && (
                          <a href={`tel:${farmer.phone}`} className="text-xs" style={{ color: colors.primary }} onClick={(e) => e.stopPropagation()}>{farmer.phone}</a>
                        )}
                      </td>
                      <td className="p-3" style={{ maxWidth: '250px' }}>
                        <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>{job.title}</p>
                        <p className="text-xs truncate" style={{ color: colors.textSecondary }}>{job.description}</p>
                        {pivot && (
                          <button className="text-xs hover:underline mt-1" style={{ color: colors.primary }} onClick={(e) => { e.stopPropagation(); setSelectedEquipmentProfile(pivot); }}>
                            📍 {job.pivotName}
                          </button>
                        )}
                      </td>
                      <td className="p-3">
                        {assignees.length > 0 ? (
                          <span className="text-sm" style={{ color: colors.textPrimary }}>{assignedNames}</span>
                        ) : (
                          <button className="text-xs px-2 py-1 rounded" style={{ backgroundColor: colors.warning + '20', color: colors.warning }} onClick={(e) => { e.stopPropagation(); setSelectedJobForAction(job); setShowAssignJobModal(true); }}>Assign</button>
                        )}
                      </td>
                      <td className="p-3">
                        <select className="text-xs px-2 py-1 rounded border" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }} value={job.status} onClick={(e) => e.stopPropagation()} onChange={(e) => handleUpdateJobStatus && handleUpdateJobStatus(job.id, e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned</option>
                          <option value="in-progress">In Progress</option>
                          <option value="waiting-on-parts">Waiting</option>
                          <option value="completed">Completed</option>
                          <option value="ready-to-bill">Ready Bill</option>
                          <option value="billed">Billed</option>
                          <option value="canceled">Canceled</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>{job.priority}</Badge>
                      </td>
                      {canSeePricing && (
                        <td className="p-3 text-sm font-medium" style={{ color: colors.success }}>{job.totalCost ? formatCurrency(job.totalCost) : '-'}</td>
                      )}
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => { setSelectedJobForAction(job); setShowEditJobModal(true); }}
                            className="p-1.5 rounded hover:bg-yellow-50 transition-colors"
                            title="Edit job"
                            style={{ color: colors.accent }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {(job.status === 'assigned' || job.status === 'in-progress' || job.status === 'waiting-on-parts') && (
                            <Button size="sm" variant="secondary" onClick={() => { setSelectedJobForAction(job); setShowAssignJobModal(true); }}>Team</Button>
                          )}
                          {(job.status === 'completed' || job.status === 'ready-to-bill' || job.status === 'billed') && (
                            <Button size="sm" variant="secondary" icon={FileSpreadsheet} onClick={() => handleDownloadJobSheet(job)} />
                          )}
                          {['manager', 'office'].includes(userProfile?.role) && job.status !== 'canceled' && (
                            <button 
                              onClick={() => {
                                if (window.confirm(`Cancel job "${job.title}"?`)) {
                                  handleUpdateJobStatus && handleUpdateJobStatus(job.id, 'canceled');
                                }
                              }} 
                              className="p-1.5 rounded hover:bg-orange-50 transition-colors"
                              title="Cancel job"
                              style={{ color: '#F59E0B' }}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {['manager', 'office'].includes(userProfile?.role) && (
                            <button onClick={() => handleDeleteJob(job.id, job.title)} className="p-1.5 rounded text-red-500 hover:bg-red-50" title="Delete job">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// TEAM MANAGEMENT
// ============================================
export const TeamManagement = ({
  colors,
  users,
  jobs,
  userProfile,
  setShowAddUserModal,
  handleDeleteUser,
  updateUser,
  addNotification,
  resetPassword
}) => {
  // Memoize team members filter
  const teamMembers = useMemo(() => users.filter(u => u.role !== 'farmer'), [users]);
  const [editingMemberRole, setEditingMemberRole] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleRoleChange = async (userId, newRole) => {
    const result = await updateUser(userId, { role: newRole });
    if (result.success) {
      addNotification('success', 'Role updated successfully');
      setEditingMemberRole(null);
    } else {
      addNotification('error', result.error || 'Failed to update role');
    }
  };

  // Get member stats
  const getMemberStats = (member) => {
    const memberJobs = jobs.filter(j => {
      const assigned = j.assignedTo;
      const assignedArr = Array.isArray(assigned) ? assigned : [assigned];
      return assignedArr.includes(member.id);
    });
    
    const activeJobs = memberJobs.filter(j => ['assigned', 'in-progress', 'waiting-on-parts'].includes(j.status));
    const completedJobs = memberJobs.filter(j => ['completed', 'ready-to-bill', 'billed'].includes(j.status));
    
    // Hours this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    let hoursThisWeek = 0;
    let hoursThisMonth = 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    memberJobs.forEach(job => {
      (job.timeEntries || []).forEach(entry => {
        if (entry.techId === member.id && entry.startTime && entry.endTime) {
          const start = new Date(entry.startTime);
          const end = new Date(entry.endTime);
          const hours = (end - start) / (1000 * 60 * 60);
          
          if (start >= weekStart) hoursThisWeek += hours;
          if (start >= monthStart) hoursThisMonth += hours;
        }
      });
    });
    
    // Average rating
    const ratedJobs = completedJobs.filter(j => j.rating);
    const avgRating = ratedJobs.length > 0 
      ? ratedJobs.reduce((sum, j) => sum + j.rating, 0) / ratedJobs.length 
      : null;
    
    // Check if currently on a job (has active time entry)
    const isOnJob = memberJobs.some(job => 
      job.timeEntries?.some(e => e.techId === member.id && !e.endTime)
    );
    
    const currentJob = isOnJob ? memberJobs.find(job => 
      job.timeEntries?.some(e => e.techId === member.id && !e.endTime)
    ) : null;
    
    return {
      activeJobs,
      completedJobs,
      totalJobs: memberJobs.length,
      hoursThisWeek,
      hoursThisMonth,
      avgRating,
      isOnJob,
      currentJob
    };
  };

  // Get unassigned jobs for quick assign
  const unassignedJobs = jobs.filter(j => 
    j.status === 'pending' || 
    (j.status === 'assigned' && (!j.assignedTo || (Array.isArray(j.assignedTo) && j.assignedTo.length === 0)))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Team Members</h2>
        <Button icon={UserPlus} onClick={() => setShowAddUserModal(true)}>Add Team Member</Button>
      </div>

      {/* Role Edit Modal */}
      <Modal isOpen={!!editingMemberRole} title="Change Team Member Role" onClose={() => setEditingMemberRole(null)}>
        {editingMemberRole && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
              <span className="text-3xl">{editingMemberRole.avatar || '👤'}</span>
              <div>
                <p className="font-semibold" style={{ color: colors.textPrimary }}>{editingMemberRole.name}</p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>{editingMemberRole.email}</p>
              </div>
            </div>
            <Select
              label="Role"
              value={editingMemberRole.role}
              onChange={(e) => setEditingMemberRole({ ...editingMemberRole, role: e.target.value })}
              options={[
                { value: 'farmer', label: 'Customer - Farmer/equipment owner' },
                { value: 'tech', label: 'Technician - Field service worker' },
                { value: 'office', label: 'Office - Can manage jobs and customers' },
                { value: 'manager', label: 'Manager - Full access' }
              ]}
            />
            <div className="flex space-x-3">
              <Button className="flex-1" onClick={() => handleRoleChange(editingMemberRole.id, editingMemberRole.role)}>Save Changes</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setEditingMemberRole(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Team Member Profile Modal */}
      <Modal isOpen={!!selectedMember} title="Team Member Profile" onClose={() => setSelectedMember(null)} size="lg">
        {selectedMember && (() => {
          const stats = getMemberStats(selectedMember);
          const farmers = users.filter(u => u.role === 'farmer');
          
          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                <div className="flex items-center space-x-4">
                  <span className="text-5xl">{selectedMember.avatar || '👤'}</span>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>{selectedMember.name}</h3>
                    <Badge variant={selectedMember.role === 'manager' ? 'accent' : selectedMember.role === 'office' ? 'water' : 'default'}>
                      {selectedMember.role}
                    </Badge>
                    {stats.isOnJob && (
                      <Badge variant="success" className="ml-2">
                        <span className="animate-pulse mr-1">●</span> On Job
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  {selectedMember.phone && (
                    <a 
                      href={`tel:${selectedMember.phone}`}
                      className="flex items-center px-3 py-2 rounded-lg text-sm"
                      style={{ backgroundColor: colors.success + '15', color: colors.success }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {selectedMember.phone}
                    </a>
                  )}
                  {selectedMember.email && (
                    <a 
                      href={`mailto:${selectedMember.email}`}
                      className="flex items-center px-3 py-2 rounded-lg text-sm"
                      style={{ backgroundColor: colors.water + '15', color: colors.water }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {selectedMember.email}
                    </a>
                  )}
                  {selectedMember.email && resetPassword && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`Send password reset email to ${selectedMember.email}?`)) {
                          const result = await resetPassword(selectedMember.email);
                          if (result.success) {
                            addNotification('success', `Password reset email sent to ${selectedMember.email}`);
                          } else {
                            addNotification('error', result.error || 'Failed to send reset email');
                          }
                        }
                      }}
                      className="flex items-center px-3 py-2 rounded-lg text-sm"
                      style={{ backgroundColor: colors.warning + '15', color: colors.warning }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Reset Password
                    </button>
                  )}
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.water + '15' }}>
                  <p className="text-2xl font-bold" style={{ color: colors.water }}>{stats.activeJobs.length}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Active Jobs</p>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.success + '15' }}>
                  <p className="text-2xl font-bold" style={{ color: colors.success }}>{stats.completedJobs.length}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Completed</p>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.primary + '15' }}>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>{stats.hoursThisWeek.toFixed(1)}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Hours This Week</p>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.accent + '15' }}>
                  <p className="text-2xl font-bold" style={{ color: colors.accent }}>
                    {stats.avgRating ? stats.avgRating.toFixed(1) + '★' : '-'}
                  </p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Avg Rating</p>
                </div>
              </div>
              
              {/* Current Job Alert */}
              {stats.currentJob && (
                <div className="p-4 rounded-lg border-l-4" style={{ backgroundColor: colors.success + '10', borderColor: colors.success }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: colors.success }}>Currently Working On:</p>
                      <p className="font-semibold" style={{ color: colors.textPrimary }}>{stats.currentJob.title}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {stats.currentJob.pivotName} • {farmers.find(f => f.id === stats.currentJob.farmerId)?.name || 'Unknown'}
                      </p>
                    </div>
                    {stats.currentJob.soNumber && (
                      <span className="font-mono px-2 py-1 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>
                        SO# {stats.currentJob.soNumber}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Active Jobs List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold" style={{ color: colors.textPrimary }}>Active Jobs ({stats.activeJobs.length})</h4>
                  {(selectedMember.role === 'tech' || selectedMember.role === 'manager') && unassignedJobs.length > 0 && (
                    <Button size="sm" icon={Plus} onClick={() => setShowAssignModal(true)}>
                      Assign Job
                    </Button>
                  )}
                </div>
                {stats.activeJobs.length === 0 ? (
                  <p className="text-sm p-4 text-center rounded-lg" style={{ backgroundColor: colors.background, color: colors.textSecondary }}>
                    No active jobs assigned
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {stats.activeJobs.map(job => {
                      const farmer = farmers.find(f => f.id === job.farmerId);
                      const hasActiveEntry = job.timeEntries?.some(e => e.techId === selectedMember.id && !e.endTime);
                      return (
                        <div 
                          key={job.id} 
                          className="p-3 rounded-lg flex items-center justify-between"
                          style={{ backgroundColor: hasActiveEntry ? colors.success + '10' : colors.background }}
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              {job.soNumber && (
                                <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>
                                  {job.soNumber}
                                </span>
                              )}
                              <span className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</span>
                              {hasActiveEntry && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: colors.success, color: 'white' }}>ACTIVE</span>}
                            </div>
                            <p className="text-xs" style={{ color: colors.textSecondary }}>
                              {farmer?.name || 'Unknown'} • {job.pivotName}
                            </p>
                          </div>
                          <Badge variant={job.status === 'in-progress' ? 'success' : job.status === 'waiting-on-parts' ? 'warning' : 'default'}>
                            {job.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Hours Summary */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                <h4 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Time Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>This Week</p>
                    <p className="text-xl font-bold" style={{ color: colors.primary }}>{stats.hoursThisWeek.toFixed(1)} hrs</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>This Month</p>
                    <p className="text-xl font-bold" style={{ color: colors.primary }}>{stats.hoursThisMonth.toFixed(1)} hrs</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Quick Assign Modal */}
      <Modal isOpen={showAssignModal && selectedMember} title={`Assign Job to ${selectedMember?.name}`} onClose={() => setShowAssignModal(false)}>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {unassignedJobs.length === 0 ? (
            <p className="text-center p-4" style={{ color: colors.textSecondary }}>No unassigned jobs available</p>
          ) : (
            unassignedJobs.map(job => {
              const farmer = users.find(u => u.id === job.farmerId);
              return (
                <div 
                  key={job.id}
                  className="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all"
                  style={{ borderColor: colors.border }}
                  onClick={async () => {
                    // Quick assign logic - would need handleAssignJob passed in
                    const currentAssignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
                    if (!currentAssignees.includes(selectedMember.id)) {
                      const result = await updateUser(job.id, { 
                        assignedTo: [...currentAssignees, selectedMember.id],
                        status: 'assigned'
                      });
                      if (result?.success !== false) {
                        addNotification('success', `Assigned "${job.title}" to ${selectedMember.name}`);
                        setShowAssignModal(false);
                      }
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        {job.soNumber && (
                          <span className="font-mono text-xs" style={{ color: colors.primary }}>{job.soNumber}</span>
                        )}
                        <span className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</span>
                      </div>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {farmer?.name || 'Unknown'} • {job.pivotName}
                      </p>
                    </div>
                    <Badge variant={job.priority === 'high' ? 'danger' : 'warning'}>{job.priority}</Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {teamMembers.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title="No Team Members" 
          description="Add technicians and office staff to your team." 
          action={<Button icon={UserPlus} onClick={() => setShowAddUserModal(true)}>Add Team Member</Button>} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map(member => {
            const stats = getMemberStats(member);
            const isSelf = member.id === userProfile?.id;
            
            return (
              <div 
                key={member.id} 
                className="card p-4 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedMember(member)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <span className="text-3xl">{member.avatar || '👤'}</span>
                      {stats.isOnJob && (
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: colors.success }} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                        {member.name}
                        {isSelf && <span className="text-xs ml-1" style={{ color: colors.primary }}>(You)</span>}
                      </h3>
                      <Badge variant={member.role === 'manager' ? 'accent' : member.role === 'office' ? 'water' : 'default'}>{member.role}</Badge>
                    </div>
                  </div>
                  {userProfile?.role === 'manager' && !isSelf && (
                    <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditingMemberRole(member)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Edit role"
                      >
                        <Settings className="w-4 h-4" style={{ color: colors.textSecondary }} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(member.id, member.name, member.role)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete team member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Contact Quick Actions */}
                <div className="flex space-x-2 mb-3" onClick={(e) => e.stopPropagation()}>
                  {member.phone && (
                    <a 
                      href={`tel:${member.phone}`}
                      className="flex-1 flex items-center justify-center px-2 py-1.5 rounded text-xs"
                      style={{ backgroundColor: colors.success + '15', color: colors.success }}
                    >
                      <Phone className="w-3 h-3 mr-1" />Call
                    </a>
                  )}
                  {member.email && (
                    <a 
                      href={`mailto:${member.email}`}
                      className="flex-1 flex items-center justify-center px-2 py-1.5 rounded text-xs"
                      style={{ backgroundColor: colors.water + '15', color: colors.water }}
                    >
                      <Mail className="w-3 h-3 mr-1" />Email
                    </a>
                  )}
                </div>
                
                {/* Status Banner */}
                {stats.isOnJob && stats.currentJob && (
                  <div className="p-2 rounded mb-3 text-xs" style={{ backgroundColor: colors.success + '15' }}>
                    <span style={{ color: colors.success }}>● On Job: </span>
                    <span style={{ color: colors.textPrimary }}>{stats.currentJob.title}</span>
                  </div>
                )}
                
                {/* Stats */}
                {(member.role === 'tech' || member.role === 'manager') && (
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: colors.border }}>
                    <div className="text-center">
                      <p className="font-bold" style={{ color: colors.water }}>{stats.activeJobs.length}</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>Active</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold" style={{ color: colors.success }}>{stats.completedJobs.length}</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>Done</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold" style={{ color: colors.primary }}>{stats.hoursThisWeek.toFixed(1)}</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>Hrs/Wk</p>
                    </div>
                  </div>
                )}
                
                {/* Click hint */}
                <p className="text-xs text-center mt-3" style={{ color: colors.muted }}>Click for details →</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// ANALYTICS VIEW
// ============================================
export const AnalyticsView = ({
  colors,
  jobs,
  users,
  analytics
}) => {
  // Calculate monthly data for charts
  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthJobs = jobs.filter(j => {
        const date = new Date(j.completedAt || j.createdAt);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });
      const completed = monthJobs.filter(j => j.status === 'completed');
      const revenue = completed.reduce((sum, j) => sum + (j.totalCost || 0), 0);
      
      return { name: month, jobs: monthJobs.length, completed: completed.length, revenue };
    });
  };

  // Team performance data - anyone who has billed hours
  const getTechPerformance = () => {
    // Get all users who have time entries (billed hours)
    const usersWithHours = users.filter(u => u.role !== 'farmer').filter(user => {
      return jobs.some(job => 
        job.timeEntries?.some(entry => entry.techId === user.id && entry.endTime)
      );
    });
    
    return usersWithHours.map(member => {
      const memberJobs = jobs.filter(j => {
        const assigned = j.assignedTo;
        return Array.isArray(assigned) ? assigned.includes(member.id) : assigned === member.id;
      });
      const completed = memberJobs.filter(j => j.status === 'completed');
      const avgRating = completed.length > 0 
        ? completed.reduce((sum, j) => sum + (j.rating || 0), 0) / completed.filter(j => j.rating).length 
        : 0;
      
      // Calculate total hours from time entries across ALL jobs
      const totalHours = jobs.reduce((sum, job) => {
        if (job.timeEntries && Array.isArray(job.timeEntries)) {
          const memberEntries = job.timeEntries.filter(e => e.techId === member.id && e.endTime);
          const jobHours = memberEntries.reduce((h, entry) => {
            const start = new Date(entry.startTime);
            const end = new Date(entry.endTime);
            const hours = (end - start) / (1000 * 60 * 60);
            const lunchDeduction = entry.lunchTaken ? 0.5 : 0;
            return h + Math.max(0, hours - lunchDeduction);
          }, 0);
          return sum + jobHours;
        }
        return sum;
      }, 0);
      
      return { 
        name: member.name.split(' ')[0], 
        fullName: member.name, 
        role: member.role,
        jobs: completed.length, 
        hours: totalHours, 
        rating: avgRating || 0 
      };
    }).sort((a, b) => b.hours - a.hours); // Sort by hours descending
  };

  // Job status pie chart data
  const statusData = [
    { name: 'Pending', value: analytics?.pendingJobs || 0, color: colors.warning },
    { name: 'Assigned', value: analytics?.assignedJobs || 0, color: colors.water },
    { name: 'Completed', value: analytics?.completedJobs || 0, color: colors.success }
  ];

  // Memoize expensive analytics calculations
  const monthlyData = useMemo(() => getMonthlyData(), [jobs]); // eslint-disable-line react-hooks/exhaustive-deps
  const techData = useMemo(() => getTechPerformance(), [jobs, users]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="success">{analytics?.completedJobs || 0} Completed</Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Jobs" value={analytics?.totalJobs || 0} icon={Briefcase} color={colors.primary} />
        <StatCard title="This Month" value={analytics?.completedThisMonth || 0} icon={Calendar} color={colors.water} />
        <StatCard title="Total Hours" value={techData.reduce((sum, t) => sum + t.hours, 0).toFixed(1)} icon={Clock} color={colors.success} />
        <StatCard title="Avg Rating" value={(techData.reduce((sum, t) => sum + t.rating, 0) / (techData.length || 1)).toFixed(1)} icon={Star} color={colors.accent} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Jobs Chart */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Jobs by Month</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="name" tick={{ fill: colors.textSecondary, fontSize: 12 }} />
              <YAxis tick={{ fill: colors.textSecondary, fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px' }}
                labelStyle={{ color: colors.textPrimary }}
              />
              <Bar dataKey="completed" fill={colors.success} radius={[4, 4, 0, 0]} name="Completed" />
              <Bar dataKey="jobs" fill={colors.primary} radius={[4, 4, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Job Status Pie Chart */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Job Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-2">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm" style={{ color: colors.textSecondary }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Hours Billed */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Hours Billed by Team Member</h3>
          {techData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center">
              <p style={{ color: colors.textSecondary }}>No billable hours recorded yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={techData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis type="number" tick={{ fill: colors.textSecondary, fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: colors.textSecondary, fontSize: 12 }} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px' }}
                  formatter={(value) => [`${value.toFixed(1)} hrs`, 'Hours']}
                />
                <Bar dataKey="hours" fill={colors.water} radius={[0, 4, 4, 0]} name="Hours Billed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Team Performance - Jobs Completed */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Jobs Completed by Team Member</h3>
          {techData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center">
              <p style={{ color: colors.textSecondary }}>No billable team data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={techData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis type="number" tick={{ fill: colors.textSecondary, fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: colors.textSecondary, fontSize: 12 }} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px' }}
                />
                <Bar dataKey="jobs" fill={colors.primary} radius={[0, 4, 4, 0]} name="Jobs Completed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Team Hours Summary Table */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Team Hours Summary</h3>
        {techData.length === 0 ? (
          <p className="text-center py-4" style={{ color: colors.textSecondary }}>No billable team data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: colors.background }}>
                <tr>
                  <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Team Member</th>
                  <th className="text-center p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Role</th>
                  <th className="text-center p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Jobs Completed</th>
                  <th className="text-center p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Hours Billed</th>
                  <th className="text-center p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {techData.map((tech, index) => (
                  <tr key={index} className="border-t" style={{ borderColor: colors.border }}>
                    <td className="p-3 font-medium" style={{ color: colors.textPrimary }}>{tech.fullName || tech.name}</td>
                    <td className="p-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded capitalize" style={{ 
                        backgroundColor: tech.role === 'manager' ? colors.primary + '20' : tech.role === 'tech' ? colors.water + '20' : colors.muted + '20',
                        color: tech.role === 'manager' ? colors.primary : tech.role === 'tech' ? colors.water : colors.textSecondary
                      }}>
                        {tech.role}
                      </span>
                    </td>
                    <td className="p-3 text-center" style={{ color: colors.textSecondary }}>{tech.jobs}</td>
                    <td className="p-3 text-center font-semibold" style={{ color: colors.water }}>{tech.hours.toFixed(1)} hrs</td>
                    <td className="p-3 text-center">
                      {tech.rating > 0 ? (
                        <span className="flex items-center justify-center">
                          <Star className="w-4 h-4 mr-1" style={{ color: colors.accent, fill: colors.accent }} />
                          <span style={{ color: colors.textPrimary }}>{tech.rating.toFixed(1)}</span>
                        </span>
                      ) : (
                        <span style={{ color: colors.muted }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="border-t-2" style={{ borderColor: colors.primary, backgroundColor: colors.background }}>
                  <td className="p-3 font-bold" style={{ color: colors.primary }}>TOTAL</td>
                  <td className="p-3 text-center font-bold" style={{ color: colors.primary }}>{techData.reduce((sum, t) => sum + t.jobs, 0)}</td>
                  <td className="p-3 text-center font-bold" style={{ color: colors.primary }}>{techData.reduce((sum, t) => sum + t.hours, 0).toFixed(1)} hrs</td>
                  <td className="p-3 text-center font-bold" style={{ color: colors.primary }}>
                    {techData.filter(t => t.rating > 0).length > 0 
                      ? (techData.reduce((sum, t) => sum + t.rating, 0) / techData.filter(t => t.rating > 0).length).toFixed(1)
                      : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>System Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.background }}>
            <p className="text-3xl font-bold" style={{ color: colors.primary }}>{analytics?.totalUsers || 0}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Total Users</p>
          </div>
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.background }}>
            <p className="text-3xl font-bold" style={{ color: colors.secondary }}>{analytics?.totalPivots || 0}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Total Equipment</p>
          </div>
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.background }}>
            <p className="text-3xl font-bold" style={{ color: colors.water }}>{analytics?.techs || 0}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Technicians</p>
          </div>
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.background }}>
            <p className="text-3xl font-bold" style={{ color: colors.accent }}>{users.filter(u => u.role === 'farmer').length}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Customers</p>
          </div>
        </div>
      </div>
    </div>
  );
};
