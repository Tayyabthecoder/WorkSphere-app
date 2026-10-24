"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPostModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BlogPostSchema = new mongoose_1.Schema({
    postId: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    slugHistory: { type: [String], default: [] },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverImageUrl: { type: String },
    category: { type: String, required: true, trim: true, index: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true, trim: true },
    authorRole: { type: String, default: '', trim: true },
    readTimeMinutes: { type: Number, default: 1 },
    clapsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    publishedAt: { type: Date, index: true },
}, {
    timestamps: true,
});
// Fast listing queries: published posts ordered by date
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ slugHistory: 1 });
BlogPostSchema.index({ title: 'text', excerpt: 'text', tags: 'text' }, { weights: { title: 10, tags: 5, excerpt: 2 } });
exports.BlogPostModel = mongoose_1.default.models.BlogPost ||
    mongoose_1.default.model('BlogPost', BlogPostSchema);
exports.default = exports.BlogPostModel;
