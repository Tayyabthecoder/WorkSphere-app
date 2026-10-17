import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  HardDrive,
  Users,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  SlidersHorizontal,
  Lock,
  Zap,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import apiClient from '../../../api/client';

export const SystemConfigView: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form states
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [selfRegistrationEnabled, setSelfRegistrationEnabled] = useState(true);
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(50);
  const [defaultFlags, setDefaultFlags] = useState<{ [key: string]: boolean }>({
    clientPortal: true,
    capacityPlanning: true,
    documentEditor: true,
    workflowAutomation: false,
  });

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/v1/admin/platform-config');
      if (res.data?.success && res.data.data) {
        const c = res.data.data;
        setConfig(c);
        setMaintenanceMode(Boolean(c.maintenanceMode));
        setMaintenanceMessage(c.maintenanceMessage || 'WorkSphere is undergoing scheduled system maintenance.');
        setSelfRegistrationEnabled(c.selfRegistrationEnabled !== false);
        setMaxFileSizeMB(c.maxFileSizeMB || 50);
        setDefaultFlags(c.defaultFeatureFlags || {});
      }
    } catch (err) {
      console.error('Failed to load system config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const res = await apiClient.patch('/v1/admin/platform-config', {
        maintenanceMode,
        maintenanceMessage: maintenanceMessage.trim(),
        selfRegistrationEnabled,
        maxFileSizeMB: Number(maxFileSizeMB) || 50,
        defaultFeatureFlags: defaultFlags,
      });

      if (res.data?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Failed to save platform config:', err);
      setSaveError(err?.response?.data?.error?.message || 'Failed to update system configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDefaultFlag = (flagKey: string) => {
    setDefaultFlags((prev) => ({
      ...prev,
      [flagKey]: !prev[flagKey],
    }));
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-emerald" />
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Platform System Configuration
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Operational governance, global maintenance windows, upload quotas, and tenant defaults.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={fetchConfig}
        >
          Refresh
        </Button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
          <span>System configuration parameters saved and active across API gateways.</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Maintenance Mode Pod */}
        <Card className={`p-5 transition-all ${maintenanceMode ? 'border-amber-400 bg-amber-500/5' : ''}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`w-4 h-4 ${maintenanceMode ? 'text-amber-600' : 'text-text-muted'}`} />
                <h3 className="text-xs font-bold text-text-primary">Global Maintenance Mode</h3>
                {maintenanceMode && (
                  <Badge variant="pending" size="sm">
                    ACTIVE OUTAGE
                  </Badge>
                )}
              </div>
              <p className="text-xs text-text-secondary max-w-xl">
                When active, all non-Super Admin API requests receive a 503 Service Unavailable status,
                and user dashboards display the maintenance banner. Super Admins retain full access.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                maintenanceMode ? 'bg-amber-500' : 'bg-surface-low'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {maintenanceMode && (
            <div className="mt-4 pt-3 border-t border-border/80">
              <label className="text-xs font-bold text-text-primary block mb-1">
                Public Maintenance Message Broadcasted to Users
              </label>
              <textarea
                rows={2}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-surface-low border border-border/80 text-xs text-text-primary focus:outline-none focus:border-brand-emerald"
              />
            </div>
          )}
        </Card>

        {/* Workspace Self-Registration & Security */}
        <Card className="p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" /> Organization Onboarding Gateways
          </h3>

          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <span className="text-xs font-semibold text-text-primary block">
                Public Self-Service Workspace Registration
              </span>
              <p className="text-[11px] text-text-muted">
                Allow new visitors on the marketing homepage to register an organization workspace directly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelfRegistrationEnabled(!selfRegistrationEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                selfRegistrationEnabled ? 'bg-brand-emerald' : 'bg-surface-low'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  selfRegistrationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-primary flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-purple-500" /> Max Individual File Attachment Size
              </span>
              <span className="font-mono font-bold text-text-primary">{maxFileSizeMB} MB</span>
            </label>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={maxFileSizeMB}
              onChange={(e) => setMaxFileSizeMB(Number(e.target.value))}
              className="w-full accent-brand-emerald cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-muted font-mono mt-1">
              <span>5 MB (Strict)</span>
              <span>50 MB (Recommended)</span>
              <span>200 MB (Enterprise)</span>
            </div>
          </div>
        </Card>

        {/* Default Tenant Feature Flags */}
        <Card className="p-5 flex flex-col gap-3">
          <div>
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-emerald" /> New Workspace Default Feature Flags
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              These capability flags will be assigned automatically whenever an organization is provisioned.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {[
              { key: 'clientPortal', label: 'Client Portal & External CRM', desc: 'Secure stakeholder guest views' },
              { key: 'capacityPlanning', label: 'Resource & Capacity Planning', desc: 'Workload limits and velocity' },
              { key: 'documentEditor', label: 'Documents & Knowledge Base', desc: 'Rich TipTap block editor' },
              { key: 'workflowAutomation', label: 'Workflow Automation Engine', desc: 'Trigger-condition-action rules' },
            ].map((flag) => {
              const isEnabled = !!defaultFlags[flag.key];
              return (
                <div
                  key={flag.key}
                  onClick={() => toggleDefaultFlag(flag.key)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isEnabled
                      ? 'border-brand-emerald/60 bg-brand-emerald/5'
                      : 'border-border/80 bg-surface-low hover:border-border'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-text-primary block">{flag.label}</span>
                    <span className="text-[10px] text-text-muted">{flag.desc}</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-white ${
                      isEnabled ? 'bg-brand-emerald' : 'bg-surface-card border border-border'
                    }`}
                  >
                    {isEnabled && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={isSaving}
            leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            Save Configuration Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SystemConfigView;
