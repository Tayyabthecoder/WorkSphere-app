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

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  superAdmin: 4,
  orgAdmin: 3,
  manager: 2,
  member: 1,
  viewer: 0,
};

export function canManageRole(callerRole?: string, targetRole?: string): boolean {
  if (!callerRole || !targetRole) return false;
  if (callerRole === 'superAdmin') return true;
  if (callerRole === 'orgAdmin') {
    // Org Admin manages all workspace users (orgAdmin, manager, member, viewer)
    return targetRole !== 'superAdmin';
  }
  if (callerRole === 'manager') {
    // Manager manages members and others (member, viewer)
    return targetRole === 'member' || targetRole === 'viewer';
  }
  return false;
}

/**
 * Returns true if callerRole has permissions to edit the role of targetMember.
 * - Cannot change your own role (isSelf = true).
 * - superAdmin can change anyone's role.
 * - orgAdmin manages all users in the workspace (orgAdmin, manager, member, viewer).
 * - manager manages members and others (member, viewer). Cannot change orgAdmin or manager!
 * - member and viewer cannot change anyone's role.
 */
export function canChangeMemberRole(callerRole?: string, targetRole?: string, isSelf: boolean = false): boolean {
  if (isSelf || !callerRole || !targetRole) return false;
  if (callerRole === 'superAdmin') return true;
  if (callerRole === 'orgAdmin') {
    return targetRole !== 'superAdmin';
  }
  if (callerRole === 'manager') {
    return targetRole === 'member' || targetRole === 'viewer';
  }
  return false;
}

/**
 * Returns true if callerRole has permissions to deactivate or reactivate targetMember.
 * - Cannot deactivate your own account (isSelf = true).
 * - superAdmin can deactivate anyone except self.
 * - orgAdmin can deactivate any workspace user except superAdmin.
 * - manager can deactivate members and viewers. Cannot deactivate orgAdmin or other managers!
 * - member and viewer cannot deactivate anyone.
 */
export function canDeactivateMember(callerRole?: string, targetRole?: string, isSelf: boolean = false): boolean {
  if (isSelf || !callerRole || !targetRole) return false;
  if (!hasPermission(callerRole, 'user:deactivate')) return false;
  if (callerRole === 'superAdmin') return true;
  if (callerRole === 'orgAdmin') {
    return targetRole !== 'superAdmin';
  }
  if (callerRole === 'manager') {
    return targetRole === 'member' || targetRole === 'viewer';
  }
  return false;
}

export interface AssignableRoleOption {
  value: UserRole;
  label: string;
  description: string;
}

/**
 * Returns the list of roles the caller is allowed to assign.
 * - superAdmin: orgAdmin, manager, member, viewer
 * - orgAdmin: orgAdmin, manager, member, viewer ("org admin manage all the user")
 * - manager: member, viewer ("manager manage the members and others")
 * - member/viewer: []
 */
export function getAssignableRoles(callerRole?: string, _isAddingNewMember: boolean = false): AssignableRoleOption[] {
  if (callerRole === 'superAdmin' || callerRole === 'orgAdmin') {
    return [
      { value: 'orgAdmin', label: 'Org Admin', description: 'Full workspace authority and settings' },
      { value: 'manager', label: 'Manager', description: 'Lead squads and manage projects/tasks' },
      { value: 'member', label: 'Member', description: 'Standard delivery and execution' },
      { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
    ];
  }

  if (callerRole === 'manager') {
    return [
      { value: 'member', label: 'Member', description: 'Standard delivery and execution' },
      { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
    ];
  }

  return [];
}

