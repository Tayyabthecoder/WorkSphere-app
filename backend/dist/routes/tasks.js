"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Task_js_1 = require("../models/Task.js");
const User_js_1 = require("../models/User.js");
const Comment_js_1 = require("../models/Comment.js");
const TimeEntry_js_1 = require("../models/TimeEntry.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const Notification_js_1 = require("../models/Notification.js");
const id_js_1 = require("../utils/id.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const errors_js_1 = require("../utils/errors.js");
const index_js_1 = require("../socket/index.js");
const automationDispatcher_js_1 = require("../services/automationDispatcher.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
const CreateTaskSchema = zod_1.z.object({
    projectId: zod_1.z.string().min(1, 'Project ID is required'),
    title: zod_1.z.string().min(1, 'Task title is required').max(300),
    description: zod_1.z.string().optional().default(''),
    status: zod_1.z.enum(['Backlog', 'To Do', 'In Progress', 'In Review', 'Done']).optional().default('To Do'),
    priority: zod_1.z.enum(['critical', 'high', 'medium', 'low']).optional().default('medium'),
    assignees: zod_1.z.array(zod_1.z.string()).optional().default([]),
    dueDate: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    storyPoints: zod_1.z.number().min(0).optional().default(0),
    estimatedHours: zod_1.z.number().min(0).optional().default(0),
    sprintId: zod_1.z.string().nullable().optional(),
    parentTaskId: zod_1.z.string().nullable().optional(),
});
const UpdateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Task title is required').max(300).optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['Backlog', 'To Do', 'In Progress', 'In Review', 'Done']).optional(),
    priority: zod_1.z.enum(['critical', 'high', 'medium', 'low']).optional(),
    assignees: zod_1.z.array(zod_1.z.string()).optional(),
    dueDate: zod_1.z.string().nullable().optional(),
    startDate: zod_1.z.string().nullable().optional(),
    storyPoints: zod_1.z.number().min(0).optional(),
    estimatedHours: zod_1.z.number().min(0).optional(),
    sprintId: zod_1.z.string().nullable().optional(),
    parentTaskId: zod_1.z.string().nullable().optional(),
    labels: zod_1.z.array(zod_1.z.string()).optional(),
    order: zod_1.z.number().optional(),
    customFields: zod_1.z.record(zod_1.z.unknown()).optional(),
    dependencies: zod_1.z
        .array(zod_1.z.object({
        taskId: zod_1.z.string().min(1),
        type: zod_1.z.enum(['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish']).optional(),
    }))
        .optional(),
});
/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: List and search tasks with offset or cursor-based pagination
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Backlog, To Do, In Progress, In Review, Done]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: after
 *         description: Cursor task ID for efficient infinite scrolling
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
 *           default: 200
 *     responses:
 *       200:
 *         description: List of tasks with pagination metadata
 */
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const { projectId, status, priority, sprintId, assignee, dueDateFrom, dueDateTo, page = '1', limit = '200', after } = req.query;
        const query = { tenantId: user.tenantId };
        if (projectId && projectId !== 'all')
            query.projectId = projectId;
        if (status && status !== 'all')
            query.status = status;
        if (priority && priority !== 'all')
            query.priority = priority;
        if (sprintId)
            query.sprintId = sprintId === 'null' ? null : sprintId;
        if (assignee)
            query.assignees = assignee;
        if (dueDateFrom || dueDateTo) {
            query.dueDate = {};
            if (dueDateFrom)
                query.dueDate.$gte = new Date(dueDateFrom);
            if (dueDateTo)
                query.dueDate.$lte = new Date(dueDateTo);
        }
        const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10)));
        let tasks;
        let total;
        let nextCursor = null;
        let pageNum = 1;
        if (after && typeof after === 'string') {
            const anchor = (await Task_js_1.TaskModel.findOne({ tenantId: user.tenantId, taskId: after }).select('order createdAt').lean());
            if (anchor) {
                query.$or = [
                    { order: { $gt: anchor.order } },
                    { order: anchor.order, createdAt: { $lt: anchor.createdAt } },
                ];
            }
            [tasks, total] = await Promise.all([
                Task_js_1.TaskModel.find(query).sort({ order: 1, createdAt: -1 }).limit(limitNum + 1).lean(),
                Task_js_1.TaskModel.countDocuments({ tenantId: user.tenantId, ...(projectId && projectId !== 'all' ? { projectId } : {}) }),
            ]);
            if (tasks.length > limitNum) {
                tasks = tasks.slice(0, limitNum);
                nextCursor = tasks[tasks.length - 1].taskId;
            }
        }
        else {
            pageNum = Math.max(1, parseInt(page, 10));
            const skip = (pageNum - 1) * limitNum;
            [tasks, total] = await Promise.all([
                Task_js_1.TaskModel.find(query).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
                Task_js_1.TaskModel.countDocuments(query),
            ]);
        }
        // Batch hydrate assignee user profiles (name, avatar, email)
        const allAssigneeIds = [
            ...new Set(tasks
                .flatMap((t) => t.assignees || [])
                .filter((id) => typeof id === 'string' && id.trim().length > 0)),
        ];
        let userMap = new Map();
        if (allAssigneeIds.length > 0) {
            const users = await User_js_1.UserModel.find({
                tenantId: user.tenantId,
                userId: { $in: allAssigneeIds },
            })
                .select('userId name email avatarUrl')
                .lean();
            userMap = new Map(users.map((u) => [u.userId, u]));
        }
        const enrichedTasks = tasks.map((t) => ({
            ...t,
            assigneeProfiles: (t.assignees || []).map((id) => userMap.get(id) || {
                userId: id,
                name: id,
            }),
        }));
        return (0, apiResponse_js_1.sendApiResponse)(res, enrichedTasks, 200, {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
            nextCursor,
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/tasks
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'task:create');
        const parseResult = CreateTaskSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid task data', parseResult.error.flatten().fieldErrors), 422);
        }
        const data = parseResult.data;
        const taskId = (0, id_js_1.generateId)('task');
        const maxOrderTask = (await Task_js_1.TaskModel.findOne({
            tenantId: user.tenantId,
            projectId: data.projectId,
            status: data.status,
        }).sort({ order: -1 }).select('order').lean());
        const nextOrder = (maxOrderTask?.order ?? -1) + 1;
        const task = await Task_js_1.TaskModel.create({
            taskId,
            tenantId: user.tenantId,
            projectId: data.projectId,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            assignees: data.assignees,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            storyPoints: data.storyPoints,
            estimatedHours: data.estimatedHours,
            sprintId: data.sprintId || null,
            parentTaskId: data.parentTaskId || null,
            order: nextOrder,
            completedAt: data.status === 'Done' ? new Date() : undefined,
        });
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('log'),
            tenantId: user.tenantId,
            projectId: data.projectId,
            userId: user.userId,
            action: 'created_task',
            entityType: 'task',
            entityId: taskId,
            metadata: { title: task.title, status: task.status, priority: task.priority },
        });
        // Real-Time: Broadcast task creation to project room
        (0, index_js_1.emitToProject)(user.tenantId, data.projectId, 'task:created', {
            task,
            author: { userId: user.userId, name: user.name || 'Teammate' },
        });
        // Real-Time: Notify assigned team members
        if (data.assignees && data.assignees.length > 0) {
            for (const assigneeId of data.assignees) {
                if (assigneeId !== user.userId) {
                    try {
                        const notif = await Notification_js_1.NotificationModel.create({
                            notificationId: (0, id_js_1.generateId)('notification'),
                            tenantId: user.tenantId,
                            userId: assigneeId,
                            title: 'New Task Assignment',
                            message: `${user.name || 'A teammate'} assigned you to "${task.title}"`,
                            type: 'assignment',
                            relatedEntityType: 'task',
                            relatedEntityId: task.taskId,
                            entityType: 'task',
                            entityId: task.taskId,
                            isRead: false,
                        });
                        (0, index_js_1.emitToUser)(user.tenantId, assigneeId, 'notification:new', { notification: notif });
                    }
                    catch (notifErr) {
                        console.error('Failed to create assignment notification:', notifErr);
                    }
                }
            }
        }
        // Workflow Automation Engine trigger
        (0, automationDispatcher_js_1.dispatchAutomationEvent)({
            event: 'task.created',
            tenantId: user.tenantId,
            projectId: data.projectId,
            entity: task.toObject ? task.toObject() : task,
            userId: user.userId,
        }).catch((err) => console.error('Automation dispatch error:', err));
        return (0, apiResponse_js_1.sendApiResponse)(res, task, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/tasks/:taskId
router.get('/:taskId', async (req, res) => {
    try {
        const user = req.user;
        const task = await Task_js_1.TaskModel.findOne({
            tenantId: user.tenantId,
            taskId: req.params.taskId,
        }).lean();
        if (!task) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Task not found'), 404);
        }
        const subtasks = await Task_js_1.TaskModel.find({
            tenantId: user.tenantId,
            parentTaskId: req.params.taskId,
        }).sort({ createdAt: 1 }).lean();
        return (0, apiResponse_js_1.sendApiResponse)(res, { ...task, subtasks });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PUT /api/v1/tasks/:taskId
router.put('/:taskId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'task:update');
        const parseResult = UpdateTaskSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid task update data', parseResult.error.flatten().fieldErrors), 422);
        }
        const validData = parseResult.data;
        const updateData = {};
        if (validData.title !== undefined)
            updateData.title = validData.title;
        if (validData.description !== undefined)
            updateData.description = validData.description;
        if (validData.priority !== undefined)
            updateData.priority = validData.priority;
        if (validData.assignees !== undefined)
            updateData.assignees = validData.assignees;
        if (validData.storyPoints !== undefined)
            updateData.storyPoints = validData.storyPoints;
        if (validData.estimatedHours !== undefined)
            updateData.estimatedHours = validData.estimatedHours;
        if (validData.sprintId !== undefined)
            updateData.sprintId = validData.sprintId;
        if (validData.parentTaskId !== undefined)
            updateData.parentTaskId = validData.parentTaskId;
        if (validData.labels !== undefined)
            updateData.labels = validData.labels;
        if (validData.order !== undefined)
            updateData.order = validData.order;
        if (validData.customFields !== undefined)
            updateData.customFields = validData.customFields;
        if (validData.dependencies !== undefined)
            updateData.dependencies = validData.dependencies;
        if (validData.dueDate !== undefined) {
            updateData.dueDate = validData.dueDate ? new Date(validData.dueDate) : null;
        }
        if (validData.startDate !== undefined) {
            updateData.startDate = validData.startDate ? new Date(validData.startDate) : null;
        }
        if (validData.status !== undefined) {
            updateData.status = validData.status;
            if (validData.status === 'Done') {
                updateData.completedAt = new Date();
            }
            else {
                updateData.completedAt = null;
            }
        }
        const task = await Task_js_1.TaskModel.findOneAndUpdate({ tenantId: user.tenantId, taskId: req.params.taskId }, { $set: updateData }, { new: true }).lean();
        if (!task) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Task not found'), 404);
        }
        // Real-Time: Broadcast task update to project room
        (0, index_js_1.emitToProject)(user.tenantId, task.projectId, 'task:updated', {
            task,
            modifiedBy: { userId: user.userId, name: user.name || 'Teammate' },
        });
        // Workflow Automation Engine triggers
        if (validData.status !== undefined) {
            (0, automationDispatcher_js_1.dispatchAutomationEvent)({
                event: 'task.status_changed',
                tenantId: user.tenantId,
                projectId: task.projectId,
                entity: task,
                userId: user.userId,
            }).catch((err) => console.error('Automation dispatch error:', err));
        }
        if (validData.priority !== undefined) {
            (0, automationDispatcher_js_1.dispatchAutomationEvent)({
                event: 'task.priority_changed',
                tenantId: user.tenantId,
                projectId: task.projectId,
                entity: task,
                userId: user.userId,
            }).catch((err) => console.error('Automation dispatch error:', err));
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, task);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
const PatchStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['Backlog', 'To Do', 'In Progress', 'In Review', 'Done']),
    order: zod_1.z.number().optional(),
});
// PATCH /api/v1/tasks/:taskId/status
router.patch('/:taskId/status', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'task:update');
        const parseResult = PatchStatusSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid status or order payload', parseResult.error.flatten().fieldErrors), 422);
        }
        const { status, order } = parseResult.data;
        const updateData = { status };
        if (order !== undefined)
            updateData.order = order;
        if (status === 'Done') {
            updateData.completedAt = new Date();
        }
        else {
            updateData.completedAt = null;
        }
        const task = await Task_js_1.TaskModel.findOneAndUpdate({ tenantId: user.tenantId, taskId: req.params.taskId }, { $set: updateData }, { new: true }).lean();
        if (!task) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Task not found'), 404);
        }
        // Real-Time: Broadcast card movement to project room
        (0, index_js_1.emitToProject)(user.tenantId, task.projectId, 'task:moved', {
            taskId: task.taskId,
            status: task.status,
            order: task.order,
            modifiedBy: { userId: user.userId, name: user.name || 'Teammate' },
        });
        // Workflow Automation Engine trigger
        (0, automationDispatcher_js_1.dispatchAutomationEvent)({
            event: 'task.status_changed',
            tenantId: user.tenantId,
            projectId: task.projectId,
            entity: task,
            userId: user.userId,
        }).catch((err) => console.error('Automation dispatch error:', err));
        return (0, apiResponse_js_1.sendApiResponse)(res, task);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// DELETE /api/v1/tasks/:taskId
