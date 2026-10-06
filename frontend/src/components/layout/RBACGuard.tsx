import React from 'react';
import { useRBAC } from '../../hooks/useRBAC';
import { Permission, UserRole } from '../../lib/rbac';

interface RBACGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export const RBACGuard: React.FC<RBACGuardProps> = ({
  children,
  permission,
  allowedRoles,
  fallback = null,
}) => {
  const { can, hasRole } = useRBAC();

  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RBACGuard;
