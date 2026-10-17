import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  Users,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import apiClient from '../../../api/client';

interface TenantPlanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: {
    tenantId: string;
    name: string;
    plan?: string;
    limits?: {
      maxUsers?: number;
      maxProjects?: number;
      maxStorageMB?: number;
    };
    billingNotes?: string;
  } | null;
  onPlanUpdated?: () => void;
}

export const TenantPlanDrawer: React.FC<TenantPlanDrawerProps> = ({
  isOpen,
  onClose,
  tenant,
  onPlanUpdated,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'Free' | 'Pro' | 'Enterprise'>('Free');
  const [maxUsers, setMaxUsers] = useState<number>(50);
  const [maxProjects, setMaxProjects] = useState<number>(20);
  const [maxStorageMB, setMaxStorageMB] = useState<number>(500);
  const [billingNotes, setBillingNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tenant) {
      setSelectedPlan((tenant.plan as any) || 'Free');
      setMaxUsers(tenant.limits?.maxUsers ?? (tenant.plan === 'Enterprise' ? 500 : tenant.plan === 'Pro' ? 150 : 50));
      setMaxProjects(tenant.limits?.maxProjects ?? (tenant.plan === 'Enterprise' ? 200 : tenant.plan === 'Pro' ? 50 : 20));
      setMaxStorageMB(tenant.limits?.maxStorageMB ?? (tenant.plan === 'Enterprise' ? 10000 : tenant.plan === 'Pro' ? 2500 : 500));
      setBillingNotes(tenant.billingNotes || '');
      setError(null);
      setSuccess(false);
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const handlePlanPreset = (plan: 'Free' | 'Pro' | 'Enterprise') => {
    setSelectedPlan(plan);
    if (plan === 'Free') {
      setMaxUsers(50);
      setMaxProjects(20);
      setMaxStorageMB(500);
    } else if (plan === 'Pro') {
      setMaxUsers(150);
      setMaxProjects(50);
      setMaxStorageMB(2500);
    } else if (plan === 'Enterprise') {
      setMaxUsers(1000);
      setMaxProjects(500);
      setMaxStorageMB(25000);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      const res = await apiClient.patch(`/v1/admin/tenants/${tenant.tenantId}/plan`, {
        plan: selectedPlan,
        limits: {
          maxUsers: Number(maxUsers) || 50,
          maxProjects: Number(maxProjects) || 20,
          maxStorageMB: Number(maxStorageMB) || 500,
        },
        billingNotes: billingNotes.trim(),
      });

      if (res.data?.success) {
        setSuccess(true);
        if (onPlanUpdated) onPlanUpdated();
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error('Failed to update tenant plan:', err);
      setError(err?.response?.data?.error?.message || 'Failed to update workspace plan allocation');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-brand-evergreen/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md bg-surface-card border-l border-border/80 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-border/80 flex items-center justify-between bg-surface-low/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-emerald/10 text-brand-emerald">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-tight">
                  Plan & Quota Allocation
                </h3>
                <p className="text-xs text-text-secondary">
                  {tenant.name} &bull; <span className="font-mono text-[10px]">{tenant.tenantId}</span>
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

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-emerald" />
                <span>Plan parameters updated successfully!</span>
              </div>
            )}

            {/* Plan Tier Selection */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-2">
                Select Platform Plan Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Free', 'Pro', 'Enterprise'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => handlePlanPreset(tier)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      selectedPlan === tier
                        ? 'border-brand-emerald bg-brand-emerald/10 shadow-xs'
                        : 'border-border/80 bg-surface-low hover:border-brand-emerald/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-text-primary">{tier}</span>
                      {tier === 'Enterprise' && <Sparkles className="w-3 h-3 text-amber-500" />}
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {tier === 'Free' ? 'Community' : tier === 'Pro' ? 'Growth' : 'Unlimited'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quotas & Capacity Limits */}
            <div className="p-4 rounded-xl border border-border/80 bg-surface-low/40 flex flex-col gap-3.5">
              <span className="font-bold text-text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-emerald" /> Workspace Resource Limits
              </span>

              {/* Max Users */}
              <div>
                <label className="text-[11px] font-medium text-text-secondary flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-text-muted" /> Max Seat Accounts
                  </span>
                  <span className="font-mono font-bold text-text-primary">{maxUsers} seats</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-card border border-border/80 text-xs font-mono text-text-primary focus:outline-none focus:border-brand-emerald"
                />
              </div>

              {/* Max Projects */}
              <div>
                <label className="text-[11px] font-medium text-text-secondary flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-text-muted" /> Max Active Initiatives
                  </span>
                  <span className="font-mono font-bold text-text-primary">{maxProjects} projects</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={maxProjects}
                  onChange={(e) => setMaxProjects(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-card border border-border/80 text-xs font-mono text-text-primary focus:outline-none focus:border-brand-emerald"
                />
              </div>

              {/* Max Storage */}
              <div>
                <label className="text-[11px] font-medium text-text-secondary flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-text-muted" /> File Storage Quota (MB)
                  </span>
                  <span className="font-mono font-bold text-text-primary">{maxStorageMB} MB</span>
                </label>
                <input
                  type="number"
                  min="100"
                  max="500000"
                  value={maxStorageMB}
                  onChange={(e) => setMaxStorageMB(parseInt(e.target.value, 10) || 100)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-card border border-border/80 text-xs font-mono text-text-primary focus:outline-none focus:border-brand-emerald"
                />
              </div>
            </div>

            {/* Internal Billing / Operator Notes */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Internal Account Notes & Contract Reference
              </label>
              <textarea
                rows={3}
                value={billingNotes}
                onChange={(e) => setBillingNotes(e.target.value)}
                placeholder="e.g., Special enterprise pilot contract through Q4, point of contact: billing@acme.com"
                className="w-full p-2.5 rounded-lg bg-surface-low border border-border/80 text-xs text-text-primary focus:outline-none focus:border-brand-emerald resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border/80 flex items-center justify-end gap-2 bg-surface-low/30">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              leftIcon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
            >
              Apply Allocation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantPlanDrawer;
