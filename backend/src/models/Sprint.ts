import mongoose, { Schema, Document } from 'mongoose';

export type SprintStatus = 'planning' | 'active' | 'completed';

export interface ISprint extends Document {
  sprintId: string;
  tenantId: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  capacityPoints?: number;
  committedPoints?: number;
  status: SprintStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema = new Schema<ISprint>(
  {
    sprintId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    goal: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    capacityPoints: { type: Number, default: 0 },
    committedPoints: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed'],
      default: 'planning',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

SprintSchema.index({ tenantId: 1, projectId: 1, status: 1 });
SprintSchema.index({ tenantId: 1, sprintId: 1 }, { unique: true });

export const SprintModel =
  mongoose.models.Sprint || mongoose.model<ISprint>('Sprint', SprintSchema);

export default SprintModel;
