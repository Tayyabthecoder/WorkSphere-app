"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBytes = formatBytes;
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function formatBytes(bytes) {
    if (!bytes || bytes <= 0)
        return '0 B';
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
const Tenant_js_1 = require("../models/Tenant.js");
const User_js_1 = require("../models/User.js");
const Project_js_1 = require("../models/Project.js");
const Task_js_1 = require("../models/Task.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const EmailTemplate_js_1 = require("../models/EmailTemplate.js");
const File_js_1 = require("../models/File.js");
const TimeEntry_js_1 = require("../models/TimeEntry.js");
const Comment_js_1 = require("../models/Comment.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const id_js_1 = require("../utils/id.js");
const currency_js_1 = require("../utils/currency.js");
const env_js_1 = require("../config/env.js");
const regex_js_1 = require("../utils/regex.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
// Guard: superAdmin only (exempting active impersonation exit)
router.use((req, res, next) => {
    try {
        if (req.path === '/impersonate/end' || req.path === '/impersonate/exit') {
            if (req.user?.impersonated || req.user?.role === 'superAdmin') {
                return next();
            }
        }
        (0, rbac_js_1.assertPermission)(req.user.role, 'tenant:manage');
        next();
    }
    catch (err) {
        return (0, apiResponse_js_1.sendApiError)(res, err, 403);
    }
});
// GET /api/v1/admin/tenants
router.get('/tenants', async (_req, res) => {
    try {
        const [tenants, userAgg, projectAgg, orgAdmins] = await Promise.all([
            Tenant_js_1.TenantModel.find().sort({ createdAt: -1 }).lean(),
            User_js_1.UserModel.aggregate([
                {
                    $group: {
                        _id: '$tenantId',
                        totalUsers: { $sum: 1 },
                        activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
                    },
                },
            ]),
            Project_js_1.ProjectModel.aggregate([
                {
                    $group: {
                        _id: '$tenantId',
                        totalProjects: { $sum: 1 },
                    },
                },
            ]),
            User_js_1.UserModel.find({ role: 'orgAdmin' }).select('tenantId email name').lean(),
        ]);
        const userMap = new Map(userAgg.map((u) => [u._id, u]));
        const projectMap = new Map(projectAgg.map((p) => [p._id, p.totalProjects]));
        const adminMap = new Map(orgAdmins.map((a) => [a.tenantId, a]));
        const enrichedTenants = tenants.map((t) => {
            const uStats = userMap.get(t.tenantId);
            const orgAdmin = adminMap.get(t.tenantId);
            return {
                tenantId: t.tenantId,
                name: t.name,
                slug: t.slug,
                status: t.status,
                plan: t.settings?.plan || 'Free',
                limits: t.settings?.limits || { maxUsers: 50, maxProjects: 20, maxStorageMB: 500 },
                billingNotes: t.settings?.billingNotes || '',
                userCount: uStats?.totalUsers || 0,
                activeUserCount: uStats?.activeUsers || 0,
                projectCount: projectMap.get(t.tenantId) || 0,
                adminEmail: orgAdmin?.email || 'N/A',
                adminName: orgAdmin?.name || 'N/A',
                timezone: t.timezone || 'UTC',
                adminLabels: t.settings?.adminLabels || [],
                createdAt: t.createdAt,
            };
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, enrichedTenants);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/admin/tenants
router.post('/tenants', async (req, res) => {
    try {
        const user = req.user;
        const { name, slug, adminName, adminEmail, adminPassword = 'Password123!', country = '', currency, currencySymbol, } = req.body;
        if (!name || !slug || !adminName || !adminEmail) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'VALIDATION_ERROR', message: 'Name, slug, adminName, and adminEmail are required.' }, 400);
        }
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (!cleanSlug) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'VALIDATION_ERROR', message: 'Invalid subdomain slug format.' }, 400);
        }
        const existingTenant = await Tenant_js_1.TenantModel.findOne({ slug: cleanSlug });
        if (existingTenant) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'VALIDATION_ERROR', message: `Subdomain slug "${cleanSlug}" is already taken.` }, 400);
        }
        const existingUser = await User_js_1.UserModel.findOne({ email: adminEmail.toLowerCase() });
        if (existingUser) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'VALIDATION_ERROR', message: `User with email "${adminEmail}" already exists.` }, 400);
        }
        const tenantId = `tnt_${cleanSlug.replace(/-/g, '_')}_${(0, id_js_1.generateId)('tenant').slice(-6)}`;
        const passwordHash = await bcryptjs_1.default.hash(adminPassword, 12);
        const countryStr = typeof country === 'string' ? country.trim() : '';
        const countryCurrency = countryStr ? (0, currency_js_1.getCurrencyForCountry)(countryStr) : null;
        const resolvedCurrency = (currency || countryCurrency?.code || 'USD').toUpperCase();
        const resolvedSymbol = currencySymbol || currency_js_1.CURRENCY_SYMBOLS[resolvedCurrency] || countryCurrency?.symbol || '$';
        const newTenant = await Tenant_js_1.TenantModel.create({
            tenantId,
            name,
            slug: cleanSlug,
            status: 'active',
            timezone: 'UTC',
            language: 'en',
            country: countryStr,
            settings: {
                plan: 'Free',
                currency: resolvedCurrency,
                currencySymbol: resolvedSymbol,
                country: countryStr,
                dateFormat: 'MM/DD/YYYY',
            },
        });
        const adminUserId = (0, id_js_1.generateId)('user');
        const newAdmin = await User_js_1.UserModel.create({
            userId: adminUserId,
            tenantId,
            email: adminEmail.toLowerCase().trim(),
            passwordHash,
            name: adminName.trim(),
            role: 'orgAdmin',
            provider: 'email',
            emailVerified: true,
            isActive: true,
            department: 'Executive',
        });
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('act'),
            tenantId,
            userId: user.id,
            action: 'provisioned_tenant',
            entityType: 'project',
            entityId: tenantId,
            metadata: { tenantName: name, slug: cleanSlug, plan: 'Free', adminEmail },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            tenant: newTenant,
            admin: {
                userId: newAdmin.userId,
                email: newAdmin.email,
                name: newAdmin.name,
                role: newAdmin.role,
            },
        }, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PATCH /api/v1/admin/tenants/:tenantId
