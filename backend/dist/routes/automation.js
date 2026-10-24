"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const AutomationRule_js_1 = require("../models/AutomationRule.js");
const id_js_1 = require("../utils/id.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const errors_js_1 = require("../utils/errors.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
const ALLOWED_AUTOMATION_ROLES = ['superAdmin', 'orgAdmin', 'managingDirector', 'manager'];
router.use((req, res, next) => {
    const user = req.user;
    if (!user || !ALLOWED_AUTOMATION_ROLES.includes(user.role)) {
        return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ForbiddenError(`Role '${user?.role}' does not have access to automations`), 403);
    }
    next();
});
const TriggerSchema = zod_1.z.object({
    event: zod_1.z.enum([
        'task.created',
        'task.status_changed',
        'task.priority_changed',
        'sprint.started',
        'sprint.completed',
    ]),
    condition: zod_1.z
        .object({
        field: zod_1.z.string().optional(),
        operator: zod_1.z.enum(['equals', 'not_equals', 'contains']).optional().default('equals'),
        value: zod_1.z.string().optional(),
    })
        .optional(),
});
const ActionSchema = zod_1.z.object({
    type: zod_1.z.enum([
        'assign_user',
        'change_priority',
        'change_status',
        'send_notification',
        'add_label',
    ]),
    params: zod_1.z.record(zod_1.z.any()).optional().default({}),
});
const CreateRuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Rule name is required').max(100),
    description: zod_1.z.string().max(300).optional().default(''),
    projectId: zod_1.z.string().nullable().optional(),
    trigger: TriggerSchema,
    actions: zod_1.z.array(ActionSchema).min(1, 'At least one action is required'),
    isActive: zod_1.z.boolean().optional().default(true),
});
const UpdateRuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(300).optional(),
    projectId: zod_1.z.string().nullable().optional(),
    trigger: TriggerSchema.optional(),
    actions: zod_1.z.array(ActionSchema).min(1).optional(),
    isActive: zod_1.z.boolean().optional(),
});
// GET /api/v1/automation
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const { projectId } = req.query;
        const query = { tenantId: user.tenantId };
        if (projectId && projectId !== 'all') {
            query.$or = [{ projectId }, { projectId: null }, { projectId: { $exists: false } }];
        }
        const rules = await AutomationRule_js_1.AutomationRuleModel.find(query).sort({ createdAt: -1 }).lean();
        return (0, apiResponse_js_1.sendApiResponse)(res, rules);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/automation
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'project:update');
        const parseResult = CreateRuleSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid automation rule payload', parseResult.error.flatten().fieldErrors), 422);
        }
        const data = parseResult.data;
        const ruleId = (0, id_js_1.generateId)('rule');
        const rule = await AutomationRule_js_1.AutomationRuleModel.create({
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
        return (0, apiResponse_js_1.sendApiResponse)(res, rule, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PUT /api/v1/automation/:ruleId
router.put('/:ruleId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'project:update');
        const parseResult = UpdateRuleSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid rule update payload', parseResult.error.flatten().fieldErrors), 422);
        }
        const updateFields = {};
        const d = parseResult.data;
        if (d.name !== undefined)
            updateFields.name = d.name.trim();
        if (d.description !== undefined)
            updateFields.description = d.description;
        if (d.projectId !== undefined)
            updateFields.projectId = d.projectId;
        if (d.trigger !== undefined)
            updateFields.trigger = d.trigger;
        if (d.actions !== undefined)
            updateFields.actions = d.actions;
        if (d.isActive !== undefined)
            updateFields.isActive = d.isActive;
        const rule = await AutomationRule_js_1.AutomationRuleModel.findOneAndUpdate({ tenantId: user.tenantId, ruleId: req.params.ruleId }, { $set: updateFields }, { new: true }).lean();
        if (!rule) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Automation rule not found'), 404);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, rule);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// DELETE /api/v1/automation/:ruleId
router.delete('/:ruleId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'project:update');
        const rule = await AutomationRule_js_1.AutomationRuleModel.findOneAndDelete({
            tenantId: user.tenantId,
            ruleId: req.params.ruleId,
        }).lean();
        if (!rule) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Automation rule not found'), 404);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Automation rule deleted successfully' });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
