import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SprintModel } from '../models/Sprint.js';
import { TaskModel } from '../models/Task.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { dispatchAutomationEvent } from '../services/automationDispatcher.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

const CreateSprintSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Sprint name is required').max(100),
  goal: z.string().optional().default(''),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  capacityPoints: z.number().min(0).optional().default(30),
});

const UpdateSprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required').max(100).optional(),
  goal: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  capacityPoints: z.number().min(0).optional(),
  status: z.enum(['planning', 'active', 'completed']).optional(),
});

// GET /api/v1/sprints
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { projectId, status } = req.query;

    const query: Record<string, any> = {
      tenantId: user.tenantId,
    };
    if (projectId && projectId !== 'all') {
      query.projectId = projectId as string;
    }
    if (status && status !== 'all') {
      query.status = status as string;
    }

    const sprints = await SprintModel.find(query).sort({ startDate: -1 }).lean();
    const sprintIds = sprints.map((s) => s.sprintId);

    // Single aggregation query across all retrieved sprints to eliminate N+1 latency
    const taskStats = await TaskModel.aggregate([
      {
        $match: {
          tenantId: user.tenantId,
          sprintId: { $in: sprintIds },
        },
      },
      {
        $group: {
          _id: '$sprintId',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
          },
          totalStoryPoints: { $sum: { $ifNull: ['$storyPoints', 0] } },
          completedStoryPoints: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'Done'] },
                { $ifNull: ['$storyPoints', 0] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const statsMap = new Map(taskStats.map((stat) => [stat._id, stat]));

    const enriched = sprints.map((sprint) => {
      const stat = statsMap.get(sprint.sprintId);
      return {
        ...sprint,
        totalTasks: stat?.totalTasks || 0,
        completedTasks: stat?.completedTasks || 0,
        totalStoryPoints: stat?.totalStoryPoints || 0,
        completedStoryPoints: stat?.completedStoryPoints || 0,
      };
    });

    return sendApiResponse(res, enriched);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/sprints
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:update');

    const parseResult = CreateSprintSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Invalid sprint data', parseResult.error.flatten().fieldErrors), 422);
    }

    const data = parseResult.data;
    const sprintId = generateId('sprint');

    const sprint = await SprintModel.create({
      sprintId,
      tenantId: user.tenantId,
      projectId: data.projectId,
      name: data.name,
      goal: data.goal,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      capacityPoints: data.capacityPoints,
      committedPoints: 0,
      status: 'planning',
    });

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      projectId: data.projectId,
      userId: user.userId,
      action: 'created_sprint',
      entityType: 'sprint',
      entityId: sprintId,
      metadata: { name: sprint.name },
    });

    return sendApiResponse(res, sprint, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/sprints/:sprintId
router.get('/:sprintId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const sprint = await SprintModel.findOne({
      tenantId: user.tenantId,
      sprintId: req.params.sprintId,
    }).lean();

    if (!sprint) {
      return sendApiError(res, new NotFoundError('Sprint not found'), 404);
    }

    const tasks = await TaskModel.find({
      tenantId: user.tenantId,
      sprintId: req.params.sprintId,
    }).lean();

    return sendApiResponse(res, { ...sprint, tasks });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PUT /api/v1/sprints/:sprintId
router.put('/:sprintId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:update');

    const sprint = await SprintModel.findOne({
      tenantId: user.tenantId,
      sprintId: req.params.sprintId,
    });

    if (!sprint) {
      return sendApiError(res, new NotFoundError('Sprint not found'), 404);
    }

    const parseResult = UpdateSprintSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(
        res,
        new ValidationError('Invalid sprint update data', parseResult.error.flatten().fieldErrors),
        422
      );
    }

    const validData = parseResult.data;

    if (validData.status === 'active' && sprint.status !== 'active') {
      // Auto-complete any other currently active sprint on this project
      await SprintModel.updateMany(
        {
          tenantId: user.tenantId,
          projectId: sprint.projectId,
          status: 'active',
          sprintId: { $ne: sprint.sprintId },
        },
        { $set: { status: 'completed' } }
      );
    }

    const oldStatus = sprint.status;
    if (validData.name !== undefined) sprint.name = validData.name.trim();
    if (validData.goal !== undefined) sprint.goal = validData.goal;
    if (validData.startDate !== undefined) sprint.startDate = new Date(validData.startDate);
    if (validData.endDate !== undefined) sprint.endDate = new Date(validData.endDate);
    if (validData.capacityPoints !== undefined) sprint.capacityPoints = validData.capacityPoints;
    if (validData.status !== undefined) sprint.status = validData.status;

    await sprint.save();

    // Workflow Automation Engine triggers
    if (sprint.status !== oldStatus) {
      if (sprint.status === 'active') {
        dispatchAutomationEvent({
          event: 'sprint.started',
          tenantId: user.tenantId,
          projectId: sprint.projectId,
          entity: sprint.toObject ? sprint.toObject() : sprint,
          userId: user.userId,
        }).catch((err) => console.error('Automation dispatch error:', err));
      } else if (sprint.status === 'completed') {
        dispatchAutomationEvent({
          event: 'sprint.completed',
          tenantId: user.tenantId,
          projectId: sprint.projectId,
          entity: sprint.toObject ? sprint.toObject() : sprint,
          userId: user.userId,
        }).catch((err) => console.error('Automation dispatch error:', err));
      }
    }

    return sendApiResponse(res, sprint);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/sprints/:sprintId
router.delete('/:sprintId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:delete');

    const sprint = await SprintModel.findOneAndDelete({
      tenantId: user.tenantId,
      sprintId: req.params.sprintId,
    }).lean();

    if (!sprint) {
      return sendApiError(res, new NotFoundError('Sprint not found'), 404);
    }

    // Move tasks to backlog
    await TaskModel.updateMany(
      { tenantId: user.tenantId, sprintId: req.params.sprintId },
      { $set: { sprintId: null } }
    );

    return sendApiResponse(res, { message: 'Sprint deleted successfully and tasks moved to backlog' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
