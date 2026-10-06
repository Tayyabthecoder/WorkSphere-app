import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TimeEntryModel } from '../models/TimeEntry.js';
import { TaskModel } from '../models/Task.js';
import { ProjectModel } from '../models/Project.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { UserModel } from '../models/User.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { emitToUser, emitToTenant } from '../socket/index.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

const CreateTimeSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  description: z.string().optional().default(''),
  isBillable: z.boolean().optional().default(true),
});

// GET /api/v1/time
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { projectId, taskId, userId, startDate, endDate, page = '1', limit = '100' } = req.query;

    const query: Record<string, any> = { tenantId: user.tenantId };
    if (projectId) query.projectId = projectId;
    if (taskId) query.taskId = taskId;
    if (userId) query.userId = userId;

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate as string);
      if (endDate) query.startTime.$lte = new Date(endDate as string);
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Batch-fetch entries, count, and rollup aggregation concurrently
    const [entries, total, [rollupAgg]] = await Promise.all([
      TimeEntryModel.find(query).sort({ startTime: -1 }).skip(skip).limit(limitNum).lean(),
      TimeEntryModel.countDocuments(query),
      TimeEntryModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: '$duration' },
            billableMinutes: {
              $sum: {
                $cond: [{ $eq: ['$isBillable', true] }, '$duration', 0],
              },
            },
          },
        },
      ]),
    ]);

    const totalMinutes = rollupAgg?.totalMinutes || 0;
    const billableMinutes = rollupAgg?.billableMinutes || 0;
    const nonBillableMinutes = totalMinutes - billableMinutes;
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const billableHours = Math.round((billableMinutes / 60) * 10) / 10;
    const nonBillableHours = Math.round((nonBillableMinutes / 60) * 10) / 10;
    const billablePercentage = totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0;

    // Batch enrich entries to eliminate N+1 database queries
    const taskIds = [...new Set(entries.map((e) => e.taskId).filter(Boolean))];
    const projectIds = [...new Set(entries.map((e) => e.projectId).filter(Boolean))];

    const [tasks, projects] = await Promise.all([
      TaskModel.find({ tenantId: user.tenantId, taskId: { $in: taskIds } }).select('taskId title').lean() as any,
      ProjectModel.find({ tenantId: user.tenantId, projectId: { $in: projectIds } }).select('projectId name').lean() as any,
    ]);

    const taskMap = new Map((tasks || []).map((t: any) => [t.taskId, t.title]));
    const projectMap = new Map((projects || []).map((p: any) => [p.projectId, p.name]));

    const enriched = entries.map((entry: any) => ({
      ...entry,
      taskTitle: taskMap.get(entry.taskId) || 'Unknown Task',
      projectName: projectMap.get(entry.projectId) || 'Unknown Project',
    }));

    return sendApiResponse(
      res,
      {
        entries: enriched,
        summary: {
          totalMinutes,
          totalHours,
          billableMinutes,
          billableHours,
          nonBillableMinutes,
          nonBillableHours,
          billablePercentage,
        },
      },
      200,
      { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    );
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/time
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const parseResult = CreateTimeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Invalid time entry data', parseResult.error.flatten().fieldErrors), 422);
    }

    const data = parseResult.data;

    // Verify task and project exist in the user's tenant
    const [project, task] = await Promise.all([
      ProjectModel.findOne({ tenantId: user.tenantId, projectId: data.projectId }).lean() as any,
      TaskModel.findOne({ tenantId: user.tenantId, taskId: data.taskId }).lean() as any,
    ]);

    if (!project) {
      return sendApiError(res, new NotFoundError(`Project '${data.projectId}' not found in workspace`), 404);
    }
    if (!task) {
      return sendApiError(res, new NotFoundError(`Task '${data.taskId}' not found in workspace`), 404);
    }
    if (task.projectId !== data.projectId) {
      return sendApiError(res, new ValidationError(`Task '${data.taskId}' does not belong to project '${data.projectId}'`), 422);
    }

    const entryId = generateId('time');
    const start = data.startTime ? new Date(data.startTime) : new Date(Date.now() - data.duration * 60000);
    const end = data.endTime ? new Date(data.endTime) : new Date(start.getTime() + data.duration * 60000);

    const entry = await TimeEntryModel.create({
      entryId,
      tenantId: user.tenantId,
      projectId: data.projectId,
      taskId: data.taskId,
      userId: user.userId,
      startTime: start,
      endTime: end,
      duration: data.duration,
      description: data.description || '',
      isBillable: data.isBillable,
    });

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      projectId: data.projectId,
      userId: user.userId,
      action: 'logged_time',
      entityType: 'timeEntry',
      entityId: entryId,
      metadata: { duration: data.duration, taskId: data.taskId },
    });

    return sendApiResponse(res, entry, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/time/:entryId
router.delete('/:entryId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const entry = await TimeEntryModel.findOneAndDelete({
      tenantId: user.tenantId,
      entryId: req.params.entryId,
    }).lean();

    if (!entry) {
      return sendApiError(res, new NotFoundError('Time entry not found'), 404);
    }

    return sendApiResponse(res, { message: 'Time entry deleted successfully' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/time/pending (Manager approval review queue)
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'time:approve');

    const entries = await TimeEntryModel.find({
      tenantId: user.tenantId,
      status: 'submitted',
    })
      .sort({ startTime: -1 })
      .lean();

    const userIds = [...new Set(entries.map((e) => e.userId))];
    const projectIds = [...new Set(entries.map((e) => e.projectId))];
    const taskIds = [...new Set(entries.map((e) => e.taskId))];

    const [users, projects, tasks] = await Promise.all([
      UserModel.find({ tenantId: user.tenantId, userId: { $in: userIds } }).select('userId name email avatarUrl').lean(),
      ProjectModel.find({ tenantId: user.tenantId, projectId: { $in: projectIds } }).select('projectId name').lean(),
      TaskModel.find({ tenantId: user.tenantId, taskId: { $in: taskIds } }).select('taskId title').lean(),
    ]);

    const userMap = new Map(users.map((u: any) => [u.userId, u]));
    const projectMap = new Map(projects.map((p: any) => [p.projectId, p.name]));
    const taskMap = new Map(tasks.map((t: any) => [t.taskId, t.title]));

    const enriched = entries.map((e: any) => ({
      ...e,
      userName: userMap.get(e.userId)?.name || 'Unknown User',
      userEmail: userMap.get(e.userId)?.email || '',
      userAvatarUrl: userMap.get(e.userId)?.avatarUrl || '',
      projectName: projectMap.get(e.projectId) || 'Unknown Project',
      taskTitle: taskMap.get(e.taskId) || 'Unknown Task',
    }));

    return sendApiResponse(res, enriched);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/time/:entryId/submit
router.patch('/:entryId/submit', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const entry = await TimeEntryModel.findOne({
      tenantId: user.tenantId,
      entryId: req.params.entryId,
    });

    if (!entry) {
      return sendApiError(res, new NotFoundError('Time entry not found'), 404);
    }

    if (entry.userId !== user.userId && user.role === 'member') {
      return sendApiError(res, new ForbiddenError('You can only submit your own time entries'), 403);
    }

    entry.status = 'submitted';
    entry.submittedAt = new Date();
    await entry.save();

    emitToTenant(user.tenantId, 'timesheet:submitted', {
      entryId: entry.entryId,
      userId: entry.userId,
    });

    return sendApiResponse(res, entry);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/time/submit-week
router.post('/submit-week', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return sendApiError(res, new ValidationError('startDate and endDate are required'), 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = await TimeEntryModel.updateMany(
      {
        tenantId: user.tenantId,
        userId: user.userId,
        status: { $in: ['draft', 'rejected'] },
        startTime: { $gte: start, $lte: end },
      },
      {
        $set: {
          status: 'submitted',
          submittedAt: new Date(),
          rejectionNote: '',
        },
      }
    );

    emitToTenant(user.tenantId, 'timesheet:submitted', {
      userId: user.userId,
      count: result.modifiedCount,
    });

    return sendApiResponse(res, {
      message: `Successfully submitted ${result.modifiedCount} time entries`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/time/:entryId/approve
router.patch('/:entryId/approve', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'time:approve');

    const entry = await TimeEntryModel.findOne({
      tenantId: user.tenantId,
      entryId: req.params.entryId,
    });

    if (!entry) {
      return sendApiError(res, new NotFoundError('Time entry not found'), 404);
    }

    entry.status = 'approved';
    entry.approvedAt = new Date();
    entry.reviewedBy = user.userId;
    entry.rejectionNote = '';
    await entry.save();

    emitToUser(user.tenantId, entry.userId, 'timesheet:reviewed', {
      entryId: entry.entryId,
      status: 'approved',
      reviewerName: user.name,
    });

    return sendApiResponse(res, entry);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/time/:entryId/reject
router.patch('/:entryId/reject', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'time:approve');

    const RejectSchema = z.object({
      rejectionNote: z.string().min(1, 'A rejection reason is required'),
    });
    const parseResult = RejectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Rejection reason required', parseResult.error.flatten().fieldErrors), 422);
    }

    const entry = await TimeEntryModel.findOne({
      tenantId: user.tenantId,
      entryId: req.params.entryId,
    });

    if (!entry) {
      return sendApiError(res, new NotFoundError('Time entry not found'), 404);
    }

    entry.status = 'rejected';
    entry.rejectionNote = parseResult.data.rejectionNote;
    entry.reviewedBy = user.userId;
    await entry.save();

    emitToUser(user.tenantId, entry.userId, 'timesheet:reviewed', {
      entryId: entry.entryId,
      status: 'rejected',
      rejectionNote: entry.rejectionNote,
      reviewerName: user.name,
    });

    return sendApiResponse(res, entry);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
