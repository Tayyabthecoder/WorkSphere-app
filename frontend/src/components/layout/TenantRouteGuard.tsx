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

  // Tenant resolution: ensure user belongs to an active tenant workspace
  const hasTenant = Boolean(user?.tenantId && !user.tenantId.startsWith('pending'));

  if (!hasTenant) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/onboarding" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default TenantRouteGuard;
