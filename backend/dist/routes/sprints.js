"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Sprint_js_1 = require("../models/Sprint.js");
const Task_js_1 = require("../models/Task.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const id_js_1 = require("../utils/id.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const errors_js_1 = require("../utils/errors.js");
const automationDispatcher_js_1 = require("../services/automationDispatcher.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
const CreateSprintSchema = zod_1.z.object({
    projectId: zod_1.z.string().min(1, 'Project ID is required'),
    name: zod_1.z.string().min(1, 'Sprint name is required').max(100),
    goal: zod_1.z.string().optional().default(''),
    startDate: zod_1.z.string().min(1, 'Start date is required'),
    endDate: zod_1.z.string().min(1, 'End date is required'),
    capacityPoints: zod_1.z.number().min(0).optional().default(30),
});
const UpdateSprintSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Sprint name is required').max(100).optional(),
    goal: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    capacityPoints: zod_1.z.number().min(0).optional(),
    status: zod_1.z.enum(['planning', 'active', 'completed']).optional(),
});
// GET /api/v1/sprints
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const { projectId, status } = req.query;
        const query = {
            tenantId: user.tenantId,
        };
        if (projectId && projectId !== 'all') {
            query.projectId = projectId;
        }
        if (status && status !== 'all') {
            query.status = status;
        }
        const sprints = await Sprint_js_1.SprintModel.find(query).sort({ startDate: -1 }).lean();
        const sprintIds = sprints.map((s) => s.sprintId);
        // Single aggregation query across all retrieved sprints to eliminate N+1 latency
        const taskStats = await Task_js_1.TaskModel.aggregate([
            {
                $match: {
                    tenantId: user.tenantId,
                    sprintId: { $in: sprintIds },
                },
            },
            {
                $group: {
                    _id: '$sprintId',
                    totalTasks: { $sum: 1 },
                    completedTasks: {
                        $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
                    },
                    totalStoryPoints: { $sum: { $ifNull: ['$storyPoints', 0] } },
                    completedStoryPoints: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'Done'] },
                                { $ifNull: ['$storyPoints', 0] },
                                0,
                            ],
                        },
                    },
                },
            },
        ]);
        const statsMap = new Map(taskStats.map((stat) => [stat._id, stat]));
        const enriched = sprints.map((sprint) => {
            const stat = statsMap.get(sprint.sprintId);
            return {
                ...sprint,
                totalTasks: stat?.totalTasks || 0,
                completedTasks: stat?.completedTasks || 0,
                totalStoryPoints: stat?.totalStoryPoints || 0,
                completedStoryPoints: stat?.completedStoryPoints || 0,
            };
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, enriched);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/sprints
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'project:update');
        const parseResult = CreateSprintSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid sprint data', parseResult.error.flatten().fieldErrors), 422);
        }
        const data = parseResult.data;
        const sprintId = (0, id_js_1.generateId)('sprint');
        const sprint = await Sprint_js_1.SprintModel.create({
            sprintId,
            tenantId: user.tenantId,
            projectId: data.projectId,
            name: data.name,
            goal: data.goal,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            capacityPoints: data.capacityPoints,
            committedPoints: 0,
            status: 'planning',
        });
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('log'),
            tenantId: user.tenantId,
            projectId: data.projectId,
            userId: user.userId,
            action: 'created_sprint',
            entityType: 'sprint',
            entityId: sprintId,
            metadata: { name: sprint.name },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, sprint, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/sprints/:sprintId
router.get('/:sprintId', async (req, res) => {
    try {
        const user = req.user;
        const sprint = await Sprint_js_1.SprintModel.findOne({
            tenantId: user.tenantId,
            sprintId: req.params.sprintId,
        }).lean();
        if (!sprint) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Sprint not found'), 404);
        }
        const tasks = await Task_js_1.TaskModel.find({
            tenantId: user.tenantId,
            sprintId: req.params.sprintId,
        }).lean();
        return (0, apiResponse_js_1.sendApiResponse)(res, { ...sprint, tasks });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PUT /api/v1/sprints/:sprintId
router.put('/:sprintId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'project:update');
        const sprint = await Sprint_js_1.SprintModel.findOne({
            tenantId: user.tenantId,
            sprintId: req.params.sprintId,
        });
        if (!sprint) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Sprint not found'), 404);
        }
        const parseResult = UpdateSprintSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid sprint update data', parseResult.error.flatten().fieldErrors), 422);
        }
        const validData = parseResult.data;
        if (validData.status === 'active' && sprint.status !== 'active') {
            // Auto-complete any other currently active sprint on this project
            await Sprint_js_1.SprintModel.updateMany({
                tenantId: user.tenantId,
                projectId: sprint.projectId,
                status: 'active',
                sprintId: { $ne: sprint.sprintId },
            }, { $set: { status: 'completed' } });
        }
        const oldStatus = sprint.status;
        if (validData.name !== undefined)
            sprint.name = validData.name.trim();
        if (validData.goal !== undefined)
            sprint.goal = validData.goal;
        if (validData.startDate !== undefined)
            sprint.startDate = new Date(validData.startDate);
        if (validData.endDate !== undefined)
            sprint.endDate = new Date(validData.endDate);
        if (validData.capacityPoints !== undefined)
            sprint.capacityPoints = validData.capacityPoints;
        if (validData.status !== undefined)
            sprint.status = validData.status;
        await sprint.save();
        // Workflow Automation Engine triggers
        if (sprint.status !== oldStatus) {
            if (sprint.status === 'active') {
                (0, automationDispatcher_js_1.dispatchAutomationEvent)({
                    event: 'sprint.started',
                    tenantId: user.tenantId,
                    projectId: sprint.projectId,
                    entity: sprint.toObject ? sprint.toObject() : sprint,
                    userId: user.userId,
                }).catch((err) => console.error('Automation dispatch error:', err));
            }
            else if (sprint.status === 'completed') {
                (0, automationDispatcher_js_1.dispatchAutomationEvent)({
                    event: 'sprint.completed',
                    tenantId: user.tenantId,
                    projectId: sprint.projectId,
                    entity: sprint.toObject ? sprint.toObject() : sprint,
                    userId: user.userId,
                }).catch((err) => console.error('Automation dispatch error:', err));
            }
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, sprint);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// DELETE /api/v1/sprints/:sprintId
router.delete('/:sprintId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'project:delete');
        const sprint = await Sprint_js_1.SprintModel.findOneAndDelete({
            tenantId: user.tenantId,
            sprintId: req.params.sprintId,
        }).lean();
        if (!sprint) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Sprint not found'), 404);
        }
        // Move tasks to backlog
        await Task_js_1.TaskModel.updateMany({ tenantId: user.tenantId, sprintId: req.params.sprintId }, { $set: { sprintId: null } });
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Sprint deleted successfully and tasks moved to backlog' });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
