"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Notification_js_1 = require("../models/Notification.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const index_js_1 = require("../socket/index.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
// GET /api/v1/notifications
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const [notifications, unreadCount] = await Promise.all([
            Notification_js_1.NotificationModel.find({ tenantId: user.tenantId, userId: user.userId })
                .sort({ createdAt: -1 })
                .limit(20)
                .lean(),
            Notification_js_1.NotificationModel.countDocuments({
                tenantId: user.tenantId,
                userId: user.userId,
                isRead: false,
            }),
        ]);
        return (0, apiResponse_js_1.sendApiResponse)(res, { notifications, unreadCount });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PATCH /api/v1/notifications
router.patch('/', async (req, res) => {
    try {
        const user = req.user;
        const { notificationId } = req.body;
        if (notificationId) {
            await Notification_js_1.NotificationModel.updateOne({ tenantId: user.tenantId, userId: user.userId, notificationId }, { $set: { isRead: true } });
        }
        else {
            await Notification_js_1.NotificationModel.updateMany({ tenantId: user.tenantId, userId: user.userId, isRead: false }, { $set: { isRead: true } });
        }
        (0, index_js_1.emitToUser)(user.tenantId, user.userId, 'notification:marked_read', { notificationId });
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Notifications updated' });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
