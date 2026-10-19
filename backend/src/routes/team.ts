import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { UserModel, UserRole } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { TaskModel } from '../models/Task.js';
import { ProjectModel } from '../models/Project.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { InvitationModel } from '../models/Invitation.js';
import { TenantModel } from '../models/Tenant.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { assertPermission, assertCanManageRole, canManageRole, canCallerManageMember } from '../middleware/rbac.js';
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from '../utils/errors.js';
import { sendEmail } from '../utils/email.js';
import { emitToTenant } from '../socket/index.js';
import { ENV } from '../config/env.js';
import { escapeRegex } from '../utils/regex.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

/**
 * GET /api/v1/team
 * Retrieve team members for current workspace with task statistics and filters.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { department, status, search, teamId } = req.query;

    const query: Record<string, any> = { tenantId: user.tenantId };

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'deactivated') {
      query.isActive = false;
    }

    if (department && department !== 'ALL' && department !== 'all') {
      query.department = department;
    }

    if (teamId && typeof teamId === 'string' && teamId !== 'ALL' && teamId !== 'all') {
      query.teamId = teamId;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { role: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } },
        { jobTitle: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await UserModel.find(query).select('-passwordHash -refreshTokenHash').lean();

    // Fetch all active teams in this tenant to enrich squad names
    const teams = await TeamModel.find({ tenantId: user.tenantId, isActive: true }).lean();
    const teamMap = new Map(teams.map((t) => [t.teamId, t]));

    // Fetch reporting managers
    const reportsToIds = [...new Set(users.map((u) => u.reportsToUserId).filter(Boolean) as string[])];
    const managers = reportsToIds.length > 0
      ? await UserModel.find({ tenantId: user.tenantId, userId: { $in: reportsToIds } })
          .select('userId name role jobTitle')
          .lean()
      : [];
    const managerMap = new Map(managers.map((m) => [m.userId, m]));

    // Aggregation query across all team members for active and completed task counts
    const taskStats = await TaskModel.aggregate([
      {
        $match: {
          tenantId: user.tenantId,
          assignees: { $exists: true, $ne: [] },
        },
      },
      { $unwind: '$assignees' },
      {
        $group: {
          _id: '$assignees',
          activeTasks: {
            $sum: { $cond: [{ $ne: ['$status', 'Done'] }, 1, 0] },
          },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
          },
        },
      },
    ]);

    const statMap = new Map<string, { activeTasks: number; completedTasks: number }>(
      taskStats.map((s) => [s._id, { activeTasks: s.activeTasks, completedTasks: s.completedTasks }])
    );

    const enriched = users.map((member) => {
      const stats = statMap.get(member.userId);
      const teamObj = member.teamId ? teamMap.get(member.teamId) : null;
      const reportsToObj = member.reportsToUserId ? managerMap.get(member.reportsToUserId) : null;

      return {
        ...member,
        team: teamObj
          ? {
              teamId: teamObj.teamId,
              name: teamObj.name,
              department: teamObj.department,
              colorLabel: teamObj.colorLabel,
            }
          : null,
        reportsToUser: reportsToObj
          ? {
              userId: reportsToObj.userId,
              name: reportsToObj.name,
              role: reportsToObj.role,
              jobTitle: reportsToObj.jobTitle,
            }
          : null,
        activeTasks: stats?.activeTasks || 0,
        completedTasks: stats?.completedTasks || 0,
      };
    });

    return sendApiResponse(res, enriched);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * GET /api/v1/team/invitations
 * Retrieve pending invitations for the workspace.
 */
router.get('/invitations', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'user:invite');

    const invitations = await InvitationModel.find({
      tenantId: user.tenantId,
      status: 'pending',
    })
      .select('-tokenHash')
      .sort({ createdAt: -1 })
      .lean();

    return sendApiResponse(res, invitations);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * POST /api/v1/team and POST /api/v1/team/add
 * Directly add an active member to the workspace without email invitation.
 */
