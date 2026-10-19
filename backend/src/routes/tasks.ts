import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TaskModel } from '../models/Task.js';
import { UserModel } from '../models/User.js';
import { CommentModel } from '../models/Comment.js';
import { TimeEntryModel } from '../models/TimeEntry.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { NotificationModel } from '../models/Notification.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { emitToProject, emitToUser } from '../socket/index.js';
import { dispatchAutomationEvent } from '../services/automationDispatcher.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

const CreateTaskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(1, 'Task title is required').max(300),
  description: z.string().optional().default(''),
  status: z.enum(['Backlog', 'To Do', 'In Progress', 'In Review', 'Done']).optional().default('To Do'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional().default('medium'),
  assignees: z.array(z.string()).optional().default([]),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  storyPoints: z.number().min(0).optional().default(0),
  estimatedHours: z.number().min(0).optional().default(0),
  sprintId: z.string().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(300).optional(),
  description: z.string().optional(),
  status: z.enum(['Backlog', 'To Do', 'In Progress', 'In Review', 'Done']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  assignees: z.array(z.string()).optional(),
  dueDate: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  storyPoints: z.number().min(0).optional(),
  estimatedHours: z.number().min(0).optional(),
  sprintId: z.string().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  order: z.number().optional(),
  customFields: z.record(z.unknown()).optional(),
  dependencies: z
    .array(
      z.object({
        taskId: z.string().min(1),
        type: z.enum(['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish']).optional(),
      })
    )
    .optional(),
});

