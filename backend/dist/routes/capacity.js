"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const id_js_1 = require("../utils/id.js");
const Sprint_js_1 = require("../models/Sprint.js");
const Task_js_1 = require("../models/Task.js");
const User_js_1 = require("../models/User.js");
const Availability_js_1 = require("../models/Availability.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
const AvailabilitySchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    date: zod_1.z.string().min(1, 'Date is required'),
    type: zod_1.z.enum(['pto', 'holiday', 'partial']).default('pto'),
    hoursAvailable: zod_1.z.number().min(0).max(8).default(0),
    note: zod_1.z.string().optional(),
});
// GET /api/v1/capacity
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'project:read');
        const { sprintId, projectId, startDate: fromParam, endDate: toParam } = req.query;
        let startDate;
        let endDate;
        let sprintName = '';
        if (sprintId) {
            const sprint = await Sprint_js_1.SprintModel.findOne({
                sprintId: sprintId,
                tenantId: user.tenantId,
            }).lean();
            if (!sprint) {
                return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: `Sprint '${sprintId}' not found` }, 404);
            }
            startDate = new Date(sprint.startDate);
            endDate = new Date(sprint.endDate);
            sprintName = sprint.name;
        }
        else {
            startDate = fromParam ? new Date(fromParam) : new Date();
            endDate = toParam ? new Date(toParam) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        }
        startDate.setUTCHours(0, 0, 0, 0);
        endDate.setUTCHours(23, 59, 59, 999);
        // Business days calculation (Mon-Fri)
        let businessDays = 0;
        const cur = new Date(startDate);
        while (cur <= endDate) {
            const day = cur.getUTCDay();
            if (day !== 0 && day !== 6)
                businessDays++;
            cur.setUTCDate(cur.getUTCDate() + 1);
        }
        const defaultMemberHours = businessDays * 8;
        // Fetch team members for tenant
        const members = await User_js_1.UserModel.find({
            tenantId: user.tenantId,
            isActive: true,
        }).lean();
        // Fetch all availability records in date range
        const availRecords = await Availability_js_1.AvailabilityModel.find({
            tenantId: user.tenantId,
            date: { $gte: startDate, $lte: endDate },
        }).lean();
        // Fetch tasks for sprint or project
        const taskQuery = {
            tenantId: user.tenantId,
            status: { $ne: 'Done' },
        };
        if (sprintId) {
            taskQuery.sprintId = sprintId;
        }
        else if (projectId && projectId !== 'all') {
            taskQuery.projectId = projectId;
        }
        const tasks = await Task_js_1.TaskModel.find(taskQuery).lean();
        let totalAvailable = 0;
        let totalCommitted = 0;
        const memberCapacities = members.map((member) => {
            const memberAvail = availRecords.filter((r) => r.userId === member.userId);
            let ptoHours = 0;
            let ptoDays = 0;
            memberAvail.forEach((a) => {
                if (a.type === 'pto' || a.type === 'holiday') {
                    ptoHours += 8;
                    ptoDays += 1;
                }
                else if (a.type === 'partial') {
                    const reduced = 8 - (a.hoursAvailable ?? 8);
                    if (reduced > 0)
                        ptoHours += reduced;
                }
            });
            const memberAvailableHours = Math.max(0, defaultMemberHours - ptoHours);
            const memberWorkingDays = Math.max(0, businessDays - ptoDays);
            // Tasks assigned to member
            const memberTasks = tasks.filter((t) => Array.isArray(t.assignees) && t.assignees.includes(member.userId));
            const committedHours = memberTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
            const committedPoints = memberTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
            const loadPct = memberAvailableHours > 0
                ? Math.round((committedHours / memberAvailableHours) * 100)
                : committedHours > 0
                    ? 100
                    : 0;
            let status = 'optimal';
            if (loadPct > 100)
                status = 'overloaded';
            else if (loadPct > 80)
                status = 'heavy';
            totalAvailable += memberAvailableHours;
            totalCommitted += committedHours;
            return {
                userId: member.userId,
                name: member.name,
                email: member.email,
                role: member.role,
                avatarUrl: member.avatarUrl,
                department: member.department,
                workingDays: memberWorkingDays,
                ptoDays,
                availableHours: memberAvailableHours,
                committedHours,
                committedPoints,
                assignedTaskCount: memberTasks.length,
                loadPct,
                status,
            };
        });
        const overallLoadPct = totalAvailable > 0 ? Math.round((totalCommitted / totalAvailable) * 100) : 0;
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            sprintId: sprintId || null,
            sprintName,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            businessDays,
            totalAvailableHours: totalAvailable,
            totalCommittedHours: totalCommitted,
            overallLoadPct,
            members: memberCapacities,
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/capacity/availability (or /api/v1/availability)
router.get('/availability', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'user:read');
        const { userId, from, to } = req.query;
        const query = { tenantId: user.tenantId };
        if (userId && userId !== 'all')
            query.userId = userId;
        if (from || to) {
            query.date = {};
            if (from)
                query.date.$gte = new Date(from);
            if (to)
                query.date.$lte = new Date(to);
        }
        const records = await Availability_js_1.AvailabilityModel.find(query).sort({ date: 1 }).lean();
        return (0, apiResponse_js_1.sendApiResponse)(res, records);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/capacity/availability
router.post('/availability', async (req, res) => {
    try {
        const user = req.user;
        const validated = AvailabilitySchema.parse(req.body);
        const targetUserId = validated.userId || user.id;
        if (targetUserId !== user.id && user.role === 'member') {
            (0, rbac_js_1.assertPermission)(user.role, 'user:invite');
        }
        const targetDate = new Date(validated.date);
        targetDate.setUTCHours(0, 0, 0, 0);
        const record = await Availability_js_1.AvailabilityModel.findOneAndUpdate({
            tenantId: user.tenantId,
            userId: targetUserId,
            date: targetDate,
        }, {
            $set: {
                availabilityId: (0, id_js_1.generateId)('avail'),
                tenantId: user.tenantId,
                userId: targetUserId,
                date: targetDate,
                type: validated.type,
                hoursAvailable: validated.hoursAvailable,
                note: validated.note || '',
            },
        }, { upsert: true, new: true });
        return (0, apiResponse_js_1.sendApiResponse)(res, record, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// DELETE /api/v1/capacity/availability/:availabilityId
router.delete('/availability/:availabilityId', async (req, res) => {
    try {
        const user = req.user;
        const { availabilityId } = req.params;
        const record = await Availability_js_1.AvailabilityModel.findOne({
            availabilityId,
            tenantId: user.tenantId,
        });
        if (!record) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: `Availability record '${availabilityId}' not found` }, 404);
        }
        if (record.userId !== user.id && user.role === 'member') {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'FORBIDDEN', message: 'Unauthorized to remove this record' }, 403);
        }
        await Availability_js_1.AvailabilityModel.deleteOne({ availabilityId });
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Availability record deleted successfully' });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
