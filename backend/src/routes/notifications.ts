import { Router, Request, Response } from 'express';
import { NotificationModel } from '../models/Notification.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { emitToUser } from '../socket/index.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

// GET /api/v1/notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const [notifications, unreadCount] = await Promise.all([
      NotificationModel.find({ tenantId: user.tenantId, userId: user.userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      NotificationModel.countDocuments({
        tenantId: user.tenantId,
        userId: user.userId,
        isRead: false,
      }),
    ]);

    return sendApiResponse(res, { notifications, unreadCount });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/notifications
router.patch('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { notificationId } = req.body;

    if (notificationId) {
      await NotificationModel.updateOne(
        { tenantId: user.tenantId, userId: user.userId, notificationId },
        { $set: { isRead: true } }
      );
    } else {
      await NotificationModel.updateMany(
        { tenantId: user.tenantId, userId: user.userId, isRead: false },
        { $set: { isRead: true } }
      );
    }

    emitToUser(user.tenantId, user.userId, 'notification:marked_read', { notificationId });

    return sendApiResponse(res, { message: 'Notifications updated' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
