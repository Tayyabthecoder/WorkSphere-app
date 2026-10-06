import React, { useState, useEffect } from 'react';
import { X, Folder, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import apiClient from '../../api/client';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFolderCreated: () => void;
  initialProjectId?: string;
  initialParentFolderId?: string | null;
}

interface ProjectOption {
  projectId: string;
  name: string;
}

interface FolderOption {
  folderId: string;
  name: string;
  parentFolderId?: string | null;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onFolderCreated,
  initialProjectId,
  initialParentFolderId,
}) => {
  const [name, setName] = useState('');
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [availableFolders, setAvailableFolders] = useState<FolderOption[]>([]);
  const [selectedParentFolderId, setSelectedParentFolderId] = useState<string>(
    initialParentFolderId || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch projects on open
  useEffect(() => {
    if (!isOpen) return;

    apiClient
      .get('/v1/projects')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setProjects(res.data.data);
          if (!selectedProjectId && res.data.data.length > 0) {
            setSelectedProjectId(res.data.data[0].projectId);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen]);

  // Fetch existing folders for the selected project to allow nesting
  useEffect(() => {
    if (!isOpen || !selectedProjectId) return;

    apiClient
      .get(`/v1/folders?projectId=${encodeURIComponent(selectedProjectId)}`)
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setAvailableFolders(res.data.data);
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen, selectedProjectId]);

  useEffect(() => {
    if (initialParentFolderId !== undefined) {
      setSelectedParentFolderId(initialParentFolderId || '');
    }
  }, [initialParentFolderId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }
    if (!selectedProjectId) {
      setError('Please select a project');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post('/v1/folders', {
        name: name.trim(),
        projectId: selectedProjectId,
        parentFolderId: selectedParentFolderId ? selectedParentFolderId : null,
      });

      onFolderCreated();
      onClose();
      setName('');
      setSelectedParentFolderId('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-card border border-border/80 rounded-xl p-6 shadow-2xl w-full max-w-sm flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shadow-2xs">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary tracking-tight">
                New Folder
              </h3>
              <p className="text-xs text-text-secondary">
                Organize documents and assets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedParentFolderId('');
              }}
              className="w-full text-xs p-2.5 rounded-lg bg-surface-low border border-border/80 text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald"
              required
            >
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Parent Folder (Optional)
            </label>
            <select
              value={selectedParentFolderId}
              onChange={(e) => setSelectedParentFolderId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-surface-low border border-border/80 text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald"
            >
              <option value="">None (Top-Level Folder)</option>
              {availableFolders.map((f) => (
                <option key={f.folderId} value={f.folderId}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Folder Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Technical Specifications"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg text-xs gap-1.5 shadow-2xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Folder className="w-3.5 h-3.5" />
              )}
              <span>Create Folder</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFolderModal;
