import mongoose, { Schema, Document } from 'mongoose';

export type EmailTemplateKey =
  | 'invitation'
  | 'password_reset'
  | 'portal_welcome'
  | 'announcement'
  | 'digest'
  | string;

export interface IEmailTemplate extends Document {
  templateId: string;
  key: EmailTemplateKey;
  name: string;
  subjectLine: string;
  htmlBody: string;
  textBody?: string;
  variables: string[];
  isActive: boolean;
  lastEditedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    templateId: { type: String, required: true, unique: true, index: true },
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    subjectLine: { type: String, required: true, trim: true },
    htmlBody: { type: String, required: true },
    textBody: { type: String, default: '' },
    variables: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    lastEditedByUserId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const EmailTemplateModel =
  mongoose.models.EmailTemplate ||
  mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);

export default EmailTemplateModel;
