import React, { useState, useMemo, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  Plus,
  Search,
  FileText,
  UploadCloud,
  File,
  Trash2,
  ChevronRight,
  ChevronDown,
  Layers,
  FolderPlus,
  Download,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { CreateFolderModal } from '../CreateFolderModal';
import { UploadFileModal } from '../UploadFileModal';
import { DocumentEditorModal } from '../DocumentEditorModal';
import { DocumentItem, FolderItem, FileItem } from '../../../types';
import apiClient from '../../../api/client';

type FilterTab = 'all' | 'documents' | 'files';

interface DocumentManagerViewProps {
  projectId?: string;
}

export const DocumentManagerView: React.FC<DocumentManagerViewProps> = ({ projectId }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const projectQuery = projectId && projectId !== 'all' ? `?projectId=${projectId}` : '';
      const [docsRes, foldersRes, filesRes] = await Promise.all([
        apiClient.get(`/v1/documents${projectQuery}`),
        apiClient.get(`/v1/folders${projectQuery}`),
        apiClient.get(`/v1/files${projectQuery}`),
      ]);

      if (docsRes.data?.success) setDocuments(docsRes.data.data || []);
      if (foldersRes.data?.success) setFolders(foldersRes.data.data || []);
      if (filesRes.data?.success) setFiles(filesRes.data.data || []);
    } catch (err) {
      console.error('Failed to load documents workspace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Group folders hierarchically
  const { rootFolders, folderChildrenMap } = useMemo(() => {
    const root: FolderItem[] = [];
    const childrenMap = new Map<string, FolderItem[]>();

    folders.forEach((f) => {
      if (!f.parentFolderId) {
        root.push(f);
      } else {
        const existing = childrenMap.get(f.parentFolderId) || [];
        existing.push(f);
        childrenMap.set(f.parentFolderId, existing);
      }
    });

    return { rootFolders: root, folderChildrenMap: childrenMap };
  }, [folders]);

  const handleDeleteFolder = async (e: React.MouseEvent, folder: FolderItem) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete folder "${folder.name}"?`)) return;

    try {
      await apiClient.delete(`/v1/folders/${folder.folderId}`);
      if (selectedFolderId === folder.folderId) setSelectedFolderId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete folder', err);
    }
  };

  const handleDeleteDocument = async (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await apiClient.delete(`/v1/documents/${documentId}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this file asset?')) return;
    try {
      await apiClient.delete(`/v1/files/${fileId}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete file', err);
    }
  };

  const handleDownloadFile = async (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    try {
      const downloadPath = `/v1/files/${file.fileId}/download`;
      const response = await apiClient.get(downloadPath, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: file.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download file directly, falling back:', err);
      window.open(`/api/v1/files/${file.fileId}/download`, '_blank');
    }
  };

  // Filtered items based on activeTab, selectedFolderId, and searchQuery
  const filteredDocuments = useMemo(() => {
    if (activeTab === 'files') return [];
    return documents.filter((doc) => {
      if (selectedFolderId && doc.folderId !== selectedFolderId) return false;
      if (!selectedFolderId && doc.folderId) return false;
      if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [documents, activeTab, selectedFolderId, searchQuery]);

  const filteredFiles = useMemo(() => {
    if (activeTab === 'documents') return [];
    return files.filter((file) => {
      if (selectedFolderId && file.folderId !== selectedFolderId) return false;
      if (!selectedFolderId && file.folderId) return false;
      if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [files, activeTab, selectedFolderId, searchQuery]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">
            Knowledge Base &amp; Assets
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Specifications, architecture documentation, and digital media repository
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FolderPlus className="w-4 h-4 text-brand-emerald" />}
            onClick={() => setIsFolderModalOpen(true)}
          >
            New Folder
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<UploadCloud className="w-4 h-4 text-brand-emerald" />}
            onClick={() => setIsFileModalOpen(true)}
          >
            Upload File
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingDocId(null);
              setIsEditorOpen(true);
            }}
          >
            New Document
          </Button>
        </div>
      </div>

      {/* Main Layout: Left Folder Tree, Right Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Folder Hierarchy */}
        <div className="md:col-span-1 p-4 rounded-xl bg-surface-card border border-border/80 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/80">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Directory
            </span>
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                selectedFolderId === null
                  ? 'bg-brand-emerald/15 text-brand-emerald font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              All Files
            </button>
          </div>

          <div className="flex flex-col gap-1 overflow-y-auto max-h-[500px]">
            {/* Root workspace entry */}
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                selectedFolderId === null
                  ? 'bg-surface-low text-brand-emerald font-bold border border-border'
                  : 'text-text-secondary hover:bg-surface-low hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Workspace Root</span>
              </div>
            </button>

            {/* Folder Tree */}
            {rootFolders.map((folder) => {
              const children = folderChildrenMap.get(folder.folderId) || [];
              const isExpanded = expandedFolderIds.has(folder.folderId);
              const isSelected = selectedFolderId === folder.folderId;

              return (
                <div key={folder.folderId} className="flex flex-col">
                  <div
                    onClick={() => setSelectedFolderId(folder.folderId)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-surface-low text-brand-emerald font-bold border border-border'
                        : 'text-text-secondary hover:bg-surface-low hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {children.length > 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFolderExpand(folder.folderId);
                          }}
                          className="p-0.5 rounded hover:bg-surface-card text-text-muted"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ) : (
                        <span className="w-4" />
                      )}
                      {isSelected ? (
                        <FolderOpen className="w-4 h-4 text-brand-emerald shrink-0" />
                      ) : (
                        <Folder className="w-4 h-4 text-text-muted shrink-0" />
                      )}
                      <span className="truncate">{folder.name}</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteFolder(e, folder)}
                      className="p-1 rounded text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                      title="Delete folder"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Nested child folders */}
                  {isExpanded && children.length > 0 && (
                    <div className="pl-6 flex flex-col gap-1 mt-1 border-l border-border/60 ml-3">
                      {children.map((child) => (
                        <div
                          key={child.folderId}
                          onClick={() => setSelectedFolderId(child.folderId)}
                          className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            selectedFolderId === child.folderId
                              ? 'bg-surface-low text-brand-emerald font-bold border border-border'
                              : 'text-text-secondary hover:bg-surface-low hover:text-text-primary'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Folder className="w-3.5 h-3.5 text-text-muted shrink-0" />
                            <span className="truncate">{child.name}</span>
                          </div>
                          <button
                            onClick={(e) => handleDeleteFolder(e, child)}
                            className="p-1 rounded text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Content Area: Files & Documents */}
        <div className="md:col-span-3 flex flex-col gap-4">
          {/* Controls Bar: Search & Tabs */}
          <div className="p-3 rounded-xl bg-surface-card border border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-surface-low p-1 rounded-lg border border-border text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'all'
                    ? 'bg-surface-card text-text-primary font-bold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                All ({documents.length + files.length})
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'documents'
                    ? 'bg-surface-card text-text-primary font-bold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Documents ({documents.length})
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'files'
                    ? 'bg-surface-card text-text-primary font-bold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Files ({files.length})
              </button>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents or files..."
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>

          {/* Grid of Documents and Files */}
          {isLoading ? (
            <div className="p-16 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-brand-emerald border-t-transparent animate-spin" />
            </div>
          ) : filteredDocuments.length === 0 && filteredFiles.length === 0 ? (
            <div className="p-16 rounded-xl bg-surface-card border border-border text-center flex flex-col items-center justify-center gap-2">
              <FileText className="w-8 h-8 text-text-muted" />
              <p className="text-xs font-semibold text-text-primary">No items found in this view</p>
              <p className="text-[11px] text-text-muted max-w-sm">
                Create a new document or upload a file asset to start compiling project deliverables.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Documents */}
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.documentId}
                  onClick={() => {
                    setEditingDocId(doc.documentId);
                    setIsEditorOpen(true);
                  }}
                  className="p-4 rounded-xl bg-surface-card border border-border/80 shadow-xs hover:border-brand-emerald/40 cursor-pointer transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary group-hover:text-brand-emerald transition-colors line-clamp-1">
                          {doc.title}
                        </h4>
                        <span className="text-[10px] text-text-muted">
                          Updated {new Date(doc.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteDocument(e, doc.documentId)}
                      className="p-1 rounded text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-text-secondary line-clamp-2">
                    {doc.content ? doc.content.replace(/[#*`]/g, '') : 'No content'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-text-muted">
                    <Badge variant="neutral">Doc</Badge>
                    <span>Click to open &amp; edit</span>
                  </div>
                </div>
              ))}

              {/* Files */}
              {filteredFiles.map((f) => (
                <div
                  key={f.fileId}
                  className="p-4 rounded-xl bg-surface-card border border-border/80 shadow-xs flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                        <File className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary line-clamp-1">
                          {f.name}
                        </h4>
                        <span className="text-[10px] text-text-muted">
                          {formatFileSize(f.size)} • {new Date(f.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDownloadFile(e, f)}
                        className="p-1 rounded text-text-muted hover:text-brand-emerald transition-colors"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFile(e, f.fileId)}
                        className="p-1 rounded text-text-muted hover:text-red-400 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-text-muted">
                    <span className="font-mono">{f.mimeType.split('/')[1] || 'binary'}</span>
                    <button
                      onClick={(e) => handleDownloadFile(e, f)}
                      className="text-brand-emerald hover:underline font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onFolderCreated={fetchData}
        initialParentFolderId={selectedFolderId}
      />

      <UploadFileModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onFileUploaded={fetchData}
        initialFolderId={selectedFolderId || undefined}
      />

      <DocumentEditorModal
        isOpen={isEditorOpen}
        documentId={editingDocId}
        onClose={() => setIsEditorOpen(false)}
        onDocumentSaved={fetchData}
        initialFolderId={selectedFolderId || undefined}
      />
    </div>
  );
};

export default DocumentManagerView;
