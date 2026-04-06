// FieldSync v2 - TV Dashboard
// Read-only big-screen view for shop wall TV
// Access: /tv?token=<TV_DASHBOARD_TOKEN>
// Shows active jobs sorted by date, auto-refreshes every 60s
import React, { useState, useEffect } from 'react';
import { subscribeToJobs, subscribeToUsers } from '../../firebase';
import { STATUS_LABELS } from '../../constants/statusMaps';

const HIDDEN_STATUSES = ['completed', 'ready-to-bill', 'billed', 'canceled'];
const PRIORITY_COLORS = {
  high: { bg: '#C73E1D20', text: '#FF6B4A', border: '#C73E1D40' },
  medium: { bg: '#D4A84320', text: '#D4A843', border: '#D4A84340' },
  low: { bg: '#52C41A20', text: '#52C41A', border: '#52C41A40' }
};

const STATUS_COLORS = {
  pending: { bg: '#D4A84320', text: '#D4A843' },
  assigned: { bg: '#1890FF20', text: '#1890FF' },
  'in-progress': { bg: '#1890FF30', text: '#5CB8FF' },
  'needs-followup': { bg: '#C73E1D20', text: '#FF6B4A' }
};
const TVDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [clock, setClock] = useState(new Date());

  // Subscribe to live Firestore data
  useEffect(() => {
    const unsubJobs = subscribeToJobs((data) => setJobs(data));
    const unsubUsers = subscribeToUsers((data) => setUsers(data));
    return () => { unsubJobs(); unsubUsers(); };
  }, []);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  // Filter out completed/billed/ready-to-bill, sort by createdAt desc
  const activeJobs = jobs
    .filter(j => !HIDDEN_STATUSES.includes(j.status))
    .sort((a, b) => {
      const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const db = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return db - da;
    });

  const getUserName = (id) => users.find(u => u.id === id)?.name || '';
  const getAssignees = (job) => {
    const ids = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
    return ids.map(getUserName).filter(Boolean).join(', ') || '—';
  };
  const getCustomer = (job) => {
    const farmer = users.find(u => u.id === job.farmerId);
    return farmer?.name || job.customerName || '—';
  };
  const formatShortDate = (ts) => {
    const d = ts?.toDate?.() || new Date(ts || 0);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D1117',
      color: '#E6EDF3',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '20px 24px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        borderBottom: '1px solid #30363D',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#4A7C59' }}>⚡ FieldSync</span>
          <span style={{ fontSize: '14px', color: '#8B949E' }}>Active Jobs</span>
          <span style={{
            fontSize: '12px', padding: '2px 8px', borderRadius: '12px',
            backgroundColor: '#1890FF20', color: '#1890FF', fontWeight: 600
          }}>{activeJobs.length}</span>
        </div>
        <span style={{ fontSize: '14px', color: '#8B949E' }}>
          {clock.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {' · '}
          {clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>
      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #30363D' }}>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>SO #</th>
            <th style={thStyle}>Customer</th>
            <th style={{ ...thStyle, width: '35%' }}>Description</th>
            <th style={thStyle}>Tech</th>
            <th style={thStyle}>Priority</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {activeJobs.map((job, i) => {
            const pc = PRIORITY_COLORS[job.priority] || PRIORITY_COLORS.low;
            const sc = STATUS_COLORS[job.status] || { bg: '#8B949E20', text: '#8B949E' };
            return (
              <tr key={job.id} style={{
                borderBottom: '1px solid #21262D',
                backgroundColor: i % 2 === 0 ? 'transparent' : '#161B22'
              }}>
                <td style={tdStyle}>{formatShortDate(job.createdAt)}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#4A7C59', fontWeight: 600 }}>
                  {job.soNumber || '—'}
                </td>
                <td style={tdStyle}>{getCustomer(job)}</td>
                <td style={{ ...tdStyle, color: '#C9D1D9', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {job.description || job.title}
                </td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{getAssignees(job)}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                    backgroundColor: pc.bg, color: pc.text, border: `1px solid ${pc.border}`,
                    textTransform: 'capitalize'
                  }}>{job.priority}</span>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                    backgroundColor: sc.bg, color: sc.text
                  }}>{STATUS_LABELS[job.status] || job.status}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {activeJobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#8B949E' }}>
          <p style={{ fontSize: '18px' }}>No active jobs</p>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#8B949E',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '7px 12px',
  fontSize: '13px',
  color: '#E6EDF3',
  whiteSpace: 'nowrap'
};

export default TVDashboard;