"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProjectSchema = exports.ProjectMemberInputSchema = exports.ProjectMemberSchema = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const Project_js_1 = require("../models/Project.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const id_js_1 = require("../utils/id.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const errors_js_1 = require("../utils/errors.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
const CreateProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Project name is required').max(100),
    description: zod_1.z.string().optional(),
    methodology: zod_1.z.enum(['Agile', 'Waterfall', 'Hybrid']).optional().default('Agile'),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    colorLabel: zod_1.z.string().optional().default('#1B4D3E'),
    budgetTotal: zod_1.z.number().min(0).optional().default(0),
    currency: zod_1.z.string().optional().default('USD'),
    clientId: zod_1.z.string().nullable().optional(),
});
exports.ProjectMemberSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    role: zod_1.z.enum(['manager', 'member', 'viewer']).default('member'),
});
exports.ProjectMemberInputSchema = zod_1.z.union([
    exports.ProjectMemberSchema,
    zod_1.z.string().transform((userId) => ({ userId, role: 'member' })),
]);
exports.UpdateProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Project name is required').max(100).optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['Active', 'On Hold', 'Completed', 'Archived']).optional(),
    methodology: zod_1.z.enum(['Agile', 'Waterfall', 'Hybrid']).optional(),
    startDate: zod_1.z.string().nullable().optional(),
    endDate: zod_1.z.string().nullable().optional(),
    colorLabel: zod_1.z.string().optional(),
    budget: zod_1.z
        .object({
        total: zod_1.z.number().min(0).optional(),
        currency: zod_1.z.string().optional(),
    })
        .optional(),
    budgetTotal: zod_1.z.number().min(0).optional(),
    currency: zod_1.z.string().optional(),
    clientId: zod_1.z.string().nullable().optional(),
    phases: zod_1.z.array(zod_1.z.any()).optional(),
    members: zod_1.z.array(exports.ProjectMemberInputSchema).optional(),
    settings: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// GET /api/v1/projects
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const { status, methodology, clientId, page = '1', limit = '50' } = req.query;
        const query = { tenantId: user.tenantId };
        if (status)
            query.status = status;
        if (methodology)
            query.methodology = methodology;
        if (clientId)
            query.clientId = clientId;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;
        const [projects, total] = await Promise.all([
            Project_js_1.ProjectModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
            Project_js_1.ProjectModel.countDocuments(query),
        ]);
        return (0, apiResponse_js_1.sendApiResponse)(res, projects, 200, {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/projects
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'project:create');
        const parseResult = CreateProjectSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid project data', parseResult.error.flatten().fieldErrors), 422);
        }
        const data = parseResult.data;
        const projectId = (0, id_js_1.generateId)('project');
        let phases = [];
        if (data.methodology === 'Waterfall') {
            phases = [
                { id: (0, id_js_1.generateId)('task'), name: 'Requirements', color: '#3B82F6' },
                { id: (0, id_js_1.generateId)('task'), name: 'Design', color: '#8B5CF6' },
                { id: (0, id_js_1.generateId)('task'), name: 'Implementation', color: '#1B4D3E' },
                { id: (0, id_js_1.generateId)('task'), name: 'Verification', color: '#F59E0B' },
            ];
        }
        const project = await Project_js_1.ProjectModel.create({
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
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('log'),
            tenantId: user.tenantId,
            projectId,
            userId: user.userId,
            action: 'created_project',
            entityType: 'project',
            entityId: projectId,
            metadata: { name: project.name, methodology: project.methodology },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, project, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/projects/:projectId
router.get('/:projectId', async (req, res) => {
    try {
        const user = req.user;
        const project = await Project_js_1.ProjectModel.findOne({
            tenantId: user.tenantId,
            projectId: req.params.projectId,
        }).lean();
        if (!project) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Project not found'), 404);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, project);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PUT /api/v1/projects/:projectId
router.put('/:projectId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'project:update');
        const parseResult = exports.UpdateProjectSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid project update data', parseResult.error.flatten().fieldErrors), 422);
        }
        const validData = parseResult.data;
        const updateData = {};
        if (validData.name !== undefined)
            updateData.name = validData.name;
        if (validData.description !== undefined)
            updateData.description = validData.description;
        if (validData.status !== undefined)
            updateData.status = validData.status;
        if (validData.methodology !== undefined)
            updateData.methodology = validData.methodology;
        if (validData.colorLabel !== undefined)
            updateData.colorLabel = validData.colorLabel;
        if (validData.clientId !== undefined)
            updateData.clientId = validData.clientId;
        if (validData.phases !== undefined)
            updateData.phases = validData.phases;
        if (validData.members !== undefined)
            updateData.members = validData.members;
        if (validData.settings !== undefined)
            updateData.settings = validData.settings;
        if (validData.startDate !== undefined) {
            updateData.startDate = validData.startDate ? new Date(validData.startDate) : null;
        }
        if (validData.endDate !== undefined) {
            updateData.endDate = validData.endDate ? new Date(validData.endDate) : null;
        }
        if (validData.budget !== undefined) {
            updateData.budget = validData.budget;
        }
        else if (validData.budgetTotal !== undefined || validData.currency !== undefined) {
            if (validData.budgetTotal !== undefined)
                updateData['budget.total'] = validData.budgetTotal;
            if (validData.currency !== undefined)
                updateData['budget.currency'] = validData.currency;
        }
        const updated = await Project_js_1.ProjectModel.findOneAndUpdate({ tenantId: user.tenantId, projectId: req.params.projectId }, { $set: updateData }, { new: true }).lean();
        if (!updated) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Project not found'), 404);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, updated);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// DELETE /api/v1/projects/:projectId
router.delete('/:projectId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'project:delete');
        const project = await Project_js_1.ProjectModel.findOneAndUpdate({ tenantId: user.tenantId, projectId: req.params.projectId }, { $set: { status: 'Archived' } }, { new: true }).lean();
        if (!project) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Project not found'), 404);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Project archived successfully', project });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
