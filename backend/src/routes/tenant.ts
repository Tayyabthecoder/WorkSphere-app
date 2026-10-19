import { Router, Request, Response } from 'express';
import { TenantModel } from '../models/Tenant.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    let slug = (req.headers['x-tenant-slug'] as string) || (req.query.workspace as string);

    if (!slug) {
      return sendApiError(res, { code: 'TENANT_REQUIRED', message: 'Workspace context missing' }, 400);
    }

    const tenant = (await TenantModel.findOne({ slug: slug.toLowerCase() }).lean()) as any;

    if (!tenant) {
      return sendApiError(res, { code: 'TENANT_NOT_FOUND', message: 'Workspace not found' }, 404);
    }

    const rawSettings = (tenant.settings || {}) as Record<string, any>;
    return sendApiResponse(res, {
      tenantId: tenant.tenantId,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      logoUrl: tenant.logoUrl,
      timezone: tenant.timezone || 'UTC',
      language: tenant.language || 'en',
      country: tenant.country || '',
      settings: {
        currency: rawSettings.currency || 'USD',
        currencySymbol: rawSettings.currencySymbol || '$',
        dateFormat: rawSettings.dateFormat || 'MM/DD/YYYY',
        plan: rawSettings.plan || 'Free',
      },
    });
  } catch (error: any) {
    return sendApiError(res, error, 500);
  }
});

export default router;
