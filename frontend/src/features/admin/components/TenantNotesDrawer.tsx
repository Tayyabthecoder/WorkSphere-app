import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import apiClient from '../../../api/client';

interface TenantNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  onNotesSaved?: () => void;
}

export const TenantNotesDrawer: React.FC<TenantNotesDrawerProps> = ({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  onNotesSaved,
}) => {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !tenantId) return;

    const fetchTenantNotes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSaveSuccess(false);

        const res = await apiClient.get('/v1/admin/tenants');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const tenant = res.data.data.find((t: any) => t.tenantId === tenantId);
          setNotes(tenant?.settings?.internalNotes || '');
        }
      } catch (err: any) {
        setError('Failed to load notes for this tenant.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantNotes();
  }, [isOpen, tenantId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await apiClient.patch(`/v1/admin/tenants/${tenantId}/settings`, {
        settings: {
          internalNotes: notes,
        },
      });

      setSaveSuccess(true);
      onNotesSaved?.();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError('Failed to save tenant notes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-evergreen/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-surface-card border-l border-border/80 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-low border border-border/80 flex items-center justify-center text-brand-emerald">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-tight">Internal Notes</h3>
              <p className="text-[11px] text-text-secondary truncate max-w-[240px]">
                {tenantName} ({tenantId})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-emerald" />
              <span>Internal notes saved!</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-brand-emerald animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs font-semibold text-text-primary">
                Administrative Notes & Context
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record compliance details, customer success notes, VIP contracts, escalation contacts..."
                className="w-full flex-1 min-h-[300px] p-3 text-xs font-mono rounded-xl bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald resize-y"
              />
              <span className="text-[10px] text-text-muted">
                These notes are visible strictly to SuperAdmin team members.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 flex items-center justify-end gap-2 bg-surface-card">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            leftIcon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          >
            Save Notes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TenantNotesDrawer;
