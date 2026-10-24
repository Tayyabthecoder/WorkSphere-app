"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordActivity = recordActivity;
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const id_js_1 = require("./id.js");
const index_js_1 = require("../socket/index.js");
async function recordActivity(params) {
    try {
        const logId = (0, id_js_1.generateId)('act');
        const log = await ActivityLog_js_1.ActivityLogModel.create({
            logId,
            tenantId: params.tenantId,
            projectId: params.projectId || null,
            userId: params.userId,
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            metadata: params.metadata || {},
            impersonatedBy: params.impersonatedBy || null,
            impersonationSessionId: params.impersonationSessionId || null,
        });
        // Broadcast in real-time to all tenant members
        (0, index_js_1.emitToTenant)(params.tenantId, 'activity:new', {
            logId: log.logId,
            tenantId: log.tenantId,
            projectId: log.projectId,
            userId: log.userId,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            metadata: log.metadata,
            createdAt: log.createdAt,
            user: {
                name: params.userName || 'Workspace Member',
                email: params.userEmail || '',
                avatarUrl: params.userAvatarUrl || '',
            },
            projectName: params.projectName || null,
        });
    }
    catch (err) {
        console.error('[ActivityLog] Failed to record activity:', err);
    }
}
