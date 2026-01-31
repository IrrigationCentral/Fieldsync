import React, { useState, useEffect, useRef } from 'react';
import { Play, X, Search, Clock, MapPin, User } from 'lucide-react';

export const ClockInFAB = ({
  colors,
  jobs = [],
  users = [],
  equipment = [],
  userProfile,
  handleStartTime,
  handleSelfAssign
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  
  // Check if user is currently on the clock for any job
  const isOnClock = jobs.some(job => 
    job.timeEntries?.some(e => e.techId === userProfile?.id && !e.endTime)
  );
  
  // Get jobs assigned to current user
  const myJobs = jobs.filter(job => {
    if (!job || job.status === 'completed' || job.status === 'billed' || job.status === 'canceled') return false;
    const assigned = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo];
    return assigned.includes(userProfile?.id);
  });
  
  // Get available jobs (not assigned to anyone or assigned but not started)
  const availableJobs = jobs.filter(job => {
    if (!job || job.status === 'completed' || job.status === 'billed' || job.status === 'canceled') return false;
    const assigned = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo];
    // Not assigned to current user and is pending/assigned status
    return !assigned.includes(userProfile?.id) && 
           (job.status === 'pending' || job.status === 'assigned');
  });
  
  // Filter based on search
  const filterJobs = (jobList) => {
    if (!searchQuery.trim()) return jobList;
    const query = searchQuery.toLowerCase();
    return jobList.filter(job => {
      const customer = users.find(u => u.id === job.farmerId);
      const pivot = equipment.find(p => p.id === job.pivotId);
      return (
        job.title?.toLowerCase().includes(query) ||
        job.soNumber?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.pivotName?.toLowerCase().includes(query) ||
        customer?.name?.toLowerCase().includes(query) ||
        pivot?.name?.toLowerCase().includes(query)
      );
    });
  };
  
  const filteredMyJobs = filterJobs(myJobs);
  const filteredAvailableJobs = filterJobs(availableJobs);
  
  // Focus search when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);
  
  // Handle starting time on a job
  const handleSelectJob = async (job) => {
    const assigned = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo];
    const isAssignedToMe = assigned.includes(userProfile?.id);
    
    // If not assigned, self-assign first
    if (!isAssignedToMe && handleSelfAssign) {
      await handleSelfAssign(job.id);
    }
    
    // Start time
    if (handleStartTime) {
      await handleStartTime(job.id);
    }
    
    setIsOpen(false);
  };
  
  // Get customer name
  const getCustomerName = (job) => {
    const customer = users.find(u => u.id === job.farmerId);
    return customer?.name || 'Unknown Customer';
  };
  
  // Don't show FAB if already on clock or not a tech/manager
  if (!userProfile || !['tech', 'manager'].includes(userProfile.role)) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed z-40 right-4 bottom-20 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${
          isOnClock ? 'animate-pulse' : ''
        }`}
        style={{ 
          backgroundColor: isOnClock ? colors.success : colors.primary,
          boxShadow: `0 4px 14px ${isOnClock ? colors.success : colors.primary}50`
        }}
        title={isOnClock ? "On the clock" : "Start time on a job"}
      >
        {isOnClock ? (
          <Clock className="w-6 h-6 text-white" />
        ) : (
          <Play className="w-6 h-6 text-white ml-1" />
        )}
      </button>
      
      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Modal Content */}
          <div 
            className="relative w-full max-w-lg max-h-[85vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
            style={{ backgroundColor: colors.cardBg || '#fff' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
              <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                Start Time
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="p-3 border-b" style={{ borderColor: colors.border }}>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textSecondary }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search jobs, customers, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-none"
                  style={{ 
                    backgroundColor: colors.background || '#f5f5f5', 
                    color: colors.textPrimary,
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
            
            {/* Jobs List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* My Assigned Jobs */}
              {filteredMyJobs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 px-1" style={{ color: colors.primary }}>
                    MY ASSIGNED JOBS ({filteredMyJobs.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredMyJobs.map(job => (
                      <JobCard 
                        key={job.id} 
                        job={job} 
                        colors={colors}
                        customerName={getCustomerName(job)}
                        onSelect={() => handleSelectJob(job)}
                        isAssigned={true}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Available Jobs */}
              {filteredAvailableJobs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 px-1" style={{ color: colors.textSecondary }}>
                    AVAILABLE JOBS ({filteredAvailableJobs.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredAvailableJobs.map(job => (
                      <JobCard 
                        key={job.id} 
                        job={job} 
                        colors={colors}
                        customerName={getCustomerName(job)}
                        onSelect={() => handleSelectJob(job)}
                        isAssigned={false}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* No Results */}
              {filteredMyJobs.length === 0 && filteredAvailableJobs.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: colors.muted }} />
                  <p style={{ color: colors.textSecondary }}>
                    {searchQuery ? 'No jobs match your search' : 'No available jobs'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Safe area padding for mobile */}
            <div className="h-6 sm:hidden" />
          </div>
        </div>
      )}
    </>
  );
};

// Job Card Component
const JobCard = ({ job, colors, customerName, onSelect, isAssigned }) => {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-3 rounded-xl transition-all active:scale-98 hover:shadow-md"
      style={{ 
        backgroundColor: isAssigned ? colors.primary + '10' : colors.background || '#f5f5f5',
        border: isAssigned ? `2px solid ${colors.primary}30` : 'none'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* SO Number & Priority */}
          <div className="flex items-center space-x-2 mb-1">
            {job.soNumber && (
              <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded" 
                style={{ backgroundColor: colors.primary + '20', color: colors.primary }}>
                SO# {job.soNumber}
              </span>
            )}
            {job.priority === 'high' && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                HIGH
              </span>
            )}
          </div>
          
          {/* Title */}
          <p className="font-semibold truncate" style={{ color: colors.textPrimary }}>
            {job.title}
          </p>
          
          {/* Customer */}
          <div className="flex items-center text-sm mt-1" style={{ color: colors.textSecondary }}>
            <User className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{customerName}</span>
          </div>
          
          {/* Location */}
          {job.pivotName && (
            <div className="flex items-center text-sm mt-0.5" style={{ color: colors.primary }}>
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{job.pivotName}</span>
            </div>
          )}
        </div>
        
        {/* Start Button */}
        <div 
          className="ml-3 p-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: colors.success }}
        >
          <Play className="w-5 h-5 text-white" />
        </div>
      </div>
    </button>
  );
};

export default ClockInFAB;