router.patch('/tenants/:tenantId', async (req, res) => {
    try {
        const user = req.user;
        const { tenantId } = req.params;
        const { status, name } = req.body;
        const tenant = await Tenant_js_1.TenantModel.findOne({ tenantId });
        if (!tenant) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: `Tenant "${tenantId}" not found` }, 404);
        }
        if (status && ['active', 'suspended', 'archived'].includes(status)) {
            tenant.status = status;
        }
        if (name) {
            tenant.name = name.trim();
        }
        tenant.updatedAt = new Date();
        await tenant.save();
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('act'),
            tenantId,
            userId: user.id,
            action: 'updated_tenant_status',
            entityType: 'project',
            entityId: tenantId,
            metadata: { newStatus: status },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, tenant);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/admin/overview
router.get('/overview', async (_req, res) => {
    try {
        const [totalTenants, activeTenants, suspendedTenants, archivedTenants, totalUsers, activeUsers, orgAdmins, totalProjects, totalTasks, fileAgg, recentLogs,] = await Promise.all([
            Tenant_js_1.TenantModel.countDocuments(),
            Tenant_js_1.TenantModel.countDocuments({ status: 'active' }),
            Tenant_js_1.TenantModel.countDocuments({ status: 'suspended' }),
            Tenant_js_1.TenantModel.countDocuments({ status: 'archived' }),
            User_js_1.UserModel.countDocuments(),
            User_js_1.UserModel.countDocuments({ isActive: true }),
            User_js_1.UserModel.countDocuments({ role: 'orgAdmin' }),
            Project_js_1.ProjectModel.countDocuments(),
            Task_js_1.TaskModel.countDocuments(),
            File_js_1.FileModel.aggregate([
                { $group: { _id: null, totalBytes: { $sum: '$size' }, count: { $sum: 1 } } },
            ]),
            ActivityLog_js_1.ActivityLogModel.find().sort({ createdAt: -1 }).limit(10).lean(),
        ]);
        // Live MongoDB stats
        let dbStorageBytes = 0;
        let dbDataBytes = 0;
        let dbIndexBytes = 0;
        try {
            if (mongoose_1.default.connection.db) {
                const dbStats = await mongoose_1.default.connection.db.stats();
                dbStorageBytes = Number(dbStats.storageSize) || 0;
                dbDataBytes = Number(dbStats.dataSize) || 0;
                dbIndexBytes = Number(dbStats.indexSize) || 0;
            }
        }
        catch (dbErr) {
            console.warn('[Admin Overview] Failed to fetch MongoDB db.stats():', dbErr);
        }
        const fileStorageBytes = fileAgg[0]?.totalBytes || 0;
        const fileCount = fileAgg[0]?.count || 0;
        // Prefer physical storageSize, fallback to logical dataSize if storageSize is 0
        const effectiveDbBytes = dbStorageBytes > 0 ? dbStorageBytes : dbDataBytes;
        const totalStorageBytes = effectiveDbBytes + fileStorageBytes;
        const storageMB = Math.round((totalStorageBytes / (1024 * 1024)) * 10) / 10;
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            stats: {
                totalTenants,
                activeTenants,
                suspendedTenants,
                archivedTenants,
                totalUsers,
                activeUsers,
                orgAdmins,
                totalProjects,
                totalTasks,
                mrr: 0,
                arr: 0,
                estimatedStorageMB: storageMB > 0 ? storageMB : 1,
                storage: {
                    totalBytes: totalStorageBytes,
                    formatted: formatBytes(totalStorageBytes),
                    dbBytes: dbStorageBytes,
                    dbFormatted: formatBytes(dbStorageBytes),
                    dbDataBytes,
                    dbDataFormatted: formatBytes(dbDataBytes),
                    dbIndexBytes,
                    dbIndexFormatted: formatBytes(dbIndexBytes),
                    filesBytes: fileStorageBytes,
                    filesCount: fileCount,
                    filesFormatted: formatBytes(fileStorageBytes),
                },
            },
            recentLogs: recentLogs.map((log) => ({
                logId: log.logId,
                tenantId: log.tenantId,
                userId: log.userId,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId,
                createdAt: log.createdAt,
            })),
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/admin/audit-log
router.get('/audit-log', async (req, res) => {
    try {
        const { tenantId, action, entityType, fromDate, toDate, page = '1', limit = '30' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
        const skip = (pageNum - 1) * limitNum;
        const query = {};
        if (tenantId && tenantId !== 'all')
            query.tenantId = tenantId;
        if (action)
            query.action = { $regex: (0, regex_js_1.escapeRegex)(String(action)), $options: 'i' };
        if (entityType && entityType !== 'all')
            query.entityType = entityType;
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate)
                query.createdAt.$gte = new Date(String(fromDate));
            if (toDate)
                query.createdAt.$lte = new Date(String(toDate));
        }
        const [total, logs] = await Promise.all([
            ActivityLog_js_1.ActivityLogModel.countDocuments(query),
            ActivityLog_js_1.ActivityLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        ]);
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1,
            },
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/admin/stats (Health & telemetry)
router.get('/stats', async (_req, res) => {
    try {
        const startTime = Date.now();
        const [tenantCount, userCount, projectCount, taskCount] = await Promise.all([
            Tenant_js_1.TenantModel.countDocuments(),
            User_js_1.UserModel.countDocuments(),
            Project_js_1.ProjectModel.countDocuments(),
            Task_js_1.TaskModel.countDocuments(),
        ]);
        const dbLatencyMs = Date.now() - startTime;
        const memoryUsage = process.memoryUsage();
        let dbStorageBytes = 0;
        let dbDataBytes = 0;
        let dbIndexBytes = 0;
        try {
            if (mongoose_1.default.connection.db) {
                const dbStats = await mongoose_1.default.connection.db.stats();
                dbStorageBytes = Number(dbStats.storageSize) || 0;
                dbDataBytes = Number(dbStats.dataSize) || 0;
                dbIndexBytes = Number(dbStats.indexSize) || 0;
            }
        }
        catch {
            // ignore
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
            dbLatencyMs,
            nodeVersion: process.version,
            platform: process.platform,
            memory: {
                rssMB: Math.round(memoryUsage.rss / (1024 * 1024)),
                heapUsedMB: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
                heapTotalMB: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
            },
            database: {
                storageBytes: dbStorageBytes,
                storageFormatted: formatBytes(dbStorageBytes),
                dataBytes: dbDataBytes,
                dataFormatted: formatBytes(dbDataBytes),
                indexBytes: dbIndexBytes,
                indexFormatted: formatBytes(dbIndexBytes),
            },
            counts: {
                tenants: tenantCount,
                users: userCount,
                projects: projectCount,
                tasks: taskCount,
            },
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PATCH /api/v1/admin/tenants/:tenantId/settings (Feature flags, notes, etc.)
router.patch('/tenants/:tenantId/settings', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { settings } = req.body;
        const tenant = await Tenant_js_1.TenantModel.findOne({ tenantId });
        if (!tenant) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: `Tenant ${tenantId} not found` }, 404);
        }
        if (settings) {
            tenant.settings = { ...(tenant.settings || {}), ...settings };
            tenant.markModified('settings');
        }
        await tenant.save();
        return (0, apiResponse_js_1.sendApiResponse)(res, tenant);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/admin/email-templates
router.get('/email-templates', async (_req, res) => {
    try {
        const templates = await EmailTemplate_js_1.EmailTemplateModel.find().sort({ name: 1 }).lean();
        return (0, apiResponse_js_1.sendApiResponse)(res, templates);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/admin/email-templates
router.post('/email-templates', async (req, res) => {
    try {
        const { key, name, subjectLine, htmlBody, textBody, variables } = req.body;
        if (!key || !name || !subjectLine || !htmlBody) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'VALIDATION_ERROR', message: 'key, name, subjectLine, and htmlBody are required' }, 400);
        }
        const templateId = (0, id_js_1.generateId)('emailTemplate');
        const template = await EmailTemplate_js_1.EmailTemplateModel.create({
            templateId,
            key,
            name,
            subjectLine,
            htmlBody,
            textBody: textBody || '',
            variables: variables || [],
            isActive: true,
            lastEditedByUserId: req.user.id,
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, template, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PUT /api/v1/admin/email-templates/:templateId
router.put('/email-templates/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        const { name, subjectLine, htmlBody, textBody, variables, isActive } = req.body;
        const template = await EmailTemplate_js_1.EmailTemplateModel.findOne({ templateId });
        if (!template) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: 'Template not found' }, 404);
        }
        if (name !== undefined)
            template.name = name;
        if (subjectLine !== undefined)
            template.subjectLine = subjectLine;
        if (htmlBody !== undefined)
            template.htmlBody = htmlBody;
        if (textBody !== undefined)
            template.textBody = textBody;
        if (variables !== undefined)
            template.variables = variables;
        if (isActive !== undefined)
            template.isActive = isActive;
        template.lastEditedByUserId = req.user.id;
        await template.save();
        return (0, apiResponse_js_1.sendApiResponse)(res, template);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
const DEFAULT_RETENTION_POLICY = {
    activityLogRetentionDays: 90,
    completedTasksRetentionDays: 180,
    inactiveProjectArchiveDays: 365,
    purgedRecordsWindowDays: 30,
    autoArchiveEnabled: false,
    autoPurgeEnabled: false,
};
const DEFAULT_SECURITY_POLICY = {
    mfaRequired: false,
    sessionTimeoutMinutes: 480,
    passwordMinLength: 8,
    requireSpecialChar: true,
    requireNumber: true,
    ipAllowlist: [],
    ipBlocklist: [],
    ssoEnabled: false,
};
const DEFAULT_PLATFORM_CONFIG = {
    maintenanceMode: false,
    maintenanceMessage: 'WorkSphere is undergoing scheduled system maintenance. We will be back shortly.',
    selfRegistrationEnabled: true,
    maxFileSizeMB: 50,
    defaultFeatureFlags: {
        clientPortal: true,
        capacityPlanning: true,
        documentEditor: true,
        workflowAutomation: false,
    },
};
async function getOrCreatePlatformTenant() {
    let platform = await Tenant_js_1.TenantModel.findOne({ tenantId: 'tnt_platform' });
    if (!platform) {
        platform = await Tenant_js_1.TenantModel.create({
            tenantId: 'tnt_platform',
            name: 'WorkSphere Platform',
            slug: 'platform',
            status: 'active',
            settings: {
                retentionPolicy: DEFAULT_RETENTION_POLICY,
                securityPolicy: DEFAULT_SECURITY_POLICY,
                platformConfig: DEFAULT_PLATFORM_CONFIG,
            },
        });
    }
    return platform;
}
// GET /api/v1/admin/retention
router.get('/retention', async (_req, res) => {
    try {
        const platform = await getOrCreatePlatformTenant();
        const policy = {
            ...DEFAULT_RETENTION_POLICY,
            ...(platform.settings?.retentionPolicy || {}),
        };
        return (0, apiResponse_js_1.sendApiResponse)(res, policy);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PATCH /api/v1/admin/retention
router.patch('/retention', async (req, res) => {
    try {
        const body = req.body;
        const platform = await getOrCreatePlatformTenant();
        if (!platform.settings)
            platform.settings = {};
        const currentPolicy = {
            ...DEFAULT_RETENTION_POLICY,
            ...(platform.settings.retentionPolicy || {}),
        };
        if (body.activityLogRetentionDays !== undefined) {
            currentPolicy.activityLogRetentionDays = Number(body.activityLogRetentionDays) || 90;
        }
        if (body.completedTasksRetentionDays !== undefined) {
            currentPolicy.completedTasksRetentionDays = Number(body.completedTasksRetentionDays) || 180;
        }
        if (body.inactiveProjectArchiveDays !== undefined) {
            currentPolicy.inactiveProjectArchiveDays = Number(body.inactiveProjectArchiveDays) || 365;
        }
        if (body.purgedRecordsWindowDays !== undefined) {
            currentPolicy.purgedRecordsWindowDays = Number(body.purgedRecordsWindowDays) || 30;
        }
        if (body.autoArchiveEnabled !== undefined) {
            currentPolicy.autoArchiveEnabled = Boolean(body.autoArchiveEnabled);
        }
        if (body.autoPurgeEnabled !== undefined) {
            currentPolicy.autoPurgeEnabled = Boolean(body.autoPurgeEnabled);
        }
        platform.settings.retentionPolicy = currentPolicy;
        platform.markModified('settings');
        await platform.save();
        return (0, apiResponse_js_1.sendApiResponse)(res, currentPolicy);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/admin/retention/run
router.post('/retention/run', async (req, res) => {
    try {
        const { opType = 'purge_logs' } = req.body;
        const platform = await getOrCreatePlatformTenant();
        const policy = {
            ...DEFAULT_RETENTION_POLICY,
            ...(platform.settings?.retentionPolicy || {}),
        };
        let affectedCount = 0;
        let message = '';
        if (opType === 'purge_logs') {
            const cutoff = new Date(Date.now() - (policy.activityLogRetentionDays || 90) * 86400000);
            const result = await ActivityLog_js_1.ActivityLogModel.deleteMany({ createdAt: { $lt: cutoff } });
            affectedCount = result.deletedCount || 0;
            message = `Purged ${affectedCount} activity logs older than ${policy.activityLogRetentionDays} days`;
        }
        else if (opType === 'archive_inactive_projects') {
            const cutoff = new Date(Date.now() - (policy.inactiveProjectArchiveDays || 365) * 86400000);
            const result = await Project_js_1.ProjectModel.updateMany({ updatedAt: { $lt: cutoff }, status: { $ne: 'Archived' } }, { $set: { status: 'Archived' } });
            affectedCount = result.modifiedCount || 0;
            message = `Archived ${affectedCount} inactive projects`;
        }
        else if (opType === 'purge_completed_tasks') {
            const cutoff = new Date(Date.now() - (policy.completedTasksRetentionDays || 180) * 86400000);
            const result = await Task_js_1.TaskModel.deleteMany({
                status: 'Done',
                updatedAt: { $lt: cutoff },
            });
            affectedCount = result.deletedCount || 0;
            message = `Purged ${affectedCount} completed tasks older than ${policy.completedTasksRetentionDays} days`;
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            opType,
            affectedCount,
            message,
            executedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/admin/security-policy
router.get('/security-policy', async (_req, res) => {
    try {
        const platform = await getOrCreatePlatformTenant();
        const policy = {
            ...DEFAULT_SECURITY_POLICY,
            ...(platform.settings?.securityPolicy || {}),
        };
        return (0, apiResponse_js_1.sendApiResponse)(res, policy);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PATCH /api/v1/admin/security-policy (or PUT)
router.patch('/security-policy', async (req, res) => {
    try {
        const body = req.body;
        const platform = await getOrCreatePlatformTenant();
        if (!platform.settings)
            platform.settings = {};
        const currentPolicy = {
            ...DEFAULT_SECURITY_POLICY,
            ...(platform.settings.securityPolicy || {}),
        };
        if (body.mfaRequired !== undefined)
            currentPolicy.mfaRequired = Boolean(body.mfaRequired);
        if (body.sessionTimeoutMinutes !== undefined) {
            currentPolicy.sessionTimeoutMinutes = Math.max(5, Math.min(10080, Number(body.sessionTimeoutMinutes) || 480));
        }
        if (body.passwordMinLength !== undefined) {
            currentPolicy.passwordMinLength = Math.max(6, Math.min(64, Number(body.passwordMinLength) || 8));
        }
        if (body.requireSpecialChar !== undefined)
            currentPolicy.requireSpecialChar = Boolean(body.requireSpecialChar);
        if (body.requireNumber !== undefined)
            currentPolicy.requireNumber = Boolean(body.requireNumber);
        if (Array.isArray(body.ipAllowlist))
            currentPolicy.ipAllowlist = body.ipAllowlist;
        if (Array.isArray(body.ipBlocklist))
            currentPolicy.ipBlocklist = body.ipBlocklist;
        if (body.ssoEnabled !== undefined)
            currentPolicy.ssoEnabled = Boolean(body.ssoEnabled);
        platform.settings.securityPolicy = currentPolicy;
        platform.markModified('settings');
        await platform.save();
        return (0, apiResponse_js_1.sendApiResponse)(res, currentPolicy);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// ==========================================
// 1. IMPERSONATION ENDPOINTS
// ==========================================
// POST /api/v1/admin/tenants/:tenantId/impersonate
router.post('/tenants/:tenantId/impersonate', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const superAdmin = req.user;
        const tenant = await Tenant_js_1.TenantModel.findOne({ tenantId });
        if (!tenant) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: `Tenant "${tenantId}" not found` }, 404);
        }
        if (tenant.status === 'archived') {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'TENANT_ARCHIVED', message: 'Cannot impersonate an archived tenant' }, 400);
        }
        // Find orgAdmin or another active user in this tenant
        let targetUser = await User_js_1.UserModel.findOne({ tenantId, role: 'orgAdmin', isActive: true }).lean();
        if (!targetUser) {
            targetUser = await User_js_1.UserModel.findOne({ tenantId, isActive: true }).lean();
        }
        if (!targetUser) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NO_ACTIVE_USERS', message: 'No active user found in this workspace to impersonate' }, 400);
        }
        const sessionId = (0, id_js_1.generateId)('act').replace('act_', 'imp_');
        const tokenPayload = {
            userId: targetUser.userId,
            id: targetUser.userId,
            name: targetUser.name,
            email: targetUser.email,
            tenantId: tenant.tenantId,
            role: targetUser.role,
            impersonated: true,
            impersonatedBy: superAdmin.id,
            impersonationSessionId: sessionId,
        };
        const accessToken = jsonwebtoken_1.default.sign(tokenPayload, env_js_1.ENV.JWT_SECRET, { expiresIn: '2h' });
        // Store session info in tenant
        if (!tenant.settings)
            tenant.settings = {};
        tenant.settings.impersonationSession = {
            token: sessionId,
            startedByUserId: superAdmin.id,
            expiresAt: new Date(Date.now() + 2 * 3600 * 1000),
        };
        tenant.markModified('settings');
        await tenant.save();
        // Log to ActivityLog with impersonatedBy
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('act'),
            tenantId: tenant.tenantId,
            userId: superAdmin.id,
            action: 'impersonation_started',
            entityType: 'tenant',
            entityId: tenant.tenantId,
            metadata: {
                superAdminId: superAdmin.id,
                superAdminEmail: superAdmin.email,
                targetUserId: targetUser.userId,
                targetUserEmail: targetUser.email,
                tenantName: tenant.name,
                sessionId,
            },
            impersonatedBy: superAdmin.id,
            impersonationSessionId: sessionId,
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            accessToken,
            user: {
                ...targetUser,
                isImpersonated: true,
                impersonatedBy: superAdmin.id,
                impersonationSessionId: sessionId,
            },
            tenant: {
                tenantId: tenant.tenantId,
                name: tenant.name,
                slug: tenant.slug,
            },
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/admin/impersonate/end (or /api/v1/admin/impersonate/exit)
const handleExitImpersonation = async (req, res) => {
    try {
        const user = req.user;
        const superAdminId = user.impersonatedBy;
        if (user.tenantId && user.tenantId !== 'tnt_platform') {
            const tenant = await Tenant_js_1.TenantModel.findOne({ tenantId: user.tenantId });
            if (tenant?.settings?.impersonationSession) {
                delete tenant.settings.impersonationSession;
                tenant.markModified('settings');
                await tenant.save();
            }
        }
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('act'),
            tenantId: user.tenantId || 'tnt_platform',
            userId: user.id,
            action: 'impersonation_ended',
            entityType: 'tenant',
            entityId: user.tenantId || 'platform',
            metadata: {
                superAdminId,
                sessionId: user.impersonationSessionId,
            },
            impersonatedBy: superAdminId,
            impersonationSessionId: user.impersonationSessionId,
        });
        // If superAdmin ID was stored, generate fresh superAdmin access token
        let superAdminToken = null;
        let superAdminUser = null;
        if (superAdminId) {
            const saUser = await User_js_1.UserModel.findOne({ userId: superAdminId }).lean();
            if (saUser) {
                superAdminUser = {
                    userId: saUser.userId,
                    id: saUser.userId,
                    name: saUser.name,
                    email: saUser.email,
                    tenantId: saUser.tenantId,
                    role: saUser.role,
                };
                superAdminToken = jsonwebtoken_1.default.sign(superAdminUser, env_js_1.ENV.JWT_SECRET, { expiresIn: env_js_1.ENV.JWT_ACCESS_EXPIRES_IN });
            }
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            message: 'Impersonation session terminated',
            accessToken: superAdminToken,
            user: superAdminUser,
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
};
router.post('/impersonate/end', handleExitImpersonation);
router.post('/impersonate/exit', handleExitImpersonation);
// ==========================================
// 2. TENANT DEEP-DIVE ENDPOINTS
// ==========================================
// GET /api/v1/admin/tenants/:tenantId/detail
router.get('/tenants/:tenantId/detail', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const tenant = await Tenant_js_1.TenantModel.findOne({ tenantId }).lean();
        if (!tenant) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: `Tenant "${tenantId}" not found` }, 404);
        }
        const [totalUsers, activeUsers, orgAdmin, projects, tasks, timeAgg, fileAgg, latestLog,] = await Promise.all([
            User_js_1.UserModel.countDocuments({ tenantId }),
            User_js_1.UserModel.countDocuments({ tenantId, isActive: true }),
            User_js_1.UserModel.findOne({ tenantId, role: 'orgAdmin' }).select('userId name email avatarUrl department createdAt').lean(),
            Project_js_1.ProjectModel.find({ tenantId }).select('projectId name status methodology startDate endDate createdAt budget').lean(),
            Task_js_1.TaskModel.find({ tenantId }).select('taskId status priority dueDate sprintId projectId').lean(),
            TimeEntry_js_1.TimeEntryModel.aggregate([
                { $match: { tenantId } },
                { $group: { _id: null, totalMinutes: { $sum: '$duration' }, count: { $sum: 1 } } },
            ]),
            File_js_1.FileModel.aggregate([
                { $match: { tenantId } },
                { $group: { _id: null, totalBytes: { $sum: '$size' }, count: { $sum: 1 } } },
            ]),
            ActivityLog_js_1.ActivityLogModel.findOne({ tenantId }).sort({ createdAt: -1 }).select('createdAt action userId').lean(),
        ]);
        // Compute task breakdown
        const taskBreakdown = {
            total: tasks.length,
            done: tasks.filter((t) => t.status === 'Done').length,
            inProgress: tasks.filter((t) => t.status === 'In Progress' || t.status === 'In Review').length,
            toDo: tasks.filter((t) => t.status === 'To Do' || t.status === 'Backlog').length,
        };
        // Compute project breakdown
        const projectBreakdown = {
            total: projects.length,
            active: projects.filter((p) => p.status === 'Active').length,
            onHold: projects.filter((p) => p.status === 'On Hold').length,
            completed: projects.filter((p) => p.status === 'Completed').length,
            archived: projects.filter((p) => p.status === 'Archived').length,
            byMethodology: {
                agile: projects.filter((p) => p.methodology === 'Agile').length,
                waterfall: projects.filter((p) => p.methodology === 'Waterfall').length,
                hybrid: projects.filter((p) => p.methodology === 'Hybrid').length,
            },
        };
        const totalHoursLogged = Math.round(((timeAgg[0]?.totalMinutes || 0) / 60) * 10) / 10;
        const storageBytes = fileAgg[0]?.totalBytes || 0;
        const storageMB = Math.round((storageBytes / (1024 * 1024)) * 10) / 10;
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            tenant: {
                tenantId: tenant.tenantId,
                name: tenant.name,
                slug: tenant.slug,
                status: tenant.status,
                plan: tenant.settings?.plan || 'Free',
                limits: tenant.settings?.limits || { maxUsers: 50, maxProjects: 20, maxStorageMB: 500 },
                billingNotes: tenant.settings?.billingNotes || '',
                timezone: tenant.timezone || 'UTC',
                language: tenant.language || 'en',
                country: tenant.country || '',
                currency: tenant.settings?.currency || 'USD',
                currencySymbol: tenant.settings?.currencySymbol || '$',
                featureFlags: tenant.settings?.featureFlags || {},
                adminNotes: tenant.settings?.adminNotes || '',
                adminNotesUpdatedAt: tenant.settings?.adminNotesUpdatedAt || null,
                adminLabels: tenant.settings?.adminLabels || [],
                createdAt: tenant.createdAt,
                updatedAt: tenant.updatedAt,
            },
            admin: orgAdmin,
            stats: {
                totalUsers,
                activeUsers,
                totalProjects: projects.length,
                projectBreakdown,
                totalTasks: tasks.length,
                taskBreakdown,
                totalHoursLogged,
                totalTimeEntries: timeAgg[0]?.count || 0,
                totalFiles: fileAgg[0]?.count || 0,
                storageBytes,
                storageMB,
                storageFormatted: formatBytes(storageBytes),
                lastActiveAt: latestLog?.createdAt || tenant.updatedAt,
            },
            recentProjects: projects.slice(0, 5),
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/admin/tenants/:tenantId/members
router.get('/tenants/:tenantId/members', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const members = await User_js_1.UserModel.find({ tenantId })
            .select('userId name email role department isActive avatarUrl createdAt')
            .sort({ createdAt: -1 })
            .lean();
        return (0, apiResponse_js_1.sendApiResponse)(res, members);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/admin/tenants/:tenantId/projects
router.get('/tenants/:tenantId/projects', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const [projects, tasks] = await Promise.all([
            Project_js_1.ProjectModel.find({ tenantId }).sort({ createdAt: -1 }).lean(),
            Task_js_1.TaskModel.aggregate([
                { $match: { tenantId } },
                { $group: { _id: '$projectId', totalTasks: { $sum: 1 }, completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } } } },
            ]),
        ]);
        const taskMap = new Map(tasks.map((t) => [t._id, t]));
        const enrichedProjects = projects.map((p) => {
            const tStat = taskMap.get(p.projectId) || { totalTasks: 0, completedTasks: 0 };
            return {
                projectId: p.projectId,
                name: p.name,
                description: p.description,
                status: p.status,
                methodology: p.methodology,
                startDate: p.startDate,
                endDate: p.endDate,
                memberCount: (p.members || []).length,
                taskCount: tStat.totalTasks,
                completedTaskCount: tStat.completedTasks,
                budget: p.budget,
                createdAt: p.createdAt,
            };
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, enrichedProjects);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/admin/tenants/:tenantId/activity-timeline
router.get('/tenants/:tenantId/activity-timeline', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
        const timeline = await ActivityLog_js_1.ActivityLogModel.aggregate([
            { $match: { tenantId, createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        return (0, apiResponse_js_1.sendApiResponse)(res, timeline.map((item) => ({ date: item._id, count: item.count })));
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// DELETE /api/v1/admin/tenants/:tenantId
router.delete('/tenants/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { purge } = req.query;
        const user = req.user;
        const tenant = await Tenant_js_1.TenantModel.findOne({ tenantId });
        if (!tenant) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: `Tenant "${tenantId}" not found` }, 404);
        }
        if (tenant.tenantId === 'tnt_platform') {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'FORBIDDEN', message: 'Platform root tenant cannot be deleted' }, 403);
        }
        if (purge === 'true') {
            // Hard purge all documents associated with this tenant
            await Promise.all([
                Task_js_1.TaskModel.deleteMany({ tenantId }),
                Project_js_1.ProjectModel.deleteMany({ tenantId }),
                TimeEntry_js_1.TimeEntryModel.deleteMany({ tenantId }),
                File_js_1.FileModel.deleteMany({ tenantId }),
                Comment_js_1.CommentModel.deleteMany({ tenantId }),
                User_js_1.UserModel.deleteMany({ tenantId }),
                ActivityLog_js_1.ActivityLogModel.deleteMany({ tenantId }),
                Tenant_js_1.TenantModel.deleteOne({ tenantId }),
            ]);
            await ActivityLog_js_1.ActivityLogModel.create({
                logId: (0, id_js_1.generateId)('act'),
                tenantId: 'tnt_platform',
                userId: user.id,
                action: 'deleted_tenant_purged',
                entityType: 'tenant',
                entityId: tenantId,
                metadata: { tenantName: tenant.name, slug: tenant.slug, purgedBy: user.email },
            });
            return (0, apiResponse_js_1.sendApiResponse)(res, { message: `Tenant ${tenantId} and all associated data permanently purged.` });
        }
        else {
            // Soft-delete / Archive
            tenant.status = 'archived';
            tenant.updatedAt = new Date();
            await tenant.save();
            await ActivityLog_js_1.ActivityLogModel.create({
                logId: (0, id_js_1.generateId)('act'),
                tenantId,
                userId: user.id,
                action: 'archived_tenant',
                entityType: 'tenant',
                entityId: tenantId,
                metadata: { tenantName: tenant.name, slug: tenant.slug, archivedBy: user.email },
            });
            return (0, apiResponse_js_1.sendApiResponse)(res, { message: `Tenant ${tenantId} has been archived.`, tenant });
        }
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// ==========================================
// 3. PLAN & LIMITS MANAGEMENT
// ==========================================
// PATCH /api/v1/admin/tenants/:tenantId/plan
router.patch('/tenants/:tenantId/plan', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { plan, limits, billingNotes } = req.body;
        const user = req.user;
        const tenant = await Tenant_js_1.TenantModel.findOne({ tenantId });
        if (!tenant) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: `Tenant "${tenantId}" not found` }, 404);
        }
        if (!tenant.settings)
            tenant.settings = {};
        if (plan !== undefined)
            tenant.settings.plan = plan;
        if (limits !== undefined) {
            tenant.settings.limits = {
                ...(tenant.settings.limits || {}),
                ...limits,
            };
        }
        if (billingNotes !== undefined)
            tenant.settings.billingNotes = billingNotes;
        tenant.updatedAt = new Date();
        tenant.markModified('settings');
        await tenant.save();
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('act'),
            tenantId,
            userId: user.id,
            action: 'updated_tenant_plan',
            entityType: 'tenant',
            entityId: tenantId,
            metadata: { plan, limits, billingNotes },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            tenantId: tenant.tenantId,
            plan: tenant.settings.plan,
            limits: tenant.settings.limits,
            billingNotes: tenant.settings.billingNotes,
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// ==========================================
// 4. GLOBAL SEARCH ENDPOINT
// ==========================================
// GET /api/v1/admin/search?q=...
router.get('/search', async (req, res) => {
    try {
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        if (!q || q.length < 2) {
            return (0, apiResponse_js_1.sendApiResponse)(res, { tenants: [], users: [], projects: [] });
        }
        const regex = new RegExp((0, regex_js_1.escapeRegex)(q), 'i');
        const [tenants, users, projects] = await Promise.all([
            Tenant_js_1.TenantModel.find({
                $or: [{ name: regex }, { slug: regex }, { tenantId: regex }],
            })
                .select('tenantId name slug status settings.plan createdAt')
                .limit(8)
                .lean(),
            User_js_1.UserModel.find({
                $or: [{ name: regex }, { email: regex }, { userId: regex }],
            })
                .select('userId name email tenantId role department isActive')
                .limit(8)
                .lean(),
            Project_js_1.ProjectModel.find({
                $or: [{ name: regex }, { projectId: regex }],
            })
                .select('projectId name tenantId status methodology createdAt')
                .limit(8)
                .lean(),
        ]);
        return (0, apiResponse_js_1.sendApiResponse)(res, { tenants, users, projects });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// ==========================================
// 5. PLATFORM ANALYTICS
// ==========================================
// GET /api/v1/admin/analytics
router.get('/analytics', async (_req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
        const [tenantRegistrations, activeUsersList, taskStatusAgg, projectMethodologyAgg, topTenantsAgg, allTenants, recentActiveTenants,] = await Promise.all([
            // Tenant registrations per day (30 days)
            Tenant_js_1.TenantModel.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            // Unique active users in last 30 days
            ActivityLog_js_1.ActivityLogModel.distinct('userId', { createdAt: { $gte: thirtyDaysAgo } }),
            // Task breakdown
            Task_js_1.TaskModel.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            // Project methodology breakdown
            Project_js_1.ProjectModel.aggregate([
                { $group: { _id: '$methodology', count: { $sum: 1 } } },
            ]),
            // Top tenants by task deliverables
            Task_js_1.TaskModel.aggregate([
                { $group: { _id: '$tenantId', taskCount: { $sum: 1 } } },
                { $sort: { taskCount: -1 } },
                { $limit: 10 },
            ]),
            // All tenants
            Tenant_js_1.TenantModel.find().select('tenantId name slug status createdAt').lean(),
            // Tenants with activity in last 30d
            ActivityLog_js_1.ActivityLogModel.distinct('tenantId', { createdAt: { $gte: thirtyDaysAgo } }),
        ]);
        const activeTenantSet = new Set(recentActiveTenants);
        const tenantMap = new Map(allTenants.map((t) => [t.tenantId, t]));
        const topTenants = topTenantsAgg.map((item) => {
            const t = tenantMap.get(item._id);
            return {
                tenantId: item._id,
                name: t?.name || item._id,
                slug: t?.slug || '',
                taskCount: item.taskCount,
            };
        });
        const inactiveTenants = allTenants
            .filter((t) => !activeTenantSet.has(t.tenantId) && t.tenantId !== 'tnt_platform')
            .slice(0, 10);
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            tenantRegistrations: tenantRegistrations.map((r) => ({ date: r._id, count: r.count })),
            thirtyDayMAU: activeUsersList.length,
            taskStatusDistribution: taskStatusAgg.map((s) => ({ status: s._id || 'Unknown', count: s.count })),
            projectMethodologyDistribution: projectMethodologyAgg.map((m) => ({ methodology: m._id || 'Standard', count: m.count })),
            topTenants,
            inactiveTenants,
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// ==========================================
// 6. PLATFORM CONFIGURATION
// ==========================================
// GET /api/v1/admin/platform-config
router.get('/platform-config', async (_req, res) => {
    try {
        const platform = await getOrCreatePlatformTenant();
        const config = {
            ...DEFAULT_PLATFORM_CONFIG,
            ...(platform.settings?.platformConfig || {}),
        };
        return (0, apiResponse_js_1.sendApiResponse)(res, config);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PATCH /api/v1/admin/platform-config
router.patch('/platform-config', async (req, res) => {
    try {
        const body = req.body;
        const platform = await getOrCreatePlatformTenant();
        if (!platform.settings)
            platform.settings = {};
        const currentConfig = {
            ...DEFAULT_PLATFORM_CONFIG,
            ...(platform.settings.platformConfig || {}),
        };
        if (body.maintenanceMode !== undefined)
            currentConfig.maintenanceMode = Boolean(body.maintenanceMode);
        if (body.maintenanceMessage !== undefined)
            currentConfig.maintenanceMessage = String(body.maintenanceMessage).trim();
        if (body.selfRegistrationEnabled !== undefined)
            currentConfig.selfRegistrationEnabled = Boolean(body.selfRegistrationEnabled);
        if (body.maxFileSizeMB !== undefined)
            currentConfig.maxFileSizeMB = Number(body.maxFileSizeMB) || 50;
        if (body.defaultFeatureFlags !== undefined && typeof body.defaultFeatureFlags === 'object') {
            currentConfig.defaultFeatureFlags = {
                ...currentConfig.defaultFeatureFlags,
                ...body.defaultFeatureFlags,
            };
        }
        platform.settings.platformConfig = currentConfig;
        platform.markModified('settings');
        await platform.save();
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('act'),
            tenantId: 'tnt_platform',
            userId: req.user.id,
            action: 'platform_config_updated',
            entityType: 'system',
            entityId: 'platform_config',
            metadata: currentConfig,
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, currentConfig);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// ==========================================
// 7. CROSS-TENANT USER LOOKUP & GDPR
// ==========================================
// GET /api/v1/admin/users
router.get('/users', async (req, res) => {
    try {
        const { q, tenantId, role, status, page = '1', limit = '25' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
        const skip = (pageNum - 1) * limitNum;
        const query = {};
        if (tenantId && tenantId !== 'all')
            query.tenantId = tenantId;
        if (role && role !== 'all')
            query.role = role;
        if (status === 'active')
            query.isActive = true;
        if (status === 'inactive')
            query.isActive = false;
        if (q) {
            const regex = new RegExp((0, regex_js_1.escapeRegex)(String(q).trim()), 'i');
            query.$or = [{ name: regex }, { email: regex }, { userId: regex }];
        }
        const [total, users, tenants] = await Promise.all([
            User_js_1.UserModel.countDocuments(query),
            User_js_1.UserModel.find(query)
                .select('userId name email tenantId role department isActive avatarUrl createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Tenant_js_1.TenantModel.find().select('tenantId name slug').lean(),
        ]);
        const tenantMap = new Map(tenants.map((t) => [t.tenantId, t.name]));
        const enrichedUsers = users.map((u) => ({
            ...u,
            tenantName: tenantMap.get(u.tenantId) || u.tenantId,
        }));
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            users: enrichedUsers,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1,
            },
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/admin/users/:userId
router.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User_js_1.UserModel.findOne({ userId }).select('-passwordHash -refreshTokenHash').lean();
        if (!user) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
        }
        const [tenant, tasksCount, timeCount] = await Promise.all([
            Tenant_js_1.TenantModel.findOne({ tenantId: user.tenantId }).select('tenantId name slug status').lean(),
            Task_js_1.TaskModel.countDocuments({ assignees: user.userId }),
            TimeEntry_js_1.TimeEntryModel.countDocuments({ userId: user.userId }),
        ]);
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            user,
            tenant,
            stats: {
                assignedTasks: tasksCount,
                loggedTimeEntries: timeCount,
            },
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PATCH /api/v1/admin/users/:userId/status
router.patch('/users/:userId/status', async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;
        const adminUser = req.user;
        if (isActive === undefined) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'VALIDATION_ERROR', message: 'isActive boolean is required' }, 400);
        }
        const user = await User_js_1.UserModel.findOne({ userId });
        if (!user) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
        }
        user.isActive = Boolean(isActive);
        user.updatedAt = new Date();
        await user.save();
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('act'),
            tenantId: user.tenantId,
            userId: adminUser.id,
            action: user.isActive ? 'user_activated_by_admin' : 'user_deactivated_by_admin',
            entityType: 'user',
            entityId: user.userId,
            metadata: { targetEmail: user.email, newStatus: user.isActive },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, { userId: user.userId, isActive: user.isActive });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/admin/users/:userId/reset-password
router.post('/users/:userId/reset-password', async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;
        const adminUser = req.user;
        const user = await User_js_1.UserModel.findOne({ userId });
        if (!user) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
        }
        const tempPassword = newPassword?.trim() || `WsPass${Math.random().toString(36).slice(-6)}!`;
        const passwordHash = await bcryptjs_1.default.hash(tempPassword, 12);
        user.passwordHash = passwordHash;
        user.updatedAt = new Date();
        await user.save();
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('act'),
            tenantId: user.tenantId,
            userId: adminUser.id,
            action: 'user_password_reset_by_admin',
            entityType: 'user',
            entityId: user.userId,
            metadata: { targetEmail: user.email },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            message: 'Password reset successful',
            temporaryPassword: tempPassword,
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/admin/users/:userId/gdpr-export
router.post('/users/:userId/gdpr-export', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User_js_1.UserModel.findOne({ userId }).select('-passwordHash -refreshTokenHash').lean();
        if (!user) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
        }
        const [tasks, timeEntries, comments, activity] = await Promise.all([
            Task_js_1.TaskModel.find({ assignees: userId }).select('taskId title status priority dueDate createdAt').lean(),
            TimeEntry_js_1.TimeEntryModel.find({ userId }).lean(),
            Comment_js_1.CommentModel.find({ authorId: userId }).select('commentId content taskId createdAt').lean(),
            ActivityLog_js_1.ActivityLogModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
        ]);
        const exportBundle = {
            exportMetadata: {
                exportedAt: new Date().toISOString(),
                exportedBy: req.user.email,
                complianceStandard: 'GDPR Article 15 / CCPA Data Portability',
            },
            profile: user,
            assignedTasks: tasks,
            timeEntries,
            comments,
            recentActivity: activity,
        };
        return (0, apiResponse_js_1.sendApiResponse)(res, exportBundle);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// ==========================================
// 8. SUPER ADMIN ROSTER & PLATFORM FEED
// ==========================================
// GET /api/v1/admin/super-admins
router.get('/super-admins', async (_req, res) => {
    try {
        const admins = await User_js_1.UserModel.find({ role: 'superAdmin' })
            .select('userId name email tenantId isActive avatarUrl createdAt updatedAt')
            .sort({ createdAt: 1 })
            .lean();
        return (0, apiResponse_js_1.sendApiResponse)(res, admins);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/admin/platform-feed
router.get('/platform-feed', async (_req, res) => {
    try {
        const PLATFORM_ACTIONS = [
            'provisioned_tenant',
            'updated_tenant_status',
            'archived_tenant',
            'deleted_tenant_purged',
            'impersonation_started',
            'impersonation_ended',
            'updated_tenant_plan',
            'platform_config_updated',
            'user_activated_by_admin',
            'user_deactivated_by_admin',
            'user_password_reset_by_admin',
        ];
        const feed = await ActivityLog_js_1.ActivityLogModel.find({ action: { $in: PLATFORM_ACTIONS } })
            .sort({ createdAt: -1 })
            .limit(35)
            .lean();
        return (0, apiResponse_js_1.sendApiResponse)(res, feed);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
