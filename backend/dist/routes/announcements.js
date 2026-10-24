"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Announcement_js_1 = require("../models/Announcement.js");
const id_js_1 = require("../utils/id.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const now = new Date();
        const announcements = await Announcement_js_1.AnnouncementModel.find({
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
        return (0, apiResponse_js_1.sendApiResponse)(res, announcements);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'tenant:manage');
        const { title, message, type = 'info', targetAudience = 'all', targetTenantIds = [], expiresAt } = req.body;
        const announcementId = (0, id_js_1.generateId)('announcement');
        const announcement = await Announcement_js_1.AnnouncementModel.create({
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
        return (0, apiResponse_js_1.sendApiResponse)(res, announcement, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
