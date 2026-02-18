// FieldSync v2 - Farmer Equipment Page
// Extracted from App.js FarmerEquipmentView (~line 1021)
import React from 'react';
import { Plus, Eye, AlertCircle, Trash2, Navigation } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContextV2';
import { useData } from '../../context/DataContext';
import { useEquipment } from '../../hooks/useEquipment';
import { formatEquipmentType } from '../../constants/equipmentTypes';
import { getStatusVariant } from '../../constants/statusMaps';
import { Button, Badge, EmptyState } from '../../components/ui';

const EquipmentPage = ({ onViewEquipment, onReportIssue, onAddEquipment }) => {
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const { equipment } = useData();
  const { deleteEquipment } = useEquipment();

  const myEquipment = equipment.filter(p => p.farmerId === userProfile?.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>My Equipment</h2>
        <Button icon={Plus} onClick={onAddEquipment}>Add Equipment</Button>
      </div>

      {myEquipment.length === 0 ? (
        <EmptyState
          icon={Navigation}
          title="No Equipment Yet"
          description="Add your first equipment to start tracking your irrigation equipment."
          action={<Button icon={Plus} onClick={onAddEquipment}>Add Your first equipment</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myEquipment.map(pivot => (
            <div key={pivot.id} className="card p-4 cursor-pointer hover:shadow-lg transition-shadow" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }} onClick={() => onViewEquipment(pivot)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{pivot.name}</h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{formatEquipmentType(pivot.type)} {pivot.brand ? `\u2022 ${pivot.brand}` : ''}</p>
                </div>
                <Badge variant={getStatusVariant(pivot.status)}>{pivot.status}</Badge>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Acres:</span><span style={{ color: colors.textPrimary }}>{pivot.acres}</span></div>
                {pivot.length && <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Length:</span><span style={{ color: colors.textPrimary }}>{pivot.length} ft</span></div>}
                {pivot.powerType && <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Power:</span><span style={{ color: colors.textPrimary }}>{pivot.powerType}</span></div>}
                {pivot.address && <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Location:</span><span style={{ color: colors.textPrimary }} className="text-right text-xs truncate max-w-32">{pivot.address}</span></div>}
                <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Last Service:</span><span style={{ color: colors.textPrimary }}>{pivot.lastService || 'Never'}</span></div>
              </div>
              <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                <Button variant="secondary" size="sm" className="flex-1" icon={Eye} onClick={() => onViewEquipment(pivot)}>View Details</Button>
                <Button variant="danger" size="sm" className="flex-1" icon={AlertCircle} onClick={() => onReportIssue(pivot)}>Report Issue</Button>
                <button
                  type="button"
                  onClick={() => deleteEquipment(pivot.id, pivot.name)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  title="delete equipment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;
