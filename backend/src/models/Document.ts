import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentVersion {
  version: number;
  content: string; // JSON or HTML
  savedBy: string;
  createdAt: Date;
}

export interface IDoc extends Document {
  documentId: string;
  tenantId: string;
  projectId: string;
  folderId?: string | null;
  title: string;
  content: string; // Prosemirror / TipTap JSON string
  versionHistory: IDocumentVersion[];
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDoc>(
  {
    documentId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    folderId: { type: String, default: null, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    versionHistory: [
      {
        version: Number,
        content: String,
        savedBy: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

DocumentSchema.index({ tenantId: 1, projectId: 1, folderId: 1 });
DocumentSchema.index({ title: 'text', content: 'text' });

export const DocumentModel =
  mongoose.models.Document || mongoose.model<IDoc>('Document', DocumentSchema);

export default DocumentModel;
