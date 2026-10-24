"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Comment_js_1 = require("../models/Comment.js");
const Task_js_1 = require("../models/Task.js");
const User_js_1 = require("../models/User.js");
const Notification_js_1 = require("../models/Notification.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const id_js_1 = require("../utils/id.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const errors_js_1 = require("../utils/errors.js");
const index_js_1 = require("../socket/index.js");
const email_js_1 = require("../utils/email.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
const CreateCommentSchema = zod_1.z.object({
    taskId: zod_1.z.string().min(1, 'Task ID is required'),
    projectId: zod_1.z.string().min(1, 'Project ID is required'),
    content: zod_1.z.string().min(1, 'Comment text cannot be empty').max(5000, 'Comment exceeds 5000 characters'),
    mentions: zod_1.z.array(zod_1.z.string()).optional().default([]),
});
const UpdateCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Comment text cannot be empty').max(5000, 'Comment exceeds 5000 characters'),
});
// GET /api/v1/comments?taskId=:taskId
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'comment:read');
        const { taskId } = req.query;
        if (!taskId) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('taskId query parameter is required'), 400);
        }
        const comments = await Comment_js_1.CommentModel.find({
            tenantId: user.tenantId,
            taskId: String(taskId),
        })
            .sort({ createdAt: 1 })
            .lean();
        // Enrich with latest author avatar and name if available
        const authorIds = [...new Set(comments.map((c) => c.authorId))];
        const authors = await User_js_1.UserModel.find({
            tenantId: user.tenantId,
            userId: { $in: authorIds },
        })
            .select('userId name avatarUrl email')
            .lean();
        const authorMap = new Map();
        for (const a of authors) {
            authorMap.set(a.userId, a);
        }
        const enriched = comments.map((c) => {
            const author = authorMap.get(c.authorId);
            return {
                ...c,
                authorName: author?.name || c.authorName || 'Teammate',
                authorAvatarUrl: author?.avatarUrl || c.authorAvatarUrl,
            };
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, enriched);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/comments
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'comment:create');
        const parseResult = CreateCommentSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid comment data', parseResult.error.flatten().fieldErrors), 422);
        }
        const { taskId, projectId, content, mentions } = parseResult.data;
        // Verify task exists
        const task = await Task_js_1.TaskModel.findOne({ tenantId: user.tenantId, taskId }).lean();
        if (!task) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Task not found'), 404);
        }
        // Auto-detect @[userId] or explicit mentions
        const commentId = (0, id_js_1.generateId)('comment');
        const comment = await Comment_js_1.CommentModel.create({
            commentId,
            tenantId: user.tenantId,
            taskId,
            projectId,
            authorId: user.userId,
            authorName: user.name || 'Teammate',
            content,
            mentions,
            isDeleted: false,
        });
        // Record activity log
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('log'),
            tenantId: user.tenantId,
            projectId,
            userId: user.userId,
            action: 'commented_on_task',
            entityType: 'task',
            entityId: taskId,
            metadata: { commentId, taskTitle: task.title },
        });
        // Real-Time: Broadcast new comment to project room
        (0, index_js_1.emitToProject)(user.tenantId, projectId, 'comment:new', {
            comment,
            task: { taskId: task.taskId, title: task.title },
            author: { userId: user.userId, name: user.name || 'Teammate' },
        });
        // Deliver notifications & emails to mentioned users
        if (mentions && mentions.length > 0) {
            for (const mentionUserId of mentions) {
                if (mentionUserId !== user.userId) {
                    try {
                        const mentionedUser = await User_js_1.UserModel.findOne({
                            tenantId: user.tenantId,
                            userId: mentionUserId,
                        }).select('email name').lean();
                        const notification = await Notification_js_1.NotificationModel.create({
                            notificationId: (0, id_js_1.generateId)('notification'),
                            tenantId: user.tenantId,
                            userId: mentionUserId,
                            title: 'Mentioned in a Task Comment',
                            message: `${user.name || 'A teammate'} mentioned you on "${task.title}": "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}"`,
                            type: 'mention',
                            relatedEntityType: 'task',
                            relatedEntityId: taskId,
                            entityType: 'task',
                            entityId: taskId,
                            isRead: false,
                        });
                        (0, index_js_1.emitToUser)(user.tenantId, mentionUserId, 'notification:new', { notification });
                        // Send notification email
                        if (mentionedUser && mentionedUser.email) {
                            await (0, email_js_1.sendEmail)({
                                to: mentionedUser.email,
                                subject: `${user.name || 'A teammate'} mentioned you on task: ${task.title}`,
                                text: `Hi ${mentionedUser.name || 'there'},\n\n${user.name || 'A teammate'} mentioned you in a comment on task "${task.title}":\n\n"${content}"\n\nLog in to WorkSphere to review and reply.`,
                            });
                        }
                    }
                    catch (notifErr) {
                        console.error('Failed to deliver mention notification:', notifErr);
                    }
                }
            }
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, comment, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PUT /api/v1/comments/:commentId
router.put('/:commentId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'comment:update');
        const parseResult = UpdateCommentSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid comment update', parseResult.error.flatten().fieldErrors), 422);
        }
        const comment = await Comment_js_1.CommentModel.findOne({
            tenantId: user.tenantId,
            commentId: req.params.commentId,
        });
        if (!comment) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Comment not found'), 404);
        }
        // Only the original author or management roles can edit
        const isAuthor = comment.authorId === user.userId;
        const isManager = ['superAdmin', 'orgAdmin', 'manager'].includes(user.role);
        if (!isAuthor && !isManager) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ForbiddenError('You can only edit your own comments'), 403);
        }
        comment.content = parseResult.data.content;
        comment.editedAt = new Date();
        await comment.save();
        (0, index_js_1.emitToProject)(user.tenantId, comment.projectId, 'comment:updated', {
            comment,
            modifiedBy: { userId: user.userId, name: user.name },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, comment);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// DELETE /api/v1/comments/:commentId
router.delete('/:commentId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'comment:delete');
        const comment = await Comment_js_1.CommentModel.findOne({
            tenantId: user.tenantId,
            commentId: req.params.commentId,
        });
        if (!comment) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Comment not found'), 404);
        }
        const isAuthor = comment.authorId === user.userId;
        const isManager = ['superAdmin', 'orgAdmin', 'manager'].includes(user.role);
        if (!isAuthor && !isManager) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ForbiddenError('You can only delete your own comments'), 403);
        }
        // Soft delete to maintain discussion flow
        comment.isDeleted = true;
        comment.content = 'This comment was deleted.';
        await comment.save();
        (0, index_js_1.emitToProject)(user.tenantId, comment.projectId, 'comment:deleted', {
            commentId: comment.commentId,
            taskId: comment.taskId,
            modifiedBy: { userId: user.userId, name: user.name },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Comment deleted successfully' });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
