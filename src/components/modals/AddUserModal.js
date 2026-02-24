// ============================================
// ADD USER MODAL
// ============================================
import React, { useState } from 'react';
import { User, Mail, Phone, UserPlus } from 'lucide-react';
import { Modal, Button, Input, Select } from '../ui';

const AddUserModal = ({
  isOpen,
  onClose,
  colors,
  signUp,
  addNotification,
  isLoading,
  setIsLoading
}) => {
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', password: '', role: 'farmer',
    company: '', billingAddress: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const userData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role
    };
    if (formData.role === 'farmer') {
      userData.company = formData.company;
      userData.billingAddress = formData.billingAddress;
    }
    const result = await signUp(formData.email, formData.password, formData.name, formData.role, formData.phone, userData);
    if (result.success) {
      addNotification('success', `${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} account created successfully`);
      onClose();
      setFormData({ name: '', email: '', phone: '', password: '', role: 'farmer', company: '', billingAddress: '' });
    } else {
      addNotification('error', result.error);
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    onClose();
    setFormData({ name: '', email: '', phone: '', password: '', role: 'farmer', company: '', billingAddress: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New User" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name *" placeholder="John Smith" icon={User} value={formData.name} onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} required />
        <Input label="Email Address *" type="email" placeholder="john@example.com" icon={Mail} value={formData.email} onChange={e => setFormData(prev => ({...prev, email: e.target.value}))} required />
        <Input label="Phone Number" placeholder="(555) 123-4567" icon={Phone} value={formData.phone} onChange={e => setFormData(prev => ({...prev, phone: e.target.value}))} />
        <Input label="Password *" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData(prev => ({...prev, password: e.target.value}))} required />
        <Select label="Role" value={formData.role} onChange={e => setFormData(prev => ({...prev, role: e.target.value}))} options={[
          { value: 'farmer', label: '👨‍🌾 Farmer / Customer' },
          { value: 'tech', label: '👷 Technician' },
          { value: 'office', label: '🏢 Office Staff' },
          { value: 'manager', label: '👔 Manager' }
        ]} />
        
        {formData.role === 'farmer' && (
          <div className="border-t pt-4 space-y-4" style={{ borderColor: colors.border }}>
            <h4 className="font-medium text-sm" style={{ color: colors.textSecondary }}>Customer Details (Optional)</h4>
            <Input label="Company/Farm Name" placeholder="Smith Family Farms" value={formData.company} onChange={e => setFormData(prev => ({...prev, company: e.target.value}))} />
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Billing Address</label>
              <textarea 
                className="input" 
                rows={2} 
                placeholder="123 Farm Road&#10;County, State 12345"
                value={formData.billingAddress}
                onChange={e => setFormData(prev => ({...prev, billingAddress: e.target.value}))}
              />
            </div>
          </div>
        )}
        
        <div className="flex space-x-3 pt-4">
          <Button type="submit" className="flex-1" icon={UserPlus} loading={isLoading}>Create Account</Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
