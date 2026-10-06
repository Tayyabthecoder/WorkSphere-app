import React, { useState, useEffect } from 'react';
import {
  X,
  SlidersHorizontal,
  Layers,
  Zap,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import apiClient from '../../../api/client';

interface TenantFeatureFlagsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  onFlagsUpdated?: () => void;
}

interface FlagDefinition {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  badge: string;
}

const AVAILABLE_FLAGS: FlagDefinition[] = [
  {
    key: 'clientPortal',
    label: 'Client Portal & External Access',
    description: 'Permits dedicated external client account views and secure unauthenticated token URLs.',
    icon: Users,
    badge: 'Enterprise',
  },
  {
    key: 'capacityPlanning',
    label: 'Resource & Capacity Planning',
    description: 'Activates team workload swimlane limits and sprint commitment calculators.',
    icon: Layers,
    badge: 'Pro',
  },
  {
    key: 'documentEditor',
    label: 'Documents & Knowledge Base',
    description: 'Enables TipTap rich block document editor, version history snapshots, and nested folder trees.',
    icon: FileText,
    badge: 'Core',
  },
];

export const TenantFeatureFlagsDrawer: React.FC<TenantFeatureFlagsDrawerProps> = ({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  tenantSlug,
  onFlagsUpdated,
}) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({
    clientPortal: true,
    workflowAutomation: true,
    capacityPlanning: true,
    documentEditor: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !tenantId) return;

    const fetchTenantFlags = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSaveSuccess(false);

        const res = await apiClient.get('/v1/admin/tenants');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const tenant = res.data.data.find((t: any) => t.tenantId === tenantId);
          if (tenant?.settings?.featureFlags) {
            setFlags((prev) => ({
              ...prev,
              ...tenant.settings.featureFlags,
            }));
          }
        }
      } catch (err: any) {
        setError('Failed to fetch existing feature flags for tenant.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantFlags();
  }, [isOpen, tenantId]);

  const handleToggle = (key: string) => {
    setFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await apiClient.patch(`/v1/admin/tenants/${tenantId}/settings`, {
        settings: {
          featureFlags: flags,
        },
      });

      setSaveSuccess(true);
      onFlagsUpdated?.();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError('Failed to persist feature flag overrides.');
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
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-tight">Feature Flags</h3>
              <p className="text-[11px] text-text-secondary truncate max-w-[240px]">
                {tenantName} ({tenantSlug})
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
              <span>Flags successfully updated and applied!</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-brand-emerald animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {AVAILABLE_FLAGS.map((flag) => {
                const isEnabled = !!flags[flag.key];
                const Icon = flag.icon;

                return (
                  <div
                    key={flag.key}
                    onClick={() => handleToggle(flag.key)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isEnabled
                        ? 'border-brand-emerald/40 bg-brand-emerald/5'
                        : 'border-border/80 bg-surface-card hover:bg-surface-low/50'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isEnabled
                            ? 'bg-brand-emerald text-white'
                            : 'bg-surface-low text-text-muted border border-border/80'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-primary">{flag.label}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-low border border-border/80 text-text-muted">
                            {flag.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                          {flag.description}
                        </p>
                      </div>
                    </div>

                    {/* Toggle pill */}
                    <div
                      className={`w-8 h-4 rounded-full transition-colors relative shrink-0 mt-1 ${
                        isEnabled ? 'bg-brand-emerald' : 'bg-surface-dim'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                          isEnabled ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
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
            leftIcon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TenantFeatureFlagsDrawer;