const handleAddMember = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'user:invite');

    const { email, name, role = 'member', department = 'Engineering', password, teamId, reportsToUserId, jobTitle } = req.body;

    if (!email || !name) {
      return sendApiError(res, new ValidationError('Name and email are required'), 400);
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Enforce role hierarchy: cannot add a user with role equal to or higher than caller
    assertCanManageRole(user.role, role as UserRole, 'add a user with');

    // Strict RBAC: Managers may only onboard members with 'teamLeader', 'member' or 'viewer' roles
    if (user.role === 'manager' && role !== 'teamLeader' && role !== 'member' && role !== 'viewer') {
      return sendApiError(
        res,
        new ForbiddenError(`Managers are strictly restricted to adding 'teamLeader', 'member' or 'viewer' roles`),
        403
      );
    }

    // Strict RBAC: Org Admins cannot add Super Admins
    if (user.role === 'orgAdmin' && role === 'superAdmin') {
      return sendApiError(
        res,
        new ForbiddenError('Organization Administrators cannot create Super Administrators'),
        403
      );
    }

    // Retrieve tenant to verify workspace policies and seat limits
    const tenant = await TenantModel.findOne({ tenantId: user.tenantId });
    if (!tenant) {
      return sendApiError(res, new NotFoundError('Workspace tenant not found'), 404);
    }

    const settings = (tenant.settings || {}) as Record<string, any>;

    // 1. Domain restrictions check
    if (settings.restrictDomain && settings.allowedDomain) {
      const allowed = String(settings.allowedDomain).toLowerCase().replace(/^@/, '');
      const userDomain = normalizedEmail.split('@')[1];
      if (userDomain !== allowed) {
        return sendApiError(
          res,
          new ValidationError(`Only emails with domain '@${allowed}' are allowed to join this workspace`),
          400
        );
      }
    }

    // 2. Workspace seat limits check
    if (typeof settings.userLimit === 'number' && settings.userLimit > 0) {
      const activeUserCount = await UserModel.countDocuments({ tenantId: user.tenantId, isActive: true });
      if (activeUserCount >= settings.userLimit) {
        return sendApiError(
          res,
          new ConflictError(`Workspace member limit (${settings.userLimit}) reached for current plan`),
          403
        );
      }
    }

    // 3. Check if user already exists in this workspace
    const existingMember = await UserModel.findOne({
      tenantId: user.tenantId,
      email: normalizedEmail,
    });
    if (existingMember) {
      return sendApiError(res, new ConflictError('A team member with this email already belongs to this workspace'), 409);
    }

    // Validate squad assignment and reporting structure
    let assignedTeamId = teamId || null;
    let assignedReportsTo = reportsToUserId || null;

    if (assignedTeamId) {
      const targetTeam = await TeamModel.findOne({
        tenantId: user.tenantId,
        teamId: assignedTeamId,
        isActive: true,
      });
      if (!targetTeam) {
        return sendApiError(res, new NotFoundError('Assigned squad not found'), 404);
      }

      if (user.role === 'manager' && targetTeam.managerId !== user.userId) {
        return sendApiError(res, new ForbiddenError('Managers can only assign members to their own squads'), 403);
      }

      if (!assignedReportsTo) {
        assignedReportsTo = targetTeam.managerId;
      }
    } else if (user.role === 'manager') {
      assignedReportsTo = user.userId;
    }

    // Resolve initial password (provided or generated secure password)
    const initialPassword =
      password && String(password).trim().length >= 8
        ? String(password).trim()
        : `Temp${crypto.randomBytes(4).toString('hex')}!`;

    const passwordHash = await bcrypt.hash(initialPassword, 12);
    const userId = generateId('user');

    const newMember = await UserModel.create({
      userId,
      tenantId: user.tenantId,
      email: normalizedEmail,
      name: name.trim(),
      role: role as UserRole,
      department,
      teamId: assignedTeamId,
      reportsToUserId: assignedReportsTo,
      jobTitle: jobTitle ? String(jobTitle).trim() : '',
      passwordHash,
      provider: 'email',
      emailVerified: true,
      isActive: true,
    });

    if (assignedTeamId) {
      await TeamModel.updateOne(
        { tenantId: user.tenantId, teamId: assignedTeamId },
        { $addToSet: { memberIds: userId } }
      );
    }

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'added_team_member',
      entityType: 'member',
      entityId: userId,
      metadata: { name: newMember.name, email: normalizedEmail, role, department },
    });

    const sanitized = newMember.toObject();
    delete sanitized.passwordHash;
    delete sanitized.refreshTokenHash;

    // Real-time broadcast to all teammates in workspace
    emitToTenant(user.tenantId, 'team:member_added', sanitized);
    emitToTenant(user.tenantId, 'team:member_updated', sanitized);

    return sendApiResponse(
      res,
      {
        ...sanitized,
        initialPassword,
        activeTasks: 0,
        completedTasks: 0,
      },
      201
    );
  } catch (error: any) {
    return sendApiError(res, error);
  }
};

