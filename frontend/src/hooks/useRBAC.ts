import { useAuthStore } from '../store/auth';
import { Permission, hasPermission, UserRole } from '../lib/rbac';

export const useRBAC = () => {
  const user = useAuthStore((state) => state.user);
  const role = user?.role as UserRole | undefined;

  const can = (permission: Permission): boolean => {
    return hasPermission(role, permission);
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!role) return false;
    return allowedRoles.includes(role);
  };

  const isSuperAdmin = role === 'superAdmin';
  const isOrgAdmin = role === 'orgAdmin' || isSuperAdmin;
  const isManager = role === 'manager' || isOrgAdmin;

  return {
    role,
    can,
    hasRole,
    isSuperAdmin,
    isOrgAdmin,
    isManager,
  };
};

export default useRBAC;
