import { Router, Request, Response } from 'express';
import { ProjectModel } from '../models/Project.js';
import { TaskModel } from '../models/Task.js';
import { SprintModel } from '../models/Sprint.js';
import { TimeEntryModel } from '../models/TimeEntry.js';
import { UserModel } from '../models/User.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth } from '../middleware/auth.js';

const router = Router();
router.use(verifyAuth);

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    // 1. Project counts
    const activeProjects = await ProjectModel.countDocuments({
      tenantId: user.tenantId,
      status: 'Active',
    });

    // 2. Task metrics
    const deliveredTasks = await TaskModel.countDocuments({
      tenantId: user.tenantId,
      status: 'Done',
    });

    const recentTasks = await TaskModel.find({ tenantId: user.tenantId })
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean();

    // 3. Current active sprint
    const activeSprint = (await SprintModel.findOne({
      tenantId: user.tenantId,
      status: 'active',
    }).lean()) as any;

    let sprintMetrics = null;
    if (activeSprint) {
      const sprintTasks = await TaskModel.find({
        tenantId: user.tenantId,
        sprintId: activeSprint.sprintId,
      }).select('status storyPoints').lean();

      const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const donePoints = sprintTasks
        .filter((t) => t.status === 'Done')
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const progressPct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

      sprintMetrics = {
        ...activeSprint,
        totalPoints,
        donePoints,
        progressPct,
        taskCount: sprintTasks.length,
      };
    }

    // 4. Time tracked this week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekTimeEntries = await TimeEntryModel.find({
      tenantId: user.tenantId,
      startTime: { $gte: startOfWeek },
    }).select('duration').lean();

    const weekMinutes = weekTimeEntries.reduce((sum, te) => sum + (te.duration || 0), 0);
    const timeTrackedThisWeek = +(weekMinutes / 60).toFixed(1);

    // 5. Team count and Presence
    const teamMembers = (await UserModel.find({
      tenantId: user.tenantId,
      isActive: true,
    })
      .select('userId name email avatarUrl')
      .limit(6)
      .lean()) as any[];

    const teamCount = await UserModel.countDocuments({
      tenantId: user.tenantId,
      isActive: true,
    });

    const userIds = teamMembers.map((m) => m.userId);
    const userActiveTasks = (await TaskModel.find({
      tenantId: user.tenantId,
      assigneeId: { $in: userIds },
      status: { $in: ['In Progress', 'In Review', 'Todo'] },
    })
      .select('taskId title status assigneeId')
      .sort({ updatedAt: -1 })
      .lean()) as any[];

    const userTaskMap = new Map<string, any>();
    for (const t of userActiveTasks) {
      if (t.assigneeId && !userTaskMap.has(t.assigneeId)) {
        userTaskMap.set(t.assigneeId, t);
      }
    }

    const teamPresence = teamMembers.map((m) => {
      const task = userTaskMap.get(m.userId);
      const status =
        task?.status === 'In Progress'
          ? 'progress'
          : task?.status === 'In Review'
          ? 'pending'
          : 'completed';
      const statusLabel = task?.status || 'Online';
      return {
        name: m.name,
        avatar: m.avatarUrl,
        email: m.email,
        task: task?.title || 'No active task',
        status,
        statusLabel,
      };
    });

    // 6. Dynamic Featured Velocity Calculation
    const completedSprints = (await SprintModel.find({
      tenantId: user.tenantId,
      status: 'completed',
    })
      .sort({ endDate: -1 })
      .limit(3)
      .lean()) as any[];

    let featuredVelocity = 0;
    if (completedSprints.length > 0) {
      const sprintIds = completedSprints.map((s) => s.sprintId);
      const completedSprintTasks = await TaskModel.find({
        tenantId: user.tenantId,
        sprintId: { $in: sprintIds },
        status: 'Done',
      }).select('storyPoints').lean();

      const totalDonePoints = completedSprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      featuredVelocity = Math.round(totalDonePoints / completedSprints.length);
    }

    if (featuredVelocity === 0) {
      const deliveredTasksWithPoints = await TaskModel.find({
        tenantId: user.tenantId,
        status: 'Done',
      }).select('storyPoints').lean();
      const points = deliveredTasksWithPoints.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      featuredVelocity = points;
    }

    // 7. 7-Day Velocity Burnup Trend
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const velocityBurnup: Array<{ day: string; date: string; completed: number; remaining: number }> = [];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      velocityBurnup.push({
        day: dayName,
        date: d.toISOString().slice(0, 10),
        completed: 0,
        remaining: sprintMetrics ? Math.max(0, sprintMetrics.totalPoints - sprintMetrics.donePoints) : 0,
      });
    }

    const recentDoneTasks = (await TaskModel.find({
      tenantId: user.tenantId,
      status: 'Done',
      updatedAt: { $gte: sevenDaysAgo },
    }).select('storyPoints updatedAt').lean()) as any[];

    for (const task of recentDoneTasks) {
      const taskDate = new Date(task.updatedAt).toISOString().slice(0, 10);
      const entry = velocityBurnup.find((v) => v.date === taskDate);
      if (entry) {
        entry.completed += task.storyPoints || 1;
      }
    }

    return sendApiResponse(res, {
      activeProjects,
      deliveredTasks,
      timeTrackedThisWeek,
      featuredVelocity,
      activeSprint: sprintMetrics,
      recentTasks,
      teamCount,
      teamPresence,
      velocityBurnup,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
