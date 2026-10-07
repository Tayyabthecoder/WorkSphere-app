import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Building2, AlertTriangle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { Button } from '../ui/Button';

interface TenantRouteGuardProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export const TenantRouteGuard: React.FC<TenantRouteGuardProps> = ({
  children,
  fallback,
}) => {
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super Admin operates at the platform level and does not require an active tenant
  const isSuperAdmin = user?.role === 'superAdmin';
  const hasTenant = isSuperAdmin || Boolean(user?.tenantId && !user.tenantId.startsWith('pending'));

  if (!hasTenant) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/onboarding" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default TenantRouteGuard;
