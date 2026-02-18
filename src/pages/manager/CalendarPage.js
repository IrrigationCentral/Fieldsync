// FieldSync v2 - Calendar Page
// Extracted from App.js CalendarView (~line 2373)
import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { getStatusVariant } from '../../constants/statusMaps';
import { Badge, Button } from '../../components/ui';

const CalendarPage = ({ onOpenJobDetails }) => {
  const { colors } = useTheme();
  const { users, jobs } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const days = [];
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  const getJobsForDate = (date) => {
    return jobs.filter(job => {
      const jobDate = new Date(job.scheduledDate || job.createdAt);
      return jobDate.toDateString() === date.toDateString();
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  const selectedDateJobs = selectedDate ? getJobsForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Job Calendar</h2>
        <Button size="sm" variant="secondary" onClick={goToToday}>Today</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5" style={{ color: colors.textSecondary }} /></button>
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight className="w-5 h-5" style={{ color: colors.textSecondary }} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (<div key={day} className="text-center text-sm font-medium py-2" style={{ color: colors.textSecondary }}>{day}</div>))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dayJobs = getJobsForDate(day.date);
              const isToday = day.date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
              return (
                <div key={index} onClick={() => setSelectedDate(day.date)}
                  className={`min-h-[80px] p-1 rounded-lg cursor-pointer transition-all border ${!day.isCurrentMonth ? 'opacity-40' : ''} ${isSelected ? 'ring-2 ring-green-500' : ''}`}
                  style={{ backgroundColor: isSelected ? colors.primary + '10' : colors.cardBg, borderColor: isToday ? colors.success : colors.border }}>
                  <div className="text-sm font-medium mb-1" style={{ color: isToday ? colors.success : colors.textPrimary }}>{day.date.getDate()}</div>
                  <div className="space-y-1">
                    {dayJobs.slice(0, 2).map((job, i) => (
                      <div key={i} className="text-xs px-1 py-0.5 rounded truncate"
                        style={{
                          backgroundColor: ['completed', 'billed', 'ready-to-bill'].includes(job.status) ? colors.success + '20' : ['assigned', 'in-progress'].includes(job.status) ? colors.water + '20' : job.status === 'needs-followup' ? '#C73E1D20' : colors.warning + '20',
                          color: ['completed', 'billed', 'ready-to-bill'].includes(job.status) ? colors.success : ['assigned', 'in-progress'].includes(job.status) ? colors.water : job.status === 'needs-followup' ? '#C73E1D' : colors.warning
                        }}>{job.title}</div>
                    ))}
                    {dayJobs.length > 2 && <div className="text-xs" style={{ color: colors.muted }}>+{dayJobs.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>
            {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
          </h3>
          {selectedDate ? (
            selectedDateJobs.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-2" style={{ color: colors.muted }} />
                <p style={{ color: colors.textSecondary }}>No jobs scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateJobs.map(job => (
                  <div key={job.id} className="p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow" style={{ backgroundColor: colors.background }}
                    onClick={() => onOpenJobDetails && onOpenJobDetails(job)}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium" style={{ color: colors.textPrimary }}>{job.title}</h4>
                      <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                    </div>
                    <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>{job.pivotName}</p>
                    <p className="text-xs" style={{ color: colors.muted }}>
                      {Array.isArray(job.assignedTo)
                        ? job.assignedTo.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ') || 'Unassigned'
                        : users.find(u => u.id === job.assignedTo)?.name || 'Unassigned'}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-2" style={{ color: colors.muted }} />
              <p style={{ color: colors.textSecondary }}>Click a date to view jobs</p>
            </div>
          )}
        </div>
      </div>

      <div className="card p-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <div className="flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: colors.warning + '40' }} /><span className="text-sm" style={{ color: colors.textSecondary }}>Pending</span></div>
          <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: colors.water + '40' }} /><span className="text-sm" style={{ color: colors.textSecondary }}>Assigned</span></div>
          <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: colors.success + '40' }} /><span className="text-sm" style={{ color: colors.textSecondary }}>Completed</span></div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