/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: List and search tasks with offset or cursor-based pagination
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Backlog, To Do, In Progress, In Review, Done]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: after
 *         description: Cursor task ID for efficient infinite scrolling
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 200
 *     responses:
 *       200:
 *         description: List of tasks with pagination metadata
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { projectId, status, priority, sprintId, assignee, dueDateFrom, dueDateTo, page = '1', limit = '200', after } = req.query;

    const query: Record<string, any> = { tenantId: user.tenantId };
    if (projectId && projectId !== 'all') query.projectId = projectId;
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (sprintId) query.sprintId = sprintId === 'null' ? null : sprintId;
    if (assignee) query.assignees = assignee;

    if (dueDateFrom || dueDateTo) {
      query.dueDate = {};
      if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom as string);
      if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo as string);
    }

    const limitNum = Math.min(500, Math.max(1, parseInt(limit as string, 10)));
    let tasks: any[];
    let total: number;
    let nextCursor: string | null = null;
    let pageNum = 1;

    if (after && typeof after === 'string') {
      const anchor = (await TaskModel.findOne({ tenantId: user.tenantId, taskId: after }).select('order createdAt').lean()) as any;
      if (anchor) {
        query.$or = [
          { order: { $gt: anchor.order } },
          { order: anchor.order, createdAt: { $lt: anchor.createdAt } },
        ];
      }
      [tasks, total] = await Promise.all([
        TaskModel.find(query).sort({ order: 1, createdAt: -1 }).limit(limitNum + 1).lean(),
        TaskModel.countDocuments({ tenantId: user.tenantId, ...(projectId && projectId !== 'all' ? { projectId } : {}) }),
      ]);

      if (tasks.length > limitNum) {
        tasks = tasks.slice(0, limitNum);
        nextCursor = tasks[tasks.length - 1].taskId;
      }
    } else {
      pageNum = Math.max(1, parseInt(page as string, 10));
      const skip = (pageNum - 1) * limitNum;
      [tasks, total] = await Promise.all([
        TaskModel.find(query).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        TaskModel.countDocuments(query),
      ]);
    }

    // Batch hydrate assignee user profiles (name, avatar, email)
    const allAssigneeIds = [
      ...new Set(
        tasks
          .flatMap((t: any) => t.assignees || [])
          .filter((id: any) => typeof id === 'string' && id.trim().length > 0)
      ),
    ];

    let userMap = new Map<string, any>();
    if (allAssigneeIds.length > 0) {
      const users = await UserModel.find({
        tenantId: user.tenantId,
        userId: { $in: allAssigneeIds },
      })
        .select('userId name email avatarUrl')
        .lean();
      userMap = new Map(users.map((u: any) => [u.userId, u]));
    }

    const enrichedTasks = tasks.map((t: any) => ({
      ...t,
      assigneeProfiles: (t.assignees || []).map((id: string) => userMap.get(id) || {
        userId: id,
        name: id,
      }),
    }));

    return sendApiResponse(res, enrichedTasks, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      nextCursor,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/tasks
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'task:create');

    const parseResult = CreateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Invalid task data', parseResult.error.flatten().fieldErrors), 422);
    }

    const data = parseResult.data;
    const taskId = generateId('task');

    const maxOrderTask = (await TaskModel.findOne({
      tenantId: user.tenantId,
      projectId: data.projectId,
      status: data.status,
    }).sort({ order: -1 }).select('order').lean()) as any;
    const nextOrder = (maxOrderTask?.order ?? -1) + 1;

    const task = await TaskModel.create({
      taskId,
      tenantId: user.tenantId,
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignees: data.assignees,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      storyPoints: data.storyPoints,
      estimatedHours: data.estimatedHours,
      sprintId: data.sprintId || null,
      parentTaskId: data.parentTaskId || null,
      order: nextOrder,
      completedAt: data.status === 'Done' ? new Date() : undefined,
    });

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      projectId: data.projectId,
      userId: user.userId,
      action: 'created_task',
      entityType: 'task',
      entityId: taskId,
      metadata: { title: task.title, status: task.status, priority: task.priority },
    });

    // Real-Time: Broadcast task creation to project room
    emitToProject(user.tenantId, data.projectId, 'task:created', {
      task,
      author: { userId: user.userId, name: user.name || 'Teammate' },
    });

    // Real-Time: Notify assigned team members
    if (data.assignees && data.assignees.length > 0) {
      for (const assigneeId of data.assignees) {
        if (assigneeId !== user.userId) {
          try {
            const notif = await NotificationModel.create({
              notificationId: generateId('notification'),
              tenantId: user.tenantId,
              userId: assigneeId,
              title: 'New Task Assignment',
              message: `${user.name || 'A teammate'} assigned you to "${task.title}"`,
              type: 'assignment',
              relatedEntityType: 'task',
              relatedEntityId: task.taskId,
              entityType: 'task',
              entityId: task.taskId,
              isRead: false,
            });
            emitToUser(user.tenantId, assigneeId, 'notification:new', { notification: notif });
          } catch (notifErr) {
            console.error('Failed to create assignment notification:', notifErr);
          }
        }
      }
    }

    // Workflow Automation Engine trigger
    dispatchAutomationEvent({
      event: 'task.created',
      tenantId: user.tenantId,
      projectId: data.projectId,
      entity: task.toObject ? task.toObject() : task,
      userId: user.userId,
    }).catch((err) => console.error('Automation dispatch error:', err));

    return sendApiResponse(res, task, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/tasks/:taskId
router.get('/:taskId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const task = await TaskModel.findOne({
      tenantId: user.tenantId,
      taskId: req.params.taskId,
    }).lean();

    if (!task) {
      return sendApiError(res, new NotFoundError('Task not found'), 404);
    }

    const subtasks = await TaskModel.find({
      tenantId: user.tenantId,
      parentTaskId: req.params.taskId,
    }).sort({ createdAt: 1 }).lean();

    return sendApiResponse(res, { ...task, subtasks });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PUT /api/v1/tasks/:taskId
