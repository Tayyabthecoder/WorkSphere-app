import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from './User.js';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface IInvitation extends Document {
  invitationId: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  tokenHash: string;
  invitedByUserId: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    invitationId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['superAdmin', 'orgAdmin', 'manager', 'member', 'viewer'],
      default: 'member',
      required: true,
    },
    department: { type: String, default: 'Engineering' },
    tokenHash: { type: String, required: true, unique: true, index: true },
    invitedByUserId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    acceptedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

InvitationSchema.index({ tenantId: 1, email: 1, status: 1 });
InvitationSchema.index({ tenantId: 1, createdAt: -1 });

export const InvitationModel =
  mongoose.models.Invitation || mongoose.model<IInvitation>('Invitation', InvitationSchema);

export default InvitationModel;
