import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  Clock,
  Eye,
  CheckCircle2,
  FileText,
  AlertCircle,
  Archive,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { BlogEditorModal } from './BlogEditorModal';
import {
  fetchAllPostsAdmin,
  updateBlogPost,
  deleteBlogPost,
  restoreBlogPost,
  BlogPost,
  BlogPostStatus,
  getAuthorDetails,
} from '../../../api/blog';

export const BlogManagerView: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BlogPostStatus>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const res = await fetchAllPostsAdmin({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 50,
      });
      setPosts(res.data || []);
    } catch (err) {
      console.error('Failed to load blog posts for admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [statusFilter]);

  const handleEdit = (postId: string) => {
    setSelectedPostId(postId);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setSelectedPostId(null);
    setIsEditorOpen(true);
  };

  const handleTogglePublish = async (post: BlogPost) => {
    const newStatus: BlogPostStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await updateBlogPost(post.postId, { status: newStatus });
      loadPosts();
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (post.status === 'archived') {
      if (!window.confirm(`Permanently purge "${post.title}"? This cannot be undone.`)) {
        return;
      }
      try {
        await deleteBlogPost(post.postId, true);
        loadPosts();
      } catch (err) {
        console.error('Failed to permanently purge blog post:', err);
      }
    } else {
      if (!window.confirm(`Archive "${post.title}"? It will be removed from the public blog and can be restored from the Archived tab.`)) {
        return;
      }
      try {
        await deleteBlogPost(post.postId, false);
        loadPosts();
      } catch (err) {
        console.error('Failed to archive blog post:', err);
      }
    }
  };

  const handleRestore = async (post: BlogPost) => {
    try {
      await restoreBlogPost(post.postId);
      loadPosts();
    } catch (err) {
      console.error('Failed to restore blog post:', err);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const author = getAuthorDetails(p);
    const categoryName = typeof p.category === 'object' && p.category ? ((p.category as any).name || '') : (p.category || '');
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.excerpt || '').toLowerCase().includes(q) ||
      author.name.toLowerCase().includes(q) ||
      categoryName.toLowerCase().includes(q)
    );
  });

  const totalPublished = posts.filter((p) => p.status === 'published').length;
  const totalDrafts = posts.filter((p) => p.status === 'draft').length;
  const totalArchived = posts.filter((p) => p.status === 'archived').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-emerald" />
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Blog &amp; Editorial Dispatch Manager
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Platform owner controls to author, curate, and publish technical articles to the marketing site (/blog).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={loadPosts}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleCreate}
          >
            New Article
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-card border border-border/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Total Articles
            </div>
            <div className="text-2xl font-bold font-display text-text-primary mt-1">
              {posts.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Live &amp; Published
            </div>
            <div className="text-2xl font-bold font-display text-emerald-700 mt-1">
              {totalPublished}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Drafts / In Review
            </div>
            <div className="text-2xl font-bold font-display text-amber-700 mt-1">
              {totalDrafts}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Archived / Trash
            </div>
            <div className="text-2xl font-bold font-display text-slate-700 mt-1">
              {totalArchived}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
            <Archive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-card p-3 rounded-xl border border-border/80">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'published', 'draft', 'archived'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-brand-emerald text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter articles..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-low border border-border/80 text-xs text-text-primary placeholder-text-muted focus:outline-hidden focus:border-brand-emerald"
          />
        </div>
      </div>

      {/* Articles Table / List */}
      <div className="bg-surface-card rounded-xl border border-border/80 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-text-muted space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-emerald" />
            <span className="text-xs">Loading editorial repository...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <BookOpen className="w-8 h-8 text-text-muted mx-auto" />
            <div className="text-sm font-bold text-text-primary">No articles found</div>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              No articles match your current status or search filter. Create your first technical dispatch to get started.
            </p>
            <Button size="sm" variant="primary" onClick={handleCreate}>
              Compose First Article
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredPosts.map((post) => {
              const author = getAuthorDetails(post);
              return (
                <div
                  key={post.postId}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-low/50 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          post.status === 'published'
                            ? 'success'
                            : post.status === 'draft'
                            ? 'warning'
                            : 'neutral'
                        }
                        className="text-[10px] uppercase font-mono font-bold tracking-wider"
                      >
                        {post.status}
                      </Badge>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-[#006C4B] border border-emerald-200/60">
                        {typeof post.category === 'object' && post.category ? ((post.category as any).name || 'Engineering') : (post.category || 'Engineering')}
                      </span>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTimeMinutes || 5} min read
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-text-primary hover:text-brand-emerald transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>

                    <div className="text-[11px] text-text-muted flex items-center gap-2">
                      <span>By <strong className="text-text-primary">{author.name}</strong> ({author.role})</span>
                      <span>&bull;</span>
                      <span>Slug: <code className="font-mono bg-surface-low px-1 rounded">{post.slug}</code></span>
                    </div>
                  </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {post.status === 'archived' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={() => handleRestore(post)}
                        title="Restore back to draft"
                      >
                        Restore
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleDelete(post)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Permanently purge article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      {post.status === 'published' && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-low hover:bg-surface-high border border-border/80 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                          title="View public article"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>View</span>
                        </a>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(post)}
                        title={post.status === 'published' ? 'Unpublish to draft' : 'Publish to live site'}
                      >
                        {post.status === 'published' ? 'Unpublish' : 'Publish'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        onClick={() => handleEdit(post.postId)}
                      >
                        Edit
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleDelete(post)}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                        title="Archive article"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <BlogEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        postId={selectedPostId}
        onSaved={loadPosts}
      />
    </div>
  );
};

export default BlogManagerView;