router.put('/:taskId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'task:update');

    const parseResult = UpdateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Invalid task update data', parseResult.error.flatten().fieldErrors), 422);
    }

    const validData = parseResult.data;
    const updateData: Record<string, any> = {};

    if (validData.title !== undefined) updateData.title = validData.title;
    if (validData.description !== undefined) updateData.description = validData.description;
    if (validData.priority !== undefined) updateData.priority = validData.priority;
    if (validData.assignees !== undefined) updateData.assignees = validData.assignees;
    if (validData.storyPoints !== undefined) updateData.storyPoints = validData.storyPoints;
    if (validData.estimatedHours !== undefined) updateData.estimatedHours = validData.estimatedHours;
    if (validData.sprintId !== undefined) updateData.sprintId = validData.sprintId;
    if (validData.parentTaskId !== undefined) updateData.parentTaskId = validData.parentTaskId;
    if (validData.labels !== undefined) updateData.labels = validData.labels;
    if (validData.order !== undefined) updateData.order = validData.order;
    if (validData.customFields !== undefined) updateData.customFields = validData.customFields;
    if (validData.dependencies !== undefined) updateData.dependencies = validData.dependencies;

    if (validData.dueDate !== undefined) {
      updateData.dueDate = validData.dueDate ? new Date(validData.dueDate) : null;
    }
    if (validData.startDate !== undefined) {
      updateData.startDate = validData.startDate ? new Date(validData.startDate) : null;
    }

    if (validData.status !== undefined) {
      updateData.status = validData.status;
      if (validData.status === 'Done') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const task: any = await TaskModel.findOneAndUpdate(
      { tenantId: user.tenantId, taskId: req.params.taskId },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!task) {
      return sendApiError(res, new NotFoundError('Task not found'), 404);
    }

    // Real-Time: Broadcast task update to project room
    emitToProject(user.tenantId, task.projectId, 'task:updated', {
      task,
      modifiedBy: { userId: user.userId, name: user.name || 'Teammate' },
    });

    // Workflow Automation Engine triggers
    if (validData.status !== undefined) {
      dispatchAutomationEvent({
        event: 'task.status_changed',
        tenantId: user.tenantId,
        projectId: task.projectId,
        entity: task,
        userId: user.userId,
      }).catch((err) => console.error('Automation dispatch error:', err));
    }
    if (validData.priority !== undefined) {
      dispatchAutomationEvent({
        event: 'task.priority_changed',
        tenantId: user.tenantId,
        projectId: task.projectId,
        entity: task,
        userId: user.userId,
      }).catch((err) => console.error('Automation dispatch error:', err));
    }

    return sendApiResponse(res, task);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

const PatchStatusSchema = z.object({
  status: z.enum(['Backlog', 'To Do', 'In Progress', 'In Review', 'Done']),
  order: z.number().optional(),
});

// PATCH /api/v1/tasks/:taskId/status
router.patch('/:taskId/status', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'task:update');

    const parseResult = PatchStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Invalid status or order payload', parseResult.error.flatten().fieldErrors), 422);
    }

    const { status, order } = parseResult.data;
    const updateData: Record<string, any> = { status };
    if (order !== undefined) updateData.order = order;
    if (status === 'Done') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    const task: any = await TaskModel.findOneAndUpdate(
      { tenantId: user.tenantId, taskId: req.params.taskId },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!task) {
      return sendApiError(res, new NotFoundError('Task not found'), 404);
    }

    // Real-Time: Broadcast card movement to project room
    emitToProject(user.tenantId, task.projectId, 'task:moved', {
      taskId: task.taskId,
      status: task.status,
      order: task.order,
      modifiedBy: { userId: user.userId, name: user.name || 'Teammate' },
    });

    // Workflow Automation Engine trigger
    dispatchAutomationEvent({
      event: 'task.status_changed',
      tenantId: user.tenantId,
      projectId: task.projectId,
      entity: task,
      userId: user.userId,
    }).catch((err) => console.error('Automation dispatch error:', err));

    return sendApiResponse(res, task);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/tasks/:taskId
router.delete('/:taskId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'task:delete');

    const task: any = await TaskModel.findOneAndDelete({
      tenantId: user.tenantId,
      taskId: req.params.taskId,
    }).lean();

    if (!task) {
      return sendApiError(res, new NotFoundError('Task not found'), 404);
    }

    // Cascading cleanups:
    // 1. Delete all subtasks
    // 2. Delete all comments associated with this task
    // 3. Unlink time entries that were associated with this task
    // 4. Remove this task from dependency lists in other tasks
    await Promise.all([
      TaskModel.deleteMany({
        tenantId: user.tenantId,
        parentTaskId: req.params.taskId,
      }),
      CommentModel.deleteMany({
        tenantId: user.tenantId,
        taskId: req.params.taskId,
      }),
      TimeEntryModel.updateMany(
        { tenantId: user.tenantId, taskId: req.params.taskId },
        { $set: { taskId: null } }
      ),
      TaskModel.updateMany(
        { tenantId: user.tenantId, 'dependencies.taskId': req.params.taskId },
        { $pull: { dependencies: { taskId: req.params.taskId } } }
      ),
    ]);

    // Real-Time: Broadcast task deletion to project room
    emitToProject(user.tenantId, task.projectId, 'task:deleted', {
      taskId: task.taskId,
      modifiedBy: { userId: user.userId, name: user.name || 'Teammate' },
    });

    return sendApiResponse(res, { message: 'Task deleted successfully' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