router.post('/', handleAddMember);
router.post('/add', handleAddMember);

/**
 * POST /api/v1/team/invite
 * Invite a new member with secure token and email notification.
 */
router.post('/invite', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'user:invite');

    const { email, name, role = 'member', department = 'Engineering' } = req.body;

    if (!email || !name) {
      return sendApiError(res, new ValidationError('Name and email are required'), 400);
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Enforce role hierarchy: cannot invite a user with role equal to or higher than caller
    assertCanManageRole(user.role, role as UserRole, 'invite a user with');

    // Strict RBAC: Managers may only onboard members with 'teamLeader', 'member' or 'viewer' roles
    if (user.role === 'manager' && role !== 'teamLeader' && role !== 'member' && role !== 'viewer') {
      return sendApiError(
        res,
        new ForbiddenError(`Managers are strictly restricted to inviting 'teamLeader', 'member' or 'viewer' roles`),
        403
      );
    }

    // Strict RBAC: Org Admins cannot invite Super Admins
    if (user.role === 'orgAdmin' && role === 'superAdmin') {
      return sendApiError(
        res,
        new ForbiddenError('Organization Administrators cannot invite Super Administrators'),
        403
      );
    }

    // Retrieve tenant to verify workspace policies and seat limits
    const tenant = await TenantModel.findOne({ tenantId: user.tenantId });
    if (!tenant) {
      return sendApiError(res, new NotFoundError('Workspace tenant not found'), 404);
    }

    const settings = (tenant.settings || {}) as Record<string, any>;

    // 1. Domain restrictions check
    if (settings.restrictDomain && settings.allowedDomain) {
      const allowed = String(settings.allowedDomain).toLowerCase().replace(/^@/, '');
      const userDomain = normalizedEmail.split('@')[1];
      if (userDomain !== allowed) {
        return sendApiError(
          res,
          new ValidationError(`Only emails with domain '@${allowed}' are allowed to join this workspace`),
          400
        );
      }
    }

    // 2. Workspace seat limits check
    if (typeof settings.userLimit === 'number' && settings.userLimit > 0) {
      const [activeUserCount, pendingInviteCount] = await Promise.all([
        UserModel.countDocuments({ tenantId: user.tenantId, isActive: true }),
        InvitationModel.countDocuments({ tenantId: user.tenantId, status: 'pending' }),
      ]);
      if (activeUserCount + pendingInviteCount >= settings.userLimit) {
        return sendApiError(
          res,
          new ConflictError(`Workspace member limit (${settings.userLimit}) reached for current plan`),
          403
        );
      }
    }

    // 3. Check if user is already a member of this workspace
    const existingMember = await UserModel.findOne({
      tenantId: user.tenantId,
      email: normalizedEmail,
    });
    if (existingMember) {
      return sendApiError(res, new ConflictError('A team member with this email already belongs to this workspace'), 409);
    }

    // 4. Check for active pending invitation for this email in this workspace
    const existingInvite = await InvitationModel.findOne({
      tenantId: user.tenantId,
      email: normalizedEmail,
      status: 'pending',
    });

    // Generate secure crypto invitation token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    let invitationRecord;
    if (existingInvite) {
      existingInvite.name = name.trim();
      existingInvite.role = role as UserRole;
      existingInvite.department = department;
      existingInvite.tokenHash = tokenHash;
      existingInvite.expiresAt = expiresAt;
      existingInvite.invitedByUserId = user.userId;
      invitationRecord = await existingInvite.save();
    } else {
      const invitationId = generateId('inv');
      invitationRecord = await InvitationModel.create({
        invitationId,
        tenantId: user.tenantId,
        email: normalizedEmail,
        name: name.trim(),
        role: role as UserRole,
        department,
        tokenHash,
        invitedByUserId: user.userId,
        status: 'pending',
        expiresAt,
      });
    }

    // Dispatch invitation email
    const appOrigin = ENV.CORS_ORIGIN || 'http://localhost:5173';
    const acceptLink = `${appOrigin}/accept-invite?token=${rawToken}&tenantId=${user.tenantId}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendEmail({
      to: normalizedEmail,
      subject: `You've been invited to join ${tenant.name} on WorkSphere`,
      text: `Hello ${name},\n\nYou have been invited to join ${tenant.name} on WorkSphere as a ${role}.\n\nPlease accept your invitation and set up your account by clicking the link below:\n${acceptLink}\n\nThis invitation link will expire in 7 days.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Join ${tenant.name} on WorkSphere</h2>
          <p style="color: #334155; line-height: 1.6;">
            Hello <strong>${name}</strong>,<br/><br/>
            You've been invited to join the <strong>${tenant.name}</strong> workspace as a <strong>${role}</strong> in <strong>${department}</strong>.
          </p>
          <div style="margin: 28px 0;">
            <a href="${acceptLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Accept Invitation & Join Workspace
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px;">
            Link not working? Paste this URL into your browser:<br/>
            <span style="word-break: break-all; color: #0284c7;">${acceptLink}</span>
          </p>
          <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            This invitation expires in 7 days. If you were not expecting this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'invited_team_member',
      entityType: 'member',
      entityId: invitationRecord.invitationId,
      metadata: { name, email: normalizedEmail, role, department },
    });

    // Real-time broadcast
    emitToTenant(user.tenantId, 'team:invite_created', {
      invitationId: invitationRecord.invitationId,
      email: normalizedEmail,
      name,
      role,
      department,
      expiresAt,
    });

    return sendApiResponse(
      res,
      {
        invitationId: invitationRecord.invitationId,
        email: normalizedEmail,
        name,
        role,
        department,
        expiresAt,
        acceptLink, // included for local development & staging convenience
      },
      201
    );
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * POST /api/v1/team/invitations/:invitationId/resend
 * Resend invitation email with refreshed token and expiration.
 */
router.post('/invitations/:invitationId/resend', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'user:invite');

    const invitation = await InvitationModel.findOne({
      tenantId: user.tenantId,
      invitationId: req.params.invitationId,
      status: 'pending',
    });

    if (!invitation) {
      return sendApiError(res, new NotFoundError('Pending invitation not found'), 404);
    }

    if (!canManageRole(user.role, invitation.role)) {
      return sendApiError(
        res,
        new ForbiddenError(`Your role '${user.role}' cannot resend invitations for role '${invitation.role}'`),
        403
      );
    }

    const tenant = await TenantModel.findOne({ tenantId: user.tenantId });
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    invitation.tokenHash = tokenHash;
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitation.save();

    const appOrigin = ENV.CORS_ORIGIN || 'http://localhost:5173';
    const acceptLink = `${appOrigin}/accept-invite?token=${rawToken}&tenantId=${user.tenantId}&email=${encodeURIComponent(invitation.email)}`;

    await sendEmail({
      to: invitation.email,
      subject: `Invitation Reminder: Join ${tenant?.name || 'WorkSphere'}`,
      text: `Hello ${invitation.name},\n\nHere is your refreshed invitation to join ${tenant?.name || 'WorkSphere'}:\n${acceptLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Invitation Reminder</h2>
          <p style="color: #334155;">You've been invited to join <strong>${tenant?.name || 'WorkSphere'}</strong>.</p>
          <div style="margin: 24px 0;">
            <a href="${acceptLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
        </div>
      `,
    });

    return sendApiResponse(res, {
      message: `Invitation resent to ${invitation.email}`,
      expiresAt: invitation.expiresAt,
      acceptLink,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * DELETE /api/v1/team/invitations/:invitationId
 * Revoke a pending invitation.
 */
router.delete('/invitations/:invitationId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'user:invite');

    const invitation = await InvitationModel.findOne({
      tenantId: user.tenantId,
      invitationId: req.params.invitationId,
    });

    if (!invitation) {
      return sendApiError(res, new NotFoundError('Invitation not found'), 404);
    }

    if (!canManageRole(user.role, invitation.role)) {
      return sendApiError(
        res,
        new ForbiddenError(`Your role '${user.role}' cannot revoke invitations for role '${invitation.role}'`),
        403
      );
    }

    invitation.status = 'revoked';
    await invitation.save();

    emitToTenant(user.tenantId, 'team:invite_revoked', {
      invitationId: invitation.invitationId,
      email: invitation.email,
    });

    return sendApiResponse(res, { message: `Invitation for ${invitation.email} has been revoked` });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * PATCH /api/v1/team/:userId
 * Update team member's role, department, or active status with RBAC hierarchy checks.
 */
router.patch('/:userId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'user:deactivate');

    const targetUserId = req.params.userId;
    const { role, department, isActive, teamId, reportsToUserId, jobTitle } = req.body;

    const targetMember = await UserModel.findOne({
      tenantId: user.tenantId,
      userId: targetUserId,
    });

    if (!targetMember) {
      return sendApiError(res, new NotFoundError('Member not found'), 404);
    }

    // Role hierarchy & squad boundary check: Caller cannot modify members they cannot manage
    if (user.userId !== targetUserId) {
      if (!canManageRole(user.role, targetMember.role)) {
        return sendApiError(
          res,
          new ForbiddenError(`Your role '${user.role}' cannot modify members with role '${targetMember.role}'`),
          403
        );
      }

      const hasAuthority = await canCallerManageMember(user, targetMember);
      if (!hasAuthority) {
        return sendApiError(
          res,
          new ForbiddenError('You do not have administrative authority over members outside your squad'),
          403
        );
      }
    }

    // If changing role:
    if (role && role !== targetMember.role) {
      if (user.userId === targetUserId) {
        return sendApiError(res, new ValidationError('You cannot change your own role'), 400);
      }

      // Caller cannot assign a role they cannot manage
      if (!canManageRole(user.role, role as UserRole)) {
        return sendApiError(
          res,
          new ForbiddenError(`Your role '${user.role}' cannot assign the role '${role}'`),
          403
        );
      }

      targetMember.role = role as UserRole;
    }

    // If changing department:
    if (department !== undefined) {
      targetMember.department = department;
    }

    // If updating team assignment:
    if (teamId !== undefined && teamId !== targetMember.teamId) {
      if (user.role === 'manager' && teamId) {
        const managedTeam = await TeamModel.findOne({
          tenantId: user.tenantId,
          teamId,
          managerId: user.userId,
          isActive: true,
        });
        if (!managedTeam) {
          return sendApiError(res, new ForbiddenError('Managers can only assign members to their own squads'), 403);
        }
      }

      // Remove from previous team roster
      if (targetMember.teamId) {
        await TeamModel.updateOne(
          { tenantId: user.tenantId, teamId: targetMember.teamId },
          { $pull: { memberIds: targetUserId } }
        );
      }

      // Add to new team roster
      if (teamId) {
        const newTeam = await TeamModel.findOne({ tenantId: user.tenantId, teamId, isActive: true });
        if (newTeam) {
          await TeamModel.updateOne(
            { tenantId: user.tenantId, teamId },
            { $addToSet: { memberIds: targetUserId } }
          );
          targetMember.reportsToUserId = newTeam.managerId;
        }
      } else {
        targetMember.reportsToUserId = null;
      }

      targetMember.teamId = teamId || null;
    }

    if (reportsToUserId !== undefined) {
      targetMember.reportsToUserId = reportsToUserId || null;
    }

    if (jobTitle !== undefined) {
      targetMember.jobTitle = String(jobTitle).trim();
    }

    // If toggling active status:
    if (isActive !== undefined && isActive !== targetMember.isActive) {
      if (user.userId === targetUserId && isActive === false) {
        return sendApiError(res, new ValidationError('You cannot deactivate your own account'), 400);
      }
      targetMember.isActive = Boolean(isActive);
      if (!targetMember.isActive) {
        targetMember.refreshTokenHash = null;
        if (targetMember.teamId) {
          await TeamModel.updateOne(
            { tenantId: user.tenantId, teamId: targetMember.teamId },
            { $pull: { memberIds: targetUserId } }
          );
        }
      }
    }

    await targetMember.save();

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'updated_member',
      entityType: 'member',
      entityId: targetUserId,
      metadata: { role, department, isActive, teamId: targetMember.teamId },
    });

    const sanitized = targetMember.toObject();
    delete sanitized.passwordHash;
    delete sanitized.refreshTokenHash;

    emitToTenant(user.tenantId, 'team:member_updated', sanitized);

    return sendApiResponse(res, sanitized);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * POST /api/v1/team/:userId/deactivate
 * Safely deactivates a team member with optional task reassignment.
 */
router.post('/:userId/deactivate', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'user:deactivate');

    const targetUserId = req.params.userId;
    const { reassignToUserId } = req.body;

    if (user.userId === targetUserId) {
      return sendApiError(res, new ValidationError('You cannot deactivate your own account'), 400);
    }

    const targetMember = await UserModel.findOne({
      tenantId: user.tenantId,
      userId: targetUserId,
    });

    if (!targetMember) {
      return sendApiError(res, new NotFoundError('Member not found'), 404);
    }

    if (!canManageRole(user.role, targetMember.role)) {
      return sendApiError(
        res,
        new ForbiddenError(`Your role '${user.role}' cannot deactivate members with role '${targetMember.role}'`),
        403
      );
    }

    const hasAuthority = await canCallerManageMember(user, targetMember);
    if (!hasAuthority) {
      return sendApiError(
        res,
        new ForbiddenError('You do not have authority to deactivate members outside your squad'),
        403
      );
    }

    // If a replacement assignee is provided, verify they belong to this workspace and are active
    if (reassignToUserId) {
      const replacementMember = await UserModel.findOne({
        tenantId: user.tenantId,
        userId: reassignToUserId,
        isActive: true,
      });
      if (!replacementMember) {
        return sendApiError(res, new NotFoundError('Designated replacement member is not found or is inactive'), 404);
      }

      // Reassign open (non-Done) tasks
      const activeTasks = await TaskModel.find({
        tenantId: user.tenantId,
        assignees: targetUserId,
        status: { $ne: 'Done' },
      });

      for (const task of activeTasks) {
        const nextAssignees = task.assignees
          .filter((id: string) => id !== targetUserId)
          .concat(task.assignees.includes(reassignToUserId) ? [] : [reassignToUserId]);
        task.assignees = nextAssignees;
        await task.save();
      }
    } else {
      // Unassign: remove targetUserId from assignees on all non-Done tasks
      await TaskModel.updateMany(
        {
          tenantId: user.tenantId,
          assignees: targetUserId,
          status: { $ne: 'Done' },
        },
        { $pull: { assignees: targetUserId } }
      );
    }

    // Deactivate member and revoke auth tokens
    targetMember.isActive = false;
    targetMember.refreshTokenHash = null;
    await targetMember.save();

    if (targetMember.teamId) {
      await TeamModel.updateOne(
        { tenantId: user.tenantId, teamId: targetMember.teamId },
        { $pull: { memberIds: targetUserId } }
      );
    }

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'deactivated_member',
      entityType: 'member',
      entityId: targetUserId,
      metadata: { reassignToUserId: reassignToUserId || null },
    });

    emitToTenant(user.tenantId, 'team:member_updated', {
      userId: targetUserId,
      isActive: false,
    });

    return sendApiResponse(res, {
      message: `Member ${targetMember.email} has been deactivated successfully`,
      reassignedTo: reassignToUserId || null,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * DELETE /api/v1/team/:userId
 * Permanent removal of member, requiring all open tasks to be cleared first.
 */
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'tenant:manage');

    const targetUserId = req.params.userId;
    if (user.userId === targetUserId) {
      return sendApiError(res, new ValidationError('You cannot remove yourself from the workspace'), 400);
    }

    const targetMember = await UserModel.findOne({
      tenantId: user.tenantId,
      userId: targetUserId,
    });

    if (!targetMember) {
      return sendApiError(res, new NotFoundError('Member not found'), 404);
    }

    // Verify member has no active tasks before permanent deletion
    const activeTasksCount = await TaskModel.countDocuments({
      tenantId: user.tenantId,
      assignees: targetUserId,
      status: { $ne: 'Done' },
    });

    if (activeTasksCount > 0) {
      return sendApiError(
        res,
        new ConflictError(
          `Cannot delete member with ${activeTasksCount} active task(s). Please reassign or unassign their tasks first.`
        ),
        409
      );
    }

    // Remove from project memberships
    await ProjectModel.updateMany(
      { tenantId: user.tenantId, 'members.userId': targetUserId },
      { $pull: { members: { userId: targetUserId } } }
    );

    await UserModel.deleteOne({ tenantId: user.tenantId, userId: targetUserId });

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'removed_member',
      entityType: 'member',
      entityId: targetUserId,
      metadata: { email: targetMember.email },
    });

    emitToTenant(user.tenantId, 'team:member_removed', { userId: targetUserId });

    return sendApiResponse(res, { message: `Member ${targetMember.email} permanently removed from workspace` });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
