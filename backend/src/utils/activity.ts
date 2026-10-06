import { ActivityLogModel, IActivityLog } from '../models/ActivityLog.js';
import { generateId } from './id.js';
import { emitToTenant } from '../socket/index.js';

export interface RecordActivityParams {
  tenantId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  action: string;
  entityType: 'project' | 'task' | 'sprint' | 'document' | 'timeEntry' | 'expense' | 'member' | 'comment';
  entityId: string;
  projectId?: string | null;
  projectName?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordActivity(params: RecordActivityParams): Promise<void> {
  try {
    const logId = generateId('act');
    const log = await ActivityLogModel.create({
      logId,
      tenantId: params.tenantId,
      projectId: params.projectId || null,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata || {},
    });

    // Broadcast in real-time to all tenant members
    emitToTenant(params.tenantId, 'activity:new', {
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
  } catch (err) {
    console.error('[ActivityLog] Failed to record activity:', err);
  }
}
