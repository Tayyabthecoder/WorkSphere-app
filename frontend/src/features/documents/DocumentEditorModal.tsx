import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  X,
  Save,
  History,
  RotateCcw,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
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
  FileText,
  Eye,
  Edit3,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import apiClient from '../../api/client';

interface DocumentVersion {
  version: number;
  content: string;
  savedBy: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface ProjectOption {
  projectId: string;
  name: string;
}

interface DocumentEditorModalProps {
  documentId: string | null;
  initialProjectId?: string;
  initialFolderId?: string;
  isOpen: boolean;
  onClose: () => void;
  onDocumentSaved: () => void;
}

export const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
  documentId,
  initialProjectId,
  initialFolderId,
  isOpen,
  onClose,
  onDocumentSaved,
}) => {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [folderId, setFolderId] = useState<string | null>(initialFolderId || null);
  const [versionHistory, setVersionHistory] = useState<DocumentVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState<DocumentVersion | null>(null);
  const [error, setError] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Write your specifications, requirements, architecture decisions...',
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[400px] text-text-primary leading-relaxed',
      },
    },
  });

  // Fetch project list for dropdown
  useEffect(() => {
    if (!isOpen) return;

    apiClient
      .get('/v1/projects')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setProjects(res.data.data);
          if (!projectId && res.data.data.length > 0) {
            setProjectId(res.data.data[0].projectId);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen, projectId]);

  // Load existing document if documentId provided
  useEffect(() => {
    if (!isOpen) return;

    if (documentId) {
      setIsLoading(true);
      apiClient
        .get(`/v1/documents/${documentId}`)
        .then((res) => {
          if (res.data?.success && res.data.data) {
            const doc = res.data.data;
            setTitle(doc.title || '');
            setProjectId(doc.projectId);
            setFolderId(doc.folderId || null);
            setVersionHistory(doc.versionHistory || []);
            setCurrentVersion((doc.versionHistory?.length || 0) + 1);

            if (editor && doc.content) {
              editor.commands.setContent(doc.content);
            }
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    } else {
      // Creating new doc
      setTitle('Untitled Document');
      setVersionHistory([]);
      setCurrentVersion(1);

      if (editor) {
        editor.commands.setContent(
          '<h1>Executive Project Brief</h1><p>Outline project vision, system architecture, deliverables, and requirements here.</p><h2>Key Milestones</h2><ul><li><p>Milestone 1: Discovery & Architecture</p></li><li><p>Milestone 2: Sprint 1 MVP</p></li><li><p>Milestone 3: Verification & Client Handover</p></li></ul>'
        );
      }
    }
  }, [documentId, isOpen, editor]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Document title is required');
      return;
    }
    if (!projectId) {
      setError('Please select a project');
      return;
    }

    const htmlContent = editor?.getHTML() || '';

    setIsSaving(true);
    setError('');

    try {
      if (documentId) {
        // Update existing document
        const res = await apiClient.put(`/v1/documents/${documentId}`, {
          title: title.trim(),
          content: htmlContent,
          folderId,
          saveVersionSnapshot: true,
        });
        const data = res.data;
        setVersionHistory(data.data.versionHistory || []);
        setCurrentVersion((data.data.versionHistory?.length || 0) + 1);
      } else {
        // Create new document
        await apiClient.post('/v1/documents', {
          title: title.trim(),
          content: htmlContent,
          projectId,
          folderId,
        });
      }

      setSaveSuccessMsg('Revision Saved!');
      setTimeout(() => setSaveSuccessMsg(''), 2500);
      onDocumentSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchVersionHistory = async () => {
    if (!documentId) return;
    try {
      const res = await apiClient.get(`/v1/documents/${documentId}/versions`);
      if (res.data?.success && res.data.data) {
        setVersionHistory(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch document versions:', err);
    }
  };

  const handleRestoreVersion = async (v: DocumentVersion) => {
    if (!editor) return;

    setIsSaving(true);
    try {
      if (documentId) {
        const res = await apiClient.post(`/v1/documents/${documentId}/restore/${v.version}`);
        const restoredDoc = res.data?.data?.document;
        editor.commands.setContent(restoredDoc?.content || v.content);
        await fetchVersionHistory();
        setCurrentVersion((restoredDoc?.versionHistory?.length || 0) + 1);
      } else {
        editor.commands.setContent(v.content);
      }

      setShowHistory(false);
      setSelectedHistoryVersion(null);
      setSaveSuccessMsg(`Restored Version ${v.version}!`);
      setTimeout(() => setSaveSuccessMsg(''), 2500);
      onDocumentSaved();
    } catch (err) {
      console.error(err);
      setError('Failed to restore version snapshot');
    } finally {
      setIsSaving(false);
    }
  };

  const textContent = editor?.getText().trim() || '';
  const wordCount = textContent ? textContent.split(/\s+/).length : 0;
  const charCount = textContent.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-card border border-border/80 rounded-xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <div className="p-4 px-6 border-b border-border/80 flex items-center justify-between bg-surface-card">
          <div className="flex items-center gap-3 flex-1 mr-4">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-4 h-4" />
            </div>

            {/* Editable Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document Title..."
              className="text-sm font-bold text-text-primary bg-transparent outline-none hover:bg-surface-low px-2.5 py-1 rounded-lg focus:ring-1 focus:ring-brand-emerald w-full max-w-xs truncate transition-colors tracking-tight"
            />

            {/* Project Picker if creating or changing */}
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!!documentId}
              className="text-xs px-2.5 py-1 rounded-lg bg-surface-low border border-border text-text-secondary outline-none focus:ring-1 focus:ring-brand-emerald disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name}
                </option>
              ))}
            </select>

            <Badge variant="neutral" size="sm" className="font-mono tabular-nums">
              v{currentVersion}.0
            </Badge>

            {saveSuccessMsg && (
              <span className="text-xs font-semibold text-brand-emerald bg-brand-emerald/10 px-2.5 py-0.5 rounded-md animate-in fade-in">
                {saveSuccessMsg}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Preview Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="rounded-lg text-xs gap-1.5"
            >
              {previewMode ? (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </>
              )}
            </Button>

            {/* Version History Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextState = !showHistory;
                setShowHistory(nextState);
                if (nextState) fetchVersionHistory();
              }}
              className="rounded-lg text-xs gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              <span>
                History (<span className="font-mono tabular-nums">{versionHistory.length}</span>)
              </span>
            </Button>

            {/* Save Revision */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="primary"
              size="sm"
              className="rounded-lg text-xs gap-1.5 shadow-2xs"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Revision</span>
            </Button>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="px-6 py-2 bg-status-error-bg text-status-error-text text-xs border-b border-status-error-border flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Tiptap Formatting Toolbar */}
        {editor && !previewMode && (
          <div className="px-6 py-2 border-b border-border bg-surface-low/50 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('bold')
                  ? 'bg-brand-emerald text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
              }`}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('italic')
                  ? 'bg-brand-emerald text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
              }`}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('strike')
                  ? 'bg-brand-emerald text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
              }`}
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-border mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Heading 1"
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('heading', { level: 1 })
                  ? 'bg-brand-emerald text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
              }`}
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Heading 2"
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('heading', { level: 2 })
                  ? 'bg-brand-emerald text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
              }`}
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              title="Heading 3"
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('heading', { level: 3 })
                  ? 'bg-brand-emerald text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
              }`}
            >
              <Heading3 className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-border mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('bulletList')
                  ? 'bg-brand-emerald text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('orderedList')
                  ? 'bg-brand-emerald text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Blockquote"
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('blockquote')
                  ? 'bg-brand-emerald text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
              }`}
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="Code Block"
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('codeBlock')
                  ? 'bg-brand-emerald text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
              }`}
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Divider"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-card transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-border mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-card disabled:opacity-40 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-card disabled:opacity-40 transition-colors"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <span className="ml-auto text-[11px] text-text-muted font-mono tabular-nums">
              TipTap • {wordCount} words • {charCount} chars
            </span>
          </div>
        )}

        {/* Editor Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 p-8 overflow-y-auto bg-surface-card">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-brand-emerald animate-spin" />
              </div>
            ) : previewMode ? (
              <div
                className="prose prose-sm sm:prose max-w-none text-text-primary leading-relaxed"
                dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '<p>Empty document</p>' }}
              />
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>

          {/* Version History Slide-Over Drawer */}
          {showHistory && (
            <div className="w-80 border-l border-border bg-surface-low flex flex-col z-20 animate-in slide-in-from-right duration-200">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-emerald" />
                  <span className="text-xs font-bold text-text-primary">
                    Revision Snapshots
                  </span>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded-md text-text-muted hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {versionHistory.map((v) => (
                  <div
                    key={v.version}
                    onClick={() => setSelectedHistoryVersion(v)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedHistoryVersion?.version === v.version
                        ? 'bg-brand-emerald/10 border-brand-emerald text-brand-emerald shadow-xs'
                        : 'bg-surface-card border-border hover:bg-surface-low'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono tabular-nums text-text-primary">
                        Version {v.version}.0
                      </span>
                      <span className="text-[10px] text-text-muted font-mono tabular-nums">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[11px] text-text-secondary">
                      <span>Saved by {v.user?.name || v.savedBy}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreVersion(v);
                        }}
                        className="font-semibold text-brand-emerald hover:underline inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Restore
                      </button>
                    </div>

                    {selectedHistoryVersion?.version === v.version && (
                      <div className="mt-2.5 pt-2 border-t border-border/80 text-[11px] text-text-secondary animate-in fade-in duration-150">
                        <div className="font-semibold text-text-primary mb-1">Content Preview:</div>
                        <div
                          className="max-h-24 overflow-y-auto p-2 rounded bg-surface-low text-[10px] text-text-secondary leading-snug border border-border/60"
                          dangerouslySetInnerHTML={{ __html: v.content || '<em>(empty revision)</em>' }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreVersion(v);
                          }}
                          className="mt-2 w-full py-1.5 rounded-lg bg-brand-emerald text-white text-xs font-semibold hover:bg-brand-emerald/90 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore this version
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {versionHistory.length === 0 && (
                  <div className="py-12 text-center text-xs text-text-muted">
                    No previous revisions yet. Click &ldquo;Save Revision&rdquo; to create a snapshot.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentEditorModal;
