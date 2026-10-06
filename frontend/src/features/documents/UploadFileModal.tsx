import React, { useState, useEffect } from 'react';
import { X, UploadCloud, File, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import apiClient from '../../api/client';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUploaded: () => void;
  initialProjectId?: string;
  initialFolderId?: string;
}

interface ProjectOption {
  projectId: string;
  name: string;
}

interface FolderOption {
  folderId: string;
  name: string;
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({
  isOpen,
  onClose,
  onFileUploaded,
  initialProjectId,
  initialFolderId,
}) => {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [selectedFolderId, setSelectedFolderId] = useState(initialFolderId || '');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(1024 * 340); // default 340 KB
  const [mimeType, setMimeType] = useState('application/pdf');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!selectedProjectId) return;

    apiClient
      .get(`/v1/folders?projectId=${selectedProjectId}`)
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setFolders(res.data.data);
        }
      })
      .catch((err) => console.error(err));
  }, [selectedProjectId]);

  if (!isOpen) return null;

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setFileSize(file.size);
      setMimeType(file.type || 'application/octet-stream');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) {
      setError('Please select or specify a file name');
      return;
    }
    if (!selectedProjectId) {
      setError('Please select a target project');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('projectId', selectedProjectId);
        if (selectedFolderId) {
          formData.append('folderId', selectedFolderId);
        }
        formData.append('name', fileName.trim());

        await apiClient.post('/v1/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await apiClient.post('/v1/files', {
          name: fileName.trim(),
          projectId: selectedProjectId,
          folderId: selectedFolderId || null,
          size: fileSize,
          mimeType,
        });
      }

      onFileUploaded();
      onClose();
      setFileName('');
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to record file');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-card border border-border/80 rounded-xl p-6 shadow-2xl w-full max-w-md flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shadow-2xs">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary tracking-tight">
                Upload File Asset
              </h3>
              <p className="text-xs text-text-secondary">
                Upload design assets, PDFs, or spreadsheets
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
              onChange={(e) => setSelectedProjectId(e.target.value)}
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
              Target Folder (Optional)
            </label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-surface-low border border-border/80 text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald"
            >
              <option value="">Root (No Folder)</option>
              {folders.map((f) => (
                <option key={f.folderId} value={f.folderId}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Choose File or Drag &amp; Drop
            </label>
            <input
              type="file"
              onChange={handleFileChosen}
              className="w-full text-xs text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-emerald/10 file:text-brand-emerald hover:file:bg-brand-emerald/20 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Display Name *
            </label>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g., Q3_Budget_Summary.pdf"
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
              disabled={isSubmitting || !fileName}
              className="rounded-lg text-xs gap-1.5 shadow-2xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              <span>Upload File</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadFileModal;
