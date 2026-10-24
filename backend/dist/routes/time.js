"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const TimeEntry_js_1 = require("../models/TimeEntry.js");
const Task_js_1 = require("../models/Task.js");
const Project_js_1 = require("../models/Project.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const User_js_1 = require("../models/User.js");
const id_js_1 = require("../utils/id.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const errors_js_1 = require("../utils/errors.js");
const index_js_1 = require("../socket/index.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
const CreateTimeSchema = zod_1.z.object({
    taskId: zod_1.z.string().min(1, 'Task ID is required'),
    projectId: zod_1.z.string().min(1, 'Project ID is required'),
    duration: zod_1.z.number().min(1, 'Duration must be at least 1 minute'),
    startTime: zod_1.z.string().optional(),
    endTime: zod_1.z.string().optional(),
    description: zod_1.z.string().optional().default(''),
    isBillable: zod_1.z.boolean().optional().default(true),
});
// GET /api/v1/time
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const { projectId, taskId, userId, startDate, endDate, page = '1', limit = '100' } = req.query;
        const query = { tenantId: user.tenantId };
        if (projectId)
            query.projectId = projectId;
        if (taskId)
            query.taskId = taskId;
        if (userId)
            query.userId = userId;
        if (startDate || endDate) {
            query.startTime = {};
            if (startDate)
                query.startTime.$gte = new Date(startDate);
            if (endDate)
                query.startTime.$lte = new Date(endDate);
        }
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;
        // Batch-fetch entries, count, and rollup aggregation concurrently
        const [entries, total, [rollupAgg]] = await Promise.all([
            TimeEntry_js_1.TimeEntryModel.find(query).sort({ startTime: -1 }).skip(skip).limit(limitNum).lean(),
            TimeEntry_js_1.TimeEntryModel.countDocuments(query),
            TimeEntry_js_1.TimeEntryModel.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalMinutes: { $sum: '$duration' },
                        billableMinutes: {
                            $sum: {
                                $cond: [{ $eq: ['$isBillable', true] }, '$duration', 0],
                            },
                        },
                    },
                },
            ]),
        ]);
        const totalMinutes = rollupAgg?.totalMinutes || 0;
        const billableMinutes = rollupAgg?.billableMinutes || 0;
        const nonBillableMinutes = totalMinutes - billableMinutes;
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
        const billableHours = Math.round((billableMinutes / 60) * 10) / 10;
        const nonBillableHours = Math.round((nonBillableMinutes / 60) * 10) / 10;
        const billablePercentage = totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0;
        // Batch enrich entries to eliminate N+1 database queries
        const taskIds = [...new Set(entries.map((e) => e.taskId).filter(Boolean))];
        const projectIds = [...new Set(entries.map((e) => e.projectId).filter(Boolean))];
        const [tasks, projects] = await Promise.all([
            Task_js_1.TaskModel.find({ tenantId: user.tenantId, taskId: { $in: taskIds } }).select('taskId title').lean(),
            Project_js_1.ProjectModel.find({ tenantId: user.tenantId, projectId: { $in: projectIds } }).select('projectId name').lean(),
        ]);
        const taskMap = new Map((tasks || []).map((t) => [t.taskId, t.title]));
        const projectMap = new Map((projects || []).map((p) => [p.projectId, p.name]));
        const enriched = entries.map((entry) => ({
            ...entry,
            taskTitle: taskMap.get(entry.taskId) || 'Unknown Task',
            projectName: projectMap.get(entry.projectId) || 'Unknown Project',
        }));
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            entries: enriched,
            summary: {
                totalMinutes,
                totalHours,
                billableMinutes,
                billableHours,
                nonBillableMinutes,
                nonBillableHours,
                billablePercentage,
            },
        }, 200, { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/time
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        const parseResult = CreateTimeSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid time entry data', parseResult.error.flatten().fieldErrors), 422);
        }
        const data = parseResult.data;
        // Verify task and project exist in the user's tenant
        const [project, task] = await Promise.all([
            Project_js_1.ProjectModel.findOne({ tenantId: user.tenantId, projectId: data.projectId }).lean(),
            Task_js_1.TaskModel.findOne({ tenantId: user.tenantId, taskId: data.taskId }).lean(),
        ]);
        if (!project) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError(`Project '${data.projectId}' not found in workspace`), 404);
        }
        if (!task) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError(`Task '${data.taskId}' not found in workspace`), 404);
        }
        if (task.projectId !== data.projectId) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError(`Task '${data.taskId}' does not belong to project '${data.projectId}'`), 422);
        }
        const entryId = (0, id_js_1.generateId)('time');
        const start = data.startTime ? new Date(data.startTime) : new Date(Date.now() - data.duration * 60000);
        const end = data.endTime ? new Date(data.endTime) : new Date(start.getTime() + data.duration * 60000);
        const entry = await TimeEntry_js_1.TimeEntryModel.create({
            entryId,
            tenantId: user.tenantId,
            projectId: data.projectId,
            taskId: data.taskId,
            userId: user.userId,
            startTime: start,
            endTime: end,
            duration: data.duration,
            description: data.description || '',
            isBillable: data.isBillable,
        });
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('log'),
            tenantId: user.tenantId,
            projectId: data.projectId,
            userId: user.userId,
            action: 'logged_time',
            entityType: 'timeEntry',
            entityId: entryId,
            metadata: { duration: data.duration, taskId: data.taskId },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, entry, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// DELETE /api/v1/time/:entryId
