// FieldSync v2 - General Helpers

/** @param {string} role */
export const canSeePricing = (role) => ['manager', 'office'].includes(role);

/** @param {string} role @param {string} action */
export const hasPermission = (role, action) => {
  const permissions = {
    'create-job': ['office', 'manager', 'farmer'],
    'assign-job': ['office', 'manager'],
    'complete-job': ['tech', 'manager'],
    'delete-job': ['office', 'manager'],
    'delete-user': ['manager'],
    'edit-team': ['manager'],
    'manage-settings': ['manager'],
    'view-analytics': ['manager', 'office'],
    'view-all-jobs': ['office', 'manager'],
    'self-assign': ['tech', 'manager'],
    'time-tracking': ['tech', 'manager'],
  };
  return (permissions[action] || []).includes(role);
};

/** @param {string} role */
export const getDefaultRoute = (role) => {
  switch (role) {
    case 'farmer': return '/equipment';
    case 'tech': return '/dashboard';
    case 'office': return '/jobs';
    case 'manager': return '/dashboard';
    default: return '/';
  }
};

/** @param {Object} user */
export const getUserDisplayName = (user) => user?.name || user?.email || 'Unknown';

/** @param {Array} users @param {string} userId */
export const findUser = (users, userId) => users.find(u => u.id === userId);

/** @param {Object} job @param {string} techId */
export const hasActiveTimeEntry = (job, techId) => {
  if (!job?.timeEntries || !Array.isArray(job.timeEntries)) return false;
  return job.timeEntries.some(entry => entry.techId === techId && !entry.endTime);
};

/** @param {Object} job @param {Array} users */
export const getAssignedNames = (job, users) => {
  if (!job?.assignedTo) return 'Unassigned';
  if (Array.isArray(job.assignedTo)) {
    const names = job.assignedTo
      .map(id => users.find(u => u.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Unassigned';
  }
  const user = users.find(u => u.id === job.assignedTo);
  return user?.name || 'Unassigned';
};

/** @param {Object} job */
export const getJobPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent': return '#C73E1D';
    case 'high': return '#F4B942';
    case 'normal': return '#4A90A4';
    case 'low': return '#9CA986';
    default: return '#9CA986';
  }
};
