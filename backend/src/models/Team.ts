import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  teamId: string;
  tenantId: string;
  name: string;
  description?: string;
  department: string;
  managerId: string;
  leaderId?: string | null;
  memberIds: string[];
  colorLabel?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    teamId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    department: { type: String, required: true, default: 'Engineering' },
    managerId: { type: String, required: true, index: true },
    leaderId: { type: String, default: null, index: true },
    memberIds: [{ type: String, index: true }],
    colorLabel: { type: String, default: '#0D9488' },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

TeamSchema.index({ tenantId: 1, name: 1 }, { unique: true });
TeamSchema.index({ tenantId: 1, managerId: 1 });
TeamSchema.index({ tenantId: 1, isActive: 1 });

export const TeamModel = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default TeamModel;
