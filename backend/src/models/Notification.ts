import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  notificationId: string;
  tenantId: string;
  userId: string;
  type: 'assignment' | 'mention' | 'deadline' | 'status_change' | 'budget_alert';
  title: string;
  message: string;
  relatedEntityType?: 'task' | 'project' | 'comment' | 'budget';
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['assignment', 'mention', 'deadline', 'status_change', 'budget_alert'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedEntityType: { type: String },
    relatedEntityId: { type: String },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ tenantId: 1, userId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default NotificationModel;
