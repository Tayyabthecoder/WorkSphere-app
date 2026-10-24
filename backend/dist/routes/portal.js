"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const Client_js_1 = require("../models/Client.js");
const Tenant_js_1 = require("../models/Tenant.js");
const Project_js_1 = require("../models/Project.js");
const Task_js_1 = require("../models/Task.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const router = (0, express_1.Router)();
const portalRateLimiter = (0, express_rate_limit_1.default)({
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
router.get('/:portalToken', portalRateLimiter, async (req, res) => {
    try {
        const { portalToken } = req.params;
        const client = await Client_js_1.ClientModel.findOne({
            portalToken,
            isPortalActive: true,
        }).lean();
        if (!client) {
            return (0, apiResponse_js_1.sendApiError)(res, {
                code: 'NOT_FOUND',
                message: 'This client portal link is invalid, expired, or has been paused.',
            }, 404);
        }
        const tenant = await Tenant_js_1.TenantModel.findOne({ tenantId: client.tenantId })
            .select('name slug logoUrl')
            .lean();
        // Query projects strictly assigned to this client in this tenant
        const projects = await Project_js_1.ProjectModel.find({
            tenantId: client.tenantId,
            clientId: client.clientId,
            status: { $ne: 'Archived' },
        })
            .select('projectId name description methodology status startDate endDate phases budget colorLabel')
            .lean();
        const projectIds = projects.map((p) => p.projectId);
        const tasks = await Task_js_1.TaskModel.find({
            tenantId: client.tenantId,
            projectId: { $in: projectIds },
        })
            .select('taskId projectId title status priority dueDate completedAt')
            .lean();
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
        return (0, apiResponse_js_1.sendApiResponse)(res, {
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
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
