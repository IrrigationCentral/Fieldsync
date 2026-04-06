// ============================================
// SHARED UI COMPONENTS
// ============================================
import React, { useState } from 'react';
import {
  X, Eye, EyeOff, ChevronDown, Search, Check,
  Star, RefreshCw, Droplets
} from 'lucide-react';

// ============================================
// MODAL COMPONENT
// ============================================
// TODO: Add full focus trap (capture Tab/Shift+Tab to keep focus within modal)
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // On iOS: when an input inside the modal is focused, scroll it into view
  // This handles the keyboard covering inputs reliably
  React.useEffect(() => {
    if (!isOpen) return;

    const handleFocusIn = (e) => {
      const el = e.target;
      if (!el || !modalRef.current?.contains(el)) return;
      const tag = el.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        // Delay to let iOS keyboard fully animate open
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className={`modal-content ${sizeClasses[size]} w-full mx-4 p-6 overflow-y-auto`}
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between mb-6 sticky top-0 z-10 -mx-6 -mt-6 px-6 pt-6 pb-4" style={{ backgroundColor: 'var(--color-card)' }}>
          <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
        {/* Extra bottom padding so last inputs can scroll above iOS keyboard */}
        <div className="h-16 flex-shrink-0" />
      </div>
    </div>
  );
};

// ============================================
// BUTTON COMPONENT
// ============================================
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  icon: Icon,
  onClick,
  type = 'button',
  className = ''
}) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const baseStyles = `
    inline-flex items-center justify-center space-x-2 rounded-xl font-semibold
    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const getStyle = () => {
    switch(variant) {
      case 'primary':
        return { 
          background: `linear-gradient(135deg, #2D5016 0%, #8FBC3B 100%)`,
          color: 'white'
        };
      case 'secondary':
        return { 
          border: `1px solid var(--color-border)`,
          color: 'var(--color-text-secondary)',
          backgroundColor: 'var(--color-card)'
        };
      case 'danger':
        return { 
          backgroundColor: '#C73E1D20',
          color: '#C73E1D'
        };
      case 'ghost':
        return { color: 'var(--color-text-secondary)' };
      default:
        return {};
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizes[size]} ${className}`}
      style={getStyle()}
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

// ============================================
// INPUT COMPONENT
// ============================================
export const Input = ({ 
  label, 
  error, 
  icon: Icon, 
  type = 'text',
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        )}
        <input
          type={inputType}
          className={`input ${Icon ? 'pl-10' : ''} ${type === 'password' ? 'pr-10' : ''}`}
          style={{ 
            borderColor: error ? '#C73E1D' : 'var(--color-border)',
            backgroundColor: 'var(--color-input-bg)',
            color: 'var(--color-text-primary)'
          }}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            ) : (
              <Eye className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm" style={{ color: '#C73E1D' }}>{error}</p>
      )}
    </div>
  );
};

// ============================================
// SELECT COMPONENT
// ============================================
export const Select = ({ label, options = [], error, ...props }) => (
  <div className="space-y-2">
    {label && (
      <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </label>
    )}
    <select
      className="input"
      style={{ 
        borderColor: error ? '#C73E1D' : 'var(--color-border)',
        backgroundColor: 'var(--color-input-bg)',
        color: 'var(--color-text-primary)'
      }}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && (
      <p className="text-sm" style={{ color: '#C73E1D' }}>{error}</p>
    )}
  </div>
);


// ============================================
// SEARCHABLE SELECT COMPONENT
// ============================================
export const SearchableSelect = ({ label, options = [], value, onChange, placeholder = 'Search...', error, colors }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const triggerRef = React.useRef(null);

  // Fallback colors if not provided
  const c = colors || {
    cardBg: '#FFFFFF',
    border: '#E8E4D9',
    textPrimary: '#2D2D2D',
    textSecondary: '#6B6B6B',
    primary: '#2D5016',
    background: '#F5F3EE',
    inputBg: '#FFFFFF'
  };

  const selectedOption = options.find(opt => opt.value === value);
  
  const filteredOptions = options.filter(opt => 
    opt.value && opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update dropdown position when opened
  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight when filtered options change
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          onChange({ target: { value: filteredOptions[highlightedIndex].value } });
          setIsOpen(false);
          setSearchTerm('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
      default:
        break;
    }
  };

  const handleSelect = (optValue) => {
    onChange({ target: { value: optValue } });
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium" style={{ color: c.textPrimary }}>
          {label}
        </label>
      )}
      <div className="relative">
        <div
          ref={triggerRef}
          className="input cursor-pointer flex items-center justify-between"
          style={{ 
            borderColor: error ? '#C73E1D' : c.border,
            backgroundColor: c.inputBg,
            color: c.textPrimary
          }}
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        >
          <span style={{ opacity: selectedOption ? 1 : 0.5 }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="w-4 h-4" style={{ color: c.textSecondary }} />
        </div>

        {isOpen && (
          <div 
            className="rounded-lg shadow-2xl border overflow-hidden"
            style={{ 
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              backgroundColor: c.cardBg, 
              borderColor: c.border,
              maxHeight: '280px',
              zIndex: 99999
            }}
          >
            <div className="p-2 border-b" style={{ borderColor: c.border, backgroundColor: c.cardBg }}>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.textSecondary }} />
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full pl-9 py-2 text-sm rounded-lg border"
                  style={{ 
                    backgroundColor: c.inputBg, 
                    borderColor: c.border, 
                    color: c.textPrimary,
                    outline: 'none'
                  }}
                  placeholder="Type to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '220px', backgroundColor: c.cardBg }}>
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-sm" style={{ color: c.textSecondary, backgroundColor: c.cardBg }}>
                  No results found
                </div>
              ) : (
                filteredOptions.map((opt, index) => (
                  <div
                    key={opt.value}
                    className="px-3 py-2 cursor-pointer text-sm"
                    style={{ 
                      backgroundColor: index === highlightedIndex ? c.background : c.cardBg,
                      color: opt.value === value ? c.primary : c.textPrimary,
                      fontWeight: opt.value === value ? '600' : '400'
                    }}
                    onClick={(e) => { e.stopPropagation(); handleSelect(opt.value); }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {opt.value === value && <Check className="w-4 h-4 inline mr-2" style={{ color: c.primary }} />}
                    {opt.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm" style={{ color: '#C73E1D' }}>{error}</p>
      )}
    </div>
  );
};


// ============================================
// BADGE COMPONENT
// ============================================
export const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: { backgroundColor: '#9CA98630', color: 'var(--color-text-secondary)' },
    success: { backgroundColor: '#52C41A20', color: '#52C41A' },
    warning: { backgroundColor: '#FAAD1420', color: '#FAAD14' },
    danger: { backgroundColor: '#C73E1D20', color: '#C73E1D' },
    water: { backgroundColor: '#4A90A420', color: '#4A90A4' },
    accent: { backgroundColor: '#F4B94220', color: '#8B6F47' }
  };

  return (
    <span 
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={styles[variant] || styles.default}
    >
      {children}
    </span>
  );
};

// ============================================
// STAR RATING COMPONENT
// ============================================
export const StarRating = ({ rating = 0, onRate, readonly = false, size = 'md' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRate && onRate(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          disabled={readonly}
          className={`${readonly ? '' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={sizes[size]}
            fill={(hoverRating || rating) >= star ? '#F4B942' : 'none'}
            stroke={(hoverRating || rating) >= star ? '#F4B942' : '#9CA986'}
            strokeWidth={1.5}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm font-medium" style={{ color: '#F4B942' }}>{rating.toFixed(1)}</span>
      )}
    </div>
  );
};

