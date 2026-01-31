// ============================================
// TV DASHBOARD - Read-only display for break room TV
// Access via: /tv?token=YOUR_TOKEN
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import { 
  Wrench, MapPin, User, CheckCircle,
  RefreshCw, Wifi, WifiOff
} from 'lucide-react';

// FieldSync Colors
const colors = {
  primary: '#2D5016',
  secondary: '#8FBC3B',
  accent: '#F4B942',
  danger: '#C73E1D',
  water: '#4A90A4',
  success: '#52C41A',
  warning: '#F4B942',
  background: '#1a1a2e',
  cardBg: '#16213e',
  textPrimary: '#FFFFFF',
  textSecondary: '#a0a0a0',
  border: '#2a2a4a'
};

const TVDashboard = ({ jobs, users, equipment }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [, setLastRefresh] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh page every 3 minutes
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      setLastRefresh(new Date());
      window.location.reload();
    }, 3 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, []);

  // Filter active jobs
  const activeJobs = jobs.filter(j => 
    ['pending', 'assigned', 'in-progress', 'waiting-on-parts'].includes(j.status)
  );
  const pendingJobs = activeJobs.filter(j => j.status === 'pending');
  const inProgressJobs = activeJobs.filter(j => j.status === 'in-progress' || j.status === 'assigned');
  const waitingJobs = activeJobs.filter(j => j.status === 'waiting-on-parts');

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google || mapInstanceRef.current) return;

    // Center on Sikeston, MO area
    const center = { lat: 36.88, lng: -89.59 };
    
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 9,
      mapTypeId: 'hybrid',
      disableDefaultUI: true,
      gestureHandling: 'none',
      keyboardShortcuts: false
    });

    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
    };
  }, []);

  // Update markers when jobs change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Add markers for active jobs
    activeJobs.forEach(job => {
      const pivot = equipment.find(p => p.id === job.pivotId);
      const lat = pivot?.lat || job.location?.lat;
      const lng = pivot?.lng || job.location?.lng;
      
      if (!lat || !lng) return;

      // Color based on status
      let markerColor = colors.warning; // pending
      if (job.status === 'in-progress') markerColor = colors.success;
      else if (job.status === 'assigned') markerColor = colors.water;
      else if (job.status === 'waiting-on-parts') markerColor = colors.accent;

      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(lat), lng: parseFloat(lng) },
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3
        },
        title: job.pivotName || job.title
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach(m => bounds.extend(m.getPosition()));
      mapInstanceRef.current.fitBounds(bounds, 50);
      
      // Don't zoom in too far
      const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        if (mapInstanceRef.current.getZoom() > 12) {
          mapInstanceRef.current.setZoom(12);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [activeJobs, equipment]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return colors.danger;
      case 'medium': return colors.warning;
      default: return colors.success;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return colors.warning;
      case 'assigned': return colors.water;
      case 'in-progress': return colors.success;
      case 'waiting-on-parts': return colors.accent;
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return 'PENDING';
      case 'assigned': return 'ASSIGNED';
      case 'in-progress': return 'IN PROGRESS';
      case 'waiting-on-parts': return 'WAITING ON PARTS';
      default: return status?.toUpperCase();
    }
  };

  return (
    <div style={{ 
      backgroundColor: colors.background, 
      minHeight: '100vh',
      color: colors.textPrimary,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: colors.cardBg,
        borderBottom: `2px solid ${colors.primary}`,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            backgroundColor: colors.primary,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wrench style={{ width: '28px', height: '28px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: colors.textPrimary }}>
              Irrigation Central
            </h1>
            <p style={{ fontSize: '14px', margin: 0, color: colors.textSecondary }}>
              Active Service Jobs
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: colors.warning 
            }}>
              {pendingJobs.length}
            </div>
            <div style={{ fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
              Pending
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: colors.success 
            }}>
              {inProgressJobs.length}
            </div>
            <div style={{ fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
              In Progress
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: colors.accent 
            }}>
              {waitingJobs.length}
            </div>
            <div style={{ fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
              Waiting Parts
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: colors.primary 
            }}>
              {activeJobs.length}
            </div>
            <div style={{ fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
              Total Active
            </div>
          </div>
        </div>

        {/* Clock */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', fontFamily: 'monospace' }}>
            {formatTime(currentTime)}
          </div>
          <div style={{ fontSize: '14px', color: colors.textSecondary }}>
            {formatDate(currentTime)}
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: isOnline ? colors.success : colors.danger,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '4px',
            marginTop: '4px'
          }}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        height: 'calc(100vh - 100px)',
        padding: '16px',
        gap: '16px'
      }}>
        {/* Map */}
        <div style={{ 
          flex: '0 0 55%',
          backgroundColor: colors.cardBg,
          borderRadius: '16px',
          overflow: 'hidden',
          border: `1px solid ${colors.border}`
        }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Jobs List */}
        <div style={{ 
          flex: '0 0 45%',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
          {activeJobs.length === 0 ? (
            <div style={{ 
              backgroundColor: colors.cardBg,
              borderRadius: '16px',
              padding: '48px',
              textAlign: 'center',
              border: `1px solid ${colors.border}`
            }}>
              <CheckCircle style={{ width: '64px', height: '64px', color: colors.success, margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '24px', margin: '0 0 8px' }}>All Caught Up!</h2>
              <p style={{ color: colors.textSecondary, margin: 0 }}>No active jobs at this time.</p>
            </div>
          ) : (
            activeJobs
              .sort((a, b) => {
                // Sort by priority (high first), then by status
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const statusOrder = { 'in-progress': 0, 'assigned': 1, 'pending': 2, 'waiting-on-parts': 3 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return statusOrder[a.status] - statusOrder[b.status];
              })
              .map(job => {
                const farmer = users.find(u => u.id === job.farmerId);
                const pivot = equipment.find(p => p.id === job.pivotId);
                const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
                const assignedTechs = assignees.map(id => users.find(u => u.id === id)).filter(Boolean);

                return (
                  <div 
                    key={job.id}
                    style={{ 
                      backgroundColor: colors.cardBg,
                      borderRadius: '12px',
                      padding: '16px',
                      borderLeft: `4px solid ${getPriorityColor(job.priority)}`,
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        {job.soNumber && (
                          <span style={{ 
                            backgroundColor: colors.primary,
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            marginRight: '8px'
                          }}>
                            SO# {job.soNumber}
                          </span>
                        )}
                        <span style={{ 
                          backgroundColor: getStatusColor(job.status) + '30',
                          color: getStatusColor(job.status),
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {getStatusLabel(job.status)}
                        </span>
                      </div>
                      <span style={{ 
                        backgroundColor: getPriorityColor(job.priority) + '30',
                        color: getPriorityColor(job.priority),
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {job.priority}
                      </span>
                    </div>

                    {/* Customer & Location */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        color: colors.textPrimary,
                        marginBottom: '4px'
                      }}>
                        {farmer?.name || 'Unknown Customer'}
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        color: colors.water,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <MapPin size={14} />
                        {job.pivotName || pivot?.name || 'Location TBD'}
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ 
                      fontSize: '13px',
                      color: colors.textSecondary,
                      marginBottom: '8px',
                      lineHeight: '1.4'
                    }}>
                      {job.description?.substring(0, 100)}{job.description?.length > 100 ? '...' : ''}
                    </div>

                    {/* Assigned Techs */}
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      paddingTop: '8px',
                      borderTop: `1px solid ${colors.border}`
                    }}>
                      <User size={14} style={{ color: colors.textSecondary }} />
                      {assignedTechs.length > 0 ? (
                        <span style={{ fontSize: '13px', color: colors.textPrimary }}>
                          {assignedTechs.map(t => t.name).join(', ')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '13px', color: colors.warning, fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.cardBg,
        borderTop: `1px solid ${colors.border}`,
        padding: '8px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: colors.textSecondary
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={12} />
          Auto-refresh every 3 minutes
        </div>
        <div>
          FieldSync TV Dashboard • Irrigation Central
        </div>
      </div>
    </div>
  );
};

export default TVDashboard;
