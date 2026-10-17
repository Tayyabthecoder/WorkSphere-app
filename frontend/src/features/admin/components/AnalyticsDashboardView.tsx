import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { MetricCard } from '../../../components/dashboard/MetricCard';
import apiClient from '../../../api/client';

export const AnalyticsDashboardView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/v1/admin/analytics');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load platform analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const tenantRegistrations: Array<{ date: string; count: number }> = data?.tenantRegistrations || [];
  const topTenants: Array<{ tenantId: string; name: string; slug: string; taskCount: number }> =
    data?.topTenants || [];
  const inactiveTenants: Array<{ tenantId: string; name: string; slug: string; status: string; createdAt: string }> =
    data?.inactiveTenants || [];
  const taskStatusDistribution: Array<{ status: string; count: number }> =
    data?.taskStatusDistribution || [];
  const projectMethodologyDistribution: Array<{ methodology: string; count: number }> =
    data?.projectMethodologyDistribution || [];

  const totalTasks = taskStatusDistribution.reduce((a, b) => a + b.count, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-emerald" />
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Platform Analytics &amp; Adoption
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Cross-tenant utilization trends, active engagement metrics, and capacity distribution.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={fetchAnalytics}
        >
          Refresh Data
        </Button>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="30-DAY ACTIVE USERS (MAU)"
          value={data?.thirtyDayMAU ?? 0}
          trend="Unique active contributors"
          isPositiveTrend
          icon={<Users className="w-4 h-4 text-brand-emerald" />}
        />
        <MetricCard
          label="TOTAL DELIVERABLES"
          value={totalTasks}
          trend="Across all fleets"
          icon={<Briefcase className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          label="NEW FLEET REGISTRATIONS"
          value={tenantRegistrations.reduce((a, b) => a + b.count, 0)}
          trend="In last 30 days"
          icon={<Building2 className="w-4 h-4 text-purple-500" />}
        />
        <MetricCard
          label="CHURN WARNINGS"
          value={inactiveTenants.length}
          trend="Inactive in 30 days"
          variant={inactiveTenants.length > 0 ? 'light' : 'primary'}
          icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* 30-Day Registration Velocity Chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-emerald" /> Workspace Onboarding Trajectory (Last 30 Days)
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Net new organization workspaces provisioned across the platform.
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-brand-emerald">
            {tenantRegistrations.reduce((a, b) => a + b.count, 0)} new orgs
          </span>
        </div>

        {tenantRegistrations.length === 0 ? (
          <div className="py-10 text-center text-text-muted text-xs">
            No new organization registrations in the past 30 days.
          </div>
        ) : (
          <div className="flex items-end gap-1.5 h-36 pt-4 px-2 border-b border-border/80">
            {tenantRegistrations.map((point) => {
              const maxVal = Math.max(...tenantRegistrations.map((p) => p.count), 1);
              const heightPct = Math.max(12, Math.round((point.count / maxVal) * 100));
              return (
                <div
                  key={point.date}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div className="absolute -top-7 px-1.5 py-0.5 rounded bg-brand-evergreen text-white text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {point.date}: {point.count} new
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-brand-emerald hover:bg-brand-mint rounded-t-xs transition-all"
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Two Column Section: Deliverables Breakdown & Methodology Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Deliverables Breakdown */}
        <Card className="p-5">
          <h3 className="text-xs font-bold text-text-primary mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Platform Deliverable Execution Status
          </h3>
          <div className="flex flex-col gap-3 text-xs">
            {taskStatusDistribution.map((item) => {
              const pct = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;
              return (
                <div key={item.status} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-medium text-text-primary">{item.status}</span>
                    <span className="font-mono text-text-muted">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-low overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${
                        item.status === 'Done'
                          ? 'bg-emerald-500'
                          : item.status === 'In Progress'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Methodology Distribution */}
        <Card className="p-5">
          <h3 className="text-xs font-bold text-text-primary mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" /> Initiative Framework Adoption
          </h3>
          <div className="flex flex-col gap-3 text-xs">
            {projectMethodologyDistribution.map((item) => (
              <div
                key={item.methodology}
                className="p-3 rounded-xl bg-surface-low border border-border/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-emerald" />
                  <span className="font-semibold text-text-primary">{item.methodology}</span>
                </div>
                <span className="font-mono font-bold text-text-primary">{item.count} initiatives</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Two Column Section: Top Fleets Leaderboard & Inactive Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 10 Fleets Leaderboard */}
        <Card className="p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-emerald" /> Top Fleets by Deliverable Volume
            </h3>
            <span className="text-[11px] text-text-muted font-mono">Ranked by Tasks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-[10px] font-mono text-text-muted uppercase">
                  <th className="py-2">Fleet Organization</th>
                  <th className="py-2 text-right">Tasks Logged</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {topTenants.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-text-muted">
                      No data available
                    </td>
                  </tr>
                ) : (
                  topTenants.map((t, idx) => (
                    <tr key={t.tenantId} className="hover:bg-surface-low/30">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-text-muted w-4">{idx + 1}.</span>
                          <div>
                            <span className="font-semibold text-text-primary block">{t.name}</span>
                            <span className="font-mono text-[10px] text-text-muted">{t.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-text-primary">
                        {t.taskCount}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          to={`/admin/tenants/${t.tenantId}`}
                          className="inline-flex items-center gap-1 text-[11px] text-brand-emerald hover:underline font-semibold"
                        >
                          Deep-Dive <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Churn Warning List */}
        <Card className="p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Inactivity &amp; Churn Signals
            </h3>
            <span className="text-[11px] text-text-muted font-mono">Zero events in 30d</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-[10px] font-mono text-text-muted uppercase">
                  <th className="py-2">Inactive Fleet</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {inactiveTenants.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-text-muted text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                      All managed workspaces have recorded activity in the past 30 days!
                    </td>
                  </tr>
                ) : (
                  inactiveTenants.map((t) => (
                    <tr key={t.tenantId} className="hover:bg-surface-low/30">
                      <td className="py-2.5">
                        <span className="font-semibold text-text-primary block">{t.name}</span>
                        <span className="font-mono text-[10px] text-text-muted">{t.slug}.worksphere.app</span>
                      </td>
                      <td className="py-2.5">
                        <Badge variant="neutral" size="sm">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          to={`/admin/tenants/${t.tenantId}`}
                          className="inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-brand-emerald font-semibold"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboardView;
