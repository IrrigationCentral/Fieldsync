// ============================================
// TECH HOURS CALCULATOR
// Calculates billable hours from serviceEntries only.
// Top-level job fields (hoursWorked, milesDriven) are
// unreliable because they get overwritten on each
// completion. serviceEntries is the source of truth.
// ============================================

/**
 * Get hours for a specific tech from serviceEntries.
 * Returns { totalHours, totalMiles, totalJobs, entries[] }
 */
export const getTechHoursFromEntries = (jobs, techId) => {
  let totalHours = 0;
  let totalMiles = 0;
  const jobIds = new Set();
  const entries = [];

  jobs.forEach(job => {
    if (!job.serviceEntries || job.serviceEntries.length === 0) return;

    job.serviceEntries.forEach(entry => {
      const entryTechId = typeof entry.completedBy === 'object'
        ? entry.completedBy?.id
        : entry.completedBy;

      if (entryTechId === techId) {
        const hrs = Number(entry.hoursWorked) || 0;
        const mi = Number(entry.milesDriven) || 0;
        totalHours += hrs;
        totalMiles += mi;
        jobIds.add(job.id);
        entries.push({
          jobId: job.id,
          jobTitle: job.title,
          soNumber: job.soNumber,
          date: entry.date,
          hours: hrs,
          miles: mi
        });
      }
    });
  });

  return {
    totalHours,
    totalMiles,
    totalJobs: jobIds.size,
    entries: entries.sort((a, b) =>
      new Date(b.date || 0) - new Date(a.date || 0)
    )
  };
};

/**
 * Build a leaderboard of all techs ranked by billable hours.
 * Returns sorted array: [{ id, name, avatar, hours, miles, jobs }]
 */
export const buildHoursLeaderboard = (jobs, users) => {
  const techs = users.filter(u =>
    u.role === 'tech' || u.role === 'manager'
  );

  const board = techs.map(tech => {
    const stats = getTechHoursFromEntries(jobs, tech.id);
    return {
      id: tech.id,
      name: tech.name,
      avatar: tech.avatar || '',
      role: tech.role,
      hours: stats.totalHours,
      miles: stats.totalMiles,
      jobs: stats.totalJobs
    };
  });

  // Sort by hours descending, filter out zeros
  return board
    .filter(t => t.hours > 0 || t.jobs > 0)
    .sort((a, b) => b.hours - a.hours);
};
