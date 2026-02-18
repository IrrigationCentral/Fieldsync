// FieldSync v2 - Farmer Service History Page
// Extracted from App.js FarmerJobsView (~line 1071)
import React, { useState } from 'react';
import { Clipboard, Star } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContextV2';
import { useData } from '../../context/DataContext';
import { useJobs } from '../../hooks/useJobs';
import { formatDate } from '../../utils/formatters';
import { getStatusVariant } from '../../constants/statusMaps';
import { Button, Badge, StarRating, EmptyState } from '../../components/ui';

const ServiceHistoryPage = ({ onViewJob }) => {
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const { users, jobs } = useData();
  const { rateJob } = useJobs();
  const [ratingJobId, setRatingJobId] = useState(null);
  const [tempRating, setTempRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const myJobs = jobs.filter(j => j.farmerId === userProfile?.id);

  const submitRating = async (jobId) => {
    await rateJob(jobId, tempRating, feedback);
    setRatingJobId(null);
    setTempRating(0);
    setFeedback('');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Service History</h2>
      {myJobs.length === 0 ? (
        <EmptyState icon={Clipboard} title="No Service History" description="Your service requests will appear here." />
      ) : (
        <div className="space-y-3">
          {myJobs.map(job => (
            <div key={job.id} className="card p-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <div className="flex items-start justify-between cursor-pointer" onClick={() => onViewJob && onViewJob(job)}>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{job.title}</h3>
                    {job.soNumber && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>SO# {job.soNumber}</span>}
                  </div>
                  <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{job.description}</p>
                  <div className="flex items-center space-x-3 text-xs" style={{ color: colors.muted }}>
                    <span>{formatDate(job.createdAt)}</span>
                    {job.assignedTo && (() => {
                      const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
                      const names = assignees.map(id => users.find(u => u.id === id)?.name).filter(Boolean);
                      return names.length > 0 ? <span>{'\u2022'} Assigned to {names.join(', ')}</span> : null;
                    })()}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                  <Badge variant={job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'success'}>{job.priority}</Badge>
                </div>
              </div>

              {/* Rating Section for Completed Jobs */}
              {['completed', 'billed', 'ready-to-bill'].includes(job.status) && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
                  {job.rating ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm" style={{ color: colors.textSecondary }}>Your rating:</span>
                        <StarRating rating={job.rating} readonly size="sm" />
                      </div>
                      {job.feedback && <p className="text-xs italic" style={{ color: colors.muted }}>"{job.feedback}"</p>}
                    </div>
                  ) : ratingJobId === job.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm" style={{ color: colors.textSecondary }}>Rate this service:</span>
                        <StarRating rating={tempRating} onRate={setTempRating} />
                      </div>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Add a comment (optional)"
                        className="input text-sm"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => submitRating(job.id)} disabled={tempRating === 0}>Submit</Button>
                        <Button size="sm" variant="secondary" onClick={() => { setRatingJobId(null); setTempRating(0); setFeedback(''); }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setRatingJobId(job.id); }}
                      className="flex items-center space-x-2 text-sm hover:underline"
                      style={{ color: colors.accent }}
                    >
                      <Star className="w-4 h-4" />
                      <span>Rate this service</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceHistoryPage;
