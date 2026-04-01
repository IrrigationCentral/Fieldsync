// FieldSync v2 - Inline Status Change Dropdown
// Uses React Portal to render dropdown on document.body
// so it escapes overflow-hidden table containers
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { JOB_STATUSES, STATUS_LABELS, getStatusVariant } from '../constants/statusMaps';

const VARIANT_COLORS = {
  warning: { bg: '#D4A84320', text: '#D4A843', border: '#D4A84340' },
  water: { bg: '#1890FF20', text: '#1890FF', border: '#1890FF40' },
  success: { bg: '#52C41A20', text: '#52C41A', border: '#52C41A40' },
  accent: { bg: '#722ED120', text: '#722ED1', border: '#722ED140' },
  danger: { bg: '#C73E1D20', text: '#C73E1D', border: '#C73E1D40' },
  default: { bg: '#8B949E20', text: '#8B949E', border: '#8B949E40' }
};

const StatusDropdown = ({ jobId, currentStatus, onStatusChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const posRef = useRef({ top: 0, left: 0 });

  // Close dropdown on any scroll, resize, or outside click
  useEffect(() => {
    if (!isOpen) return;

    const close = () => setIsOpen(false);

    const handleClickOutside = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      setIsOpen(false);
    };

    // Close on ANY scroll (capture phase catches scrolls inside containers too)
    document.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    // Calculate position right before opening
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = JOB_STATUSES.length * 32 + 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      posRef.current = {
        top: spaceBelow > menuHeight ? rect.bottom + 2 : rect.top - menuHeight - 2,
        left: rect.left
      };
    }
    setIsOpen(true);
  }, [isOpen]);

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

  const variant = getStatusVariant(currentStatus);
  const colors = VARIANT_COLORS[variant] || VARIANT_COLORS.default;

  // Read-only badge when no onStatusChange provided
  if (!onStatusChange) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
      >
        {STATUS_LABELS[currentStatus] || currentStatus}
      </span>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        disabled={disabled || updating}
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          opacity: updating ? 0.6 : 1
        }}
      >
        {updating ? 'Updating...' : (STATUS_LABELS[currentStatus] || currentStatus)}
        <ChevronDown className="w-3 h-3 ml-1" />
      </button>

      {isOpen && ReactDOM.createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: posRef.current.top,
            left: posRef.current.left,
            zIndex: 99999,
            backgroundColor: 'var(--color-card, #161B22)',
            border: '1px solid var(--color-border, #30363D)',
            borderRadius: 8,
            padding: '4px 0',
            minWidth: 170,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          {JOB_STATUSES.map(status => {
            const sv = getStatusVariant(status);
            const sc = VARIANT_COLORS[sv] || VARIANT_COLORS.default;
            const isCurrent = status === currentStatus;
            return (
              <button
                key={status}
                onClick={(e) => { e.stopPropagation(); handleSelect(status); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 12px',
                  fontSize: 12,
                  border: 'none',
                  cursor: 'pointer',
                  color: isCurrent ? sc.text : 'var(--color-text-primary, #E6EDF3)',
                  backgroundColor: isCurrent ? sc.bg : 'transparent',
                  fontWeight: isCurrent ? 600 : 400
                }}
                onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.backgroundColor = 'var(--color-background, #0D1117)'; }}
                onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: sc.text, flexShrink: 0 }} />
                <span>{STATUS_LABELS[status]}</span>
                {isCurrent && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};

export default StatusDropdown;