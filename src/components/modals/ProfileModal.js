// ============================================
// PROFILE MODAL
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Lock, Check, MessageSquare, Shield, Bell, Smartphone } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { requestNotificationPermission, getNotificationStatus } from '../../firebase';

const ProfileModal = ({
  isOpen,
  onClose,
  userProfile,
  isLoading,
  colors,
  // Handlers
  onUpdateProfile,
  onUpdateEmail,
  onUpdatePassword,
  // SMS Service
  CARRIERS,
  sendTestNotification,
  isEmailJSConfigured,
  getSmsEmail,
  addNotification
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    avatar: '', 
    carrier: '',
    company: '',
    billingAddress: ''
  });
  const [emailData, setEmailData] = useState({ newEmail: '', currentPassword: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pushStatus, setPushStatus] = useState('default');
  const [pushLoading, setPushLoading] = useState(false);

  // Check push notification status
  useEffect(() => {
    setPushStatus(getNotificationStatus());
  }, [isOpen]);

  // Reset form only when modal opens (not when userProfile changes)
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        avatar: userProfile.avatar || '',
        carrier: userProfile.carrier || '',
        company: userProfile.company || '',
        billingAddress: userProfile.billingAddress || ''
      });
      setEmailData({ newEmail: '', currentPassword: '' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setEmailError('');
      setPasswordError('');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, userProfile]);

  const avatarOptions = ['👨‍🌾', '👩‍🌾', '👷', '👷‍♀️', '👔', '👩‍💼', '🧑‍🔧', '🌾', '🚜'];

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const result = await onUpdateProfile(userProfile.id, formData);
    if (result?.success) {
      addNotification('success', 'Profile updated successfully');
    } else {
      addNotification('error', result?.error || 'Failed to update profile');
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    
    if (!emailData.newEmail || !emailData.currentPassword) {
      setEmailError('Please fill in all fields');
      return;
    }
    
    const result = await onUpdateEmail(emailData.newEmail, emailData.currentPassword);
    if (result?.success) {
      addNotification('success', 'Email updated successfully! Use your new email to log in.');
      setEmailData({ newEmail: '', currentPassword: '' });
    } else {
      setEmailError(result?.error || 'Failed to update email');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    const result = await onUpdatePassword(passwordData.currentPassword, passwordData.newPassword);
    if (result?.success) {
      addNotification('success', 'Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setPasswordError(result?.error || 'Failed to update password');
    }
  };

  const handleTestSMS = async () => {
    const configured = isEmailJSConfigured();
    if (!configured) {
      addNotification('error', 'EmailJS not configured - check console for details');
      return;
    }
    const smsEmail = getSmsEmail(formData.phone, formData.carrier);
    if (!smsEmail) {
      addNotification('error', 'Invalid phone number - need exactly 10 digits');
      return;
    }
    addNotification('info', `Sending test to ${smsEmail}...`);
    const testUser = { ...userProfile, phone: formData.phone, carrier: formData.carrier };
    const result = await sendTestNotification(testUser);
    if (result.success) {
      addNotification('success', `Test SMS sent to ${result.smsEmail}! Check your phone.`);
    } else {
      addNotification('error', `Test failed: ${result.error}`);
      console.log('SMS Test Debug:', result);
    }
  };

  const handleEnablePush = async () => {
    setPushLoading(true);
    try {
      const token = await requestNotificationPermission(userProfile?.id);
      if (token) {
        setPushStatus('granted');
        addNotification('success', 'Push notifications enabled! You\'ll receive alerts on this device.');
      } else {
        setPushStatus(getNotificationStatus());
        if (getNotificationStatus() === 'denied') {
          addNotification('error', 'Notifications blocked. Please enable in browser settings.');
        }
      }
    } catch (error) {
      console.error('Push notification error:', error);
      addNotification('error', 'Failed to enable notifications');
    }
    setPushLoading(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'password', label: 'Password', icon: Lock }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings" size="lg">
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 p-1 rounded-lg" style={{ backgroundColor: colors.background }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: activeTab === tab.id ? colors.primary : 'transparent',
              color: activeTab === tab.id ? 'white' : colors.textSecondary
            }}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="text-center mb-4">
            <span className="text-5xl">{formData.avatar || '👤'}</span>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {avatarOptions.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, avatar: emoji}))}
                  className="text-2xl p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: formData.avatar === emoji ? colors.success + '20' : 'transparent' }}
                  onMouseEnter={e => { if (formData.avatar !== emoji) e.currentTarget.style.backgroundColor = colors.inputBg; }}
                  onMouseLeave={e => { if (formData.avatar !== emoji) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <Input label="Name" value={formData.name} onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} required />
          <Input label="Phone" value={formData.phone} onChange={e => setFormData(prev => ({...prev, phone: e.target.value}))} placeholder="(555) 123-4567" />
          
          {/* Farmer-specific fields */}
          {userProfile?.role === 'farmer' && (
            <>
              <Input 
                label="Company/Farm Name" 
                value={formData.company} 
                onChange={e => setFormData(prev => ({...prev, company: e.target.value}))} 
                placeholder="Smith Family Farms" 
              />
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Billing Address</label>
                <textarea 
                  className="input" 
                  rows={2} 
                  placeholder="123 Farm Road&#10;City, State 12345"
                  value={formData.billingAddress}
                  onChange={e => setFormData(prev => ({...prev, billingAddress: e.target.value}))}
                />
              </div>
            </>
          )}
          
          {/* SMS Carrier Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Mobile Carrier (for SMS notifications)
            </label>
            <select
              className="input"
              value={formData.carrier}
              onChange={e => setFormData(prev => ({...prev, carrier: e.target.value}))}
            >
              <option value="">Select your carrier...</option>
              <option value="email_only">📧 Email Only (no SMS)</option>
              {CARRIERS && Object.entries(CARRIERS).map(([key, { name }]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
            <p className="text-xs" style={{ color: colors.muted }}>
              Select your carrier for SMS, or choose "Email Only" to receive notifications via email.
            </p>
            <p className="text-xs mt-1" style={{ color: colors.warning }}>
              ⚠️ Note: Some carriers (especially T-Mobile) may block SMS-via-email. If SMS doesn't work, try "Email Only".
            </p>
            
            {/* Test SMS Button */}
            {formData.phone && formData.carrier && formData.carrier !== 'email_only' && getSmsEmail && (
              <div className="space-y-2 mt-3">
                <p className="text-xs p-2 rounded" style={{ backgroundColor: colors.background, color: colors.textSecondary }}>
                  SMS will be sent to: <strong style={{ color: colors.primary }}>{getSmsEmail(formData.phone, formData.carrier) || 'Invalid phone format'}</strong>
                </p>
                <button
                  type="button"
                  onClick={handleTestSMS}
                  className="text-sm px-3 py-1.5 rounded-lg flex items-center space-x-1"
                  style={{ backgroundColor: colors.water + '15', color: colors.water }}
                >
                  <Bell className="w-3 h-3" />
                  <span>Send Test SMS</span>
                </button>
              </div>
            )}
            
            {/* Email notification info */}
            {formData.carrier === 'email_only' && (
              <div className="mt-3 p-2 rounded" style={{ backgroundColor: colors.success + '15' }}>
                <p className="text-xs" style={{ color: colors.success }}>
                  ✓ Notifications will be sent to: <strong>{userProfile?.email}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              <Mail className="w-4 h-4 inline mr-1" /> {userProfile?.email}
            </p>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              <Shield className="w-4 h-4 inline mr-1" /> Role: {userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1)}
            </p>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1" icon={Check} loading={isLoading}>Save Changes</Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Push Notifications Section */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            <h3 className="font-medium flex items-center mb-3" style={{ color: colors.textPrimary }}>
              <Smartphone className="w-5 h-5 mr-2" style={{ color: colors.primary }} />
              Push Notifications
            </h3>
            
            {pushStatus === 'unsupported' && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.warning + '15' }}>
                <p className="text-sm" style={{ color: colors.warning }}>
                  ⚠️ Push notifications are not supported in this browser. 
                  Try using Chrome, Firefox, or Edge on desktop/Android.
                </p>
              </div>
            )}
            
            {pushStatus === 'denied' && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.danger + '15' }}>
                <p className="text-sm" style={{ color: colors.danger }}>
                  ❌ Notifications are blocked. To enable:
                </p>
                <ol className="text-xs mt-2 list-decimal list-inside" style={{ color: colors.danger }}>
                  <li>Click the lock/info icon in your browser's address bar</li>
                  <li>Find "Notifications" and change to "Allow"</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            )}
            
            {pushStatus === 'default' && (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Enable push notifications to receive instant alerts when:
                </p>
                <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                  <li>• New jobs are assigned to you</li>
                  <li>• Job status changes</li>
                  <li>• Urgent issues are reported</li>
                </ul>
                <Button 
                  onClick={handleEnablePush} 
                  loading={pushLoading}
                  icon={Bell}
                  className="w-full mt-3"
                >
                  Enable Push Notifications
                </Button>
              </div>
            )}
            
            {pushStatus === 'granted' && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.success + '15' }}>
                <p className="text-sm" style={{ color: colors.success }}>
                  ✅ Push notifications are enabled on this device!
                </p>
                <p className="text-xs mt-1" style={{ color: colors.muted }}>
                  You'll receive alerts even when FieldSync is closed.
                </p>
              </div>
            )}
          </div>

          {/* SMS Notifications Section */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            <h3 className="font-medium flex items-center mb-3" style={{ color: colors.textPrimary }}>
              <MessageSquare className="w-5 h-5 mr-2" style={{ color: colors.water }} />
              SMS Notifications
            </h3>
            
            <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
              Current carrier: <strong>{formData.carrier ? (formData.carrier === 'email_only' ? 'Email Only' : CARRIERS?.[formData.carrier]?.name || formData.carrier) : 'Not set'}</strong>
            </p>
            
            <p className="text-xs" style={{ color: colors.muted }}>
              Configure your carrier in the Profile tab to receive SMS alerts.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
          </div>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.water + '15', border: `1px solid ${colors.water}` }}>
            <p className="text-sm" style={{ color: colors.textPrimary }}>
              <Mail className="w-4 h-4 inline mr-2" />
              Current Email: <strong>{userProfile?.email}</strong>
            </p>
          </div>
          
          <Input 
            label="New Email Address" 
            type="email"
            value={emailData.newEmail} 
            onChange={e => setEmailData({...emailData, newEmail: e.target.value})} 
            placeholder="newemail@example.com"
            required 
          />
          
          <Input 
            label="Current Password" 
            type="password"
            value={emailData.currentPassword} 
            onChange={e => setEmailData({...emailData, currentPassword: e.target.value})} 
            placeholder="Enter your current password"
            required 
          />
          
          <p className="text-xs" style={{ color: colors.muted }}>
            For security, you must verify your current password to change your email.
          </p>
          
          {emailError && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: colors.danger + '15' }}>
              <p className="text-sm" style={{ color: colors.danger }}>{emailError}</p>
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1" icon={Mail} loading={isLoading}>Update Email</Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input 
            label="Current Password" 
            type="password"
            value={passwordData.currentPassword} 
            onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} 
            placeholder="Enter your current password"
            required 
          />
          
          <Input 
            label="New Password" 
            type="password"
            value={passwordData.newPassword} 
            onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} 
            placeholder="Enter new password (min 6 characters)"
            required 
          />
          
          <Input 
            label="Confirm New Password" 
            type="password"
            value={passwordData.confirmPassword} 
            onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
            placeholder="Confirm new password"
            required 
          />
          
          {passwordError && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: colors.danger + '15' }}>
              <p className="text-sm" style={{ color: colors.danger }}>{passwordError}</p>
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1" icon={Lock} loading={isLoading}>Update Password</Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ProfileModal;
