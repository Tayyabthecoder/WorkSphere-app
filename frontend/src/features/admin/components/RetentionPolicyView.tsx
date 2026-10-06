import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Save,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { IRetentionPolicy } from '../../../types';
import apiClient from '../../../api/client';

const DEFAULT_RETENTION_POLICY: IRetentionPolicy = {
  activityLogRetentionDays: 90,
  completedTasksRetentionDays: 180,
  inactiveProjectArchiveDays: 365,
  purgedRecordsWindowDays: 30,
  autoArchiveEnabled: false,
  autoPurgeEnabled: false,
};

export const RetentionPolicyView: React.FC = () => {
  const [policy, setPolicy] = useState<IRetentionPolicy>(DEFAULT_RETENTION_POLICY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual execution state
  const [opType, setOpType] = useState<'purge_logs' | 'archive_inactive_projects' | 'purge_completed_tasks'>('purge_logs');
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const fetchPolicy = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get('/v1/admin/retention');
      if (res.data?.success && res.data?.data) {
        setPolicy(res.data.data);
      }
    } catch {
      setError('Failed to load retention policies');
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

      const res = await apiClient.patch('/v1/admin/retention', policy);
      if (res.data?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to update retention policy');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async (dryRun: boolean) => {
    if (!dryRun) {
      if (!confirm(`CAUTION: You are about to permanently execute "${opType}". This action cannot be undone. Proceed?`)) {
        return;
      }
    }

    try {
      setIsRunning(true);
      setSimulationResult(null);

      const res = await apiClient.post('/v1/admin/retention/run', { opType, dryRun });
      if (res.data?.success) {
        setSimulationResult(res.data.data.message);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Retention operation failed');
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-brand-emerald" />
        <span>Loading retention settings...</span>
      </div>
    );
  }

  return (
    <Card className="p-6 border-border/80 bg-surface-card rounded-2xl shadow-card flex flex-col gap-6">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border/80">
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Trash2 className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary tracking-tight">
            Data Retention & Lifecycle Housekeeping
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure automated archival windows and purge stale records across workspaces.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Retention rules saved successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Retention Thresholds Inputs */}
      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-text-secondary block mb-1">
            Activity Log Purge Window (Days)
          </label>
          <Input
            type="number"
            min={7}
            max={3650}
            value={policy.activityLogRetentionDays}
            onChange={(e) =>
              setPolicy((prev) => ({
                ...prev,
                activityLogRetentionDays: Number(e.target.value),
              }))
            }
            className="text-xs"
          />
          <p className="text-[10px] text-text-muted mt-1">Logs older than this will be purged.</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-secondary block mb-1">
            Inactive Project Archival (Days)
          </label>
          <Input
            type="number"
            min={14}
            max={3650}
            value={policy.inactiveProjectArchiveDays}
            onChange={(e) =>
              setPolicy((prev) => ({
                ...prev,
                inactiveProjectArchiveDays: Number(e.target.value),
              }))
            }
            className="text-xs"
          />
          <p className="text-[10px] text-text-muted mt-1">Auto-archives unupdated projects.</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-secondary block mb-1">
            Completed Task Purge (Days)
          </label>
          <Input
            type="number"
            min={1}
            max={365}
            value={policy.completedTasksRetentionDays}
            onChange={(e) =>
              setPolicy((prev) => ({
                ...prev,
                completedTasksRetentionDays: Number(e.target.value),
              }))
            }
            className="text-xs"
          />
          <p className="text-[10px] text-text-muted mt-1">Cleans completed task bloat.</p>
        </div>

        <div className="sm:col-span-3 flex justify-end">
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {isSaving ? 'Updating...' : 'Update Retention Thresholds'}
          </Button>
        </div>
      </form>

      {/* Manual Execution Tool (Dry Run & Execute) */}
      <div className="p-4 rounded-xl border border-border/80 bg-surface-low/50 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Manual Retention Execution & Dry-Run Simulator
          </h4>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={opType}
            onChange={(e) =>
              setOpType(
                e.target.value as
                  | 'purge_logs'
                  | 'archive_inactive_projects'
                  | 'purge_completed_tasks'
              )
            }
            className="bg-surface-card border border-border/80 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-emerald flex-1"
          >
            <option value="purge_logs">Purge Expired Activity Logs</option>
            <option value="archive_inactive_projects">Archive Inactive Projects</option>
            <option value="purge_completed_tasks">Purge Completed Tasks Beyond Window</option>
          </select>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRunning}
              onClick={() => handleRun(true)}
              leftIcon={<Play className="w-3.5 h-3.5 text-blue-600" />}
              className="text-xs"
            >
              Simulate (Dry Run)
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isRunning}
              onClick={() => handleRun(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white border-rose-700 text-xs shadow-2xs"
            >
              {isRunning ? 'Processing...' : 'Execute Purge'}
            </Button>
          </div>
        </div>

        {simulationResult && (
          <div className="p-3 rounded-lg bg-blue-50 text-blue-800 text-xs border border-blue-200 font-mono">
            {simulationResult}
          </div>
        )}
      </div>
    </Card>
  );
};

export default RetentionPolicyView;
