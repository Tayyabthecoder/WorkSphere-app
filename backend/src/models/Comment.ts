import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  commentId: string;
  tenantId: string;
  taskId: string;
  projectId: string;
  authorId: string;
  authorName?: string;
  authorAvatarUrl?: string;
  content: string;
  mentions: string[];
  isDeleted: boolean;
  editedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    commentId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    taskId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, default: '' },
    authorAvatarUrl: { type: String, default: '' },
    content: { type: String, required: true, maxlength: 5000 },
    mentions: [{ type: String }],
    isDeleted: { type: Boolean, default: false, index: true },
    editedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

CommentSchema.index({ tenantId: 1, taskId: 1, createdAt: 1 });
CommentSchema.index({ tenantId: 1, commentId: 1 }, { unique: true });

export const CommentModel =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default CommentModel;
