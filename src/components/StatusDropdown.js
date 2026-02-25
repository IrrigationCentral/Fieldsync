// FieldSync v2 - Inline Status Change Dropdown
// Replaces static Badge with a clickable dropdown to change job status
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { JOB_STATUSES, STATUS_LABELS, getStatusVariant } from '../constants/statusMaps';

// Colors use alpha transparency (hex with alpha) so they work on both light and dark backgrounds
const VARIANT_COLORS = {
  warning: { bg: '#D4A84320', text: '#D4A843', border: '#D4A84340' },
  water: { bg: '#1890FF20', text: '#1890FF', border: '#1890FF40' },
  success: { bg: '#52C41A20', text: '#52C41A', border: '#52C41A40' },
  accent: { bg: '#722ED120', text: '#722ED1', border: '#722ED140' },
  danger: { bg: '#C73E1D20', text: '#C73E1D', border: '#C73E1D40' },
  default: { bg: '#8B949E20', text: '#8B949E', border: '#8B949E40' }
};

const StatusDropdown = ({ jobId, currentStatus, onStatusChange, disabled = false }) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const variant = getStatusVariant(currentStatus);
  const variantColors = VARIANT_COLORS[variant] || VARIANT_COLORS.default;

  const handleSelect = async (newStatus) => {
    if (newStatus === currentStatus || !onStatusChange) return;
    setIsOpen(false);
    setUpdating(true);
    try {
      await onStatusChange(jobId, newStatus);
    } catch (err) {
      console.error('Status update failed:', err);
    }
    setUpdating(false);
  };

  if (!onStatusChange) {
    // Read-only fallback
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: variantColors.bg, color: variantColors.text, border: `1px solid ${variantColors.border}` }}
      >
        {STATUS_LABELS[currentStatus] || currentStatus}
      </span>
    );
  }

  // TODO: Add keyboard navigation (arrow keys, Enter to select, Escape to close)
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        disabled={disabled || updating}
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-80"
        style={{
          backgroundColor: variantColors.bg,
          color: variantColors.text,
          border: `1px solid ${variantColors.border}`,
          opacity: updating ? 0.6 : 1
        }}
      >
        {updating ? 'Updating...' : (STATUS_LABELS[currentStatus] || currentStatus)}
        <ChevronDown className="w-3 h-3 ml-1" />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 py-1 rounded-lg shadow-lg min-w-[160px]"
          style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
          onClick={(e) => e.stopPropagation()}
        >
          {JOB_STATUSES.map(status => {
            const sv = getStatusVariant(status);
            const sc = VARIANT_COLORS[sv] || VARIANT_COLORS.default;
            const isCurrent = status === currentStatus;
            return (
              <button
                key={status}
                onClick={() => handleSelect(status)}
                className="w-full text-left px-3 py-1.5 text-xs flex items-center space-x-2 transition-colors"
                style={{
                  color: isCurrent ? sc.text : colors.textPrimary,
                  backgroundColor: isCurrent ? sc.bg : 'transparent',
                  fontWeight: isCurrent ? 600 : 400
                }}
                onMouseEnter={(e) => { if (!isCurrent) e.target.style.backgroundColor = colors.background; }}
                onMouseLeave={(e) => { if (!isCurrent) e.target.style.backgroundColor = 'transparent'; }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.text }} />
                <span>{STATUS_LABELS[status]}</span>
                {isCurrent && <span className="ml-auto text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StatusDropdown;
