// ============================================
// ASSIGN JOB MODAL
// ============================================
import React, { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Modal, Button, Badge } from '../ui';

const AssignJobModal = ({
  isOpen,
  onClose,
  colors,
  users,
  jobs,
  userProfile,
  selectedJobForAction,
  handleAssignJob,
  handleRemoveAssignee,
  setShowAddUserModal,
  isLoading
}) => {
  const [selectedTechs, setSelectedTechs] = useState([]);
  
  const techs = users.filter(u => u.role === 'tech');
  const managers = users.filter(u => u.role === 'manager');
  const assignableUsers = [...techs, ...managers];
  
  const currentAssignees = selectedJobForAction?.assignedTo 
    ? (Array.isArray(selectedJobForAction.assignedTo) ? selectedJobForAction.assignedTo : [selectedJobForAction.assignedTo])
    : [];

  useEffect(() => {
    if (isOpen && selectedJobForAction) {
      setSelectedTechs(currentAssignees);
    }
  }, [isOpen, selectedJobForAction?.id, currentAssignees, selectedJobForAction]);

  const toggleTech = (techId) => {
    setSelectedTechs(prev => 
      prev.includes(techId) 
        ? prev.filter(id => id !== techId)
        : [...prev, techId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTechs.length > 0 && selectedJobForAction) {
      handleAssignJob(selectedJobForAction.id, selectedTechs);
      setSelectedTechs([]);
    }
  };

  const handleRemoveCurrentAssignee = async (userId) => {
    if (selectedJobForAction) {
      await handleRemoveAssignee(selectedJobForAction.id, userId);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedTechs([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Job">
      {selectedJobForAction && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold">{selectedJobForAction.title}</p>
              <Badge variant={selectedJobForAction.priority === 'high' ? 'danger' : 'warning'}>{selectedJobForAction.priority}</Badge>
            </div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>{selectedJobForAction.description}</p>
            <p className="text-sm mt-2" style={{ color: colors.muted }}>{selectedJobForAction.pivotName}</p>
          </div>

          {currentAssignees.length > 0 && (
            <div className="p-3 rounded-lg border" style={{ borderColor: colors.border, backgroundColor: colors.success + '10' }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: colors.success }}>Currently Assigned</p>
              <div className="space-y-2">
                {currentAssignees.map(userId => {
                  const user = users.find(u => u.id === userId);
                  if (!user) return null;
                  return (
                    <div key={userId} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: colors.card }}>
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{user.avatar || '👤'}</span>
                        <span className="font-medium" style={{ color: colors.textPrimary }}>{user.name}</span>
                        <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.muted + '30', color: colors.textSecondary }}>{user.role}</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveCurrentAssignee(userId)} className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors" title="Remove from job">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                {currentAssignees.length > 0 ? 'Add More Team Members' : 'Select Team Members'} 
                <span className="text-xs ml-2" style={{ color: colors.textSecondary }}>(select multiple)</span>
              </label>
              {assignableUsers.length === 0 ? (
                <div className="p-4 text-center rounded-lg" style={{ backgroundColor: colors.background }}>
                  <p style={{ color: colors.textSecondary }}>No staff available</p>
                  <Button size="sm" className="mt-2" icon={UserPlus} onClick={() => { handleClose(); setShowAddUserModal(true); }}>Add Staff</Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {techs.length > 0 && (
                    <>
                      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.muted }}>Technicians</p>
                      {techs.map(tech => {
                        const activeJobs = jobs.filter(j => {
                          const assigned = j.assignedTo;
                          const assignedArr = Array.isArray(assigned) ? assigned : [assigned];
                          return assignedArr.includes(tech.id) && j.status === 'assigned';
                        }).length;
                        const isSelf = tech.id === userProfile?.id;
                        const isSelected = selectedTechs.includes(tech.id);
                        const isCurrentlyAssigned = currentAssignees.includes(tech.id);
                        
                        return (
                          <label key={tech.id} className={`flex items-center p-3 rounded-lg cursor-pointer border-2 transition-colors ${isSelected ? 'border-green-500' : 'border-transparent hover:bg-gray-50'} ${isCurrentlyAssigned ? 'opacity-50' : ''}`} style={{ backgroundColor: isSelected ? colors.success + '10' : colors.background }}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleTech(tech.id)} disabled={isCurrentlyAssigned} className="mr-3 w-4 h-4" />
                            <span className="text-2xl mr-3">{tech.avatar || '👷'}</span>
                            <div className="flex-1">
                              <p className="font-medium" style={{ color: colors.textPrimary }}>
                                {tech.name} {isSelf && <span className="text-xs" style={{ color: colors.primary }}>(You)</span>}
                                {isCurrentlyAssigned && <span className="text-xs ml-2" style={{ color: colors.success }}>✓ Assigned</span>}
                              </p>
                              <p className="text-sm" style={{ color: colors.textSecondary }}>{activeJobs} active jobs</p>
                            </div>
                          </label>
                        );
                      })}
                    </>
                  )}
                  
                  {managers.length > 0 && (
                    <>
                      <p className="text-xs font-medium uppercase tracking-wide mt-4" style={{ color: colors.muted }}>Managers</p>
                      {managers.map(manager => {
                        const activeJobs = jobs.filter(j => {
                          const assigned = j.assignedTo;
                          const assignedArr = Array.isArray(assigned) ? assigned : [assigned];
                          return assignedArr.includes(manager.id) && j.status === 'assigned';
                        }).length;
                        const isSelf = manager.id === userProfile?.id;
                        const isSelected = selectedTechs.includes(manager.id);
                        const isCurrentlyAssigned = currentAssignees.includes(manager.id);
                        
                        return (
                          <label key={manager.id} className={`flex items-center p-3 rounded-lg cursor-pointer border-2 transition-colors ${isSelected ? 'border-green-500' : 'border-transparent hover:bg-gray-50'} ${isCurrentlyAssigned ? 'opacity-50' : ''}`} style={{ backgroundColor: isSelected ? colors.success + '10' : colors.background }}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleTech(manager.id)} disabled={isCurrentlyAssigned} className="mr-3 w-4 h-4" />
                            <span className="text-2xl mr-3">{manager.avatar || '👔'}</span>
                            <div className="flex-1">
                              <p className="font-medium" style={{ color: colors.textPrimary }}>
                                {manager.name} {isSelf && <span className="text-xs" style={{ color: colors.primary }}>(You)</span>}
                                {isCurrentlyAssigned && <span className="text-xs ml-2" style={{ color: colors.success }}>✓ Assigned</span>}
                              </p>
                              <p className="text-sm" style={{ color: colors.textSecondary }}>{activeJobs} active jobs</p>
                            </div>
                          </label>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1" icon={UserPlus} loading={isLoading} disabled={selectedTechs.filter(id => !currentAssignees.includes(id)).length === 0}>
                {currentAssignees.length > 0 ? 'Update Assignment' : 'Assign Job'}
              </Button>
              <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>Cancel</Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
};

export default AssignJobModal;
