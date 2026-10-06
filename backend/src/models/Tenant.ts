import mongoose, { Schema, Document } from 'mongoose';

export interface ITenantFeatureFlags {
  clientPortal?: boolean;
  capacityPlanning?: boolean;
  documentEditor?: boolean;
  [key: string]: boolean | undefined;
}

export interface ITenantSettings {
  featureFlags?: ITenantFeatureFlags;
  securityPolicy?: Record<string, unknown>;
  adminLabels?: string[];
  adminNotes?: string;
  adminNotesUpdatedAt?: Date | string;
  retentionPolicy?: Record<string, unknown>;
  currency?: string;
  currencySymbol?: string;
  country?: string;
  dateFormat?: string;
  plan?: string;
  impersonationSession?: {
    token: string;
    startedByUserId: string;
    expiresAt: Date | string;
  };
  [key: string]: unknown;
}

export interface ITenant extends Document {
  tenantId: string; // Unique workspace slug or UUID
  name: string;
  slug: string; // Subdomain e.g. "acme"
  status: 'active' | 'suspended' | 'archived';
  logoUrl?: string;
  timezone: string;
  language: string;
  country?: string;
  settings: ITenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    status: { type: String, enum: ['active', 'suspended', 'archived'], default: 'active', index: true },
    logoUrl: { type: String },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
    country: { type: String, default: '' },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

export const TenantModel =
  mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);

export default TenantModel;
