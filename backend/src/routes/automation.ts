import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AutomationRuleModel } from '../models/AutomationRule.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

const TriggerSchema = z.object({
  event: z.enum([
    'task.created',
    'task.status_changed',
    'task.priority_changed',
    'sprint.started',
    'sprint.completed',
  ]),
  condition: z
    .object({
      field: z.string().optional(),
      operator: z.enum(['equals', 'not_equals', 'contains']).optional().default('equals'),
      value: z.string().optional(),
    })
    .optional(),
});

const ActionSchema = z.object({
  type: z.enum([
    'assign_user',
    'change_priority',
    'change_status',
    'send_notification',
    'add_label',
  ]),
  params: z.record(z.any()).optional().default({}),
});

const CreateRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required').max(100),
  description: z.string().max(300).optional().default(''),
  projectId: z.string().nullable().optional(),
  trigger: TriggerSchema,
  actions: z.array(ActionSchema).min(1, 'At least one action is required'),
  isActive: z.boolean().optional().default(true),
});

const UpdateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional(),
  projectId: z.string().nullable().optional(),
  trigger: TriggerSchema.optional(),
  actions: z.array(ActionSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/v1/automation
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { projectId } = req.query;

    const query: Record<string, any> = { tenantId: user.tenantId };
    if (projectId && projectId !== 'all') {
      query.$or = [{ projectId }, { projectId: null }, { projectId: { $exists: false } }];
    }

    const rules = await AutomationRuleModel.find(query).sort({ createdAt: -1 }).lean();
    return sendApiResponse(res, rules);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/automation
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:update');

    const parseResult = CreateRuleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(
        res,
        new ValidationError('Invalid automation rule payload', parseResult.error.flatten().fieldErrors),
        422
      );
    }

    const data = parseResult.data;
    const ruleId = generateId('rule');

    const rule = await AutomationRuleModel.create({
      ruleId,
      tenantId: user.tenantId,
      projectId: data.projectId || null,
      name: data.name.trim(),
      description: data.description || '',
      isActive: data.isActive,
      trigger: data.trigger,
      actions: data.actions,
      executionCount: 0,
      createdBy: user.name || user.userId,
    });

    return sendApiResponse(res, rule, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PUT /api/v1/automation/:ruleId
router.put('/:ruleId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:update');

    const parseResult = UpdateRuleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(
        res,
        new ValidationError('Invalid rule update payload', parseResult.error.flatten().fieldErrors),
        422
      );
    }

    const updateFields: Record<string, any> = {};
    const d = parseResult.data;
    if (d.name !== undefined) updateFields.name = d.name.trim();
    if (d.description !== undefined) updateFields.description = d.description;
    if (d.projectId !== undefined) updateFields.projectId = d.projectId;
    if (d.trigger !== undefined) updateFields.trigger = d.trigger;
    if (d.actions !== undefined) updateFields.actions = d.actions;
    if (d.isActive !== undefined) updateFields.isActive = d.isActive;

    const rule = await AutomationRuleModel.findOneAndUpdate(
      { tenantId: user.tenantId, ruleId: req.params.ruleId },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!rule) {
      return sendApiError(res, new NotFoundError('Automation rule not found'), 404);
    }

    return sendApiResponse(res, rule);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/automation/:ruleId
router.delete('/:ruleId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:update');

    const rule = await AutomationRuleModel.findOneAndDelete({
      tenantId: user.tenantId,
      ruleId: req.params.ruleId,
    }).lean();

    if (!rule) {
      return sendApiError(res, new NotFoundError('Automation rule not found'), 404);
    }

    return sendApiResponse(res, { message: 'Automation rule deleted successfully' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
