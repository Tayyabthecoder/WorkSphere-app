import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'superAdmin' | 'orgAdmin' | 'manager' | 'member' | 'viewer';

export interface IUser extends Document {
  userId: string;
  tenantId: string;
  email: string;
  passwordHash?: string;
  refreshTokenHash?: string | null;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  provider: 'email' | 'google';
  emailVerified: boolean;
  isActive: boolean;
  department?: string;
  timezone?: string;
  notificationPrefs?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    refreshTokenHash: { type: String, select: false, default: null },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: ['superAdmin', 'orgAdmin', 'manager', 'member', 'viewer'],
      default: 'member',
      index: true,
    },
    provider: { type: String, enum: ['email', 'google'], default: 'email' },
    emailVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
    department: { type: String },
    timezone: { type: String, default: 'UTC' },
    notificationPrefs: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique email within tenant, plus fast role lookup
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, role: 1 });

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel;
