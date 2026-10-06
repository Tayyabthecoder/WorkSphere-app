import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  logId: string;
  tenantId: string;
  projectId?: string | null;
  userId: string;
  action: string; // e.g. "created_task", "changed_status"
  entityType: 'project' | 'task' | 'sprint' | 'document' | 'timeEntry' | 'expense' | 'member' | 'comment';
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    logId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, default: null, index: true },
    userId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

ActivityLogSchema.index({ tenantId: 1, projectId: 1, createdAt: -1 });
ActivityLogSchema.index({ tenantId: 1, createdAt: -1 });

export const ActivityLogModel =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

export default ActivityLogModel;
