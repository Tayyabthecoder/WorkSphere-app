import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { ClientModel } from '../models/Client.js';
import { TenantModel } from '../models/Tenant.js';
import { ProjectModel } from '../models/Project.js';
import { TaskModel } from '../models/Task.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';

const router = Router();

const portalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // max 60 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests to client portal. Please try again later.',
    },
  },
});

// GET /api/v1/portal/:portalToken (Public access via token)
router.get('/:portalToken', portalRateLimiter as any, async (req: Request, res: Response) => {
  try {
    const { portalToken } = req.params;

    const client = await ClientModel.findOne({
      portalToken,
      isPortalActive: true,
    }).lean() as any;

    if (!client) {
      return sendApiError(
        res,
        {
          code: 'NOT_FOUND',
          message: 'This client portal link is invalid, expired, or has been paused.',
        },
        404
      );
    }

    const tenant = await TenantModel.findOne({ tenantId: client.tenantId })
      .select('name slug logoUrl')
      .lean() as any;

    // Query projects strictly assigned to this client in this tenant
    const projects = await ProjectModel.find({
      tenantId: client.tenantId,
      clientId: client.clientId,
      status: { $ne: 'Archived' },
    })
      .select('projectId name description methodology status startDate endDate phases budget colorLabel')
      .lean() as any[];

    const projectIds = projects.map((p) => p.projectId);
    const tasks = await TaskModel.find({
      tenantId: client.tenantId,
      projectId: { $in: projectIds },
    })
      .select('taskId projectId title status priority dueDate completedAt')
      .lean() as any[];

    const portalSettings = client.portalSettings || {
      allowOverview: true,
      allowTimeline: true,
      allowDeliverables: true,
      allowFinancialSummary: true,
    };

    const enrichedProjects = projects.map((p) => {
      const projTasks = tasks.filter((t) => t.projectId === p.projectId);
      const totalTasks = projTasks.length;
      const completedTasks = projTasks.filter((t) => t.status === 'Done').length;
      const inProgressTasks = projTasks.filter((t) => t.status === 'In Progress').length;
      const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        projectId: p.projectId,
        name: p.name,
        description: p.description,
        status: p.status,
        methodology: p.methodology,
        startDate: p.startDate,
        endDate: p.endDate,
        colorLabel: p.colorLabel,
        progressPct,
        totalTasks,
        completedTasks,
        inProgressTasks,
        phases: portalSettings.allowTimeline ? p.phases : [],
        deliverables: portalSettings.allowDeliverables ? projTasks : [],
        budget: portalSettings.allowFinancialSummary
          ? {
              total: p.budget?.total || 0,
              currency: p.budget?.currency || 'USD',
            }
          : undefined,
      };
    });

    return sendApiResponse(res, {
      client: {
        name: client.name,
        company: client.company,
        portalSettings,
      },
      tenant: {
        name: tenant?.name || 'WorkSphere Organization',
        logoUrl: tenant?.logoUrl,
      },
      projects: enrichedProjects,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
