// ============================================
// CUSTOMERS VIEW - Extracted to prevent re-renders
// ============================================
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, UserPlus, Phone, Mail, Plus, AlertCircle, Settings,
  Trash2, Wrench, Clipboard, ChevronRight, Users, X
} from 'lucide-react';
import { Modal, Button, Select, Badge } from '../ui';

// Empty State Component (local)
const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#9CA98620' }}>
      <Icon className="w-8 h-8" style={{ color: '#9CA986' }} />
    </div>
    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
    <p className="text-sm mb-4 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
    {action}
  </div>
);

export const CustomersView = ({
  colors,
  users,
  equipment,
  jobs,
  userProfile,
  customerSearchQuery,
  setCustomerSearchQuery,
  setShowAddUserModal,
  setShowAddEquipmentModal,
  setShowReportIssueModal,
  setSelectedEquipmentProfile,
  setSelectedJobForAction,
  setShowJobDetailsModal,
  handleDeleteUser,
  handleDeleteEquipment,
  handleDeleteJob,
  updateUser,
  addNotification,
  isLoading,
  formatEquipmentType,
  formatDate,
  formatStatus,
  getStatusVariant
}) => {
  const [editingUserRole, setEditingUserRole] = useState(null);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(customerSearchQuery);

  // Debounce search input to prevent filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setCustomerSearchQuery(localSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchQuery, setCustomerSearchQuery]);

  // Filter by search and sort alphabetically - memoized to prevent recalculation on every render
  const farmers = useMemo(() =>
    users
      .filter(u => u.role === 'farmer')
      .filter(u => {
        if (!customerSearchQuery.trim()) return true;
        const search = customerSearchQuery.toLowerCase();
        return (
          u.name?.toLowerCase().includes(search) ||
          u.company?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search) ||
          u.phone?.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [users, customerSearchQuery]
  );

  const handleRoleChange = async (userId, newRole) => {
    const result = await updateUser(userId, { role: newRole });
    if (result.success) {
      addNotification('success', 'User role updated successfully');
      setEditingUserRole(null);
    } else {
      addNotification('error', result.error || 'Failed to update role');
    }
  };

  // Get data for selected customer
  const selectedFarmerEquipment = selectedCustomerProfile ? equipment.filter(p => p.farmerId === selectedCustomerProfile.id) : [];
  const selectedFarmerJobs = selectedCustomerProfile ? jobs.filter(j => j.farmerId === selectedCustomerProfile.id) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Customers</h2>
        <div className="flex space-x-2">
          <Button icon={UserPlus} size="sm" variant="secondary" onClick={() => setShowAddUserModal(true)}>Add Customer</Button>
        </div>
      </div>

      {/* Search Bar - Debounced for better performance */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.textSecondary }} />
        <input
          type="text"
          placeholder="Search customers by name, company, email, or phone..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          className="input pl-10 w-full"
          style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}
        />
        {localSearchQuery && (
          <button
            onClick={() => setLocalSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200"
          >
            <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
          </button>
        )}
      </div>

      {/* Results count */}
      {customerSearchQuery && (
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Found {farmers.length} customer{farmers.length !== 1 ? 's' : ''} matching "{customerSearchQuery}"
        </p>
      )}

      {/* Role Edit Modal */}
      <Modal isOpen={!!editingUserRole} title="Change User Role" onClose={() => setEditingUserRole(null)}>
        {editingUserRole && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
              <span className="text-3xl">{editingUserRole.avatar || '👤'}</span>
              <div>
                <p className="font-semibold" style={{ color: colors.textPrimary }}>{editingUserRole.name}</p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>{editingUserRole.email}</p>
              </div>
            </div>
            <Select
              label="Select Role"
              value={editingUserRole.role}
              onChange={(e) => setEditingUserRole({ ...editingUserRole, role: e.target.value })}
              options={[
                { value: 'farmer', label: '👩‍🌾 Customer (Farmer)' },
                { value: 'tech', label: '👨‍🔧 Technician' },
                { value: 'office', label: '👤 Office Staff' },
                { value: 'manager', label: '👨‍💼 Manager' }
              ]}
            />
            <div className="flex space-x-3">
              <Button 
                className="flex-1" 
                onClick={() => handleRoleChange(editingUserRole.id, editingUserRole.role)}
                loading={isLoading}
              >
                Save Changes
              </Button>
              <Button className="flex-1" variant="secondary" onClick={() => setEditingUserRole(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Customer Profile Modal */}
      <Modal isOpen={!!selectedCustomerProfile} title="Customer Profile" onClose={() => setSelectedCustomerProfile(null)} size="lg">
        {selectedCustomerProfile && (
          <div className="space-y-6">
            {/* Customer Header */}
            <div className="flex items-center space-x-4 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
              <span className="text-5xl">{selectedCustomerProfile.avatar || '👨‍🌾'}</span>
              <div className="flex-1">
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>{selectedCustomerProfile.name}</h3>
                {selectedCustomerProfile.company && <p className="text-sm" style={{ color: colors.textSecondary }}>{selectedCustomerProfile.company}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCustomerProfile.phone && (
                    <a href={`tel:${selectedCustomerProfile.phone}`} className="text-sm flex items-center px-2 py-1 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>
                      <Phone className="w-3 h-3 mr-1" /> {selectedCustomerProfile.phone}
                    </a>
                  )}
                  {selectedCustomerProfile.email && (
                    <a href={`mailto:${selectedCustomerProfile.email}`} className="text-sm flex items-center px-2 py-1 rounded" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>
                      <Mail className="w-3 h-3 mr-1" /> {selectedCustomerProfile.email}
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: colors.primary }}>{selectedFarmerEquipment.length}</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>Equipment</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={Plus} onClick={() => { setSelectedCustomerProfile(null); setShowAddEquipmentModal(true); }}>Add Equipment</Button>
              <Button size="sm" variant="danger" icon={AlertCircle} onClick={() => { setSelectedCustomerProfile(null); setShowReportIssueModal(true); }}>Report Issue</Button>
              {userProfile?.role === 'manager' && (
                <>
                  <Button size="sm" variant="secondary" icon={Settings} onClick={() => { setSelectedCustomerProfile(null); setEditingUserRole(selectedCustomerProfile); }}>Edit Role</Button>
                  <Button size="sm" variant="secondary" icon={Trash2} onClick={async () => { await handleDeleteUser(selectedCustomerProfile.id, selectedCustomerProfile.name, 'farmer'); setSelectedCustomerProfile(null); }}>Delete Customer</Button>
                </>
              )}
            </div>

            {/* Equipment Section */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
                <Wrench className="w-4 h-4 mr-2" /> Equipment ({selectedFarmerEquipment.length})
              </h4>
              {selectedFarmerEquipment.length === 0 ? (
                <div className="text-center py-6 rounded-lg" style={{ backgroundColor: colors.background }}>
                  <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>No equipment registered</p>
                  <Button size="sm" icon={Plus} onClick={() => { setSelectedCustomerProfile(null); setShowAddEquipmentModal(true); }}>Add Equipment</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedFarmerEquipment.map(pivot => (
                    <div 
                      key={pivot.id} 
                      className="p-3 rounded-lg hover:shadow-md transition-all" 
                      style={{ backgroundColor: colors.background }}
                    >
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => { setSelectedCustomerProfile(null); setSelectedEquipmentProfile(pivot); }}
                        >
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{pivot.name}</p>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>{formatEquipmentType(pivot.type)} • {pivot.acres} acres</p>
                          {pivot.brand && <p className="text-xs" style={{ color: colors.muted }}>{pivot.brand} {pivot.model || ''}</p>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusVariant(pivot.status)}>{pivot.status}</Badge>
                          {['manager', 'office'].includes(userProfile?.role) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteEquipment(pivot.id, pivot.name); }}
                              className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete equipment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Jobs Section */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center" style={{ color: colors.textPrimary }}>
                <Clipboard className="w-4 h-4 mr-2" /> Service History ({selectedFarmerJobs.length})
              </h4>
              {selectedFarmerJobs.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>No service history</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedFarmerJobs.map(job => {
                    const pivot = equipment.find(p => p.id === job.pivotId);
                    return (
                    <div 
                      key={job.id} 
                      className="p-3 rounded-lg hover:shadow-md transition-all cursor-pointer" 
                      style={{ backgroundColor: colors.background }}
                      onClick={() => { setSelectedCustomerProfile(null); setSelectedJobForAction(job); setShowJobDetailsModal(true); }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium hover:underline" style={{ color: colors.textPrimary }}>{job.title}</p>
                          <div className="flex items-center space-x-2 text-xs" style={{ color: colors.textSecondary }}>
                            <span>{formatDate(job.createdAt)}</span>
                            <span>•</span>
                            {pivot ? (
                              <button 
                                className="hover:underline"
                                style={{ color: colors.primary }}
                                onClick={(e) => { e.stopPropagation(); setSelectedCustomerProfile(null); setSelectedEquipmentProfile(pivot); }}
                              >
                                {job.pivotName}
                              </button>
                            ) : (
                              <span>{job.pivotName}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {job.soNumber && <span className="text-xs" style={{ color: colors.primary }}>SO# {job.soNumber}</span>}
                          <Badge variant={getStatusVariant(job.status)}>{formatStatus(job.status)}</Badge>
                          {['manager', 'office'].includes(userProfile?.role) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id, job.title); }}
                              className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {farmers.length === 0 && !customerSearchQuery ? (
        <EmptyState icon={Users} title="No Customers Yet" description="Add your first customer to get started." action={<Button icon={UserPlus} onClick={() => setShowAddUserModal(true)}>Add Customer</Button>} />
      ) : farmers.length === 0 && customerSearchQuery ? (
        <EmptyState icon={Search} title="No Results" description={`No customers found matching "${customerSearchQuery}"`} action={<Button variant="secondary" onClick={() => setCustomerSearchQuery('')}>Clear Search</Button>} />
      ) : (
        <div className="space-y-2">
          {farmers.map(farmer => {
            const farmerEquipment = equipment.filter(p => p.farmerId === farmer.id);
            const farmerJobs = jobs.filter(j => j.farmerId === farmer.id);

            return (
              <div 
                key={farmer.id} 
                className="card p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedCustomerProfile(farmer)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{farmer.avatar || '👨‍🌾'}</span>
                    <div>
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{farmer.name}</h3>
                      {farmer.company && <p className="text-sm" style={{ color: colors.muted }}>{farmer.company}</p>}
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{farmer.phone || farmer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{farmerEquipment.length} Equipment</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>{farmerJobs.length} Jobs</p>
                    </div>
                    <ChevronRight className="w-5 h-5" style={{ color: colors.textSecondary }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomersView;
