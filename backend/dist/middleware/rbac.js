"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_HIERARCHY = void 0;
exports.hasPermission = hasPermission;
exports.assertPermission = assertPermission;
exports.requirePermission = requirePermission;
exports.canManageRole = canManageRole;
exports.assertCanManageRole = assertCanManageRole;
exports.canCallerManageMember = canCallerManageMember;
const Team_js_1 = require("../models/Team.js");
const errors_js_1 = require("../utils/errors.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const ROLE_PERMISSIONS = {
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
        'user:read',
        'document:create',
        'document:read',
        'document:update',
        'folder:create',
        'file:upload',
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
        'user:read',
        'document:create',
        'document:read',
        'document:update',
        'folder:create',
        'file:upload',
        'comment:create',
        'comment:read',
        'comment:update',
        'comment:delete',
    ],
    viewer: [
        'project:read',
        'task:read',
        'time:read',
        'user:read',
        'document:read',
        'comment:read',
    ],
};
function hasPermission(role, permission) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
}
function assertPermission(role, permission) {
    if (!hasPermission(role, permission)) {
        throw new errors_js_1.ForbiddenError(`Role '${role}' does not possess permission '${permission}'`);
    }
}
function requirePermission(permission) {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ForbiddenError('No role associated with authenticated user'), 403);
        }
        if (!hasPermission(userRole, permission)) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ForbiddenError(`Role '${userRole}' does not possess permission '${permission}'`), 403);
        }
        next();
    };
}
exports.ROLE_HIERARCHY = {
    superAdmin: 6,
    orgAdmin: 5,
    managingDirector: 4,
    hr: 3.5,
    manager: 3,
    teamLeader: 2.5,
    member: 2,
    viewer: 1,
};
function canManageRole(callerRole, targetRole) {
    if (callerRole === 'superAdmin')
        return true;
    if (callerRole === 'orgAdmin') {
        // Org Admin manages all workspace users (orgAdmin, managingDirector, hr, manager, teamLeader, member, viewer)
        return targetRole !== 'superAdmin';
    }
    if (callerRole === 'managingDirector') {
        // Managing Director manages hr, managers, team leaders, members, viewers
        return (targetRole === 'hr' ||
            targetRole === 'manager' ||
            targetRole === 'teamLeader' ||
            targetRole === 'member' ||
            targetRole === 'viewer');
    }
    if (callerRole === 'hr') {
        // HR manages managers, team leaders, members, viewers across the workspace
        return (targetRole === 'manager' ||
            targetRole === 'teamLeader' ||
            targetRole === 'member' ||
            targetRole === 'viewer');
    }
    if (callerRole === 'manager') {
        // Manager manages team leaders, members, and viewers
        return (targetRole === 'teamLeader' ||
            targetRole === 'member' ||
            targetRole === 'viewer');
    }
    return false;
}
function assertCanManageRole(callerRole, targetRole, actionDescription = 'assign or modify') {
    if (!canManageRole(callerRole, targetRole)) {
        throw new errors_js_1.ForbiddenError(`Role '${callerRole}' cannot ${actionDescription} role '${targetRole}'`);
    }
}
/**
 * Scoped boundary check: verifies if caller has authority over target member.
 * - superAdmin, orgAdmin, managingDirector, hr: global authority over manageable roles.
 * - manager: strictly scoped to members who belong to a team led by this manager.
 */
async function canCallerManageMember(caller, targetUser) {
    if (caller.userId === targetUser.userId)
        return false;
    if (!canManageRole(caller.role, targetUser.role))
        return false;
    if (caller.role === 'superAdmin' ||
        caller.role === 'orgAdmin' ||
        caller.role === 'managingDirector' ||
        caller.role === 'hr') {
        return true;
    }
    if (caller.role === 'manager') {
        if (!targetUser.teamId) {
            return true;
        }
        const team = await Team_js_1.TeamModel.findOne({
            tenantId: caller.tenantId,
            teamId: targetUser.teamId,
            managerId: caller.userId,
            isActive: true,
        });
        return Boolean(team);
    }
    return false;
}
