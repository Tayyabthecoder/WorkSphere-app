import { Router, Request, Response } from 'express';
import { ClientModel } from '../models/Client.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();
router.use(verifyAuth);

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
    const { name, company, primaryEmail, companyLogoUrl } = req.body;
    const clientId = generateId('client');
    const portalToken = generateId('client');

    const client = await ClientModel.create({
      clientId,
      tenantId: req.user!.tenantId,
      name,
      company: company || '',
      primaryEmail: primaryEmail || '',
      companyLogoUrl: companyLogoUrl || '',
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
    const { name, company, primaryEmail, companyLogoUrl, isPortalActive, portalSettings } = req.body;
    const client = await ClientModel.findOneAndUpdate(
      { tenantId: req.user!.tenantId, clientId: req.params.clientId },
      {
        $set: {
          ...(name !== undefined && { name }),
          ...(company !== undefined && { company }),
          ...(primaryEmail !== undefined && { primaryEmail }),
          ...(companyLogoUrl !== undefined && { companyLogoUrl }),
          ...(isPortalActive !== undefined && { isPortalActive }),
          ...(portalSettings !== undefined && { portalSettings }),
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
