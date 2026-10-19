import { Router, Request, Response } from 'express';
import { TenantModel } from '../models/Tenant.js';
import { UserModel } from '../models/User.js';
import { ProjectModel } from '../models/Project.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { CURRENCY_SYMBOLS } from '../utils/currency.js';
import { generateId } from '../utils/id.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

// GET /api/v1/organization
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const [tenant, userCount, projectCount] = await Promise.all([
      TenantModel.findOne({ tenantId: user.tenantId }).lean() as any,
      UserModel.countDocuments({ tenantId: user.tenantId, isActive: true }),
      ProjectModel.countDocuments({ tenantId: user.tenantId, status: { $ne: 'Archived' } }),
    ]);

    if (!tenant) {
      return sendApiError(res, { code: 'NOT_FOUND', message: 'Organization not found' }, 404);
    }

    const isOrgAdmin = user.role === 'orgAdmin' || user.role === 'superAdmin';
    if (!isOrgAdmin) {
      return sendApiResponse(res, {
        tenantId: tenant.tenantId,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        logoUrl: tenant.logoUrl,
        timezone: tenant.timezone || 'UTC',
        language: tenant.language || 'en',
        country: tenant.country || '',
      });
    }

    const settings = (tenant.settings || {}) as {
      plan?: string;
      userLimit?: number;
      projectLimit?: number;
      storageLimitGB?: number;
      currency?: string;
      currencySymbol?: string;
      country?: string;
      dateFormat?: string;
      enforce2FA?: boolean;
      restrictDomain?: boolean;
      allowedDomain?: string;
    };

    const plan = 'Free';
    const storageUsedGB = +((projectCount * 0.4 + userCount * 0.1).toFixed(2));
    const orgCurrency = settings.currency || 'USD';
    const orgSymbol = settings.currencySymbol || (CURRENCY_SYMBOLS as any)[orgCurrency] || '$';

    return sendApiResponse(res, {
      tenantId: tenant.tenantId,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      logoUrl: tenant.logoUrl,
      timezone: tenant.timezone || 'UTC',
      language: tenant.language || 'en',
      country: tenant.country || settings.country || '',
      plan,
      currency: orgCurrency,
      currencySymbol: orgSymbol,
      dateFormat: settings.dateFormat || 'MM/DD/YYYY',
      enforce2FA: !!settings.enforce2FA,
      restrictDomain: !!settings.restrictDomain,
      allowedDomain: settings.allowedDomain || '',
      featureFlags: tenant.settings?.featureFlags || {},
      usage: {
        users: userCount,
        projects: projectCount,
        storageGB: storageUsedGB,
      },
      createdAt: tenant.createdAt,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/organization
router.patch('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'orgAdmin' && user.role !== 'superAdmin') {
      return sendApiError(res, { code: 'FORBIDDEN', message: 'Organization Administrator permissions required' }, 403);
    }

    const {
      name,
      logoUrl,
      timezone,
      language,
      country,
      currency,
      currencySymbol,
      dateFormat,
      enforce2FA,
      restrictDomain,
      allowedDomain,
    } = req.body;

    const tenant = await TenantModel.findOne({ tenantId: user.tenantId });
    if (!tenant) {
      return sendApiError(res, { code: 'NOT_FOUND', message: 'Organization not found' }, 404);
    }

    if (name) tenant.name = name.trim();
    if (logoUrl !== undefined) tenant.logoUrl = logoUrl;
    if (timezone) tenant.timezone = timezone;
    if (language) tenant.language = language;
    if (country !== undefined) tenant.country = country;

    const currentSettings = (tenant.settings || {}) as Record<string, unknown>;
    const resolvedSymbol = currencySymbol || (currency ? (CURRENCY_SYMBOLS as any)[currency] : undefined);

    tenant.settings = {
      ...currentSettings,
      ...(country !== undefined && { country }),
      ...(currency !== undefined && { currency }),
      ...(resolvedSymbol !== undefined && { currencySymbol: resolvedSymbol }),
      ...(dateFormat !== undefined && { dateFormat }),
      ...(enforce2FA !== undefined && { enforce2FA: Boolean(enforce2FA) }),
      ...(restrictDomain !== undefined && { restrictDomain: Boolean(restrictDomain) }),
      ...(allowedDomain !== undefined && { allowedDomain }),
    };

    tenant.updatedAt = new Date();
    await tenant.save();

    await ActivityLogModel.create({
      logId: generateId('act'),
      tenantId: user.tenantId,
      userId: user.id,
      action: 'updated_org_settings',
      entityType: 'project',
      entityId: user.tenantId,
      metadata: { name: tenant.name, timezone: tenant.timezone },
    });

    return sendApiResponse(res, { message: 'Organization settings updated successfully', tenant });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
