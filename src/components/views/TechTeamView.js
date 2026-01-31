import React, { useState } from 'react';
import { 
  Users, Clock, Trophy, MapPin, Phone, Wrench, 
  TrendingUp, Star
} from 'lucide-react';

export const TechTeamView = ({
  colors,
  jobs = [],
  users = [],
  equipment = [],
  userProfile
}) => {
  const [timeframe, setTimeframe] = useState('week');
  
  // Safety checks
  if (!colors || !users || !jobs) {
    return (
      <div className="p-4 text-center">
        <p>Loading team data...</p>
      </div>
    );
  }
  
  // Get all team members who can bill hours
  const teamMembers = (users || []).filter(u => u?.role === 'tech' || u?.role === 'manager');
  
  // Calculate hours for a team member within timeframe
  const getMemberHours = (memberId, period) => {
    if (!memberId || !jobs) return 0;
    
    const now = new Date();
    let startDate;
    
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(0);
    }
    
    return (jobs || []).reduce((total, job) => {
      if (!job?.timeEntries) return total;
      
      const memberEntries = job.timeEntries.filter(e => 
        e?.techId === memberId && 
        e?.endTime &&
        new Date(e.startTime) >= startDate
      );
      
      return total + memberEntries.reduce((sum, entry) => {
        try {
          const start = new Date(entry.startTime);
          const end = new Date(entry.endTime);
          const hours = (end - start) / (1000 * 60 * 60);
          const lunch = entry.lunchTaken ? 0.5 : 0;
          return sum + Math.max(0, hours - lunch);
        } catch {
          return sum;
        }
      }, 0);
    }, 0);
  };
  
  // Get member's current status
  const getMemberStatus = (memberId) => {
    if (!memberId || !jobs) return { status: 'available' };
    
    const activeJob = jobs.find(job => 
      job?.timeEntries?.some(e => e?.techId === memberId && !e?.endTime)
    );
    
    if (activeJob) {
      const pivot = (equipment || []).find(p => p?.id === activeJob.pivotId);
      // Handle location being either a string or an object with address property
      let locationStr = activeJob?.pivotName || 'Unknown';
      if (pivot?.location) {
        if (typeof pivot.location === 'string') {
          locationStr = pivot.location;
        } else if (pivot.location.address) {
          locationStr = pivot.location.address;
        }
      }
      return {
        status: 'working',
        job: activeJob,
        pivot,
        location: locationStr
      };
    }
    
    return { status: 'available' };
  };
  
  // Build leaderboard data
  const leaderboard = teamMembers.map(member => {
    if (!member?.id) return null;
    
    const hours = getMemberHours(member.id, timeframe);
    const status = getMemberStatus(member.id);
    
    const completedJobs = (jobs || []).filter(j => {
      const assigned = Array.isArray(j?.assignedTo) ? j.assignedTo : [j?.assignedTo];
      return assigned.includes(member.id) && j?.status === 'completed';
    }).length;
    
    const ratedJobs = (jobs || []).filter(j => {
      const assigned = Array.isArray(j?.assignedTo) ? j.assignedTo : [j?.assignedTo];
      return assigned.includes(member.id) && j?.rating;
    });
    const avgRating = ratedJobs.length > 0 
      ? ratedJobs.reduce((sum, j) => sum + (j?.rating || 0), 0) / ratedJobs.length 
      : 0;
    
    return {
      ...member,
      hours,
      status: status.status,
      currentJob: status.job,
      currentPivot: status.pivot,
      location: status.location,
      completedJobs,
      avgRating,
      isMe: member.id === userProfile?.id
    };
  }).filter(Boolean).filter(m => m.hours > 0 || m.status === 'working')
    .sort((a, b) => b.hours - a.hours);
  
  const podium = leaderboard.slice(0, 3);
  const myRank = leaderboard.findIndex(m => m?.id === userProfile?.id) + 1;
  const myStats = leaderboard.find(m => m?.id === userProfile?.id);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold flex items-center" style={{ color: colors.primary }}>
          <Users className="w-6 h-6 mr-2" />
          Team Activity
        </h2>
        <div className="flex space-x-2">
          {['week', 'month', 'all'].map(period => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ 
                backgroundColor: timeframe === period ? colors.primary : colors.cardBg || '#f5f5f5',
                color: timeframe === period ? 'white' : colors.textSecondary
              }}
            >
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* My Stats Card */}
      {myStats && (
        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.cardBg || '#fff', borderLeft: `4px solid ${colors.primary}` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Your Ranking</p>
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold" style={{ color: colors.primary }}>#{myRank}</span>
                <div>
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>{myStats.hours.toFixed(1)} hours</p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{myStats.completedJobs} jobs completed</p>
                </div>
              </div>
            </div>
            {myStats.avgRating > 0 && (
              <div className="text-right">
                <div className="flex items-center">
                  <Star className="w-5 h-5 mr-1" style={{ color: colors.accent, fill: colors.accent }} />
                  <span className="text-xl font-bold" style={{ color: colors.accent }}>{myStats.avgRating.toFixed(1)}</span>
                </div>
                <p className="text-xs" style={{ color: colors.textSecondary }}>Avg Rating</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Podium - Top 3 */}
      {podium.length > 0 && (
        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.cardBg || '#fff' }}>
          <h3 className="font-semibold mb-4 flex items-center" style={{ color: colors.textPrimary }}>
            <Trophy className="w-5 h-5 mr-2" style={{ color: colors.accent }} />
            Hours Leaderboard
          </h3>
          <div className="flex justify-center items-end space-x-4 mb-4">
            {/* 2nd Place */}
            {podium[1] && (
              <div className="text-center">
                <div 
                  className="w-20 h-24 rounded-t-lg flex items-end justify-center pb-2"
                  style={{ backgroundColor: colors.muted + '30' }}
                >
                  <span className="text-2xl">🥈</span>
                </div>
                <p className="font-medium text-sm mt-2" style={{ color: colors.textPrimary }}>
                  {podium[1].name?.split(' ')[0] || 'Unknown'}
                </p>
                <p className="text-xs font-bold" style={{ color: colors.water }}>
                  {podium[1].hours.toFixed(1)}h
                </p>
              </div>
            )}
            {/* 1st Place */}
            {podium[0] && (
              <div className="text-center">
                <div 
                  className="w-24 h-32 rounded-t-lg flex items-end justify-center pb-2"
                  style={{ backgroundColor: colors.accent + '30' }}
                >
                  <span className="text-3xl">🥇</span>
                </div>
                <p className="font-medium mt-2" style={{ color: colors.textPrimary }}>
                  {podium[0].name?.split(' ')[0] || 'Unknown'}
                </p>
                <p className="text-sm font-bold" style={{ color: colors.accent }}>
                  {podium[0].hours.toFixed(1)}h
                </p>
              </div>
            )}
            {/* 3rd Place */}
            {podium[2] && (
              <div className="text-center">
                <div 
                  className="w-20 h-20 rounded-t-lg flex items-end justify-center pb-2"
                  style={{ backgroundColor: colors.primary + '20' }}
                >
                  <span className="text-2xl">🥉</span>
                </div>
                <p className="font-medium text-sm mt-2" style={{ color: colors.textPrimary }}>
                  {podium[2].name?.split(' ')[0] || 'Unknown'}
                </p>
                <p className="text-xs font-bold" style={{ color: colors.primary }}>
                  {podium[2].hours.toFixed(1)}h
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Status Cards */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
          <Clock className="w-5 h-5 mr-2" />
          Team Status
        </h3>
        
        {teamMembers.length === 0 ? (
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: colors.cardBg || '#fff' }}>
            <p style={{ color: colors.textSecondary }}>No team members found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teamMembers.map(member => {
              if (!member?.id) return null;
              
              const status = getMemberStatus(member.id);
              const hours = getMemberHours(member.id, timeframe);
              const isMe = member.id === userProfile?.id;
              
              return (
                <div 
                  key={member.id} 
                  className={`p-4 rounded-xl ${isMe ? 'ring-2' : ''}`}
                  style={{ 
                    backgroundColor: colors.cardBg || '#fff',
                    borderLeft: `4px solid ${status.status === 'working' ? colors.success : colors.muted}`,
                    ringColor: isMe ? colors.primary : 'transparent'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                        style={{ backgroundColor: status.status === 'working' ? colors.success : colors.muted }}
                      >
                        {member.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium" style={{ color: colors.textPrimary }}>
                            {member.name || 'Unknown'}
                            {isMe && <span className="text-xs ml-2" style={{ color: colors.primary }}>(You)</span>}
                          </p>
                          {member.role === 'manager' && (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: colors.primary + '20', color: colors.primary }}>
                              Manager
                            </span>
                          )}
                        </div>
                        {status.status === 'working' ? (
                          <div className="flex items-center text-sm" style={{ color: colors.success }}>
                            <Wrench className="w-3 h-3 mr-1 animate-pulse" />
                            <span>Working: {status.job?.title || 'Job'}</span>
                          </div>
                        ) : (
                          <p className="text-sm" style={{ color: colors.textSecondary }}>Available</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold" style={{ color: colors.water }}>{hours.toFixed(1)}h</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {timeframe === 'week' ? 'this week' : timeframe === 'month' ? 'this month' : 'total'}
                      </p>
                    </div>
                  </div>
                  
                  {status.status === 'working' && status.location && (
                    <div className="mt-2 pt-2 border-t flex items-center text-sm" style={{ borderColor: colors.border, color: colors.textSecondary }}>
                      <MapPin className="w-4 h-4 mr-1" style={{ color: colors.primary }} />
                      {status.location}
                    </div>
                  )}
                  
                  {member.phone && (
                    <a 
                      href={`tel:${member.phone}`}
                      className="mt-2 pt-2 border-t flex items-center text-sm hover:underline"
                      style={{ borderColor: colors.border, color: colors.water }}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      {member.phone}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Leaderboard */}
      {leaderboard.length > 3 && (
        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.cardBg || '#fff' }}>
          <h3 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
            <TrendingUp className="w-5 h-5 mr-2" />
            Full Rankings
          </h3>
          <div className="space-y-2">
            {leaderboard.slice(3).map((member, index) => (
              <div 
                key={member.id}
                className={`flex items-center justify-between p-2 rounded-lg ${member.isMe ? 'ring-1' : ''}`}
                style={{ 
                  backgroundColor: colors.background || '#f5f5f5',
                  ringColor: member.isMe ? colors.primary : 'transparent'
                }}
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 text-center font-bold" style={{ color: colors.textSecondary }}>
                    #{index + 4}
                  </span>
                  <span style={{ color: colors.textPrimary }}>
                    {member.name || 'Unknown'}
                    {member.isMe && <span className="text-xs ml-1" style={{ color: colors.primary }}>(You)</span>}
                  </span>
                </div>
                <span className="font-bold" style={{ color: colors.water }}>{member.hours.toFixed(1)}h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
