"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const User_js_1 = require("../models/User.js");
const Project_js_1 = require("../models/Project.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
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
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
        const skip = (page - 1) * limit;
        const { entityType, projectId, userId } = req.query;
        const filter = { tenantId: user.tenantId };
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
            ActivityLog_js_1.ActivityLogModel.countDocuments(filter),
            ActivityLog_js_1.ActivityLogModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);
        // Batch enrich with user and project metadata to eliminate N+1 frontend requests
        const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))];
        const projectIds = [...new Set(logs.map((l) => l.projectId).filter(Boolean))];
        const [users, projects] = await Promise.all([
            User_js_1.UserModel.find({ tenantId: user.tenantId, userId: { $in: userIds } })
                .select('userId name email avatarUrl')
                .lean(),
            Project_js_1.ProjectModel.find({ tenantId: user.tenantId, projectId: { $in: projectIds } })
                .select('projectId name')
                .lean(),
        ]);
        const userMap = new Map((users || []).map((u) => [u.userId, u]));
        const projectMap = new Map((projects || []).map((p) => [p.projectId, p.name]));
        const enrichedLogs = logs.map((log) => ({
            ...log,
            user: userMap.get(log.userId) || {
                name: 'Workspace Member',
                email: '',
                avatarUrl: '',
            },
            projectName: log.projectId ? projectMap.get(log.projectId) || null : null,
        }));
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            logs: enrichedLogs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
