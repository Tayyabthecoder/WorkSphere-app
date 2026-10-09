export type UserRole =
  | 'superAdmin'
  | 'orgAdmin'
  | 'managingDirector'
  | 'hr'
  | 'manager'
  | 'teamLeader'
  | 'member'
  | 'viewer';

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
  managingDirector: [
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
  hr: [
    'project:read',
    'task:read',
    'time:read',
    'report:read',
    'report:export',
    'user:invite',
    'user:deactivate',
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
  teamLeader: [
    'project:read',
    'task:create',
    'task:read',
    'task:update',
    'task:delete',
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
  superAdmin: 6,
  orgAdmin: 5,
  managingDirector: 4,
  hr: 3.5,
  manager: 3,
  teamLeader: 2.5,
  member: 2,
  viewer: 1,
};

export function canManageRole(callerRole?: string, targetRole?: string): boolean {
  if (!callerRole || !targetRole) return false;
  if (callerRole === 'superAdmin') return true;
  if (callerRole === 'orgAdmin') {
    // Org Admin manages all workspace users (orgAdmin, managingDirector, hr, manager, teamLeader, member, viewer)
    return targetRole !== 'superAdmin';
  }
  if (callerRole === 'managingDirector') {
    return (
      targetRole === 'hr' ||
      targetRole === 'manager' ||
      targetRole === 'teamLeader' ||
      targetRole === 'member' ||
      targetRole === 'viewer'
    );
  }
  if (callerRole === 'hr') {
    return (
      targetRole === 'manager' ||
      targetRole === 'teamLeader' ||
      targetRole === 'member' ||
      targetRole === 'viewer'
    );
  }
  if (callerRole === 'manager') {
    // Manager manages team leaders, members, and viewers
    return (
      targetRole === 'teamLeader' ||
      targetRole === 'member' ||
      targetRole === 'viewer'
    );
  }
  return false;
}

/**
 * Returns true if callerRole has permissions to edit the role of targetMember.
 * - Cannot change your own role (isSelf = true).
 * - Follows organizational authority hierarchy.
 */
export function canChangeMemberRole(callerRole?: string, targetRole?: string, isSelf: boolean = false): boolean {
  if (isSelf || !callerRole || !targetRole) return false;
  return canManageRole(callerRole, targetRole);
}

/**
 * Returns true if callerRole has permissions to deactivate or reactivate targetMember.
 * - Cannot deactivate your own account (isSelf = true).
 * - Requires 'user:deactivate' permission and hierarchy authority.
 */
export function canDeactivateMember(callerRole?: string, targetRole?: string, isSelf: boolean = false): boolean {
  if (isSelf || !callerRole || !targetRole) return false;
  if (!hasPermission(callerRole, 'user:deactivate')) return false;
  return canManageRole(callerRole, targetRole);
}

export interface AssignableRoleOption {
  value: UserRole;
  label: string;
  description: string;
}

/**
 * Returns the list of roles the caller is allowed to assign.
 */
export function getAssignableRoles(callerRole?: string, _isAddingNewMember: boolean = false): AssignableRoleOption[] {
  if (callerRole === 'superAdmin' || callerRole === 'orgAdmin') {
    return [
      { value: 'orgAdmin', label: 'Org Admin', description: 'Full workspace authority and settings' },
      { value: 'managingDirector', label: 'Managing Director', description: 'Executive oversight of managers and squads' },
      { value: 'hr', label: 'HR / People Ops', description: 'Workspace-wide employee management' },
      { value: 'manager', label: 'Manager', description: 'Lead squads and manage projects/tasks' },
      { value: 'teamLeader', label: 'Team Leader', description: 'Operational squad lead; manages sprint tasks and timesheet reviews' },
      { value: 'member', label: 'Member', description: 'Standard delivery and execution' },
      { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
    ];
  }

  if (callerRole === 'managingDirector') {
    return [
      { value: 'hr', label: 'HR / People Ops', description: 'Workspace-wide employee management' },
      { value: 'manager', label: 'Manager', description: 'Lead squads and manage projects/tasks' },
      { value: 'teamLeader', label: 'Team Leader', description: 'Operational squad lead; manages sprint tasks and timesheet reviews' },
      { value: 'member', label: 'Member', description: 'Standard delivery and execution' },
      { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
    ];
  }

  if (callerRole === 'hr') {
    return [
      { value: 'manager', label: 'Manager', description: 'Lead squads and manage projects/tasks' },
      { value: 'teamLeader', label: 'Team Leader', description: 'Operational squad lead; manages sprint tasks and timesheet reviews' },
      { value: 'member', label: 'Member', description: 'Standard delivery and execution' },
      { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
    ];
  }

  if (callerRole === 'manager') {
    return [
      { value: 'teamLeader', label: 'Team Leader', description: 'Operational squad lead; manages sprint tasks and timesheet reviews' },
      { value: 'member', label: 'Member', description: 'Standard delivery and execution' },
      { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
    ];
  }

  return [];
}

