export type UserRole = 'superAdmin' | 'orgAdmin' | 'manager' | 'member' | 'viewer';

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

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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

export const hasPermission = (role: string | undefined, permission: Permission): boolean => {
  if (!role) return false;
  const userRole = role as UserRole;
  const perms = ROLE_PERMISSIONS[userRole];
  return perms ? perms.includes(permission) : false;
};
