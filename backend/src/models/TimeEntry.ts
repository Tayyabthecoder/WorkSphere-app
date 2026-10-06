import mongoose, { Schema, Document } from 'mongoose';

export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface ITimeEntry extends Document {
  entryId: string;
  tenantId: string;
  taskId: string;
  projectId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // In minutes
  description?: string;
  isBillable: boolean;
  status: TimeEntryStatus;
  rejectionNote?: string;
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  reviewedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema = new Schema<ITimeEntry>(
  {
    entryId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    taskId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date },
    duration: { type: Number, required: true, default: 0 },
    description: { type: String, default: '' },
    isBillable: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    rejectionNote: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

TimeEntrySchema.index({ tenantId: 1, userId: 1, startTime: -1 });
TimeEntrySchema.index({ tenantId: 1, projectId: 1, startTime: -1 });
TimeEntrySchema.index({ tenantId: 1, taskId: 1 });

export const TimeEntryModel =
  mongoose.models.TimeEntry || mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema);

export default TimeEntryModel;
