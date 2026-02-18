// FieldSync v2 - Call-In Service Request Page
// Extracted from App.js CallInView (~line 1453)
import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useJobs } from '../../hooks/useJobs';
import { Button, Input, Select, SearchableSelect } from '../../components/ui';

const CallInPage = () => {
  const { colors } = useTheme();
  const { users, equipment } = useData();
  const { createCallInJob, isLoading } = useJobs();
  const [formData, setFormData] = useState({
    customerName: '', customerPhone: '', pivotId: '',
    description: '', priority: 'medium', farmerId: ''
  });

  const farmers = users.filter(u => u.role === 'farmer');
  const farmerEquipment = formData.farmerId ? equipment.filter(p => p.farmerId === formData.farmerId) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pivot = equipment.find(p => p.id === formData.pivotId);
    const result = await createCallInJob({
      title: `Call-in: ${formData.customerName}`,
      description: formData.description,
      priority: formData.priority,
      farmerId: formData.farmerId,
      pivotId: formData.pivotId,
      pivotName: pivot?.name || 'Unknown',
      customerPhone: formData.customerPhone,
      location: { lat: pivot?.lat || 40.7614, lng: pivot?.lng || -96.6856 }
    });
    if (result?.success) {
      setFormData({ customerName: '', customerPhone: '', pivotId: '', description: '', priority: 'medium', farmerId: '' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6" style={{ color: colors.primary }}>New Call-In Service Request</h2>
      <div className="card p-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Customer Name" placeholder="John Smith" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required />
            <Input label="Phone Number" placeholder="(555) 123-4567" icon={Phone} value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} />
          </div>
          <SearchableSelect
            label="Select Customer Account"
            value={formData.farmerId}
            onChange={e => setFormData({ ...formData, farmerId: e.target.value, pivotId: '' })}
            options={[{ value: '', label: 'Select a customer...' }, ...farmers.map(f => ({ value: f.id, label: `${f.name}${f.company ? ` (${f.company})` : ''}` }))]}
            placeholder="Search customers..."
            colors={colors}
          />
          {formData.farmerId && (
            <Select
              label="Select Pivot"
              value={formData.pivotId}
              onChange={e => setFormData({ ...formData, pivotId: e.target.value })}
              options={[{ value: '', label: 'Select a pivot...' }, ...farmerEquipment.map(p => ({ value: p.id, label: `${p.name} (${p.acres} acres)` }))]}
              required
            />
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>Issue Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the issue reported by the customer..."
              className="input min-h-[120px] resize-none"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
              required
            />
          </div>
          <Select
            label="Priority"
            value={formData.priority}
            onChange={e => setFormData({ ...formData, priority: e.target.value })}
            options={[
              { value: 'low', label: 'Low - Can wait' },
              { value: 'medium', label: 'Medium - Soon' },
              { value: 'high', label: 'High - Urgent' }
            ]}
          />
          <Button type="submit" className="w-full" icon={Phone} loading={isLoading}>Create Service Request</Button>
        </form>
      </div>
    </div>
  );
};

export default CallInPage;
