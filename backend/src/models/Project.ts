import mongoose, { Schema, Document } from 'mongoose';

export type ProjectMethodology = 'Agile' | 'Waterfall' | 'Hybrid';
export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'Archived';

export interface IProjectMember {
  userId: string;
  role: 'manager' | 'member' | 'viewer';
}

export interface IProjectPhase {
  id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  color?: string;
}

export interface IProject extends Document {
  projectId: string;
  tenantId: string;
  name: string;
  description?: string;
  methodology: ProjectMethodology;
  status: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  colorLabel?: string;
  budget?: {
    total: number;
    currency: string;
    type: 'fixed' | 'hourly';
  };
  clientId?: string | null;
  members: IProjectMember[];
  phases: IProjectPhase[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    projectId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    methodology: {
      type: String,
      enum: ['Agile', 'Waterfall', 'Hybrid'],
      default: 'Agile',
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'On Hold', 'Completed', 'Archived'],
      default: 'Active',
      index: true,
    },
    startDate: { type: Date },
    endDate: { type: Date },
    colorLabel: { type: String, default: '#1B4D3E' },
    budget: {
      total: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      type: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
    },
    clientId: { type: String, default: null, index: true },
    members: [
      {
        userId: { type: String, required: true },
        role: { type: String, enum: ['manager', 'member', 'viewer'], default: 'member' },
      },
    ],
    phases: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        startDate: { type: Date },
        endDate: { type: Date },
        color: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ tenantId: 1, status: 1 });
ProjectSchema.index({ tenantId: 1, clientId: 1 });
ProjectSchema.index({ tenantId: 1, projectId: 1 }, { unique: true });

export const ProjectModel =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default ProjectModel;
