// FieldSync v2 - Login Page
// Extracted from App.js LoginScreen (~line 856)
import React, { useState } from 'react';
import { Droplets, User, Phone, Mail } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContextV2';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

const LoginPage = () => {
  const { login, signup } = useAuth();
  const { addNotification } = useNotifications();
  const { colors } = useTheme();
  const [mode, setMode] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', name: '', phone: ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (mode === 'signup') {
      if (!formData.name) newErrors.name = 'Name is required';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    if (mode === 'login') {
      const result = await login(formData.email, formData.password);
      if (!result.success) addNotification('error', result.error);
    } else {
      const result = await signup(formData.email, formData.password, formData.name, 'farmer', formData.phone);
      if (result.success) {
        addNotification('success', 'Account created successfully! Welcome to FieldSync.');
      } else {
        addNotification('error', result.error);
      }
    }
    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${colors.background} 0%, #E8F5E9 100%)` }}
    >
      <div className="card p-8 w-full max-w-md" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
          >
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>FieldSync</h1>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Agricultural Service Management</p>
        </div>

        <div className="flex mb-6 p-1 rounded-xl" style={{ backgroundColor: colors.background }}>
          <button
            onClick={() => { setMode('login'); setErrors({}); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white shadow' : ''}`}
            style={{ color: mode === 'login' ? colors.primary : colors.textSecondary }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setErrors({}); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-white shadow' : ''}`}
            style={{ color: mode === 'signup' ? colors.primary : colors.textSecondary }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <Input
                label="Full Name" placeholder="John Smith" icon={User}
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
                error={errors.name}
              />
              <Input
                label="Phone Number" placeholder="(555) 123-4567" icon={Phone}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </>
          )}
          <Input
            label="Email Address" type="email" placeholder="you@example.com" icon={Mail}
            value={formData.email}
            onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
            error={errors.email}
          />
          <Input
            label="Password" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            value={formData.password}
            onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
            error={errors.password}
          />
          {mode === 'signup' && (
            <Input
              label="Confirm Password" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              value={formData.confirmPassword}
              onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); setErrors({ ...errors, confirmPassword: '' }); }}
              error={errors.confirmPassword}
            />
          )}
          <Button type="submit" className="w-full" loading={isLoading}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {mode === 'signup' && (
          <p className="text-xs text-center mt-4" style={{ color: colors.textSecondary }}>
            New accounts are created as Farmer accounts. Contact your manager to change your role.
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
