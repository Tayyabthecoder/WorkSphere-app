import mongoose, { Schema, Document } from 'mongoose';

export interface IFolder extends Document {
  folderId: string;
  tenantId: string;
  projectId: string;
  name: string;
  parentFolderId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    folderId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    parentFolderId: { type: String, default: null, index: true },
  },
  {
    timestamps: true,
  }
);

FolderSchema.index({ tenantId: 1, projectId: 1, parentFolderId: 1 });

export const FolderModel =
  mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);

export default FolderModel;
