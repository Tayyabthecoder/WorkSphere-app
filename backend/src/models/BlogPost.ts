import mongoose, { Schema, Document } from 'mongoose';

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface IBlogPost extends Document {
  postId: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // TipTap HTML string
  coverImageUrl?: string;
  category: string;
  tags: string[];
  status: BlogPostStatus;
  authorId: string;       // userId of the superAdmin who authored it
  authorName: string;     // Denormalized for fast reads
  authorRole: string;     // Denormalized display role / job title
  readTimeMinutes: number;
  publishedAt?: Date;
  slugHistory?: string[];
  clapsCount?: number;
  viewsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    postId:          { type: String, required: true, unique: true, index: true },
    slug:            { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    slugHistory:     { type: [String], default: [] },
    title:           { type: String, required: true, trim: true },
    excerpt:         { type: String, required: true, trim: true },
    content:         { type: String, required: true },
    coverImageUrl:   { type: String },
    category:        { type: String, required: true, trim: true, index: true },
    tags:            { type: [String], default: [] },
    status:          { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    authorId:        { type: String, required: true, index: true },
    authorName:      { type: String, required: true, trim: true },
    authorRole:      { type: String, default: '', trim: true },
    readTimeMinutes: { type: Number, default: 1 },
    clapsCount:      { type: Number, default: 0 },
    viewsCount:      { type: Number, default: 0 },
    publishedAt:     { type: Date, index: true },
  },
  {
    timestamps: true,
  }
);

// Fast listing queries: published posts ordered by date
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ slugHistory: 1 });
BlogPostSchema.index(
  { title: 'text', excerpt: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, excerpt: 2 } }
);

export const BlogPostModel =
  mongoose.models.BlogPost ||
  mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);

export default BlogPostModel;
