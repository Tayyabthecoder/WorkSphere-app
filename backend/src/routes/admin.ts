import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { TenantModel } from '../models/Tenant.js';
import { UserModel } from '../models/User.js';
import { ProjectModel } from '../models/Project.js';
import { TaskModel } from '../models/Task.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { EmailTemplateModel } from '../models/EmailTemplate.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { generateId } from '../utils/id.js';
import { CURRENCY_SYMBOLS, getCurrencyForCountry } from '../utils/currency.js';

const router = Router();
router.use(verifyAuth);

// Guard: superAdmin only
router.use((req: Request, res: Response, next) => {
  try {
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
        plan: 'Free',
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
      ActivityLogModel.find().sort({ createdAt: -1 }).limit(10).lean() as any,
    ]);

    const estimatedStorageMB = Math.round((totalProjects * 25 + totalTasks * 2 + totalUsers * 5) * 1.2);

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
        estimatedStorageMB,
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
    if (action) query.action = { $regex: String(action), $options: 'i' };
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

export default router;
