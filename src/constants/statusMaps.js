// FieldSync v2 - Status Constants

export const STATUS_VARIANTS = {
  'pending': 'warning',
  'assigned': 'water',
  'in-progress': 'water',
  'completed': 'success',
  'billed': 'success',
  'ready-to-bill': 'accent',
  'needs-followup': 'danger',
  'canceled': 'danger',
  'active': 'success',
  'needs-service': 'danger'
};

export const JOB_STATUSES = ['pending', 'assigned', 'in-progress', 'completed', 'ready-to-bill', 'billed', 'needs-followup', 'canceled'];

// Active = everything except ready-to-bill, billed, canceled
export const ACTIVE_STATUSES = ['pending', 'assigned', 'in-progress', 'needs-followup', 'completed'];

// Inactive = ready-to-bill, billed, canceled
export const INACTIVE_STATUSES = ['ready-to-bill', 'billed', 'canceled'];

export const COMPLETED_STATUSES = ['completed', 'billed', 'ready-to-bill'];

export const STATUS_LABELS = {
  'pending': 'Pending',
  'assigned': 'Assigned',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'ready-to-bill': 'Ready to Bill',
  'billed': 'Billed',
  'needs-followup': 'Needs Follow-up',
  'canceled': 'Canceled'
};

/** @param {string} status */
export const getStatusVariant = (status) => STATUS_VARIANTS[status] || 'default';

/** @param {string} status */
export const getStatusLabel = (status) => STATUS_LABELS[status] || status || 'Unknown';
