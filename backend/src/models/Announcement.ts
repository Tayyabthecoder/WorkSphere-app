import mongoose, { Schema, Document } from 'mongoose';

export type AnnouncementType = 'info' | 'warning' | 'maintenance' | 'feature';
export type AnnouncementTargetAudience = 'all' | 'specific';

export interface IAnnouncement extends Document {
  announcementId: string;
  type: AnnouncementType;
  title: string;
  message: string; // Tiptap HTML string
  targetAudience: AnnouncementTargetAudience;
  targetTenantIds: string[];
  isActive: boolean;
  scheduledAt?: Date;
  expiresAt?: Date;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    announcementId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['info', 'warning', 'maintenance', 'feature'],
      default: 'info',
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    targetAudience: {
      type: String,
      enum: ['all', 'specific'],
      default: 'all',
      index: true,
    },
    targetTenantIds: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    scheduledAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, index: true },
    createdByUserId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

AnnouncementSchema.index({ isActive: 1, scheduledAt: -1, expiresAt: 1 });

export const AnnouncementModel =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

export default AnnouncementModel;
