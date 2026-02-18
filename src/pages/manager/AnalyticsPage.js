// FieldSync v2 - Analytics Dashboard Page
// Extracted from App.js AnalyticsView (~line 2108)
import React from 'react';
import { Briefcase, Calendar, Clock, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { StatCard, Badge } from '../../components/ui';

const AnalyticsPage = () => {
  const { colors } = useTheme();
  const { users, jobs, analytics } = useData();

  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    return months.map((month, index) => {
      const monthJobs = jobs.filter(j => {
        const date = new Date(j.completedAt || j.createdAt);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });
      const completed = monthJobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status));
      const revenue = completed.reduce((sum, j) => sum + (j.totalCost || 0), 0);
      return { name: month, jobs: monthJobs.length, completed: completed.length, revenue };
    });
  };

  const getTechPerformance = () => {
    return users.filter(u => u.role === 'tech').map(tech => {
      const techJobs = jobs.filter(j => {
        const assigned = j.assignedTo;
        return Array.isArray(assigned) ? assigned.includes(tech.id) : assigned === tech.id;
      });
      const completed = techJobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status));
      const avgRating = completed.length > 0
        ? completed.reduce((sum, j) => sum + (j.rating || 0), 0) / completed.filter(j => j.rating).length
        : 0;
      const totalHours = techJobs.reduce((sum, job) => {
        if (job.timeEntries && Array.isArray(job.timeEntries)) {
          const techEntries = job.timeEntries.filter(e => e.techId === tech.id && e.endTime);
          const jobHours = techEntries.reduce((h, entry) => {
            const start = new Date(entry.startTime);
            const end = new Date(entry.endTime);
            const hours = (end - start) / (1000 * 60 * 60);
            const lunchDeduction = entry.lunchTaken ? 0.5 : 0;
            return h + Math.max(0, hours - lunchDeduction);
          }, 0);
          return sum + jobHours;
        }
        return sum + (job.hoursWorked || 0);
      }, 0);
      return { name: tech.name.split(' ')[0], fullName: tech.name, jobs: completed.length, hours: totalHours, rating: avgRating || 0 };
    });
  };

  const statusData = [
    { name: 'Pending', value: analytics?.pendingJobs || 0, color: colors.warning },
    { name: 'Assigned', value: analytics?.assignedJobs || 0, color: colors.water },
    { name: 'In Progress', value: analytics?.inProgressJobs || 0, color: '#1890FF' },
    { name: 'Completed', value: analytics?.completedJobs || 0, color: colors.success },
    { name: 'Ready to Bill', value: analytics?.readyToBillJobs || 0, color: colors.accent || '#722ED1' },
    { name: 'Billed', value: analytics?.billedJobs || 0, color: '#13C2C2' },
    { name: 'Needs Follow-up', value: analytics?.needsFollowupJobs || 0, color: '#C73E1D' }
  ].filter(d => d.value > 0);

  const monthlyData = getMonthlyData();
  const techData = getTechPerformance();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="success">{analytics?.completedJobs || 0} Completed</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Jobs" value={analytics?.totalJobs || 0} icon={Briefcase} color={colors.primary} />
        <StatCard title="This Month" value={analytics?.completedThisMonth || 0} icon={Calendar} color={colors.water} />
        <StatCard title="Total Hours" value={techData.reduce((sum, t) => sum + t.hours, 0).toFixed(1)} icon={Clock} color={colors.success} />
        <StatCard title="Avg Rating" value={(techData.reduce((sum, t) => sum + t.rating, 0) / (techData.length || 1)).toFixed(1)} icon={Star} color={colors.accent} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Jobs by Month</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="name" tick={{ fill: colors.textSecondary, fontSize: 12 }} />
              <YAxis tick={{ fill: colors.textSecondary, fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px' }} labelStyle={{ color: colors.textPrimary }} />
              <Bar dataKey="completed" fill={colors.success} radius={[4, 4, 0, 0]} name="Completed" />
              <Bar dataKey="jobs" fill={colors.primary} radius={[4, 4, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Job Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center flex-wrap gap-4 mt-2">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm" style={{ color: colors.textSecondary }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Hours Billed by Technician</h3>
          {techData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center"><p style={{ color: colors.textSecondary }}>No technician data yet</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={techData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis type="number" tick={{ fill: colors.textSecondary, fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: colors.textSecondary, fontSize: 12 }} width={60} />
                <Tooltip contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px' }} formatter={(value) => [`${value.toFixed(1)} hrs`, 'Hours']} />
                <Bar dataKey="hours" fill={colors.water} radius={[0, 4, 4, 0]} name="Hours Billed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Jobs Completed by Technician</h3>
          {techData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center"><p style={{ color: colors.textSecondary }}>No technician data yet</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={techData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis type="number" tick={{ fill: colors.textSecondary, fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: colors.textSecondary, fontSize: 12 }} width={60} />
                <Tooltip contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
                <Bar dataKey="jobs" fill={colors.primary} radius={[0, 4, 4, 0]} name="Jobs Completed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tech Hours Summary Table */}
      <div className="card p-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Technician Hours Summary</h3>
        {techData.length === 0 ? (
          <p className="text-center py-4" style={{ color: colors.textSecondary }}>No technician data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: colors.background }}>
                <tr>
                  <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Technician</th>
                  <th className="text-center p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Jobs Completed</th>
                  <th className="text-center p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Hours Billed</th>
                  <th className="text-center p-3 text-sm font-semibold" style={{ color: colors.textSecondary }}>Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {techData.map((tech, index) => (
                  <tr key={index} className="border-t" style={{ borderColor: colors.border }}>
                    <td className="p-3 font-medium" style={{ color: colors.textPrimary }}>{tech.fullName || tech.name}</td>
                    <td className="p-3 text-center" style={{ color: colors.textSecondary }}>{tech.jobs}</td>
                    <td className="p-3 text-center font-semibold" style={{ color: colors.water }}>{tech.hours.toFixed(1)} hrs</td>
                    <td className="p-3 text-center">
                      {tech.rating > 0 ? (
                        <span className="flex items-center justify-center">
                          <Star className="w-4 h-4 mr-1" style={{ color: colors.accent, fill: colors.accent }} />
                          <span style={{ color: colors.textPrimary }}>{tech.rating.toFixed(1)}</span>
                        </span>
                      ) : (<span style={{ color: colors.muted }}>-</span>)}
                    </td>
                  </tr>
                ))}
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

      <div className="card p-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
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

export default AnalyticsPage;
