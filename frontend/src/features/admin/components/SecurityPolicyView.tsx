import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Clock,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ISecurityPolicy } from '../../../types';
import { RetentionPolicyView } from './RetentionPolicyView';
import apiClient from '../../../api/client';

const DEFAULT_SECURITY_POLICY: ISecurityPolicy = {
  mfaRequired: false,
  sessionTimeoutMinutes: 480,
  passwordMinLength: 8,
  requireSpecialChar: true,
  requireNumber: true,
  ipAllowlist: [],
  ipBlocklist: [],
  ssoEnabled: false,
};

export const SecurityPolicyView: React.FC = () => {
  const [policy, setPolicy] = useState<ISecurityPolicy>(DEFAULT_SECURITY_POLICY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Raw text area states for IP lists
  const [allowlistText, setAllowlistText] = useState('');
  const [blocklistText, setBlocklistText] = useState('');

  const fetchPolicy = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get('/v1/admin/security-policy');
      if (res.data?.success && res.data?.data) {
        setPolicy(res.data.data);
        setAllowlistText((res.data.data.ipAllowlist || []).join('\n'));
        setBlocklistText((res.data.data.ipBlocklist || []).join('\n'));
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load global security policy');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);

      const parsedAllowlist = allowlistText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const parsedBlocklist = blocklistText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        passwordMinLength: Number(policy.passwordMinLength),
        requireSpecialChar: policy.requireSpecialChar,
        requireNumber: policy.requireNumber,
        mfaRequired: policy.mfaRequired,
        ssoEnabled: policy.ssoEnabled,
        sessionTimeoutMinutes: Number(policy.sessionTimeoutMinutes),
        ipAllowlist: parsedAllowlist,
        ipBlocklist: parsedBlocklist,
      };

      const res = await apiClient.patch('/v1/admin/security-policy', payload);
      if (res.data?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
        fetchPolicy();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to save security policy');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-xs text-text-muted gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
        <span>Loading platform security policies...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      {/* Header Messages */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Global platform security policy saved and active across all workspaces!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Password Strength Standards */}
        <Card className="p-6 border-border/80 bg-surface-card rounded-2xl shadow-card flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/80">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-tight">
                Password Security Standards
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Minimum complexity rules enforced during account creation and password resets.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">
              Minimum Password Length (6–32 chars)
            </label>
            <Input
              type="number"
              min={6}
              max={32}
              value={policy.passwordMinLength}
              onChange={(e) =>
                setPolicy((prev) => ({ ...prev, passwordMinLength: Number(e.target.value) }))
              }
              className="max-w-xs text-xs"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={policy.requireNumber}
                onChange={(e) =>
                  setPolicy((prev) => ({ ...prev, requireNumber: e.target.checked }))
                }
                className="w-4 h-4 accent-brand-emerald rounded cursor-pointer"
              />
              <span className="font-medium text-text-primary">Require at least one numeric character (0-9)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={policy.requireSpecialChar}
                onChange={(e) =>
                  setPolicy((prev) => ({ ...prev, requireSpecialChar: e.target.checked }))
                }
                className="w-4 h-4 accent-brand-emerald rounded cursor-pointer"
              />
              <span className="font-medium text-text-primary">Require at least one special symbol (!@#$%^&*)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={policy.mfaRequired}
                onChange={(e) =>
                  setPolicy((prev) => ({ ...prev, mfaRequired: e.target.checked }))
                }
                className="w-4 h-4 accent-brand-emerald rounded cursor-pointer"
              />
              <span className="font-medium text-text-primary">Enforce Multi-Factor Authentication (MFA)</span>
            </label>
          </div>
        </Card>

        {/* Card 2: Session & Access Lifecycle */}
        <Card className="p-6 border-border/80 bg-surface-card rounded-2xl shadow-card flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/80">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-tight">
                Global Session Lifecycle
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Maximum token lifetime before requiring member re-authentication.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">
              Global Inactive Session Timeout
            </label>
            <select
              value={policy.sessionTimeoutMinutes}
              onChange={(e) =>
                setPolicy((prev) => ({
                  ...prev,
                  sessionTimeoutMinutes: Number(e.target.value),
                }))
              }
              className="w-full max-w-xs bg-surface-low border border-border/80 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-emerald"
            >
              <option value={30}>30 Minutes</option>
              <option value={60}>1 Hour</option>
              <option value={240}>4 Hours</option>
              <option value={480}>8 Hours (Standard Workday)</option>
              <option value={1440}>24 Hours</option>
              <option value={10080}>7 Days</option>
            </select>
            <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed">
              Sessions that remain idle past this threshold will be terminated immediately.
            </p>
          </div>
        </Card>
      </div>

      {/* Card 3: Network & IP Access Control */}
      <Card className="p-6 border-border/80 bg-surface-card rounded-2xl shadow-card flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/80">
          <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0 shadow-2xs">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary tracking-tight">
              Network IP Access Governance
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Control which IP addresses can reach the platform cluster.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* IP Allowlist */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">
              IP Allowlist (One per line)
            </label>
            <textarea
              rows={4}
              placeholder="e.g. 192.168.1.1&#10;10.0.0.0/24"
              value={allowlistText}
              onChange={(e) => setAllowlistText(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border/80 text-xs font-mono bg-surface-low text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-emerald"
            />
            <p className="text-[10px] text-text-muted mt-1">
              Leave blank to permit requests from any IP address.
            </p>
          </div>

          {/* IP Blocklist */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">
              IP Blocklist (One per line)
            </label>
            <textarea
              rows={4}
              placeholder="e.g. 203.0.113.195&#10;198.51.100.0/24"
              value={blocklistText}
              onChange={(e) => setBlocklistText(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border/80 text-xs font-mono bg-surface-low text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-emerald"
            />
            <p className="text-[10px] text-text-muted mt-1">
              Connections from these IPs will be rejected with HTTP 403 Forbidden.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Lock className="w-3.5 h-3.5 text-brand-emerald" />
            <span>Applies platform-wide across all tenant workspaces</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            className="rounded-lg text-xs shadow-2xs"
          >
            {isSaving ? 'Enforcing...' : 'Save Global Security Policy'}
          </Button>
        </div>
      </Card>

      {/* Data Retention & Housekeeping Module */}
      <RetentionPolicyView />
    </form>
  );
};

export default SecurityPolicyView;
