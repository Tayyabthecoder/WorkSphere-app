import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User.js';
import { TaskModel } from '../models/Task.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';

const router = Router();
router.use(verifyAuth);

// GET /api/v1/team
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const users = await UserModel.find({ tenantId: user.tenantId }).select('-passwordHash').lean();

    // Single aggregation query across all team members to eliminate 2N count queries
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
      return {
        ...member,
        activeTasks: stats?.activeTasks || 0,
        completedTasks: stats?.completedTasks || 0,
      };
    });

    return sendApiResponse(res, enriched);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/team/invite
router.post('/invite', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'user:invite');

    const { email, name, role = 'member', department = 'Engineering', temporaryPassword = 'Password123!' } = req.body;

    if (!email || !name) {
      return sendApiError(res, new ValidationError('Name and email are required'), 400);
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendApiError(res, new ConflictError('A user with this email already exists'), 409);
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const userId = generateId('user');

    const newUser = await UserModel.create({
      userId,
      tenantId: user.tenantId,
      email: email.toLowerCase(),
      name,
      role,
      department,
      passwordHash,
      provider: 'email',
      emailVerified: true,
      isActive: true,
    });

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'invited_team_member',
      entityType: 'member',
      entityId: userId,
      metadata: { name: newUser.name, email: newUser.email, role: newUser.role },
    });

    return sendApiResponse(
      res,
      {
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        isActive: newUser.isActive,
      },
      201
    );
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/team/:userId
router.patch('/:userId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'user:deactivate');

    const targetUserId = req.params.userId;
    const { role, department, isActive } = req.body;

    if (user.userId === targetUserId && isActive === false) {
      return sendApiError(res, new ValidationError('You cannot deactivate your own account'), 400);
    }

    const updateData: Record<string, any> = {};
    if (role) updateData.role = role;
    if (department) updateData.department = department;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await UserModel.findOneAndUpdate(
      { tenantId: user.tenantId, userId: targetUserId },
      { $set: updateData },
      { new: true }
    )
      .select('-passwordHash')
      .lean();

    if (!updated) {
      return sendApiError(res, new NotFoundError('Member not found'), 404);
    }

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'updated_member',
      entityType: 'member',
      entityId: targetUserId,
      metadata: updateData,
    });

    return sendApiResponse(res, updated);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/team/:userId
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'user:deactivate');

    const targetUserId = req.params.userId;
    if (user.userId === targetUserId) {
      return sendApiError(res, new ValidationError('You cannot remove yourself from the workspace'), 400);
    }

    const removed = (await UserModel.findOneAndDelete({
      tenantId: user.tenantId,
      userId: targetUserId,
    }).lean()) as any;

    if (!removed) {
      return sendApiError(res, new NotFoundError('Member not found'), 404);
    }

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'removed_member',
      entityType: 'member',
      entityId: targetUserId,
      metadata: { email: removed.email },
    });

    return sendApiResponse(res, { message: `Member ${removed.email} has been removed from workspace` });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
