import { Router, Request, Response } from 'express';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { UserModel } from '../models/User.js';
import { ProjectModel } from '../models/Project.js';

const router = Router();

router.use(verifyAuth);
router.use(verifyTenantActive);

/**
 * @openapi
 * /activity:
 *   get:
 *     summary: Fetch global activity audit trail for tenant
 *     tags: [Activity]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [all, task, project, sprint, document, comment, timeEntry]
 *       - in: query
 *         name: projectId
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
 *           default: 25
 *     responses:
 *       200:
 *         description: Paginated activity logs enriched with user and project details
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const skip = (page - 1) * limit;

    const { entityType, projectId, userId } = req.query;

    const filter: Record<string, any> = { tenantId: user.tenantId };

    if (entityType && typeof entityType === 'string' && entityType !== 'all') {
      filter.entityType = entityType;
    }

    if (projectId && typeof projectId === 'string') {
      filter.projectId = projectId;
    }

    if (userId && typeof userId === 'string') {
      filter.userId = userId;
    }

    const [total, logs] = await Promise.all([
      ActivityLogModel.countDocuments(filter),
      ActivityLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as any,
    ]);

    // Batch enrich with user and project metadata to eliminate N+1 frontend requests
    const userIds = [...new Set(logs.map((l: any) => l.userId).filter(Boolean))];
    const projectIds = [...new Set(logs.map((l: any) => l.projectId).filter(Boolean))];

    const [users, projects] = await Promise.all([
      UserModel.find({ tenantId: user.tenantId, userId: { $in: userIds } })
        .select('userId name email avatarUrl')
        .lean() as any,
      ProjectModel.find({ tenantId: user.tenantId, projectId: { $in: projectIds } })
        .select('projectId name')
        .lean() as any,
    ]);

    const userMap = new Map((users || []).map((u: any) => [u.userId, u]));
    const projectMap = new Map((projects || []).map((p: any) => [p.projectId, p.name]));

    const enrichedLogs = logs.map((log: any) => ({
      ...log,
      user: userMap.get(log.userId) || {
        name: 'Workspace Member',
        email: '',
        avatarUrl: '',
      },
      projectName: log.projectId ? projectMap.get(log.projectId) || null : null,
    }));

    return sendApiResponse(res, {
      logs: enrichedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