// ============================================
// STAT CARD COMPONENT
// ============================================
export const StatCard = ({ title, value, icon: Icon, trend, color = '#2D5016' }) => (
  <div className="card p-4" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
    <div className="flex items-center justify-between mb-2">
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: color + '15' }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      {trend && (
        <span className="text-xs font-medium" style={{ color: trend > 0 ? '#52C41A' : '#C73E1D' }}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
  </div>
);

// ============================================
// EMPTY STATE COMPONENT
// ============================================
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div 
      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
      style={{ backgroundColor: '#9CA98620' }}
    >
      <Icon className="w-8 h-8" style={{ color: '#9CA986' }} />
    </div>
    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
    <p className="text-sm mb-4 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
    {action}
  </div>
);

// ============================================
// SPINNER COMPONENT
// ============================================
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <RefreshCw className={`${sizes[size] || sizes.md} animate-spin`} style={{ color: '#2D5016' }} />
  );
};

// ============================================
// LOADING SCREEN COMPONENT
// ============================================
export const LoadingScreen = () => (
  <div 
    className="min-h-screen flex flex-col items-center justify-center"
    style={{ background: `linear-gradient(135deg, #FEFDF8 0%, #E8F5E9 100%)` }}
  >
    <div className="text-center">
      <div 
        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg"
        style={{ background: `linear-gradient(135deg, #2D5016 0%, #8FBC3B 100%)` }}
      >
        <Droplets className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold mb-4" style={{ color: '#2D5016' }}>FieldSync</h1>
      <Spinner size="lg" />
    </div>
  </div>
);
