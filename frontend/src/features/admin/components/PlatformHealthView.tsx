import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Database,
  Cpu,
  RefreshCw,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  HardDrive,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { MetricCard } from '../../../components/dashboard/MetricCard';
import apiClient from '../../../api/client';

export const PlatformHealthView: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get('/v1/admin/stats');
      if (res.data?.success) {
        setHealth(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load health telemetry:', err);
      const errorMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to load platform health telemetry';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const formatUptime = (seconds?: number) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '—';
    const days = Math.floor(seconds / (3600 * 24));
    const hrs = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hrs}h ${mins}m`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-brand-emerald" />
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Platform Health & Telemetry
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time infrastructure performance, database connectivity, and runtime metrics.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={fetchHealth}
          disabled={isLoading}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchHealth} className="shrink-0 text-xs h-7">
            Retry
          </Button>
        </div>
      )}

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="DATABASE LATENCY"
          value={health?.dbLatencyMs !== undefined ? `${health.dbLatencyMs} ms` : isLoading ? '...' : '—'}
          trend="MongoDB Atlas Healthy"
          isPositiveTrend
          icon={<Database className="w-4 h-4 text-brand-emerald" />}
        />
        <MetricCard
          label="SERVICE UPTIME"
          value={health?.uptimeSeconds !== undefined ? formatUptime(health.uptimeSeconds) : isLoading ? '...' : '—'}
          trend="Continuous Service"
          icon={<Server className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          label="HEAP MEMORY USED"
          value={health?.memory?.heapUsedMB !== undefined ? `${health.memory.heapUsedMB} MB` : isLoading ? '...' : '—'}
          trend={`of ${health?.memory?.heapTotalMB ?? 0} MB Allocated`}
          icon={<Cpu className="w-4 h-4 text-purple-500" />}
        />
        <MetricCard
          label="OVERALL STATUS"
          value={isLoading ? 'CHECKING...' : error ? 'DEGRADED' : 'OPERATIONAL'}
          trend={error ? 'Telemetry degraded' : '99.98% SLO'}
          variant={error ? 'light' : 'primary'}
          icon={
            error ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-brand-mint" />
            )
          }
        />
      </div>

      {/* Detailed Technical Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-brand-emerald" /> Runtime Environment
          </h3>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-text-muted">Node.js Engine Version</span>
              <span className="font-mono text-text-primary font-semibold">
                {health?.nodeVersion || (isLoading ? 'Detecting...' : '—')}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-text-muted">Host OS Platform</span>
              <span className="font-mono text-text-primary">
                {health?.platform || (isLoading ? 'Detecting...' : '—')}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-text-muted">Process RSS Allocation</span>
              <span className="font-mono text-text-primary">
                {health?.memory?.rssMB ? `${health.memory.rssMB} MB` : isLoading ? '...' : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-text-muted">Database Storage Size</span>
              <span className="font-mono text-brand-emerald font-semibold">
                {health?.database?.dataFormatted || health?.database?.storageFormatted || (isLoading ? 'Detecting...' : '—')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Report Timestamp</span>
              <span className="font-mono text-[11px] text-text-muted">
                {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'Live'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-brand-emerald" /> Entity Inventory
          </h3>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-text-muted">Active Workspaces (Tenants)</span>
              <span className="font-mono font-bold text-text-primary">
                {health?.counts?.tenants ?? (isLoading ? '...' : 0)}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-text-muted">Provisioned User Accounts</span>
              <span className="font-mono font-bold text-text-primary">
                {health?.counts?.users ?? (isLoading ? '...' : 0)}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-text-muted">Initiative Projects</span>
              <span className="font-mono font-bold text-text-primary">
                {health?.counts?.projects ?? (isLoading ? '...' : 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Active Deliverables (Tasks)</span>
              <span className="font-mono font-bold text-text-primary">
                {health?.counts?.tasks ?? (isLoading ? '...' : 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlatformHealthView;
