import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';
import { ForbiddenError } from '../utils/errors.js';
import { sendApiError } from '../utils/apiResponse.js';

export type Permission =
  | 'tenant:manage'
  | 'project:create'
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'task:create'
  | 'task:read'
  | 'task:update'
  | 'task:delete'
  | 'time:log'
  | 'time:read'
  | 'budget:read'
  | 'budget:write'
  | 'report:read'
  | 'report:export'
  | 'user:invite'
  | 'user:deactivate'
  | 'user:read'
  | 'document:create'
  | 'document:read'
  | 'document:update'
  | 'document:delete'
  | 'folder:create'
  | 'folder:delete'
  | 'file:upload'
  | 'file:delete'
  | 'client:create'
  | 'client:read'
  | 'client:update'
  | 'client:delete'
  | 'comment:create'
  | 'comment:read'
  | 'comment:update'
  | 'comment:delete'
  | 'time:approve';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  superAdmin: [
    'tenant:manage',
    'project:create',
    'project:read',
    'project:update',
    'project:delete',
    'task:create',
    'task:read',
    'task:update',
    'task:delete',
    'time:log',
    'time:read',
    'budget:read',
    'budget:write',
    'report:read',
    'report:export',
    'user:invite',
    'user:deactivate',
    'user:read',
    'document:create',
    'document:read',
    'document:update',
    'document:delete',
    'folder:create',
    'folder:delete',
    'file:upload',
    'file:delete',
    'client:create',
    'client:read',
    'client:update',
    'client:delete',
    'comment:create',
    'comment:read',
    'comment:update',
    'comment:delete',
    'time:approve',
  ],
  orgAdmin: [
    'project:create',
    'project:read',
    'project:update',
    'project:delete',
    'task:create',
    'task:read',
    'task:update',
    'task:delete',
    'time:log',
    'time:read',
    'budget:read',
    'budget:write',
    'report:read',
    'report:export',
    'user:invite',
    'user:deactivate',
    'user:read',
    'document:create',
    'document:read',
    'document:update',
    'document:delete',
    'folder:create',
    'folder:delete',
    'file:upload',
    'file:delete',
    'client:create',
    'client:read',
    'client:update',
    'client:delete',
    'comment:create',
    'comment:read',
    'comment:update',
    'comment:delete',
    'time:approve',
  ],
  manager: [
    'project:create',
    'project:read',
    'project:update',
    'task:create',
    'task:read',
    'task:update',
    'task:delete',
    'time:log',
    'time:read',
    'budget:read',
    'budget:write',
    'report:read',
    'report:export',
    'user:invite',
    'user:read',
    'document:create',
    'document:read',
    'document:update',
    'document:delete',
    'folder:create',
    'folder:delete',
    'file:upload',
    'file:delete',
    'client:create',
    'client:read',
    'client:update',
    'client:delete',
    'comment:create',
    'comment:read',
    'comment:update',
    'comment:delete',
    'time:approve',
  ],
  member: [
    'project:read',
    'task:create',
    'task:read',
    'task:update',
    'time:log',
    'time:read',
    'report:read',
    'user:read',
    'document:create',
    'document:read',
    'document:update',
    'folder:create',
    'file:upload',
    'client:read',
    'comment:create',
    'comment:read',
    'comment:update',
    'comment:delete',
  ],
  viewer: [
    'project:read',
    'task:read',
    'time:read',
    'report:read',
    'user:read',
    'document:read',
    'client:read',
    'comment:read',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function assertPermission(role: UserRole, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(`Role '${role}' does not possess permission '${permission}'`);
  }
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role as UserRole;
    if (!userRole) {
      return sendApiError(res, new ForbiddenError('No role associated with authenticated user'), 403);
    }
    if (!hasPermission(userRole, permission)) {
      return sendApiError(res, new ForbiddenError(`Role '${userRole}' does not possess permission '${permission}'`), 403);
    }
    next();
  };
}
