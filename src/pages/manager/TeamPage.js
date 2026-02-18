// FieldSync v2 - Team Management Page
// Extracted from App.js TeamManagement (~line 1996)
import React, { useState } from 'react';
import { UserPlus, Users, Settings, Trash2 } from 'lucide-react';
import { updateUser } from '../../firebase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContextV2';
import { useData } from '../../context/DataContext';
import { useNotifications } from '../../context/NotificationContext';
import { useUsers } from '../../hooks/useUsers';
import { Modal, Select, Badge, Button, EmptyState } from '../../components/ui';

const TeamPage = ({ onOpenAddUser }) => {
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const { users, jobs } = useData();
  const { addNotification } = useNotifications();
  const { deleteUser } = useUsers();
  const [editingMemberRole, setEditingMemberRole] = useState(null);

  const teamMembers = users.filter(u => u.role !== 'farmer');

  const handleRoleChange = async (userId, newRole) => {
    const result = await updateUser(userId, { role: newRole });
    if (result.success) {
      addNotification('success', 'Role updated successfully');
      setEditingMemberRole(null);
    } else {
      addNotification('error', result.error || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: colors.primary }}>Team Members</h2>
        <Button icon={UserPlus} onClick={onOpenAddUser}>Add Team Member</Button>
      </div>

      {/* Role Edit Modal */}
      <Modal isOpen={!!editingMemberRole} title="Change Team Member Role" onClose={() => setEditingMemberRole(null)}>
        {editingMemberRole && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
              <span className="text-3xl">{editingMemberRole.avatar || '\uD83D\uDC64'}</span>
              <div>
                <p className="font-semibold" style={{ color: colors.textPrimary }}>{editingMemberRole.name}</p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>{editingMemberRole.email}</p>
              </div>
            </div>
            <Select
              label="Role"
              value={editingMemberRole.role}
              onChange={(e) => setEditingMemberRole({ ...editingMemberRole, role: e.target.value })}
              options={[
                { value: 'tech', label: 'Technician - Field service worker' },
                { value: 'office', label: 'Office - Can manage jobs and customers' },
                { value: 'manager', label: 'Manager - Full access' }
              ]}
            />
            <div className="flex space-x-3">
              <Button className="flex-1" onClick={() => handleRoleChange(editingMemberRole.id, editingMemberRole.role)}>Save Changes</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setEditingMemberRole(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {teamMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Team Members"
          description="Add technicians and office staff to your team."
          action={<Button icon={UserPlus} onClick={onOpenAddUser}>Add Team Member</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map(member => {
            const memberJobs = jobs.filter(j => {
              const assigned = j.assignedTo;
              const assignedArr = Array.isArray(assigned) ? assigned : [assigned];
              return assignedArr.includes(member.id);
            });
            const isSelf = member.id === userProfile?.id;
            return (
              <div key={member.id} className="card p-4" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{member.avatar || '\uD83D\uDC64'}</span>
                    <div>
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                        {member.name}
                        {isSelf && <span className="text-xs ml-1" style={{ color: colors.primary }}>(You)</span>}
                      </h3>
                      <Badge variant={member.role === 'manager' ? 'accent' : member.role === 'office' ? 'water' : 'default'}>{member.role}</Badge>
                    </div>
                  </div>
                  {userProfile?.role === 'manager' && !isSelf && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingMemberRole(member)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Edit role"
                      >
                        <Settings className="w-4 h-4" style={{ color: colors.textSecondary }} />
                      </button>
                      <button
                        onClick={() => deleteUser(member.id, member.name, member.role)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete team member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p style={{ color: colors.textSecondary }}>{member.email}</p>
                  {member.phone && <p style={{ color: colors.textSecondary }}>{member.phone}</p>}
                </div>
                {(member.role === 'tech' || member.role === 'manager') && (
                  <div className="mt-3 pt-3 border-t flex justify-between" style={{ borderColor: colors.border }}>
                    <span className="text-sm" style={{ color: colors.textSecondary }}>Active: <strong>{memberJobs.filter(j => ['assigned', 'in-progress'].includes(j.status)).length}</strong></span>
                    <span className="text-sm" style={{ color: colors.textSecondary }}>Completed: <strong>{memberJobs.filter(j => ['completed', 'billed', 'ready-to-bill'].includes(j.status)).length}</strong></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamPage;
