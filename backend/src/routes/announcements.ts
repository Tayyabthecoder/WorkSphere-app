import { Router, Request, Response } from 'express';
import { AnnouncementModel } from '../models/Announcement.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';

const router = Router();
router.use(verifyAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const now = new Date();
    const announcements = await AnnouncementModel.find({
      $or: [
        { targetAudience: 'all' },
        { targetTenantIds: user.tenantId },
      ],
      isActive: true,
      $and: [
        { $or: [{ scheduledAt: { $exists: false } }, { scheduledAt: { $lte: now } }] },
        { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }] },
      ],
    })
      .sort({ scheduledAt: -1, createdAt: -1 })
      .limit(10)
      .lean();

    return sendApiResponse(res, announcements);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'tenant:manage');
    const { title, message, type = 'info', targetAudience = 'all', targetTenantIds = [], expiresAt } = req.body;
    const announcementId = generateId('announcement');

    const announcement = await AnnouncementModel.create({
      announcementId,
      title,
      message,
      type,
      targetAudience,
      targetTenantIds,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdByUserId: user.userId,
    });

    return sendApiResponse(res, announcement, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
