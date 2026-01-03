const fs = require('fs');

const content = fs.readFileSync('./App.js.backup', 'utf-8');
const lines = content.split('\n');

// Line numbers (0-indexed)
const IMPORTS_END = 63;
const THEMES_START = 64;
const THEMES_END = 110;
const FIELDSYNC_START = 610;
const INLINE_MODALS_START = 4327;
const RETURN_START = 6155;

// New imports to add
const newImports = `
// UI Components
import { Modal, Button, Input, Select, SearchableSelect, Badge, StarRating, Spinner } from './components/ui';

// Modal Components
import {
  ReportIssueModal,
  CompleteJobModal,
  AddUserModal,
  AssignJobModal,
  SettingsModal,
  SONumberModal,
  AddEquipmentModal,
  EditEquipmentModal,
  JobDetailsModal,
  ProfileModal
} from './components/modals';
`;

// Build the new file
let output = [];

// 1. Original imports (lines 0-63)
for (let i = 0; i <= IMPORTS_END; i++) {
  output.push(lines[i]);
}

// 2. Add new imports
output.push(newImports);

// 3. Theme definitions (lines 64-110)
for (let i = THEMES_START; i <= THEMES_END; i++) {
  output.push(lines[i]);
}

// 4. Add StatCard, EmptyState, LoadingScreen (needed locally)
output.push(`
// ============================================
// LOCAL COMPONENTS (StatCard, EmptyState, LoadingScreen)
// ============================================

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, trend, color = '#2D5016' }) => (
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

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, action }) => (
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

// Loading Screen Component
const LoadingScreen = () => (
  <div 
    className="min-h-screen flex flex-col items-center justify-center"
    style={{ background: \`linear-gradient(135deg, #FEFDF8 0%, #E8F5E9 100%)\` }}
  >
    <div className="text-center">
      <div 
        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg"
        style={{ background: \`linear-gradient(135deg, #2D5016 0%, #8FBC3B 100%)\` }}
      >
        <Droplets className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold mb-4" style={{ color: '#2D5016' }}>FieldSync</h1>
      <Spinner size="lg" />
    </div>
  </div>
);

`);

// 5. FieldSyncApp component (lines 610-4326, before inline modals)
for (let i = FIELDSYNC_START; i < INLINE_MODALS_START; i++) {
  output.push(lines[i]);
}

// 6. Return statement (lines 6155 to end)
for (let i = RETURN_START; i < lines.length; i++) {
  output.push(lines[i]);
}

const result = output.join('\n');
fs.writeFileSync('./src/App.js', result);
console.log('Wrote', output.length, 'lines to src/App.js');
console.log('File size:', result.length, 'bytes');