router.delete('/:taskId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'task:delete');
        const task = await Task_js_1.TaskModel.findOneAndDelete({
            tenantId: user.tenantId,
            taskId: req.params.taskId,
        }).lean();
        if (!task) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Task not found'), 404);
        }
        // Cascading cleanups:
        // 1. Delete all subtasks
        // 2. Delete all comments associated with this task
        // 3. Unlink time entries that were associated with this task
        // 4. Remove this task from dependency lists in other tasks
        await Promise.all([
            Task_js_1.TaskModel.deleteMany({
                tenantId: user.tenantId,
                parentTaskId: req.params.taskId,
            }),
            Comment_js_1.CommentModel.deleteMany({
                tenantId: user.tenantId,
                taskId: req.params.taskId,
            }),
            TimeEntry_js_1.TimeEntryModel.updateMany({ tenantId: user.tenantId, taskId: req.params.taskId }, { $set: { taskId: null } }),
            Task_js_1.TaskModel.updateMany({ tenantId: user.tenantId, 'dependencies.taskId': req.params.taskId }, { $pull: { dependencies: { taskId: req.params.taskId } } }),
        ]);
        // Real-Time: Broadcast task deletion to project room
        (0, index_js_1.emitToProject)(user.tenantId, task.projectId, 'task:deleted', {
            taskId: task.taskId,
            modifiedBy: { userId: user.userId, name: user.name || 'Teammate' },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Task deleted successfully' });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
