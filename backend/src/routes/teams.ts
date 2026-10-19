import { Router, Request, Response } from 'express';
import { TeamModel } from '../models/Team.js';
import { UserModel } from '../models/User.js';
import { TaskModel } from '../models/Task.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';
import { emitToTenant } from '../socket/index.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

/**
 * Helper to fetch task statistics map for given user IDs
 */
async function getTaskStats(tenantId: string, userIds: string[]) {
  if (userIds.length === 0) return new Map<string, { activeTasks: number; completedTasks: number }>();

  const stats = await TaskModel.aggregate([
    {
      $match: {
        tenantId,
        assignees: { $in: userIds },
      },
    },
    { $unwind: '$assignees' },
    {
      $match: {
        assignees: { $in: userIds },
      },
    },
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

  return new Map<string, { activeTasks: number; completedTasks: number }>(
    stats.map((s) => [s._id, { activeTasks: s.activeTasks, completedTasks: s.completedTasks }])
  );
}

/**
 * GET /api/v1/teams
 * List all teams for the current tenant with manager & populated member details
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { managerId, department } = req.query;

    const query: Record<string, any> = { tenantId: user.tenantId, isActive: true };
    if (managerId && typeof managerId === 'string') {
      query.managerId = managerId;
    }
    if (department && typeof department === 'string') {
      query.department = department;
    }

    const teams = (await TeamModel.find(query).sort({ createdAt: 1 }).lean()) as any[];

    // Collect all manager IDs, leader IDs, and member IDs to query in batch
    const managerIds = [...new Set(teams.map((t) => t.managerId))];
    const leaderIds = [...new Set(teams.map((t) => t.leaderId).filter(Boolean))];
    const memberIds = [...new Set(teams.flatMap((t) => t.memberIds || []))];
    const allUserIds = [...new Set([...managerIds, ...leaderIds, ...memberIds])];

    const users = await UserModel.find({
      tenantId: user.tenantId,
      userId: { $in: allUserIds },
    })
      .select('-passwordHash -refreshTokenHash')
      .lean();

    const userMap = new Map(users.map((u) => [u.userId, u]));
    const statMap = await getTaskStats(user.tenantId, memberIds);

    const enrichedTeams = teams.map((team) => {
      const managerUser = userMap.get(team.managerId);
      const leaderUser = team.leaderId ? userMap.get(team.leaderId) : undefined;
      const members = (team.memberIds || []).map((mid: string) => {
        const u = userMap.get(mid);
        const stats = statMap.get(mid);
        return {
          userId: mid,
          name: u?.name || 'Unknown User',
          email: u?.email || '',
          avatarUrl: u?.avatarUrl,
          role: u?.role || 'member',
          jobTitle: u?.jobTitle || '',
          department: u?.department || team.department,
          isActive: u?.isActive !== false,
          activeTasks: stats?.activeTasks || 0,
          completedTasks: stats?.completedTasks || 0,
        };
      });

      return {
        ...team,
        manager: managerUser
          ? {
              userId: managerUser.userId,
              name: managerUser.name,
              email: managerUser.email,
              avatarUrl: managerUser.avatarUrl,
              role: managerUser.role,
              jobTitle: managerUser.jobTitle || 'Team Manager',
            }
          : undefined,
        leader: leaderUser
          ? {
              userId: leaderUser.userId,
              name: leaderUser.name,
              email: leaderUser.email,
              avatarUrl: leaderUser.avatarUrl,
              role: leaderUser.role,
              jobTitle: leaderUser.jobTitle || 'Team Leader',
            }
          : undefined,
        members,
      };
    });

    return sendApiResponse(res, enrichedTeams);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * GET /api/v1/teams/:teamId
 * Retrieve single team details
 */
router.get('/:teamId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { teamId } = req.params;

    const team = (await TeamModel.findOne({ tenantId: user.tenantId, teamId, isActive: true }).lean()) as any;
    if (!team) {
      return sendApiError(res, new NotFoundError('Team not found'), 404);
    }

    const allUserIds = [team.managerId, ...(team.leaderId ? [team.leaderId] : []), ...(team.memberIds || [])];
    const users = await UserModel.find({
      tenantId: user.tenantId,
      userId: { $in: allUserIds },
    })
      .select('-passwordHash -refreshTokenHash')
      .lean();

    const userMap = new Map(users.map((u) => [u.userId, u]));
    const statMap = await getTaskStats(user.tenantId, team.memberIds || []);

    const managerUser = userMap.get(team.managerId);
    const leaderUser = team.leaderId ? userMap.get(team.leaderId) : undefined;
    const members = (team.memberIds || []).map((mid: string) => {
      const u = userMap.get(mid);
      const stats = statMap.get(mid);
      return {
        userId: mid,
        name: u?.name || 'Unknown User',
        email: u?.email || '',
        avatarUrl: u?.avatarUrl,
        role: u?.role || 'member',
        jobTitle: u?.jobTitle || '',
        department: u?.department || team.department,
        isActive: u?.isActive !== false,
        activeTasks: stats?.activeTasks || 0,
        completedTasks: stats?.completedTasks || 0,
      };
    });

    return sendApiResponse(res, {
      ...team,
      manager: managerUser
        ? {
            userId: managerUser.userId,
            name: managerUser.name,
            email: managerUser.email,
            avatarUrl: managerUser.avatarUrl,
            role: managerUser.role,
            jobTitle: managerUser.jobTitle || 'Team Manager',
          }
        : undefined,
      leader: leaderUser
        ? {
            userId: leaderUser.userId,
            name: leaderUser.name,
            email: leaderUser.email,
            avatarUrl: leaderUser.avatarUrl,
            role: leaderUser.role,
            jobTitle: leaderUser.jobTitle || 'Team Leader',
          }
        : undefined,
      members,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * POST /api/v1/teams
 * Create a new team squad
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    // Authority: superAdmin, orgAdmin, managingDirector, hr
    const allowedRoles = ['superAdmin', 'orgAdmin', 'managingDirector', 'hr'];
    if (!allowedRoles.includes(user.role)) {
      return sendApiError(
        res,
        new ForbiddenError('Only Organization Administrators, Managing Directors, or HR can create teams'),
        403
      );
    }

    const { name, description, department = 'Engineering', managerId, leaderId, memberIds = [], colorLabel = '#0D9488' } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return sendApiError(res, new ValidationError('Team name is required'), 400);
    }

    if (!managerId || typeof managerId !== 'string') {
      return sendApiError(res, new ValidationError('A manager must be assigned to the team'), 400);
    }

    // Verify manager exists in this tenant
    const managerUser = await UserModel.findOne({
      tenantId: user.tenantId,
      userId: managerId,
      isActive: true,
    });

    if (!managerUser) {
      return sendApiError(res, new NotFoundError('Assigned manager not found or inactive'), 404);
    }

    // Verify duplicate team name
    const existing = await TeamModel.findOne({
      tenantId: user.tenantId,
      name: name.trim(),
      isActive: true,
    });
    if (existing) {
      return sendApiError(res, new ConflictError(`A team named '${name.trim()}' already exists`), 409);
    }

    const cleanMemberIds = Array.isArray(memberIds) ? [...new Set(memberIds.map(String))] : [];

    if (leaderId && typeof leaderId === 'string') {
      const leaderUser = await UserModel.findOne({
        tenantId: user.tenantId,
        userId: leaderId,
        isActive: true,
      });
      if (!leaderUser) {
        return sendApiError(res, new NotFoundError('Assigned team leader not found or inactive'), 404);
      }
      if (!cleanMemberIds.includes(leaderId)) {
        cleanMemberIds.push(leaderId);
      }
    }

    const teamId = generateId('team');

    const createdTeam = await TeamModel.create({
      teamId,
      tenantId: user.tenantId,
      name: name.trim(),
      description: description ? String(description).trim() : '',
      department: department.trim(),
      managerId,
      leaderId: leaderId || null,
      memberIds: cleanMemberIds,
      colorLabel,
      isActive: true,
    });

    // Update members' teamId and reportsToUserId
    if (cleanMemberIds.length > 0) {
      await UserModel.updateMany(
        {
          tenantId: user.tenantId,
          userId: { $in: cleanMemberIds },
        },
        {
          $set: {
            teamId,
            reportsToUserId: managerId,
          },
        }
      );
    }

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'created_team',
      entityType: 'team',
      entityId: teamId,
      metadata: { name: createdTeam.name, managerId, memberCount: cleanMemberIds.length },
    });

    emitToTenant(user.tenantId, 'teams:created', createdTeam.toObject());

    return sendApiResponse(res, createdTeam.toObject(), 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * PATCH /api/v1/teams/:teamId
 * Update team metadata, manager, or member roster
 */
router.patch('/:teamId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { teamId } = req.params;
    const { name, description, department, managerId, leaderId, memberIds, colorLabel } = req.body;

    const team = await TeamModel.findOne({ tenantId: user.tenantId, teamId, isActive: true });
    if (!team) {
      return sendApiError(res, new NotFoundError('Team not found'), 404);
    }

    // Authority check:
    // Global admins (superAdmin, orgAdmin, managingDirector, hr) can update all fields.
    // Squad Manager can update team name, description, colorLabel, and designate leader for their OWN team, but NOT change manager.
    const isGlobalAdmin = ['superAdmin', 'orgAdmin', 'managingDirector', 'hr'].includes(user.role);
    const isTeamManager = user.role === 'manager' && team.managerId === user.userId;

    if (!isGlobalAdmin && !isTeamManager) {
      return sendApiError(
        res,
        new ForbiddenError('You do not have permission to modify this team'),
        403
      );
    }

    if (leaderId !== undefined) {
      if (leaderId) {
        const leaderUser = await UserModel.findOne({
          tenantId: user.tenantId,
          userId: leaderId,
          isActive: true,
        });
        if (!leaderUser) {
          return sendApiError(res, new NotFoundError('Assigned team leader not found or inactive'), 404);
        }
        team.leaderId = leaderId;
        const currentMemberIds = (team.memberIds || []) as string[];
        if (!currentMemberIds.includes(leaderId)) {
          team.memberIds.push(leaderId);
        }
        await UserModel.updateOne(
          { tenantId: user.tenantId, userId: leaderId },
          { $set: { teamId: team.teamId, reportsToUserId: team.managerId } }
        );
      } else {
        team.leaderId = null;
      }
    }

    if (managerId && managerId !== team.managerId) {
      if (!isGlobalAdmin) {
        return sendApiError(res, new ForbiddenError('Only executives and admins can reassign a team manager'), 403);
      }
      const newManager = await UserModel.findOne({
        tenantId: user.tenantId,
        userId: managerId,
        isActive: true,
      });
      if (!newManager) {
        return sendApiError(res, new NotFoundError('New manager not found or inactive'), 404);
      }
      team.managerId = managerId;

      // Update reporting line for existing members
      await UserModel.updateMany(
        {
          tenantId: user.tenantId,
          teamId: team.teamId,
        },
        {
          $set: { reportsToUserId: managerId },
        }
      );
    }

    if (name && name.trim()) {
      team.name = name.trim();
    }
    if (description !== undefined) {
      team.description = String(description).trim();
    }
    if (department && department.trim() && isGlobalAdmin) {
      team.department = department.trim();
    }
    if (colorLabel) {
      team.colorLabel = colorLabel;
    }

    // Update roster if memberIds provided
    if (memberIds && Array.isArray(memberIds)) {
      const targetMemberIds = [...new Set(memberIds.map(String))];
      const previousMemberIds = (team.memberIds || []) as string[];

      const removedIds = previousMemberIds.filter((id: string) => !targetMemberIds.includes(id));
      const addedIds = targetMemberIds.filter((id: string) => !previousMemberIds.includes(id));

      if (removedIds.length > 0) {
        await UserModel.updateMany(
          {
            tenantId: user.tenantId,
            userId: { $in: removedIds },
          },
          {
            $set: { teamId: null, reportsToUserId: null },
          }
        );
      }

      if (addedIds.length > 0) {
        await UserModel.updateMany(
          {
            tenantId: user.tenantId,
            userId: { $in: addedIds },
          },
          {
            $set: { teamId: team.teamId, reportsToUserId: team.managerId },
          }
        );
      }

      team.memberIds = targetMemberIds;
    }

    await team.save();

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'updated_team',
      entityType: 'team',
      entityId: teamId,
      metadata: { name: team.name, managerId: team.managerId },
    });

    emitToTenant(user.tenantId, 'teams:updated', team.toObject());

    return sendApiResponse(res, team.toObject());
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * POST /api/v1/teams/:teamId/members
 * Add member(s) to a team
 */
router.post('/:teamId/members', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { teamId } = req.params;
    const { userIds, userId } = req.body;

    const team = await TeamModel.findOne({ tenantId: user.tenantId, teamId, isActive: true });
    if (!team) {
      return sendApiError(res, new NotFoundError('Team not found'), 404);
    }

    const isGlobalAdmin = ['superAdmin', 'orgAdmin', 'managingDirector', 'hr'].includes(user.role);
    const isTeamManager = user.role === 'manager' && team.managerId === user.userId;

    if (!isGlobalAdmin && !isTeamManager) {
      return sendApiError(res, new ForbiddenError('You can only add members to teams you manage'), 403);
    }

    const rawIds = userIds ? (Array.isArray(userIds) ? userIds : [userIds]) : [userId];
    const incomingIds = [...new Set(rawIds.filter(Boolean).map(String))];

    if (incomingIds.length === 0) {
      return sendApiError(res, new ValidationError('At least one userId is required'), 400);
    }

    // Verify members exist
    const verifiedUsers = await UserModel.find({
      tenantId: user.tenantId,
      userId: { $in: incomingIds },
      isActive: true,
    }).lean();

    const verifiedIds = verifiedUsers.map((u) => u.userId);

    // Add to team
    const updatedMemberIds = [...new Set([...(team.memberIds || []), ...verifiedIds])];
    team.memberIds = updatedMemberIds;
    await team.save();

    // Update user records
    await UserModel.updateMany(
      {
        tenantId: user.tenantId,
        userId: { $in: verifiedIds },
      },
      {
        $set: {
          teamId: team.teamId,
          reportsToUserId: team.managerId,
        },
      }
    );

    emitToTenant(user.tenantId, 'teams:updated', team.toObject());

    return sendApiResponse(res, team.toObject());
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * DELETE /api/v1/teams/:teamId/members/:targetUserId
 * Remove a member from a team
 */
router.delete('/:teamId/members/:targetUserId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { teamId, targetUserId } = req.params;

    const team = await TeamModel.findOne({ tenantId: user.tenantId, teamId, isActive: true });
    if (!team) {
      return sendApiError(res, new NotFoundError('Team not found'), 404);
    }

    const isGlobalAdmin = ['superAdmin', 'orgAdmin', 'managingDirector', 'hr'].includes(user.role);
    const isTeamManager = user.role === 'manager' && team.managerId === user.userId;

    if (!isGlobalAdmin && !isTeamManager) {
      return sendApiError(res, new ForbiddenError('You can only remove members from teams you manage'), 403);
    }

    team.memberIds = ((team.memberIds || []) as string[]).filter((id: string) => id !== targetUserId);
    await team.save();

    // Unlink member
    await UserModel.updateOne(
      {
        tenantId: user.tenantId,
        userId: targetUserId,
      },
      {
        $set: { teamId: null, reportsToUserId: null },
      }
    );

    emitToTenant(user.tenantId, 'teams:updated', team.toObject());

    return sendApiResponse(res, { message: 'Member removed from team successfully', teamId, targetUserId });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

/**
 * DELETE /api/v1/teams/:teamId
 * Soft-delete team squad
 */
router.delete('/:teamId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { teamId } = req.params;

    const allowedRoles = ['superAdmin', 'orgAdmin', 'managingDirector'];
    if (!allowedRoles.includes(user.role)) {
      return sendApiError(res, new ForbiddenError('Only Organization Administrators or Managing Directors can delete teams'), 403);
    }

    const team = await TeamModel.findOne({ tenantId: user.tenantId, teamId, isActive: true });
    if (!team) {
      return sendApiError(res, new NotFoundError('Team not found'), 404);
    }

    team.isActive = false;
    await team.save();

    // Unlink all members
    await UserModel.updateMany(
      {
        tenantId: user.tenantId,
        teamId,
      },
      {
        $set: { teamId: null, reportsToUserId: null },
      }
    );

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'deleted_team',
      entityType: 'team',
      entityId: teamId,
      metadata: { name: team.name },
    });

    emitToTenant(user.tenantId, 'teams:deleted', { teamId });

    return sendApiResponse(res, { message: 'Team successfully deactivated and members unassigned' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
