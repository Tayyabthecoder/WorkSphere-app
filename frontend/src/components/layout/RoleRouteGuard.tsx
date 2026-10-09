import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { UserRole } from '../../lib/rbac';

interface RoleRouteGuardProps {
  allowedRoles: UserRole[];
  fallbackPath?: string;
  children?: React.ReactNode;
}

/**
 * RoleRouteGuard enforces client-side route access control based on user role.
 * Unauthorized attempts are redirected to fallbackPath (default: /dashboard).
 */
export const RoleRouteGuard: React.FC<RoleRouteGuardProps> = ({
  allowedRoles,
  fallbackPath = '/dashboard',
  children,
}) => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={fallbackPath}
        replace
        state={{
          unauthorizedAttempt: location.pathname,
          requiredRoles: allowedRoles,
        }}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RoleRouteGuard;
