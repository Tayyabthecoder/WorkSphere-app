import apiClient from './client';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogPost {
  postId: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string; // only present in single-post fetch
  coverImageUrl?: string;
  category: string;
  tags: string[];
  status: BlogPostStatus;
  authorId?: string;
  authorName?: string;
  authorRole?: string;
  author?: {
    name?: string;
    role?: string;
    avatarUrl?: string;
  } | string;
  readTimeMinutes?: number;
  slugHistory?: string[];
  clapsCount?: number;
  viewsCount?: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthorDetails {
  name: string;
  role: string;
  avatarUrl?: string;
}

export function getAuthorDetails(post?: any): AuthorDetails {
  if (!post) {
    return { name: 'WorkSphere Editorial', role: 'Editorial Contributor' };
  }

  let name = '';
  let role = '';
  let avatarUrl: string | undefined = undefined;

  // Case 1: post.author is an object { name, role, avatarUrl }
  if (post.author && typeof post.author === 'object') {
    if (typeof post.author.name === 'string') name = post.author.name.trim();
    if (typeof post.author.role === 'string') role = post.author.role.trim();
    if (typeof post.author.avatarUrl === 'string') avatarUrl = post.author.avatarUrl.trim();
  } else if (typeof post.author === 'string' && post.author.trim()) {
    name = post.author.trim();
  }

  // Case 2: post.authorName
  if (typeof post.authorName === 'string' && post.authorName.trim()) {
    name = post.authorName.trim();
  } else if (post.authorName && typeof post.authorName === 'object' && typeof (post.authorName as any).name === 'string') {
    name = (post.authorName as any).name.trim();
  }

  // Case 3: post.authorRole
  if (typeof post.authorRole === 'string' && post.authorRole.trim()) {
    role = post.authorRole.trim();
  }

  return {
    name: name || 'WorkSphere Editorial',
    role: role || 'Editorial Contributor',
    avatarUrl,
  };
}

export interface BlogListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BlogListResponse {
  data: BlogPost[];
  meta: BlogListMeta;
}

export interface CreateBlogPostPayload {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags?: string[];
  coverImageUrl?: string;
  status?: 'draft' | 'published';
  authorRole?: string;
  customSlug?: string;
}

export interface UpdateBlogPostPayload {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  coverImageUrl?: string;
  status?: BlogPostStatus;
  authorRole?: string;
  customSlug?: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/** Fetch published posts for the public marketing blog. */
export async function fetchPublishedPosts(params?: {
  category?: string;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<BlogListResponse> {
  const { data } = await apiClient.get('/blog', { params });
  return data; // { success, data: BlogPost[], meta }
}

/** Fetch a single published post by slug (public). */
export async function fetchPostBySlug(slug: string): Promise<BlogPost> {
  const { data } = await apiClient.get(`/blog/${slug}`);
  return data.data;
}

/** Fetch list of distinct published blog categories. */
export async function fetchBlogCategories(): Promise<string[]> {
  const { data } = await apiClient.get('/blog/categories');
  return data.data || [];
}

// ─── Admin (superAdmin only) ─────────────────────────────────────────────────

/** Fetch all posts (any status) for the admin blog manager. */
export async function fetchAllPostsAdmin(params?: {
  status?: BlogPostStatus;
  page?: number;
  limit?: number;
}): Promise<BlogListResponse> {
  const { data } = await apiClient.get('/blog/manage/all', { params });
  return data;
}

/** Fetch a single post by postId for editing (any status). */
export async function fetchPostByIdAdmin(postId: string): Promise<BlogPost> {
  const { data } = await apiClient.get(`/blog/manage/${postId}`);
  return data.data;
}

/** Create a new blog post. */
export async function createBlogPost(payload: CreateBlogPostPayload): Promise<BlogPost> {
  const { data } = await apiClient.post('/blog', payload);
  return data.data;
}

/** Update an existing blog post. */
export async function updateBlogPost(postId: string, payload: UpdateBlogPostPayload): Promise<BlogPost> {
  const { data } = await apiClient.patch(`/blog/${postId}`, payload);
  return data.data;
}

/** Delete a blog post (soft delete by default, permanent purge if true). */
export async function deleteBlogPost(postId: string, permanent: boolean = false): Promise<void> {
  await apiClient.delete(`/blog/${postId}`, {
    params: permanent ? { permanent: 'true' } : undefined,
  });
}

/** Restore an archived post back to draft status. */
export async function restoreBlogPost(postId: string): Promise<BlogPost> {
  const { data } = await apiClient.post(`/blog/manage/${postId}/restore`);
  return data.data;
}

/** Increment reader applause / claps for an article. */
export async function clapPost(slug: string): Promise<{ slug: string; clapsCount: number }> {
  const { data } = await apiClient.post(`/blog/${slug}/clap`);
  return data.data;
}
