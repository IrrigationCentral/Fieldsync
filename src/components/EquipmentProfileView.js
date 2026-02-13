import React, { useRef, useEffect } from 'react';
import {
  ChevronLeft, Wrench, BarChart3, FileText, Clock, MapPin,
  Navigation, User, Phone, Mail, AlertCircle, Trash2, Edit, Star
} from 'lucide-react';
import { Badge, Button } from './ui';

// Info Item Component for Equipment Profile
const InfoItem = ({ label, value, colors }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.muted }}>{label}</p>
    <p className="font-medium" style={{ color: colors.textPrimary }}>{value}</p>
  </div>
);

const EquipmentProfileView = ({
  equipment,
  users,
  jobs,
  userProfile,
  colors,
  formatEquipmentType,
  formatDate,
  getStatusVariant,
  onBack,
  onEdit,
  onReportIssue,
  onDelete
}) => {
  const pivot = equipment;

  // Mini map ref - must be called before any conditional returns
  const miniMapRef = useRef(null);
  const miniMapInstance = useRef(null);

  useEffect(() => {
    if (!pivot) return;
    if (pivot.lat && pivot.lng && window.google && miniMapRef.current && !miniMapInstance.current) {
      miniMapInstance.current = new window.google.maps.Map(miniMapRef.current, {
        center: { lat: parseFloat(pivot.lat), lng: parseFloat(pivot.lng) },
        zoom: 14,
        mapTypeId: 'hybrid',
        disableDefaultUI: true,
        gestureHandling: 'none'
      });
      new window.google.maps.Marker({
        position: { lat: parseFloat(pivot.lat), lng: parseFloat(pivot.lng) },
        map: miniMapInstance.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#2D5016',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });
    }
    return () => { miniMapInstance.current = null; };
  }, [pivot]);

  // Early return after hooks
  if (!pivot) return null;

  // Get farmer info
  const farmer = users.find(u => u.id === pivot.farmerId);

  // Get service history for this pivot
  const equipmentJobs = jobs.filter(j => j.pivotId === pivot.id).sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const canEdit = ['tech', 'manager', 'office'].includes(userProfile?.role) || pivot.farmerId === userProfile?.id;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-6 h-6" style={{ color: colors.textPrimary }} />
          </button>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>{pivot.name}</h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {farmer?.name || 'Unknown Farmer'} • {formatEquipmentType(pivot.type)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={getStatusVariant(pivot.status)}>{pivot.status}</Badge>
          {canEdit && (
            <Button icon={Edit} onClick={onEdit}>Edit Details</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Equipment & Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Equipment Details */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center" style={{ color: colors.textPrimary }}>
              <Wrench className="w-5 h-5 mr-2" style={{ color: colors.primary }} />
              Equipment Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoItem label="Brand" value={pivot.brand || 'Not specified'} colors={colors} />
              <InfoItem label="Model" value={pivot.model || 'Not specified'} colors={colors} />
              <InfoItem label="Serial Number" value={pivot.serialNumber || 'Not specified'} colors={colors} />
              <InfoItem label="Power Type" value={pivot.powerType || 'Not specified'} colors={colors} />
              <InfoItem label="Panel Type" value={pivot.panelType || 'Not specified'} colors={colors} />
              <InfoItem label="Date Installed" value={pivot.dateInstalled || 'Unknown'} colors={colors} />
            </div>
          </div>

          {/* Specifications */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center" style={{ color: colors.textPrimary }}>
              <BarChart3 className="w-5 h-5 mr-2" style={{ color: colors.secondary }} />
              Specifications
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="Acres" value={pivot.acres ? `${pivot.acres} acres` : 'N/A'} colors={colors} />
              <InfoItem label="Length" value={pivot.length ? `${pivot.length} ft` : 'N/A'} colors={colors} />
              <InfoItem label="Spans" value={pivot.spans || 'N/A'} colors={colors} />
              <InfoItem label="GPM" value={pivot.gpm || pivot.flow || 'N/A'} colors={colors} />
              <InfoItem label="Nozzles" value={pivot.nozzles || 'N/A'} colors={colors} />
              <InfoItem label="Pressure" value={pivot.pressure ? `${pivot.pressure} PSI` : 'N/A'} colors={colors} />
              <InfoItem label="End Gun" value={pivot.endGun || 'None'} colors={colors} />
              <InfoItem label="Tire Size" value={pivot.tireSize || 'N/A'} colors={colors} />
              <InfoItem label="Nozzle Package" value={pivot.nozzlePackage || 'N/A'} colors={colors} />
              <InfoItem label="Gearbox Ratio" value={pivot.gearboxRatio || 'N/A'} colors={colors} />
              <InfoItem label="Last Service" value={pivot.lastService || 'Never'} colors={colors} />
              <InfoItem label="Drive Type" value={pivot.driveType || 'N/A'} colors={colors} />
            </div>
          </div>

          {/* Notes */}
          {pivot.notes && (
            <div className="card p-6">
              <h3 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
                <FileText className="w-5 h-5 mr-2" style={{ color: colors.muted }} />
                Notes
              </h3>
              <p className="text-sm whitespace-pre-wrap" style={{ color: colors.textSecondary }}>{pivot.notes}</p>
            </div>
          )}

          {/* Service History */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center" style={{ color: colors.textPrimary }}>
              <Clock className="w-5 h-5 mr-2" style={{ color: colors.water }} />
              Service History ({equipmentJobs.length})
            </h3>
            {equipmentJobs.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>No service history yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {equipmentJobs.map(job => (
                  <div key={job.id} className="p-3 rounded-lg border" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>{job.title}</p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{job.description}</p>
                      </div>
                      <Badge variant={getStatusVariant(job.status)} className="text-xs">{job.status}</Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs" style={{ color: colors.muted }}>
                      <span>{formatDate(job.createdAt)}</span>
                      {job.hoursWorked && <span>• {job.hoursWorked} hrs</span>}
                      {job.techName && <span>• {job.techName}</span>}
                      {job.rating && (
                        <span className="flex items-center">
                          • <Star className="w-3 h-3 mr-1" style={{ color: colors.accent }} /> {job.rating}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Location & Quick Actions */}
        <div className="space-y-6">
          {/* Location */}
          <div className="card p-6">
            <h3 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
              <MapPin className="w-5 h-5 mr-2" style={{ color: colors.danger }} />
              Location
            </h3>
            {pivot.lat && pivot.lng ? (
              <>
                <div ref={miniMapRef} className="w-full h-40 rounded-lg mb-3" />
                <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{pivot.address || 'No address'}</p>
                <p className="text-xs mb-3" style={{ color: colors.muted }}>
                  {parseFloat(pivot.lat).toFixed(6)}, {parseFloat(pivot.lng).toFixed(6)}
                </p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${pivot.lat},${pivot.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 p-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </a>
              </>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>
                No location set
              </p>
            )}
          </div>

          {/* Farmer Contact */}
          {farmer && (
            <div className="card p-6">
              <h3 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
                <User className="w-5 h-5 mr-2" style={{ color: colors.water }} />
                Farmer Contact
              </h3>
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-3xl">{farmer.avatar || '👤'}</span>
                <div>
                  <p className="font-medium" style={{ color: colors.textPrimary }}>{farmer.name}</p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{farmer.company || 'Independent'}</p>
                </div>
              </div>
              {farmer.phone && (
                <a href={`tel:${farmer.phone}`} className="flex items-center space-x-2 text-sm mb-2" style={{ color: colors.primary }}>
                  <Phone className="w-4 h-4" />
                  <span>{farmer.phone}</span>
                </a>
              )}
              {farmer.email && (
                <a href={`mailto:${farmer.email}`} className="flex items-center space-x-2 text-sm" style={{ color: colors.primary }}>
                  <Mail className="w-4 h-4" />
                  <span>{farmer.email}</span>
                </a>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="danger"
                className="w-full"
                icon={AlertCircle}
                onClick={() => onReportIssue(pivot)}
              >
                Report Issue
              </Button>
              {canEdit && (
                <Button
                  variant="secondary"
                  className="w-full"
                  icon={Trash2}
                  onClick={() => onDelete(pivot.id, pivot.name)}
                >
                  delete equipment
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentProfileView;
