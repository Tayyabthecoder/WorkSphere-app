import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { generateId } from '../utils/id.js';
import { SprintModel } from '../models/Sprint.js';
import { TaskModel } from '../models/Task.js';
import { UserModel } from '../models/User.js';
import { AvailabilityModel } from '../models/Availability.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

const AvailabilitySchema = z.object({
  userId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['pto', 'holiday', 'partial']).default('pto'),
  hoursAvailable: z.number().min(0).max(8).default(0),
  note: z.string().optional(),
});

// GET /api/v1/capacity
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:read');

    const { sprintId, projectId, startDate: fromParam, endDate: toParam } = req.query;

    let startDate: Date;
    let endDate: Date;
    let sprintName = '';

    if (sprintId) {
      const sprint = await SprintModel.findOne({
        sprintId: sprintId as string,
        tenantId: user.tenantId,
      }).lean() as any;

      if (!sprint) {
        return sendApiError(res, { code: 'NOT_FOUND', message: `Sprint '${sprintId}' not found` }, 404);
      }

      startDate = new Date(sprint.startDate);
      endDate = new Date(sprint.endDate);
      sprintName = sprint.name;
    } else {
      startDate = fromParam ? new Date(fromParam as string) : new Date();
      endDate = toParam ? new Date(toParam as string) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }

    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    // Business days calculation (Mon-Fri)
    let businessDays = 0;
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const day = cur.getUTCDay();
      if (day !== 0 && day !== 6) businessDays++;
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const defaultMemberHours = businessDays * 8;

    // Fetch team members for tenant
    const members = await UserModel.find({
      tenantId: user.tenantId,
      isActive: true,
    }).lean() as any[];

    // Fetch all availability records in date range
    const availRecords = await AvailabilityModel.find({
      tenantId: user.tenantId,
      date: { $gte: startDate, $lte: endDate },
    }).lean() as any[];

    // Fetch tasks for sprint or project
    const taskQuery: Record<string, any> = {
      tenantId: user.tenantId,
      status: { $ne: 'Done' },
    };
    if (sprintId) {
      taskQuery.sprintId = sprintId;
    } else if (projectId && projectId !== 'all') {
      taskQuery.projectId = projectId;
    }

    const tasks = await TaskModel.find(taskQuery).lean() as any[];

    let totalAvailable = 0;
    let totalCommitted = 0;

    const memberCapacities = members.map((member) => {
      const memberAvail = availRecords.filter((r) => r.userId === member.userId);

      let ptoHours = 0;
      let ptoDays = 0;

      memberAvail.forEach((a) => {
        if (a.type === 'pto' || a.type === 'holiday') {
          ptoHours += 8;
          ptoDays += 1;
        } else if (a.type === 'partial') {
          const reduced = 8 - (a.hoursAvailable ?? 8);
          if (reduced > 0) ptoHours += reduced;
        }
      });

      const memberAvailableHours = Math.max(0, defaultMemberHours - ptoHours);
      const memberWorkingDays = Math.max(0, businessDays - ptoDays);

      // Tasks assigned to member
      const memberTasks = tasks.filter(
        (t) => Array.isArray(t.assignees) && t.assignees.includes(member.userId)
      );

      const committedHours = memberTasks.reduce(
        (sum, t) => sum + (t.estimatedHours || 0),
        0
      );
      const committedPoints = memberTasks.reduce(
        (sum, t) => sum + (t.storyPoints || 0),
        0
      );

      const loadPct =
        memberAvailableHours > 0
          ? Math.round((committedHours / memberAvailableHours) * 100)
          : committedHours > 0
          ? 100
          : 0;

      let status: 'optimal' | 'heavy' | 'overloaded' = 'optimal';
      if (loadPct > 100) status = 'overloaded';
      else if (loadPct > 80) status = 'heavy';

      totalAvailable += memberAvailableHours;
      totalCommitted += committedHours;

      return {
        userId: member.userId,
        name: member.name,
        email: member.email,
        role: member.role,
        avatarUrl: member.avatarUrl,
        department: member.department,
        workingDays: memberWorkingDays,
        ptoDays,
        availableHours: memberAvailableHours,
        committedHours,
        committedPoints,
        assignedTaskCount: memberTasks.length,
        loadPct,
        status,
      };
    });

    const overallLoadPct =
      totalAvailable > 0 ? Math.round((totalCommitted / totalAvailable) * 100) : 0;

    return sendApiResponse(res, {
      sprintId: sprintId || null,
      sprintName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      businessDays,
      totalAvailableHours: totalAvailable,
      totalCommittedHours: totalCommitted,
      overallLoadPct,
      members: memberCapacities,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/capacity/availability (or /api/v1/availability)
router.get('/availability', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'user:read');

    const { userId, from, to } = req.query;

    const query: Record<string, any> = { tenantId: user.tenantId };
    if (userId && userId !== 'all') query.userId = userId;

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from as string);
      if (to) query.date.$lte = new Date(to as string);
    }

    const records = await AvailabilityModel.find(query).sort({ date: 1 }).lean();
    return sendApiResponse(res, records);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/capacity/availability
router.post('/availability', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const validated = AvailabilitySchema.parse(req.body);

    const targetUserId = validated.userId || user.id;
    if (targetUserId !== user.id && user.role === 'member') {
      assertPermission(user.role, 'user:invite');
    }

    const targetDate = new Date(validated.date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const record = await AvailabilityModel.findOneAndUpdate(
      {
        tenantId: user.tenantId,
        userId: targetUserId,
        date: targetDate,
      },
      {
        $set: {
          availabilityId: generateId('avail'),
          tenantId: user.tenantId,
          userId: targetUserId,
          date: targetDate,
          type: validated.type,
          hoursAvailable: validated.hoursAvailable,
          note: validated.note || '',
        },
      },
      { upsert: true, new: true }
    );

    return sendApiResponse(res, record, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/capacity/availability/:availabilityId
router.delete('/availability/:availabilityId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { availabilityId } = req.params;

    const record = await AvailabilityModel.findOne({
      availabilityId,
      tenantId: user.tenantId,
    });

    if (!record) {
      return sendApiError(res, { code: 'NOT_FOUND', message: `Availability record '${availabilityId}' not found` }, 404);
    }

    if (record.userId !== user.id && user.role === 'member') {
      return sendApiError(res, { code: 'FORBIDDEN', message: 'Unauthorized to remove this record' }, 403);
    }

    await AvailabilityModel.deleteOne({ availabilityId });
    return sendApiResponse(res, { message: 'Availability record deleted successfully' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
