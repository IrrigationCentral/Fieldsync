// FieldSync v2 - Role Guard Component
// Protects routes based on user role
import React from 'react';
import { useAuth } from '../context/AuthContextV2';

const RoleGuard = ({ allowedRoles, children, fallback = null }) => {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;
  if (!allowedRoles || allowedRoles.length === 0) return children;
  if (allowedRoles.includes(role)) return children;

  return fallback || (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Access Denied
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          You don't have permission to view this page.
        </p>
      </div>
    </div>
  );
};

export default RoleGuard;
