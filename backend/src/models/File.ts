import mongoose, { Schema, Document } from 'mongoose';

export interface IFileVersion {
  version: number;
  storageUrl: string;
  size: number;
  uploadedBy: string;
  createdAt: Date;
}

export interface IFile extends Document {
  fileId: string;
  tenantId: string;
  projectId: string;
  taskId?: string | null;
  folderId?: string | null;
  name: string;
  mimeType: string;
  size: number;
  storageUrl: string;
  filePath?: string | null;
  version: number;
  versionHistory: IFileVersion[];
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    fileId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    taskId: { type: String, default: null, index: true },
    folderId: { type: String, default: null, index: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageUrl: { type: String, required: true },
    filePath: { type: String, default: null },
    version: { type: Number, default: 1 },
    versionHistory: [
      {
        version: Number,
        storageUrl: String,
        size: Number,
        uploadedBy: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    uploadedBy: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

FileSchema.index({ tenantId: 1, projectId: 1, folderId: 1 });

export const FileModel = mongoose.models.File || mongoose.model<IFile>('File', FileSchema);

export default FileModel;
