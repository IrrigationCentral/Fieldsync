// FieldSync v2 - Analytics Service
import { ACTIVE_STATUSES, COMPLETED_STATUSES } from '../constants/statusMaps';

/**
 * @param {Array} jobs
 * @param {Object} settings - {hourlyRate, mileageRate, partsMarkup}
 * @returns {Array<{month: string, jobs: number, revenue: number, completed: number}>}
 */
export const getMonthlyData = (jobs, settings) => {
  const months = {};
  const completedJobs = jobs.filter(j => COMPLETED_STATUSES.includes(j.status));

  completedJobs.forEach(job => {
    const date = job.completedAt?.toDate?.() || job.createdAt?.toDate?.();
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!months[key]) months[key] = { month: key, jobs: 0, revenue: 0, completed: 0 };
    months[key].jobs++;
    months[key].completed++;
    months[key].revenue += job.totalCost || 0;
  });

  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * @param {Array} jobs
 * @param {Array} users
 * @returns {Array<{id: string, name: string, completed: number, active: number}>}
 */
export const getTechPerformance = (jobs, users) => {
  const techs = users.filter(u => u.role === 'tech' || u.role === 'manager');
  return techs.map(tech => {
    const techJobs = jobs.filter(j => {
      if (Array.isArray(j.assignedTo)) return j.assignedTo.includes(tech.id);
      return j.assignedTo === tech.id;
    });
    return {
      id: tech.id,
      name: tech.name || tech.email,
      completed: techJobs.filter(j => COMPLETED_STATUSES.includes(j.status)).length,
      active: techJobs.filter(j => ACTIVE_STATUSES.includes(j.status)).length,
    };
  }).sort((a, b) => b.completed - a.completed);
};

/**
 * @param {Array} jobs
 * @returns {Array<{name: string, value: number, color: string}>}
 */
export const getStatusDistribution = (jobs) => {
  const colors = {
    pending: '#FAAD14', assigned: '#4A90A4', 'in-progress': '#5BA8BE',
    completed: '#52C41A', 'ready-to-bill': '#F4B942', billed: '#8FBC3B',
    'needs-followup': '#C73E1D'
  };
  const counts = {};
  jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value, color: colors[name] || '#9CA986' }))
    .filter(d => d.value > 0);
};
