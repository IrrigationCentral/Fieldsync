// FieldSync v2 - Status Constants

export const STATUS_VARIANTS = {
  'pending': 'warning',
  'assigned': 'water',
  'in-progress': 'water',
  'completed': 'success',
  'billed': 'success',
  'ready-to-bill': 'accent',
  'needs-followup': 'danger',
  'active': 'success',
  'needs-service': 'danger'
};

export const JOB_STATUSES = ['pending', 'assigned', 'in-progress', 'completed', 'ready-to-bill', 'billed', 'needs-followup'];

export const ACTIVE_STATUSES = ['assigned', 'in-progress', 'needs-followup'];

export const COMPLETED_STATUSES = ['completed', 'billed', 'ready-to-bill'];

export const STATUS_LABELS = {
  'pending': 'Pending',
  'assigned': 'Assigned',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'ready-to-bill': 'Ready to Bill',
  'billed': 'Billed',
  'needs-followup': 'Needs Follow-up'
};

/** @param {string} status */
export const getStatusVariant = (status) => STATUS_VARIANTS[status] || 'default';

/** @param {string} status */
export const getStatusLabel = (status) => STATUS_LABELS[status] || status || 'Unknown';
