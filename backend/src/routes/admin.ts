import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

import { TenantModel } from '../models/Tenant.js';
import { UserModel } from '../models/User.js';
import { ProjectModel } from '../models/Project.js';
import { TaskModel } from '../models/Task.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { EmailTemplateModel } from '../models/EmailTemplate.js';
import { FileModel } from '../models/File.js';
import { TimeEntryModel } from '../models/TimeEntry.js';
import { CommentModel } from '../models/Comment.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { generateId } from '../utils/id.js';
import { CURRENCY_SYMBOLS, getCurrencyForCountry } from '../utils/currency.js';
import { ENV } from '../config/env.js';
import { escapeRegex } from '../utils/regex.js';

const router = Router();
router.use(verifyAuth);

// Guard: superAdmin only (exempting active impersonation exit)
router.use((req: Request, res: Response, next) => {
  try {
    if (req.path === '/impersonate/end' || req.path === '/impersonate/exit') {
      if (req.user?.impersonated || req.user?.role === 'superAdmin') {
        return next();
      }
    }
    assertPermission(req.user!.role, 'tenant:manage');
    next();
  } catch (err) {
    return sendApiError(res, err, 403);
  }
});

// GET /api/v1/admin/tenants
router.get('/tenants', async (_req: Request, res: Response) => {
  try {
    const [tenants, userAgg, projectAgg, orgAdmins] = await Promise.all([
      TenantModel.find().sort({ createdAt: -1 }).lean() as any,
      UserModel.aggregate([
        {
          $group: {
            _id: '$tenantId',
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          },
        },
      ]),
      ProjectModel.aggregate([
        {
          $group: {
            _id: '$tenantId',
            totalProjects: { $sum: 1 },
          },
        },
      ]),
      UserModel.find({ role: 'orgAdmin' }).select('tenantId email name').lean() as any,
    ]);

    const userMap = new Map(userAgg.map((u: any) => [u._id, u]));
    const projectMap = new Map(projectAgg.map((p: any) => [p._id, p.totalProjects]));
    const adminMap = new Map<string, any>(orgAdmins.map((a: any) => [a.tenantId, a]));

    const enrichedTenants = tenants.map((t: any) => {
      const uStats = userMap.get(t.tenantId);
      const orgAdmin = adminMap.get(t.tenantId) as any;

      return {
        tenantId: t.tenantId,
        name: t.name,
        slug: t.slug,
        status: t.status,
        plan: t.settings?.plan || 'Free',
        limits: t.settings?.limits || { maxUsers: 50, maxProjects: 20, maxStorageMB: 500 },
        billingNotes: (t.settings?.billingNotes as string) || '',
        userCount: uStats?.totalUsers || 0,
        activeUserCount: uStats?.activeUsers || 0,
        projectCount: projectMap.get(t.tenantId) || 0,
        adminEmail: orgAdmin?.email || 'N/A',
        adminName: orgAdmin?.name || 'N/A',
        timezone: t.timezone || 'UTC',
        adminLabels: (t.settings?.adminLabels as string[]) || [],
        createdAt: t.createdAt,
      };
    });

    return sendApiResponse(res, enrichedTenants);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/admin/tenants
router.post('/tenants', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      name,
      slug,
      adminName,
      adminEmail,
      adminPassword = 'Password123!',
      country = '',
      currency,
      currencySymbol,
    } = req.body;

    if (!name || !slug || !adminName || !adminEmail) {
      return sendApiError(res, { code: 'VALIDATION_ERROR', message: 'Name, slug, adminName, and adminEmail are required.' }, 400);
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanSlug) {
      return sendApiError(res, { code: 'VALIDATION_ERROR', message: 'Invalid subdomain slug format.' }, 400);
    }

    const existingTenant = await TenantModel.findOne({ slug: cleanSlug });
    if (existingTenant) {
      return sendApiError(res, { code: 'VALIDATION_ERROR', message: `Subdomain slug "${cleanSlug}" is already taken.` }, 400);
    }

    const existingUser = await UserModel.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      return sendApiError(res, { code: 'VALIDATION_ERROR', message: `User with email "${adminEmail}" already exists.` }, 400);
    }

    const tenantId = `tnt_${cleanSlug.replace(/-/g, '_')}_${generateId('tenant').slice(-6)}`;
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const countryStr = typeof country === 'string' ? country.trim() : '';
    const countryCurrency = countryStr ? getCurrencyForCountry(countryStr) : null;
    const resolvedCurrency = (currency || countryCurrency?.code || 'USD').toUpperCase();
    const resolvedSymbol = currencySymbol || (CURRENCY_SYMBOLS as any)[resolvedCurrency] || countryCurrency?.symbol || '$';

    const newTenant = await TenantModel.create({
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

    const adminUserId = generateId('user');
    const newAdmin = await UserModel.create({
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

    await ActivityLogModel.create({
      logId: generateId('act'),
      tenantId,
      userId: user.id,
      action: 'provisioned_tenant',
      entityType: 'project',
      entityId: tenantId,
      metadata: { tenantName: name, slug: cleanSlug, plan: 'Free', adminEmail },
    });

    return sendApiResponse(
      res,
      {
        tenant: newTenant,
        admin: {
          userId: newAdmin.userId,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
        },
      },
      201
    );
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/admin/tenants/:tenantId
router.patch('/tenants/:tenantId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { tenantId } = req.params;
    const { status, name } = req.body;

    const tenant = await TenantModel.findOne({ tenantId });
    if (!tenant) {
      return sendApiError(res, { code: 'NOT_FOUND', message: `Tenant "${tenantId}" not found` }, 404);
    }

    if (status && ['active', 'suspended', 'archived'].includes(status)) {
      tenant.status = status;
    }
    if (name) {
      tenant.name = name.trim();
    }

    tenant.updatedAt = new Date();
    await tenant.save();

    await ActivityLogModel.create({
      logId: generateId('act'),
      tenantId,
      userId: user.id,
      action: 'updated_tenant_status',
      entityType: 'project',
      entityId: tenantId,
      metadata: { newStatus: status },
    });

    return sendApiResponse(res, tenant);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/admin/overview
router.get('/overview', async (_req: Request, res: Response) => {
  try {
    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      archivedTenants,
      totalUsers,
      activeUsers,
      orgAdmins,
      totalProjects,
      totalTasks,
      fileAgg,
      recentLogs,
    ] = await Promise.all([
      TenantModel.countDocuments(),
      TenantModel.countDocuments({ status: 'active' }),
      TenantModel.countDocuments({ status: 'suspended' }),
      TenantModel.countDocuments({ status: 'archived' }),
      UserModel.countDocuments(),
      UserModel.countDocuments({ isActive: true }),
      UserModel.countDocuments({ role: 'orgAdmin' }),
      ProjectModel.countDocuments(),
      TaskModel.countDocuments(),
      FileModel.aggregate([
        { $group: { _id: null, totalBytes: { $sum: '$size' }, count: { $sum: 1 } } },
      ]),
      ActivityLogModel.find().sort({ createdAt: -1 }).limit(10).lean() as any,
    ]);

    // Live MongoDB stats
    let dbStorageBytes = 0;
    let dbDataBytes = 0;
    let dbIndexBytes = 0;
    try {
      if (mongoose.connection.db) {
        const dbStats = await mongoose.connection.db.stats();
        dbStorageBytes = Number(dbStats.storageSize) || 0;
        dbDataBytes = Number(dbStats.dataSize) || 0;
        dbIndexBytes = Number(dbStats.indexSize) || 0;
      }
    } catch (dbErr) {
      console.warn('[Admin Overview] Failed to fetch MongoDB db.stats():', dbErr);
    }

    const fileStorageBytes = fileAgg[0]?.totalBytes || 0;
    const fileCount = fileAgg[0]?.count || 0;
    // Prefer physical storageSize, fallback to logical dataSize if storageSize is 0
    const effectiveDbBytes = dbStorageBytes > 0 ? dbStorageBytes : dbDataBytes;
    const totalStorageBytes = effectiveDbBytes + fileStorageBytes;
    const storageMB = Math.round((totalStorageBytes / (1024 * 1024)) * 10) / 10;

    return sendApiResponse(res, {
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
      recentLogs: recentLogs.map((log: any) => ({
        logId: log.logId,
        tenantId: log.tenantId,
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        createdAt: log.createdAt,
      })),
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/admin/audit-log
router.get('/audit-log', async (req: Request, res: Response) => {
  try {
    const { tenantId, action, entityType, fromDate, toDate, page = '1', limit = '30' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (tenantId && tenantId !== 'all') query.tenantId = tenantId;
    if (action) query.action = { $regex: escapeRegex(String(action)), $options: 'i' };
    if (entityType && entityType !== 'all') query.entityType = entityType;

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(String(fromDate));
      if (toDate) query.createdAt.$lte = new Date(String(toDate));
    }

    const [total, logs] = await Promise.all([
      ActivityLogModel.countDocuments(query),
      ActivityLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    ]);

    return sendApiResponse(res, {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/admin/stats (Health & telemetry)
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const [tenantCount, userCount, projectCount, taskCount] = await Promise.all([
      TenantModel.countDocuments(),
      UserModel.countDocuments(),
      ProjectModel.countDocuments(),
      TaskModel.countDocuments(),
    ]);
    const dbLatencyMs = Date.now() - startTime;

    const memoryUsage = process.memoryUsage();

    let dbStorageBytes = 0;
    let dbDataBytes = 0;
    let dbIndexBytes = 0;
    try {
      if (mongoose.connection.db) {
        const dbStats = await mongoose.connection.db.stats();
        dbStorageBytes = Number(dbStats.storageSize) || 0;
        dbDataBytes = Number(dbStats.dataSize) || 0;
        dbIndexBytes = Number(dbStats.indexSize) || 0;
      }
    } catch {
      // ignore
    }

    return sendApiResponse(res, {
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
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/admin/tenants/:tenantId/settings (Feature flags, notes, etc.)
router.patch('/tenants/:tenantId/settings', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { settings } = req.body;

    const tenant = await TenantModel.findOne({ tenantId });
    if (!tenant) {
      return sendApiError(res, { code: 'NOT_FOUND', message: `Tenant ${tenantId} not found` }, 404);
    }

    if (settings) {
      tenant.settings = { ...(tenant.settings || {}), ...settings };
      tenant.markModified('settings');
    }

    await tenant.save();
    return sendApiResponse(res, tenant);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/admin/email-templates
router.get('/email-templates', async (_req: Request, res: Response) => {
  try {
    const templates = await EmailTemplateModel.find().sort({ name: 1 }).lean();
    return sendApiResponse(res, templates);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/admin/email-templates
router.post('/email-templates', async (req: Request, res: Response) => {
  try {
    const { key, name, subjectLine, htmlBody, textBody, variables } = req.body;
    if (!key || !name || !subjectLine || !htmlBody) {
      return sendApiError(res, { code: 'VALIDATION_ERROR', message: 'key, name, subjectLine, and htmlBody are required' }, 400);
    }

    const templateId = generateId('emailTemplate');
    const template = await EmailTemplateModel.create({
      templateId,
      key,
      name,
      subjectLine,
      htmlBody,
      textBody: textBody || '',
      variables: variables || [],
      isActive: true,
      lastEditedByUserId: req.user!.id,
    });

    return sendApiResponse(res, template, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PUT /api/v1/admin/email-templates/:templateId
router.put('/email-templates/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { name, subjectLine, htmlBody, textBody, variables, isActive } = req.body;

    const template = await EmailTemplateModel.findOne({ templateId });
    if (!template) {
      return sendApiError(res, { code: 'NOT_FOUND', message: 'Template not found' }, 404);
    }

    if (name !== undefined) template.name = name;
    if (subjectLine !== undefined) template.subjectLine = subjectLine;
    if (htmlBody !== undefined) template.htmlBody = htmlBody;
    if (textBody !== undefined) template.textBody = textBody;
    if (variables !== undefined) template.variables = variables;
    if (isActive !== undefined) template.isActive = isActive;
    template.lastEditedByUserId = req.user!.id;

    await template.save();
    return sendApiResponse(res, template);
  } catch (error: any) {
    return sendApiError(res, error);
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
  ipAllowlist: [] as string[],
  ipBlocklist: [] as string[],
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
  let platform = await TenantModel.findOne({ tenantId: 'tnt_platform' });
  if (!platform) {
    platform = await TenantModel.create({
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
router.get('/retention', async (_req: Request, res: Response) => {
  try {
    const platform = await getOrCreatePlatformTenant();
    const policy = {
      ...DEFAULT_RETENTION_POLICY,
      ...((platform.settings?.retentionPolicy as any) || {}),
    };
    return sendApiResponse(res, policy);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/admin/retention
router.patch('/retention', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const platform = await getOrCreatePlatformTenant();

    if (!platform.settings) platform.settings = {};

    const currentPolicy = {
      ...DEFAULT_RETENTION_POLICY,
      ...((platform.settings.retentionPolicy as any) || {}),
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

    return sendApiResponse(res, currentPolicy);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/admin/retention/run
router.post('/retention/run', async (req: Request, res: Response) => {
  try {
    const { opType = 'purge_logs' } = req.body;
    const platform = await getOrCreatePlatformTenant();
    const policy = {
      ...DEFAULT_RETENTION_POLICY,
      ...((platform.settings?.retentionPolicy as any) || {}),
    };

    let affectedCount = 0;
    let message = '';

    if (opType === 'purge_logs') {
      const cutoff = new Date(Date.now() - (policy.activityLogRetentionDays || 90) * 86400000);
      const result = await ActivityLogModel.deleteMany({ createdAt: { $lt: cutoff } });
      affectedCount = result.deletedCount || 0;
      message = `Purged ${affectedCount} activity logs older than ${policy.activityLogRetentionDays} days`;
    } else if (opType === 'archive_inactive_projects') {
      const cutoff = new Date(Date.now() - (policy.inactiveProjectArchiveDays || 365) * 86400000);
      const result = await ProjectModel.updateMany(
        { updatedAt: { $lt: cutoff }, status: { $ne: 'Archived' } },
        { $set: { status: 'Archived' } }
      );
      affectedCount = result.modifiedCount || 0;
      message = `Archived ${affectedCount} inactive projects`;
    } else if (opType === 'purge_completed_tasks') {
      const cutoff = new Date(Date.now() - (policy.completedTasksRetentionDays || 180) * 86400000);
      const result = await TaskModel.deleteMany({
        status: 'Done',
        updatedAt: { $lt: cutoff },
      });
      affectedCount = result.deletedCount || 0;
      message = `Purged ${affectedCount} completed tasks older than ${policy.completedTasksRetentionDays} days`;
    }

    return sendApiResponse(res, {
      opType,
      affectedCount,
      message,
      executedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/admin/security-policy
router.get('/security-policy', async (_req: Request, res: Response) => {
  try {
    const platform = await getOrCreatePlatformTenant();
    const policy = {
      ...DEFAULT_SECURITY_POLICY,
      ...((platform.settings?.securityPolicy as any) || {}),
    };
    return sendApiResponse(res, policy);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/admin/security-policy (or PUT)
router.patch('/security-policy', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const platform = await getOrCreatePlatformTenant();

    if (!platform.settings) platform.settings = {};

    const currentPolicy = {
      ...DEFAULT_SECURITY_POLICY,
      ...((platform.settings.securityPolicy as any) || {}),
    };

    if (body.mfaRequired !== undefined) currentPolicy.mfaRequired = Boolean(body.mfaRequired);
    if (body.sessionTimeoutMinutes !== undefined) {
      currentPolicy.sessionTimeoutMinutes = Math.max(5, Math.min(10080, Number(body.sessionTimeoutMinutes) || 480));
    }
    if (body.passwordMinLength !== undefined) {
      currentPolicy.passwordMinLength = Math.max(6, Math.min(64, Number(body.passwordMinLength) || 8));
    }
    if (body.requireSpecialChar !== undefined) currentPolicy.requireSpecialChar = Boolean(body.requireSpecialChar);
    if (body.requireNumber !== undefined) currentPolicy.requireNumber = Boolean(body.requireNumber);
    if (Array.isArray(body.ipAllowlist)) currentPolicy.ipAllowlist = body.ipAllowlist;
    if (Array.isArray(body.ipBlocklist)) currentPolicy.ipBlocklist = body.ipBlocklist;
    if (body.ssoEnabled !== undefined) currentPolicy.ssoEnabled = Boolean(body.ssoEnabled);

    platform.settings.securityPolicy = currentPolicy;
    platform.markModified('settings');
    await platform.save();

    return sendApiResponse(res, currentPolicy);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// ==========================================
// 1. IMPERSONATION ENDPOINTS
// ==========================================

// POST /api/v1/admin/tenants/:tenantId/impersonate
router.post('/tenants/:tenantId/impersonate', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const superAdmin = req.user!;

    const tenant = await TenantModel.findOne({ tenantId });
    if (!tenant) {
      return sendApiError(res, { code: 'NOT_FOUND', message: `Tenant "${tenantId}" not found` }, 404);
    }
    if (tenant.status === 'archived') {
      return sendApiError(res, { code: 'TENANT_ARCHIVED', message: 'Cannot impersonate an archived tenant' }, 400);
    }

    // Find orgAdmin or another active user in this tenant
    let targetUser = await UserModel.findOne({ tenantId, role: 'orgAdmin', isActive: true }).lean() as any;
    if (!targetUser) {
      targetUser = await UserModel.findOne({ tenantId, isActive: true }).lean() as any;
    }
    if (!targetUser) {
      return sendApiError(res, { code: 'NO_ACTIVE_USERS', message: 'No active user found in this workspace to impersonate' }, 400);
    }

    const sessionId = generateId('act').replace('act_', 'imp_');
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

    const accessToken = jwt.sign(tokenPayload, ENV.JWT_SECRET, { expiresIn: '2h' });

    // Store session info in tenant
    if (!tenant.settings) tenant.settings = {};
    tenant.settings.impersonationSession = {
      token: sessionId,
      startedByUserId: superAdmin.id,
      expiresAt: new Date(Date.now() + 2 * 3600 * 1000),
    };
    tenant.markModified('settings');
    await tenant.save();

    // Log to ActivityLog with impersonatedBy
    await ActivityLogModel.create({
      logId: generateId('act'),
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

    return sendApiResponse(res, {
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
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/admin/impersonate/end (or /api/v1/admin/impersonate/exit)
const handleExitImpersonation = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const superAdminId = user.impersonatedBy;

    if (user.tenantId && user.tenantId !== 'tnt_platform') {
      const tenant = await TenantModel.findOne({ tenantId: user.tenantId });
      if (tenant?.settings?.impersonationSession) {
        delete (tenant.settings as any).impersonationSession;
        tenant.markModified('settings');
        await tenant.save();
      }
    }

    await ActivityLogModel.create({
      logId: generateId('act'),
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
    let superAdminToken: string | null = null;
    let superAdminUser: any = null;
    if (superAdminId) {
      const saUser = await UserModel.findOne({ userId: superAdminId }).lean() as any;
      if (saUser) {
        superAdminUser = {
          userId: saUser.userId,
          id: saUser.userId,
          name: saUser.name,
          email: saUser.email,
          tenantId: saUser.tenantId,
          role: saUser.role,
        };
        superAdminToken = jwt.sign(superAdminUser, ENV.JWT_SECRET, { expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any });
      }
    }

    return sendApiResponse(res, {
      message: 'Impersonation session terminated',
      accessToken: superAdminToken,
      user: superAdminUser,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
};

router.post('/impersonate/end', handleExitImpersonation);
router.post('/impersonate/exit', handleExitImpersonation);

// ==========================================
// 2. TENANT DEEP-DIVE ENDPOINTS
// ==========================================

// GET /api/v1/admin/tenants/:tenantId/detail
router.get('/tenants/:tenantId/detail', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const tenant = await TenantModel.findOne({ tenantId }).lean() as any;
    if (!tenant) {
      return sendApiError(res, { code: 'NOT_FOUND', message: `Tenant "${tenantId}" not found` }, 404);
    }

    const [
      totalUsers,
      activeUsers,
      orgAdmin,
      projects,
      tasks,
      timeAgg,
      fileAgg,
      latestLog,
    ] = await Promise.all([
      UserModel.countDocuments({ tenantId }),
      UserModel.countDocuments({ tenantId, isActive: true }),
      UserModel.findOne({ tenantId, role: 'orgAdmin' }).select('userId name email avatarUrl department createdAt').lean(),
      ProjectModel.find({ tenantId }).select('projectId name status methodology startDate endDate createdAt budget').lean() as any,
      TaskModel.find({ tenantId }).select('taskId status priority dueDate sprintId projectId').lean() as any,
      TimeEntryModel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: null, totalMinutes: { $sum: '$duration' }, count: { $sum: 1 } } },
      ]),
      FileModel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: null, totalBytes: { $sum: '$size' }, count: { $sum: 1 } } },
      ]),
      ActivityLogModel.findOne({ tenantId }).sort({ createdAt: -1 }).select('createdAt action userId').lean() as any,
    ]);

    // Compute task breakdown
    const taskBreakdown = {
      total: tasks.length,
      done: tasks.filter((t: any) => t.status === 'Done').length,
      inProgress: tasks.filter((t: any) => t.status === 'In Progress' || t.status === 'In Review').length,
      toDo: tasks.filter((t: any) => t.status === 'To Do' || t.status === 'Backlog').length,
    };

    // Compute project breakdown
    const projectBreakdown = {
      total: projects.length,
      active: projects.filter((p: any) => p.status === 'Active').length,
      onHold: projects.filter((p: any) => p.status === 'On Hold').length,
      completed: projects.filter((p: any) => p.status === 'Completed').length,
      archived: projects.filter((p: any) => p.status === 'Archived').length,
      byMethodology: {
        agile: projects.filter((p: any) => p.methodology === 'Agile').length,
        waterfall: projects.filter((p: any) => p.methodology === 'Waterfall').length,
        hybrid: projects.filter((p: any) => p.methodology === 'Hybrid').length,
      },
    };

    const totalHoursLogged = Math.round(((timeAgg[0]?.totalMinutes || 0) / 60) * 10) / 10;
    const storageBytes = fileAgg[0]?.totalBytes || 0;
    const storageMB = Math.round((storageBytes / (1024 * 1024)) * 10) / 10;

    return sendApiResponse(res, {
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
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/admin/tenants/:tenantId/members
router.get('/tenants/:tenantId/members', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const members = await UserModel.find({ tenantId })
      .select('userId name email role department isActive avatarUrl createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return sendApiResponse(res, members);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/admin/tenants/:tenantId/projects
router.get('/tenants/:tenantId/projects', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const [projects, tasks] = await Promise.all([
      ProjectModel.find({ tenantId }).sort({ createdAt: -1 }).lean() as any,
      TaskModel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$projectId', totalTasks: { $sum: 1 }, completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } } } },
      ]),
    ]);

    const taskMap = new Map(tasks.map((t: any) => [t._id, t]));

    const enrichedProjects = projects.map((p: any) => {
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

    return sendApiResponse(res, enrichedProjects);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/admin/tenants/:tenantId/activity-timeline
router.get('/tenants/:tenantId/activity-timeline', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const timeline = await ActivityLogModel.aggregate([
      { $match: { tenantId, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return sendApiResponse(res, timeline.map((item) => ({ date: item._id, count: item.count })));
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/admin/tenants/:tenantId
router.delete('/tenants/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { purge } = req.query;
    const user = req.user!;

    const tenant = await TenantModel.findOne({ tenantId });
    if (!tenant) {
      return sendApiError(res, { code: 'NOT_FOUND', message: `Tenant "${tenantId}" not found` }, 404);
    }

    if (tenant.tenantId === 'tnt_platform') {
      return sendApiError(res, { code: 'FORBIDDEN', message: 'Platform root tenant cannot be deleted' }, 403);
    }

    if (purge === 'true') {
      // Hard purge all documents associated with this tenant
      await Promise.all([
        TaskModel.deleteMany({ tenantId }),
        ProjectModel.deleteMany({ tenantId }),
        TimeEntryModel.deleteMany({ tenantId }),
        FileModel.deleteMany({ tenantId }),
        CommentModel.deleteMany({ tenantId }),
        UserModel.deleteMany({ tenantId }),
        ActivityLogModel.deleteMany({ tenantId }),
        TenantModel.deleteOne({ tenantId }),
      ]);

      await ActivityLogModel.create({
        logId: generateId('act'),
        tenantId: 'tnt_platform',
        userId: user.id,
        action: 'deleted_tenant_purged',
        entityType: 'tenant',
        entityId: tenantId,
        metadata: { tenantName: tenant.name, slug: tenant.slug, purgedBy: user.email },
      });

      return sendApiResponse(res, { message: `Tenant ${tenantId} and all associated data permanently purged.` });
    } else {
      // Soft-delete / Archive
      tenant.status = 'archived';
      tenant.updatedAt = new Date();
      await tenant.save();

      await ActivityLogModel.create({
        logId: generateId('act'),
        tenantId,
        userId: user.id,
        action: 'archived_tenant',
        entityType: 'tenant',
        entityId: tenantId,
        metadata: { tenantName: tenant.name, slug: tenant.slug, archivedBy: user.email },
      });

      return sendApiResponse(res, { message: `Tenant ${tenantId} has been archived.`, tenant });
    }
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// ==========================================
// 3. PLAN & LIMITS MANAGEMENT
// ==========================================

// PATCH /api/v1/admin/tenants/:tenantId/plan
router.patch('/tenants/:tenantId/plan', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { plan, limits, billingNotes } = req.body;
    const user = req.user!;

    const tenant = await TenantModel.findOne({ tenantId });
    if (!tenant) {
      return sendApiError(res, { code: 'NOT_FOUND', message: `Tenant "${tenantId}" not found` }, 404);
    }

    if (!tenant.settings) tenant.settings = {};

    if (plan !== undefined) tenant.settings.plan = plan;
    if (limits !== undefined) {
      tenant.settings.limits = {
        ...((tenant.settings.limits as any) || {}),
        ...limits,
      };
    }
    if (billingNotes !== undefined) tenant.settings.billingNotes = billingNotes;

    tenant.updatedAt = new Date();
    tenant.markModified('settings');
    await tenant.save();

    await ActivityLogModel.create({
      logId: generateId('act'),
      tenantId,
      userId: user.id,
      action: 'updated_tenant_plan',
      entityType: 'tenant',
      entityId: tenantId,
      metadata: { plan, limits, billingNotes },
    });

    return sendApiResponse(res, {
      tenantId: tenant.tenantId,
      plan: tenant.settings.plan,
      limits: tenant.settings.limits,
      billingNotes: tenant.settings.billingNotes,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// ==========================================
// 4. GLOBAL SEARCH ENDPOINT
// ==========================================

// GET /api/v1/admin/search?q=...
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q || q.length < 2) {
      return sendApiResponse(res, { tenants: [], users: [], projects: [] });
    }

    const regex = new RegExp(escapeRegex(q), 'i');

    const [tenants, users, projects] = await Promise.all([
      TenantModel.find({
        $or: [{ name: regex }, { slug: regex }, { tenantId: regex }],
      })
        .select('tenantId name slug status settings.plan createdAt')
        .limit(8)
        .lean(),
      UserModel.find({
        $or: [{ name: regex }, { email: regex }, { userId: regex }],
      })
        .select('userId name email tenantId role department isActive')
        .limit(8)
        .lean(),
      ProjectModel.find({
        $or: [{ name: regex }, { projectId: regex }],
      })
        .select('projectId name tenantId status methodology createdAt')
        .limit(8)
        .lean(),
    ]);

    return sendApiResponse(res, { tenants, users, projects });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// ==========================================
// 5. PLATFORM ANALYTICS
// ==========================================

// GET /api/v1/admin/analytics
router.get('/analytics', async (_req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [
      tenantRegistrations,
      activeUsersList,
      taskStatusAgg,
      projectMethodologyAgg,
      topTenantsAgg,
      allTenants,
      recentActiveTenants,
    ] = await Promise.all([
      // Tenant registrations per day (30 days)
      TenantModel.aggregate([
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
      ActivityLogModel.distinct('userId', { createdAt: { $gte: thirtyDaysAgo } }),
      // Task breakdown
      TaskModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Project methodology breakdown
      ProjectModel.aggregate([
        { $group: { _id: '$methodology', count: { $sum: 1 } } },
      ]),
      // Top tenants by task deliverables
      TaskModel.aggregate([
        { $group: { _id: '$tenantId', taskCount: { $sum: 1 } } },
        { $sort: { taskCount: -1 } },
        { $limit: 10 },
      ]),
      // All tenants
      TenantModel.find().select('tenantId name slug status createdAt').lean() as any,
      // Tenants with activity in last 30d
      ActivityLogModel.distinct('tenantId', { createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    const activeTenantSet = new Set(recentActiveTenants);
    const tenantMap = new Map(allTenants.map((t: any) => [t.tenantId, t]));

    const topTenants = topTenantsAgg.map((item) => {
      const t = tenantMap.get(item._id) as any;
      return {
        tenantId: item._id,
        name: t?.name || item._id,
        slug: t?.slug || '',
        taskCount: item.taskCount,
      };
    });

    const inactiveTenants = allTenants
      .filter((t: any) => !activeTenantSet.has(t.tenantId) && t.tenantId !== 'tnt_platform')
      .slice(0, 10);

    return sendApiResponse(res, {
      tenantRegistrations: tenantRegistrations.map((r) => ({ date: r._id, count: r.count })),
      thirtyDayMAU: activeUsersList.length,
      taskStatusDistribution: taskStatusAgg.map((s) => ({ status: s._id || 'Unknown', count: s.count })),
      projectMethodologyDistribution: projectMethodologyAgg.map((m) => ({ methodology: m._id || 'Standard', count: m.count })),
      topTenants,
      inactiveTenants,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// ==========================================
// 6. PLATFORM CONFIGURATION
// ==========================================

// GET /api/v1/admin/platform-config
router.get('/platform-config', async (_req: Request, res: Response) => {
  try {
    const platform = await getOrCreatePlatformTenant();
    const config = {
      ...DEFAULT_PLATFORM_CONFIG,
      ...((platform.settings?.platformConfig as any) || {}),
    };
    return sendApiResponse(res, config);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/admin/platform-config
router.patch('/platform-config', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const platform = await getOrCreatePlatformTenant();

    if (!platform.settings) platform.settings = {};

    const currentConfig = {
      ...DEFAULT_PLATFORM_CONFIG,
      ...((platform.settings.platformConfig as any) || {}),
    };

    if (body.maintenanceMode !== undefined) currentConfig.maintenanceMode = Boolean(body.maintenanceMode);
    if (body.maintenanceMessage !== undefined) currentConfig.maintenanceMessage = String(body.maintenanceMessage).trim();
    if (body.selfRegistrationEnabled !== undefined) currentConfig.selfRegistrationEnabled = Boolean(body.selfRegistrationEnabled);
    if (body.maxFileSizeMB !== undefined) currentConfig.maxFileSizeMB = Number(body.maxFileSizeMB) || 50;
    if (body.defaultFeatureFlags !== undefined && typeof body.defaultFeatureFlags === 'object') {
      currentConfig.defaultFeatureFlags = {
        ...currentConfig.defaultFeatureFlags,
        ...body.defaultFeatureFlags,
      };
    }

    platform.settings.platformConfig = currentConfig;
    platform.markModified('settings');
    await platform.save();

    await ActivityLogModel.create({
      logId: generateId('act'),
      tenantId: 'tnt_platform',
      userId: req.user!.id,
      action: 'platform_config_updated',
      entityType: 'system',
      entityId: 'platform_config',
      metadata: currentConfig,
    });

    return sendApiResponse(res, currentConfig);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// ==========================================
// 7. CROSS-TENANT USER LOOKUP & GDPR
// ==========================================

// GET /api/v1/admin/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { q, tenantId, role, status, page = '1', limit = '25' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (tenantId && tenantId !== 'all') query.tenantId = tenantId;
    if (role && role !== 'all') query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    if (q) {
      const regex = new RegExp(escapeRegex(String(q).trim()), 'i');
      query.$or = [{ name: regex }, { email: regex }, { userId: regex }];
    }

    const [total, users, tenants] = await Promise.all([
      UserModel.countDocuments(query),
      UserModel.find(query)
        .select('userId name email tenantId role department isActive avatarUrl createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      TenantModel.find().select('tenantId name slug').lean() as any,
    ]);

    const tenantMap = new Map(tenants.map((t: any) => [t.tenantId, t.name]));

    const enrichedUsers = users.map((u: any) => ({
      ...u,
      tenantName: tenantMap.get(u.tenantId) || u.tenantId,
    }));

    return sendApiResponse(res, {
      users: enrichedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/admin/users/:userId
router.get('/users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findOne({ userId }).select('-passwordHash -refreshTokenHash').lean() as any;
    if (!user) {
      return sendApiError(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
    }

    const [tenant, tasksCount, timeCount] = await Promise.all([
      TenantModel.findOne({ tenantId: user.tenantId }).select('tenantId name slug status').lean(),
      TaskModel.countDocuments({ assignees: user.userId }),
      TimeEntryModel.countDocuments({ userId: user.userId }),
    ]);

    return sendApiResponse(res, {
      user,
      tenant,
      stats: {
        assignedTasks: tasksCount,
        loggedTimeEntries: timeCount,
      },
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/admin/users/:userId/status
router.patch('/users/:userId/status', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    const adminUser = req.user!;

    if (isActive === undefined) {
      return sendApiError(res, { code: 'VALIDATION_ERROR', message: 'isActive boolean is required' }, 400);
    }

    const user = await UserModel.findOne({ userId });
    if (!user) {
      return sendApiError(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
    }

    user.isActive = Boolean(isActive);
    user.updatedAt = new Date();
    await user.save();

    await ActivityLogModel.create({
      logId: generateId('act'),
      tenantId: user.tenantId,
      userId: adminUser.id,
      action: user.isActive ? 'user_activated_by_admin' : 'user_deactivated_by_admin',
      entityType: 'user',
      entityId: user.userId,
      metadata: { targetEmail: user.email, newStatus: user.isActive },
    });

    return sendApiResponse(res, { userId: user.userId, isActive: user.isActive });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/admin/users/:userId/reset-password
router.post('/users/:userId/reset-password', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const adminUser = req.user!;

    const user = await UserModel.findOne({ userId });
    if (!user) {
      return sendApiError(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
    }

    const tempPassword = newPassword?.trim() || `WsPass${Math.random().toString(36).slice(-6)}!`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    user.passwordHash = passwordHash;
    user.updatedAt = new Date();
    await user.save();

    await ActivityLogModel.create({
      logId: generateId('act'),
      tenantId: user.tenantId,
      userId: adminUser.id,
      action: 'user_password_reset_by_admin',
      entityType: 'user',
      entityId: user.userId,
      metadata: { targetEmail: user.email },
    });

    return sendApiResponse(res, {
      message: 'Password reset successful',
      temporaryPassword: tempPassword,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/admin/users/:userId/gdpr-export
router.post('/users/:userId/gdpr-export', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findOne({ userId }).select('-passwordHash -refreshTokenHash').lean() as any;
    if (!user) {
      return sendApiError(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
    }

    const [tasks, timeEntries, comments, activity] = await Promise.all([
      TaskModel.find({ assignees: userId }).select('taskId title status priority dueDate createdAt').lean(),
      TimeEntryModel.find({ userId }).lean(),
      CommentModel.find({ authorId: userId }).select('commentId content taskId createdAt').lean(),
      ActivityLogModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    const exportBundle = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: req.user!.email,
        complianceStandard: 'GDPR Article 15 / CCPA Data Portability',
      },
      profile: user,
      assignedTasks: tasks,
      timeEntries,
      comments,
      recentActivity: activity,
    };

    return sendApiResponse(res, exportBundle);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// ==========================================
// 8. SUPER ADMIN ROSTER & PLATFORM FEED
// ==========================================

// GET /api/v1/admin/super-admins
router.get('/super-admins', async (_req: Request, res: Response) => {
  try {
    const admins = await UserModel.find({ role: 'superAdmin' })
      .select('userId name email tenantId isActive avatarUrl createdAt updatedAt')
      .sort({ createdAt: 1 })
      .lean();

    return sendApiResponse(res, admins);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/admin/platform-feed
router.get('/platform-feed', async (_req: Request, res: Response) => {
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

    const feed = await ActivityLogModel.find({ action: { $in: PLATFORM_ACTIONS } })
      .sort({ createdAt: -1 })
      .limit(35)
      .lean();

    return sendApiResponse(res, feed);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
