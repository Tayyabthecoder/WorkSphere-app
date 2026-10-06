import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/auth';
import AppShell from './AppShell';
import TenantRouteGuard from './TenantRouteGuard';
import PageLoader from '../ui/PageLoader';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, accessToken, setAccessToken, clearAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(!accessToken && isAuthenticated);

  useEffect(() => {
    let isMounted = true;

    if (!accessToken && isAuthenticated) {
      axios
        .post('/api/auth/refresh', {}, { withCredentials: true })
        .then((res) => {
          if (isMounted) {
            if (res.data?.data?.accessToken) {
              setAccessToken(res.data.data.accessToken);
            }
            setIsInitializing(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            clearAuth();
            setIsInitializing(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthenticated, setAccessToken, clearAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isInitializing) {
    return <PageLoader />;
  }

  return (
    <TenantRouteGuard>
      <AppShell>
        <Outlet />
      </AppShell>
    </TenantRouteGuard>
  );
};

export default ProtectedRoute;
