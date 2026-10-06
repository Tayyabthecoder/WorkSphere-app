import mongoose, { Schema, Document } from 'mongoose';

export interface IClientPortalSettings {
  allowOverview: boolean;
  allowTimeline: boolean;
  allowDeliverables: boolean;
  allowFinancialSummary: boolean;
}

export interface IClient extends Document {
  clientId: string;
  tenantId: string;
  name: string;
  company?: string;
  primaryEmail?: string;
  companyLogoUrl?: string;
  portalToken: string;
  isPortalActive: boolean;
  portalSettings: IClientPortalSettings;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    clientId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    primaryEmail: { type: String, trim: true, lowercase: true, default: '' },
    companyLogoUrl: { type: String, default: '' },
    portalToken: { type: String, required: true, unique: true, index: true },
    isPortalActive: { type: Boolean, default: true, index: true },
    portalSettings: {
      allowOverview: { type: Boolean, default: true },
      allowTimeline: { type: Boolean, default: true },
      allowDeliverables: { type: Boolean, default: true },
      allowFinancialSummary: { type: Boolean, default: false },
    },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

ClientSchema.index({ tenantId: 1, name: 1 });
ClientSchema.index({ tenantId: 1, isPortalActive: 1 });

export const ClientModel =
  mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);

export default ClientModel;
