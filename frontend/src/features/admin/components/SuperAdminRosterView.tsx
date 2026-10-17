import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  Activity,
  Users,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Lock,
  Building2,
  FileCode,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import apiClient from '../../../api/client';

export const SuperAdminRosterView: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [adminsRes, feedRes] = await Promise.all([
        apiClient.get('/v1/admin/super-admins'),
        apiClient.get('/v1/admin/platform-feed'),
      ]);

      if (adminsRes.data?.success) setAdmins(adminsRes.data.data || []);
      if (feedRes.data?.success) setFeed(feedRes.data.data || []);
    } catch (err) {
      console.error('Failed to load governance telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('impersonation')) return 'bg-amber-500/10 text-amber-700 border-amber-300';
    if (action.includes('purged') || action.includes('deactivated')) return 'bg-rose-500/10 text-rose-700 border-rose-300';
    if (action.includes('provisioned') || action.includes('activated')) return 'bg-emerald-500/10 text-emerald-800 border-emerald-300';
    return 'bg-blue-500/10 text-blue-700 border-blue-300';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-emerald" />
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Platform Governance &amp; Super Admin Roster
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Elevated credential operators, platform security compliance, and live operational activity feed.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={fetchData}
        >
          Refresh Feed
        </Button>
      </div>

      {/* Operator Accounts Pod */}
      <Card className="p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-emerald" /> Platform Operator Accounts (Super Admins)
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Identities authorized to manage all workspaces, enforce retention policies, and impersonate sessions.
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-brand-emerald">
            {admins.length} elevated accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-[10px] font-mono text-text-muted uppercase bg-surface-low/40">
                <th className="py-2.5 px-4">Operator Name</th>
                <th className="py-2.5 px-3">Primary Email</th>
                <th className="py-2.5 px-3">Role Status</th>
                <th className="py-2.5 px-3">MFA Compliance</th>
                <th className="py-2.5 px-4 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-text-muted">
                    No operator accounts found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.userId} className="hover:bg-surface-low/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-emerald text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                          {admin.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <span className="font-bold text-text-primary block">{admin.name}</span>
                          <span className="font-mono text-[10px] text-text-muted">{admin.userId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-text-primary">
                      {admin.email}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={admin.isActive ? 'completed' : 'pending'} size="sm" dot>
                        {admin.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Lock className="w-3 h-3" /> Enforced
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-text-muted">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Live Platform Event Stream */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-emerald" /> Platform Governance Activity Stream
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Live audit trail of platform administrative actions across all fleets.
            </p>
          </div>
          <span className="text-[10px] font-mono text-text-muted">Last 35 events</span>
        </div>

        <div className="flex flex-col divide-y divide-border/60">
          {feed.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-xs">
              No platform governance events recorded yet.
            </div>
          ) : (
            feed.map((event) => (
              <div key={event.logId} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-1.5 rounded-lg bg-surface-low border border-border/80 text-text-muted mt-0.5 shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadgeColor(
                          event.action
                        )}`}
                      >
                        {event.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-text-primary font-medium">
                        Target: <span className="font-mono text-text-secondary">{event.entityId}</span>
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">
                        (Fleet: {event.tenantId})
                      </span>
                    </div>

                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <p className="text-[11px] text-text-secondary mt-1 font-mono truncate max-w-xl">
                        {JSON.stringify(event.metadata)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="font-mono text-[10px] text-text-muted block">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminRosterView;