router.delete('/:entryId', async (req, res) => {
    try {
        const user = req.user;
        const entry = await TimeEntry_js_1.TimeEntryModel.findOneAndDelete({
            tenantId: user.tenantId,
            entryId: req.params.entryId,
        }).lean();
        if (!entry) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Time entry not found'), 404);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Time entry deleted successfully' });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/time/pending (Manager approval review queue)
router.get('/pending', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'time:approve');
        const entries = await TimeEntry_js_1.TimeEntryModel.find({
            tenantId: user.tenantId,
            status: 'submitted',
        })
            .sort({ startTime: -1 })
            .lean();
        const userIds = [...new Set(entries.map((e) => e.userId))];
        const projectIds = [...new Set(entries.map((e) => e.projectId))];
        const taskIds = [...new Set(entries.map((e) => e.taskId))];
        const [users, projects, tasks] = await Promise.all([
            User_js_1.UserModel.find({ tenantId: user.tenantId, userId: { $in: userIds } }).select('userId name email avatarUrl').lean(),
            Project_js_1.ProjectModel.find({ tenantId: user.tenantId, projectId: { $in: projectIds } }).select('projectId name').lean(),
            Task_js_1.TaskModel.find({ tenantId: user.tenantId, taskId: { $in: taskIds } }).select('taskId title').lean(),
        ]);
        const userMap = new Map(users.map((u) => [u.userId, u]));
        const projectMap = new Map(projects.map((p) => [p.projectId, p.name]));
        const taskMap = new Map(tasks.map((t) => [t.taskId, t.title]));
        const enriched = entries.map((e) => ({
            ...e,
            userName: userMap.get(e.userId)?.name || 'Unknown User',
            userEmail: userMap.get(e.userId)?.email || '',
            userAvatarUrl: userMap.get(e.userId)?.avatarUrl || '',
            projectName: projectMap.get(e.projectId) || 'Unknown Project',
            taskTitle: taskMap.get(e.taskId) || 'Unknown Task',
        }));
        return (0, apiResponse_js_1.sendApiResponse)(res, enriched);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PATCH /api/v1/time/:entryId/submit
router.patch('/:entryId/submit', async (req, res) => {
    try {
        const user = req.user;
        const entry = await TimeEntry_js_1.TimeEntryModel.findOne({
            tenantId: user.tenantId,
            entryId: req.params.entryId,
        });
        if (!entry) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Time entry not found'), 404);
        }
        if (entry.userId !== user.userId && user.role === 'member') {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ForbiddenError('You can only submit your own time entries'), 403);
        }
        entry.status = 'submitted';
        entry.submittedAt = new Date();
        await entry.save();
        (0, index_js_1.emitToTenant)(user.tenantId, 'timesheet:submitted', {
            entryId: entry.entryId,
            userId: entry.userId,
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, entry);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/time/submit-week
router.post('/submit-week', async (req, res) => {
    try {
        const user = req.user;
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('startDate and endDate are required'), 400);
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const result = await TimeEntry_js_1.TimeEntryModel.updateMany({
            tenantId: user.tenantId,
            userId: user.userId,
            status: { $in: ['draft', 'rejected'] },
            startTime: { $gte: start, $lte: end },
        }, {
            $set: {
                status: 'submitted',
                submittedAt: new Date(),
                rejectionNote: '',
            },
        });
        (0, index_js_1.emitToTenant)(user.tenantId, 'timesheet:submitted', {
            userId: user.userId,
            count: result.modifiedCount,
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            message: `Successfully submitted ${result.modifiedCount} time entries`,
            modifiedCount: result.modifiedCount,
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PATCH /api/v1/time/:entryId/approve
router.patch('/:entryId/approve', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'time:approve');
        const entry = await TimeEntry_js_1.TimeEntryModel.findOne({
            tenantId: user.tenantId,
            entryId: req.params.entryId,
        });
        if (!entry) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Time entry not found'), 404);
        }
        entry.status = 'approved';
        entry.approvedAt = new Date();
        entry.reviewedBy = user.userId;
        entry.rejectionNote = '';
        await entry.save();
        (0, index_js_1.emitToUser)(user.tenantId, entry.userId, 'timesheet:reviewed', {
            entryId: entry.entryId,
            status: 'approved',
            reviewerName: user.name,
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, entry);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PATCH /api/v1/time/:entryId/reject
router.patch('/:entryId/reject', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'time:approve');
        const RejectSchema = zod_1.z.object({
            rejectionNote: zod_1.z.string().min(1, 'A rejection reason is required'),
        });
        const parseResult = RejectSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Rejection reason required', parseResult.error.flatten().fieldErrors), 422);
        }
        const entry = await TimeEntry_js_1.TimeEntryModel.findOne({
            tenantId: user.tenantId,
            entryId: req.params.entryId,
        });
        if (!entry) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Time entry not found'), 404);
        }
        entry.status = 'rejected';
        entry.rejectionNote = parseResult.data.rejectionNote;
        entry.reviewedBy = user.userId;
        await entry.save();
        (0, index_js_1.emitToUser)(user.tenantId, entry.userId, 'timesheet:reviewed', {
            entryId: entry.entryId,
            status: 'rejected',
            rejectionNote: entry.rejectionNote,
            reviewerName: user.name,
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, entry);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
