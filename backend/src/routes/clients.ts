import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { ClientModel } from '../models/Client.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

const CreateClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100),
  company: z.string().max(100).optional(),
  primaryEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  companyLogoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
});

const UpdateClientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  company: z.string().max(100).optional(),
  primaryEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  companyLogoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  isPortalActive: z.boolean().optional(),
  portalSettings: z
    .object({
      allowOverview: z.boolean().optional(),
      allowTimeline: z.boolean().optional(),
      allowDeliverables: z.boolean().optional(),
      allowFinancialSummary: z.boolean().optional(),
    })
    .optional(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    assertPermission(req.user!.role, 'client:read');
    const clients = await ClientModel.find({ tenantId: req.user!.tenantId }).sort({ name: 1 }).lean();
    return sendApiResponse(res, clients);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    assertPermission(req.user!.role, 'client:create');
    const validated = CreateClientSchema.parse(req.body);
    const clientId = generateId('client');
    const portalToken = crypto.randomBytes(32).toString('hex');

    const client = await ClientModel.create({
      clientId,
      tenantId: req.user!.tenantId,
      name: validated.name,
      company: validated.company || '',
      primaryEmail: validated.primaryEmail || '',
      companyLogoUrl: validated.companyLogoUrl || '',
      portalToken,
      isPortalActive: true,
      portalSettings: {
        allowOverview: true,
        allowTimeline: true,
        allowDeliverables: true,
        allowFinancialSummary: false,
      },
      createdBy: req.user!.userId,
    });

    return sendApiResponse(res, client, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

router.put('/:clientId', async (req: Request, res: Response) => {
  try {
    assertPermission(req.user!.role, 'client:update');
    const validated = UpdateClientSchema.parse(req.body);
    const client = await ClientModel.findOneAndUpdate(
      { tenantId: req.user!.tenantId, clientId: req.params.clientId },
      {
        $set: {
          ...(validated.name !== undefined && { name: validated.name }),
          ...(validated.company !== undefined && { company: validated.company }),
          ...(validated.primaryEmail !== undefined && { primaryEmail: validated.primaryEmail }),
          ...(validated.companyLogoUrl !== undefined && { companyLogoUrl: validated.companyLogoUrl }),
          ...(validated.isPortalActive !== undefined && { isPortalActive: validated.isPortalActive }),
          ...(validated.portalSettings !== undefined && { portalSettings: validated.portalSettings }),
        },
      },
      { new: true }
    ).lean();

    if (!client) {
      return sendApiError(res, new NotFoundError('Client not found'), 404);
    }

    return sendApiResponse(res, client);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

router.delete('/:clientId', async (req: Request, res: Response) => {
  try {
    assertPermission(req.user!.role, 'client:delete');
    const client = await ClientModel.findOneAndDelete({
      tenantId: req.user!.tenantId,
      clientId: req.params.clientId,
    }).lean();

    if (!client) {
      return sendApiError(res, new NotFoundError('Client not found'), 404);
    }

    return sendApiResponse(res, { message: 'Client deleted successfully' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
