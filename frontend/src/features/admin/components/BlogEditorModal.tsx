import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  X,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Loader2,
  BookOpen,
  Send,
  Save,
  Tag,
  Link as LinkIcon,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  createBlogPost,
  updateBlogPost,
  fetchPostByIdAdmin,
  BlogPostStatus,
} from '../../../api/blog';

interface BlogEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string | null;
  onSaved: () => void;
}

const CATEGORY_OPTIONS = [
  'Engineering & Architecture',
  'Methodology & Agile',
  'Agency Operations',
  'Product Releases',
  'Company News',
  'Security & Compliance',
];

const DRAFT_KEY = 'worksphere_blog_editor_draft_v1';

export const BlogEditorModal: React.FC<BlogEditorModalProps> = ({
  isOpen,
  onClose,
  postId,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [tagsInput, setTagsInput] = useState('');
  const [authorRole, setAuthorRole] = useState('Platform Owner');
  const [status, setStatus] = useState<BlogPostStatus>('draft');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedDraftFound, setSavedDraftFound] = useState<any | null>(null);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Write your technical dispatch, system architecture breakdown, or release notes...',
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'prose-blog focus:outline-none min-h-[320px] max-h-[500px] overflow-y-auto px-4 py-3 leading-relaxed text-text-primary',
      },
    },
  });

  // Check for local draft when creating a new post
  useEffect(() => {
    if (isOpen && !postId) {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.title || parsed.content) {
            setSavedDraftFound(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to parse local draft:', err);
      }
    } else {
      setSavedDraftFound(null);
    }
  }, [isOpen, postId]);

  // Debounced auto-save to localStorage for new drafts
  useEffect(() => {
    if (!isOpen || postId) return;

    const timer = setTimeout(() => {
      const htmlContent = editor?.getHTML() || '';
      if (
        title.trim() ||
        excerpt.trim() ||
        (htmlContent && htmlContent !== '<p></p>')
      ) {
        const draftPayload = {
          title,
          customSlug,
          excerpt,
          category,
          tagsInput,
          authorRole,
          status,
          coverImageUrl,
          content: htmlContent,
          savedAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draftPayload));
        } catch {}
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [
    isOpen,
    postId,
    title,
    customSlug,
    excerpt,
    category,
    tagsInput,
    authorRole,
    status,
    coverImageUrl,
    editor,
  ]);

  const restoreDraft = () => {
    if (!savedDraftFound) return;
    setTitle(savedDraftFound.title || '');
    setCustomSlug(savedDraftFound.customSlug || '');
    setExcerpt(savedDraftFound.excerpt || '');
    setCategory(savedDraftFound.category || CATEGORY_OPTIONS[0]);
    setTagsInput(savedDraftFound.tagsInput || '');
    setAuthorRole(savedDraftFound.authorRole || 'Platform Owner');
    setStatus(savedDraftFound.status || 'draft');
    setCoverImageUrl(savedDraftFound.coverImageUrl || '');
    if (editor && savedDraftFound.content) {
      editor.commands.setContent(savedDraftFound.content);
    }
    setSavedDraftFound(null);
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setSavedDraftFound(null);
  };

  const handleInsertImage = () => {
    const url = window.prompt('Enter Image URL (e.g. https://images.unsplash.com/...):');
    if (!url || !url.trim()) return;
    const alt = window.prompt('Enter image description / caption:', 'Architecture Diagram') || 'Image';
    const cleanUrl = url.trim().replace(/"/g, '&quot;');
    const cleanAlt = alt.trim().replace(/"/g, '&quot;');
    editor?.commands.insertContent(`<img src="${cleanUrl}" alt="${cleanAlt}" /><p></p>`);
  };

  const handleInsertCallout = (type: 'tip' | 'warning' | 'info') => {
    const defaultText =
      type === 'tip'
        ? 'Partitioning data by tenantId upfront prevents cross-tenant latency spikes.'
        : type === 'warning'
        ? 'Avoid unindexed regex queries in high-throughput production paths.'
        : 'All changes are monotonically versioned across socket frames.';

    const text = window.prompt(`Enter ${type.toUpperCase()} callout text:`, defaultText);
    if (!text) return;

    const prefix = type === 'tip' ? '💡 Tip:' : type === 'warning' ? '⚠️ Warning:' : 'ℹ️ Note:';
    editor?.commands.insertContent(
      `<blockquote><strong>${prefix}</strong> ${text.trim()}</blockquote><p></p>`
    );
  };

  // Load post data if editing
  useEffect(() => {
    if (!isOpen) return;

    if (postId) {
      setIsLoading(true);
      setError(null);
      fetchPostByIdAdmin(postId)
        .then((post) => {
          setTitle(post.title || '');
          setCustomSlug(post.slug || '');
          setExcerpt(post.excerpt || '');
          const catStr = typeof post.category === 'object' && post.category ? ((post.category as any).name || CATEGORY_OPTIONS[0]) : (post.category || CATEGORY_OPTIONS[0]);
          setCategory(catStr);
          setTagsInput(post.tags ? post.tags.join(', ') : '');
          setAuthorRole(post.authorRole || 'Platform Owner');
          setStatus(post.status || 'draft');
          setCoverImageUrl(post.coverImageUrl || '');

          if (editor && post.content) {
            editor.commands.setContent(post.content);
          }
        })
        .catch((err) => {
          console.error('Failed to load post for editing:', err);
          setError('Failed to load article details.');
        })
        .finally(() => setIsLoading(false));
    } else {
      // New post defaults
      setTitle('');
      setCustomSlug('');
      setExcerpt('');
      setCategory(CATEGORY_OPTIONS[0]);
      setTagsInput('');
      setAuthorRole('Platform Owner');
      setStatus('draft');
      setCoverImageUrl('');
      if (editor) {
        editor.commands.setContent('');
      }
    }
  }, [isOpen, postId, editor]);

  // Close modal on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  const handleSave = async (targetStatus?: BlogPostStatus) => {
    if (!title.trim()) {
      setError('Article title is required.');
      return;
    }
    if (!excerpt.trim()) {
      setError('Article summary / excerpt is required.');
      return;
    }
    const htmlContent = editor?.getHTML() || '';
    if (!htmlContent || htmlContent === '<p></p>') {
      setError('Article body content cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const postStatus = targetStatus || status;

      if (postId) {
        await updateBlogPost(postId, {
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: htmlContent,
          category,
          tags: parsedTags,
          coverImageUrl: coverImageUrl.trim() || undefined,
          authorRole: authorRole.trim(),
          status: postStatus,
          customSlug: customSlug.trim() || undefined,
        });
      } else {
        await createBlogPost({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: htmlContent,
          category,
          tags: parsedTags,
          coverImageUrl: coverImageUrl.trim() || undefined,
          authorRole: authorRole.trim(),
          status: postStatus === 'published' ? 'published' : 'draft',
        });
      }

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      setSavedDraftFound(null);

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save blog post:', err);
      setError(err.response?.data?.error?.message || 'Failed to save blog post.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-surface-card rounded-2xl shadow-2xl border border-border/80 flex flex-col max-h-[90vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-surface-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center border border-brand-emerald/20">
              <BookOpen className="w-5 h-5 text-brand-emerald" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {postId ? 'Edit Editorial Article' : 'Compose New Article'}
              </h2>
              <p className="text-xs text-text-secondary">
                Platform owner editorial dispatch published across the WorkSphere network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={status === 'published' ? 'success' : 'neutral'}
              className="uppercase tracking-wider font-mono text-[10px]"
            >
              {status}
            </Badge>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-8 h-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-high flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {savedDraftFound && !postId && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Unsaved Local Draft Detected
                </span>
                <p className="text-emerald-800 text-[11px]">
                  Found auto-saved draft for "{savedDraftFound.title || 'Untitled Article'}". Would you like to restore it?
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={discardDraft}>
                  Discard
                </Button>
                <Button size="sm" variant="primary" leftIcon={<RotateCcw className="w-3 h-3" />} onClick={restoreDraft}>
                  Restore Draft
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-text-muted space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
              <span className="text-xs">Loading post content...</span>
            </div>
          ) : (
            <>
              {/* Title & Slug */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Architecting Sub-50ms Multi-Tenant State with MERN"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-low border border-border/80 text-sm font-semibold text-text-primary placeholder-text-muted focus:outline-hidden focus:border-brand-emerald focus:bg-surface"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-low border border-border/80 text-xs text-text-primary focus:outline-hidden focus:border-brand-emerald"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Author Role / Title
                    </label>
                    <input
                      type="text"
                      value={authorRole}
                      onChange={(e) => setAuthorRole(e.target.value)}
                      placeholder="e.g. VP of Engineering, Platform Architect"
                      className="w-full px-3 py-2 rounded-xl bg-surface-low border border-border/80 text-xs text-text-primary focus:outline-hidden focus:border-brand-emerald"
                    />
                  </div>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">
                  Card Summary / Excerpt *
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A concise 1-2 sentence hook displayed on the article card and meta descriptions..."
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-low border border-border/80 text-xs text-text-primary placeholder-text-muted focus:outline-hidden focus:border-brand-emerald focus:bg-surface resize-none leading-relaxed"
                />
              </div>

              {/* Tags & Cover Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Tags (comma separated)
                  </label>
                  <div className="relative">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" />
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="WebSockets, MERN, Multi-Tenancy"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-low border border-border/80 text-xs text-text-primary focus:outline-hidden focus:border-brand-emerald"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Cover Image URL (Optional)
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" />
                    <input
                      type="text"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-low border border-border/80 text-xs text-text-primary focus:outline-hidden focus:border-brand-emerald"
                    />
                  </div>
                </div>
              </div>

              {/* Rich TipTap Editor */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-primary">
                  Article Body Content *
                </label>

                <div className="rounded-xl border border-border/80 overflow-hidden bg-surface">
                  {/* TipTap Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-2 bg-surface-subtle border-b border-border/80 text-text-muted text-xs">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`p-1.5 rounded-md hover:bg-surface-high transition-colors ${
                        editor?.isActive('bold') ? 'bg-surface-high text-brand-emerald font-bold' : ''
                      }`}
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={`p-1.5 rounded-md hover:bg-surface-high transition-colors ${
                        editor?.isActive('italic') ? 'bg-surface-high text-brand-emerald font-bold' : ''
                      }`}
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-[1px] h-4 bg-border/80 mx-1" />

                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`p-1.5 rounded-md hover:bg-surface-high transition-colors ${
                        editor?.isActive('heading', { level: 2 }) ? 'bg-surface-high text-brand-emerald font-bold' : ''
                      }`}
                      title="Heading 2"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`p-1.5 rounded-md hover:bg-surface-high transition-colors ${
                        editor?.isActive('heading', { level: 3 }) ? 'bg-surface-high text-brand-emerald font-bold' : ''
                      }`}
                      title="Heading 3"
                    >
                      <Heading3 className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-[1px] h-4 bg-border/80 mx-1" />

                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      className={`p-1.5 rounded-md hover:bg-surface-high transition-colors ${
                        editor?.isActive('bulletList') ? 'bg-surface-high text-brand-emerald font-bold' : ''
                      }`}
                      title="Bullet List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                      className={`p-1.5 rounded-md hover:bg-surface-high transition-colors ${
                        editor?.isActive('orderedList') ? 'bg-surface-high text-brand-emerald font-bold' : ''
                      }`}
                      title="Numbered List"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                      className={`p-1.5 rounded-md hover:bg-surface-high transition-colors ${
                        editor?.isActive('codeBlock') ? 'bg-surface-high text-brand-emerald font-bold' : ''
                      }`}
                      title="Code Block"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                      className={`p-1.5 rounded-md hover:bg-surface-high transition-colors ${
                        editor?.isActive('blockquote') ? 'bg-surface-high text-brand-emerald font-bold' : ''
                      }`}
                      title="Blockquote"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                      className="p-1.5 rounded-md hover:bg-surface-high transition-colors"
                      title="Horizontal Divider"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-[1px] h-4 bg-border/80 mx-1" />

                    <button
                      type="button"
                      onClick={handleInsertImage}
                      className="p-1.5 rounded-md hover:bg-surface-high transition-colors"
                      title="Insert Image by URL"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertCallout('tip')}
                      className="p-1.5 rounded-md hover:bg-surface-high transition-colors text-emerald-600"
                      title="Insert Tip Callout Box"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-[1px] h-4 bg-border/80 mx-1" />

                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().undo().run()}
                      disabled={!editor?.can().undo()}
                      className="p-1.5 rounded-md hover:bg-surface-high transition-colors disabled:opacity-30"
                      title="Undo"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().redo().run()}
                      disabled={!editor?.can().redo()}
                      className="p-1.5 rounded-md hover:bg-surface-high transition-colors disabled:opacity-30"
                      title="Redo"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Editor Content Area */}
                  <EditorContent editor={editor} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-border/80 bg-surface-subtle flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-text-muted">
            {status === 'published' ? (
              <span className="text-emerald-700 font-medium">
                ● Live on marketing site (/blog)
              </span>
            ) : (
              <span>Draft will only be visible to Super Admins</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Save className="w-3.5 h-3.5" />}
              onClick={() => handleSave('draft')}
              disabled={isSaving || isLoading}
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              onClick={() => handleSave('published')}
              disabled={isSaving || isLoading}
            >
              {isSaving ? 'Publishing...' : 'Publish Article'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogEditorModal;
