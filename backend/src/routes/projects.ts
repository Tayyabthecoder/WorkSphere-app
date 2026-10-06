import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ProjectModel } from '../models/Project.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional(),
  methodology: z.enum(['Agile', 'Waterfall', 'Hybrid']).optional().default('Agile'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  colorLabel: z.string().optional().default('#1B4D3E'),
  budgetTotal: z.number().min(0).optional().default(0),
  currency: z.string().optional().default('USD'),
  clientId: z.string().nullable().optional(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100).optional(),
  description: z.string().optional(),
  status: z.enum(['Active', 'On Hold', 'Completed', 'Archived']).optional(),
  methodology: z.enum(['Agile', 'Waterfall', 'Hybrid']).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  colorLabel: z.string().optional(),
  budget: z
    .object({
      total: z.number().min(0).optional(),
      currency: z.string().optional(),
    })
    .optional(),
  budgetTotal: z.number().min(0).optional(),
  currency: z.string().optional(),
  clientId: z.string().nullable().optional(),
  phases: z.array(z.any()).optional(),
  members: z.array(z.string()).optional(),
  settings: z.record(z.unknown()).optional(),
});

// GET /api/v1/projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { status, methodology, clientId, page = '1', limit = '50' } = req.query;

    const query: Record<string, any> = { tenantId: user.tenantId };
    if (status) query.status = status;
    if (methodology) query.methodology = methodology;
    if (clientId) query.clientId = clientId;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [projects, total] = await Promise.all([
      ProjectModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      ProjectModel.countDocuments(query),
    ]);

    return sendApiResponse(res, projects, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/projects
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:create');

    const parseResult = CreateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Invalid project data', parseResult.error.flatten().fieldErrors), 422);
    }

    const data = parseResult.data;
    const projectId = generateId('project');

    let phases: any[] = [];
    if (data.methodology === 'Waterfall') {
      phases = [
        { id: generateId('task'), name: 'Requirements', color: '#3B82F6' },
        { id: generateId('task'), name: 'Design', color: '#8B5CF6' },
        { id: generateId('task'), name: 'Implementation', color: '#1B4D3E' },
        { id: generateId('task'), name: 'Verification', color: '#F59E0B' },
      ];
    }

    const project = await ProjectModel.create({
      projectId,
      tenantId: user.tenantId,
      name: data.name,
      description: data.description || '',
      methodology: data.methodology,
      status: 'Active',
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      colorLabel: data.colorLabel,
      budget: {
        total: data.budgetTotal || 0,
        currency: data.currency || 'USD',
        type: 'fixed',
      },
      clientId: data.clientId || null,
      members: [{ userId: user.userId, role: 'manager' }],
      phases,
    });

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      projectId,
      userId: user.userId,
      action: 'created_project',
      entityType: 'project',
      entityId: projectId,
      metadata: { name: project.name, methodology: project.methodology },
    });

    return sendApiResponse(res, project, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/projects/:projectId
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const project = await ProjectModel.findOne({
      tenantId: user.tenantId,
      projectId: req.params.projectId,
    }).lean();

    if (!project) {
      return sendApiError(res, new NotFoundError('Project not found'), 404);
    }

    return sendApiResponse(res, project);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PUT /api/v1/projects/:projectId
router.put('/:projectId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:update');

    const parseResult = UpdateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(
        res,
        new ValidationError('Invalid project update data', parseResult.error.flatten().fieldErrors),
        422
      );
    }

    const validData = parseResult.data;
    const updateData: Record<string, any> = {};

    if (validData.name !== undefined) updateData.name = validData.name;
    if (validData.description !== undefined) updateData.description = validData.description;
    if (validData.status !== undefined) updateData.status = validData.status;
    if (validData.methodology !== undefined) updateData.methodology = validData.methodology;
    if (validData.colorLabel !== undefined) updateData.colorLabel = validData.colorLabel;
    if (validData.clientId !== undefined) updateData.clientId = validData.clientId;
    if (validData.phases !== undefined) updateData.phases = validData.phases;
    if (validData.members !== undefined) updateData.members = validData.members;
    if (validData.settings !== undefined) updateData.settings = validData.settings;

    if (validData.startDate !== undefined) {
      updateData.startDate = validData.startDate ? new Date(validData.startDate) : null;
    }
    if (validData.endDate !== undefined) {
      updateData.endDate = validData.endDate ? new Date(validData.endDate) : null;
    }

    if (validData.budget !== undefined) {
      updateData.budget = validData.budget;
    } else if (validData.budgetTotal !== undefined || validData.currency !== undefined) {
      if (validData.budgetTotal !== undefined) updateData['budget.total'] = validData.budgetTotal;
      if (validData.currency !== undefined) updateData['budget.currency'] = validData.currency;
    }

    const updated = await ProjectModel.findOneAndUpdate(
      { tenantId: user.tenantId, projectId: req.params.projectId },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!updated) {
      return sendApiError(res, new NotFoundError('Project not found'), 404);
    }

    return sendApiResponse(res, updated);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/projects/:projectId
router.delete('/:projectId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:delete');

    const project = await ProjectModel.findOneAndUpdate(
      { tenantId: user.tenantId, projectId: req.params.projectId },
      { $set: { status: 'Archived' } },
      { new: true }
    ).lean();

    if (!project) {
      return sendApiError(res, new NotFoundError('Project not found'), 404);
    }

    return sendApiResponse(res, { message: 'Project archived successfully', project });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
