import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CommentModel } from '../models/Comment.js';
import { TaskModel } from '../models/Task.js';
import { UserModel } from '../models/User.js';
import { NotificationModel } from '../models/Notification.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { emitToProject, emitToUser } from '../socket/index.js';
import { sendEmail } from '../utils/email.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

const CreateCommentSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  content: z.string().min(1, 'Comment text cannot be empty').max(5000, 'Comment exceeds 5000 characters'),
  mentions: z.array(z.string()).optional().default([]),
});

const UpdateCommentSchema = z.object({
  content: z.string().min(1, 'Comment text cannot be empty').max(5000, 'Comment exceeds 5000 characters'),
});

// GET /api/v1/comments?taskId=:taskId
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'comment:read');

    const { taskId } = req.query;
    if (!taskId) {
      return sendApiError(res, new ValidationError('taskId query parameter is required'), 400);
    }

    const comments = await CommentModel.find({
      tenantId: user.tenantId,
      taskId: String(taskId),
    })
      .sort({ createdAt: 1 })
      .lean();

    // Enrich with latest author avatar and name if available
    const authorIds = [...new Set(comments.map((c) => c.authorId))];
    const authors = await UserModel.find({
      tenantId: user.tenantId,
      userId: { $in: authorIds },
    })
      .select('userId name avatarUrl email')
      .lean();

    const authorMap = new Map<string, any>();
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

    return sendApiResponse(res, enriched);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/comments
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'comment:create');

    const parseResult = CreateCommentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Invalid comment data', parseResult.error.flatten().fieldErrors), 422);
    }

    const { taskId, projectId, content, mentions } = parseResult.data;

    // Verify task exists
    const task: any = await TaskModel.findOne({ tenantId: user.tenantId, taskId }).lean();
    if (!task) {
      return sendApiError(res, new NotFoundError('Task not found'), 404);
    }

    // Auto-detect @[userId] or explicit mentions
    const commentId = generateId('comment');
    const comment = await CommentModel.create({
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
    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      projectId,
      userId: user.userId,
      action: 'commented_on_task',
      entityType: 'task',
      entityId: taskId,
      metadata: { commentId, taskTitle: task.title },
    });

    // Real-Time: Broadcast new comment to project room
    emitToProject(user.tenantId, projectId, 'comment:new', {
      comment,
      task: { taskId: task.taskId, title: task.title },
      author: { userId: user.userId, name: user.name || 'Teammate' },
    });

    // Deliver notifications & emails to mentioned users
    if (mentions && mentions.length > 0) {
      for (const mentionUserId of mentions) {
        if (mentionUserId !== user.userId) {
          try {
            const mentionedUser = await UserModel.findOne({
              tenantId: user.tenantId,
              userId: mentionUserId,
            }).select('email name').lean();

            const notification = await NotificationModel.create({
              notificationId: generateId('notification'),
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

            emitToUser(user.tenantId, mentionUserId, 'notification:new', { notification });

            // Send notification email
            if (mentionedUser && (mentionedUser as any).email) {
              await sendEmail({
                to: (mentionedUser as any).email,
                subject: `${user.name || 'A teammate'} mentioned you on task: ${task.title}`,
                text: `Hi ${(mentionedUser as any).name || 'there'},\n\n${user.name || 'A teammate'} mentioned you in a comment on task "${task.title}":\n\n"${content}"\n\nLog in to WorkSphere to review and reply.`,
              });
            }
          } catch (notifErr) {
            console.error('Failed to deliver mention notification:', notifErr);
          }
        }
      }
    }

    return sendApiResponse(res, comment, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PUT /api/v1/comments/:commentId
router.put('/:commentId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'comment:update');

    const parseResult = UpdateCommentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Invalid comment update', parseResult.error.flatten().fieldErrors), 422);
    }

    const comment = await CommentModel.findOne({
      tenantId: user.tenantId,
      commentId: req.params.commentId,
    });

    if (!comment) {
      return sendApiError(res, new NotFoundError('Comment not found'), 404);
    }

    // Only the original author or management roles can edit
    const isAuthor = comment.authorId === user.userId;
    const isManager = ['superAdmin', 'orgAdmin', 'manager'].includes(user.role);
    if (!isAuthor && !isManager) {
      return sendApiError(res, new ForbiddenError('You can only edit your own comments'), 403);
    }

    comment.content = parseResult.data.content;
    comment.editedAt = new Date();
    await comment.save();

    emitToProject(user.tenantId, comment.projectId, 'comment:updated', {
      comment,
      modifiedBy: { userId: user.userId, name: user.name },
    });

    return sendApiResponse(res, comment);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/comments/:commentId
router.delete('/:commentId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'comment:delete');

    const comment = await CommentModel.findOne({
      tenantId: user.tenantId,
      commentId: req.params.commentId,
    });

    if (!comment) {
      return sendApiError(res, new NotFoundError('Comment not found'), 404);
    }

    const isAuthor = comment.authorId === user.userId;
    const isManager = ['superAdmin', 'orgAdmin', 'manager'].includes(user.role);
    if (!isAuthor && !isManager) {
      return sendApiError(res, new ForbiddenError('You can only delete your own comments'), 403);
    }

    // Soft delete to maintain discussion flow
    comment.isDeleted = true;
    comment.content = 'This comment was deleted.';
    await comment.save();

    emitToProject(user.tenantId, comment.projectId, 'comment:deleted', {
      commentId: comment.commentId,
      taskId: comment.taskId,
      modifiedBy: { userId: user.userId, name: user.name },
    });

    return sendApiResponse(res, { message: 'Comment deleted successfully' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
