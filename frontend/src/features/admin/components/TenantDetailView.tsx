import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Briefcase,
  Layers,
  HardDrive,
  Clock,
  ArrowLeft,
  ShieldAlert,
  SlidersHorizontal,
  FileText,
  CreditCard,
  RefreshCw,
  Power,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  Check,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { MetricCard } from '../../../components/dashboard/MetricCard';
import { TenantFeatureFlagsDrawer } from './TenantFeatureFlagsDrawer';
import { TenantNotesDrawer } from './TenantNotesDrawer';
import { TenantPlanDrawer } from './TenantPlanDrawer';
import apiClient from '../../../api/client';
import { useAuthStore } from '../../../store/auth';

export const TenantDetailView: React.FC = () => {
  const { tenantId: routeTenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  // Extract from path if not directly in params
  const path = window.location.pathname;
  const match = path.match(/\/admin\/tenants\/([a-zA-Z0-9_-]+)/);
  const tenantId = routeTenantId || (match ? match[1] : '');

  const [detail, setDetail] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'projects' | 'danger'>('overview');

  // Search in tabs
  const [memberSearch, setMemberSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  // Drawers
  const [isFlagsOpen, setIsFlagsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);

  // Impersonation modal & action
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  const fetchTenantDetail = async () => {
    if (!tenantId) return;
    try {
      setIsLoading(true);
      const [detailRes, membersRes, projectsRes, timelineRes] = await Promise.all([
        apiClient.get(`/v1/admin/tenants/${tenantId}/detail`),
        apiClient.get(`/v1/admin/tenants/${tenantId}/members`),
        apiClient.get(`/v1/admin/tenants/${tenantId}/projects`),
        apiClient.get(`/v1/admin/tenants/${tenantId}/activity-timeline`),
      ]);

      if (detailRes.data?.success) setDetail(detailRes.data.data);
      if (membersRes.data?.success) setMembers(membersRes.data.data || []);
      if (projectsRes.data?.success) setProjects(projectsRes.data.data || []);
      if (timelineRes.data?.success) setTimeline(timelineRes.data.data || []);
    } catch (err) {
      console.error('Failed to load tenant detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantDetail();
  }, [tenantId]);

  const handleImpersonate = async () => {
    if (!tenantId) return;
    try {
      setIsImpersonating(true);
      const currentToken = useAuthStore.getState().accessToken;
      const currentUser = useAuthStore.getState().user;

      const res = await apiClient.post(`/v1/admin/tenants/${tenantId}/impersonate`);
      if (res.data?.success && res.data.data) {
        const { accessToken, user } = res.data.data;

        // Backup current Super Admin credentials
        if (currentToken) sessionStorage.setItem('superadmin_backup_token', currentToken);
        if (currentUser) sessionStorage.setItem('superadmin_backup_user', JSON.stringify(currentUser));
        sessionStorage.setItem('active_impersonation_token', accessToken);

        // Update state to impersonated session
        useAuthStore.getState().setAuth(user, accessToken);

        // Navigate to the tenant workspace dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to initiate impersonation session');
    } finally {
      setIsImpersonating(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!detail) return;
    const nextStatus = detail.tenant.status === 'active' ? 'suspended' : 'active';
    try {
      await apiClient.patch(`/v1/admin/tenants/${tenantId}`, { status: nextStatus });
      fetchTenantDetail();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handlePurge = async () => {
    if (purgeConfirmText !== detail?.tenant?.slug) return;
    try {
      setIsPurging(true);
      await apiClient.delete(`/v1/admin/tenants/${tenantId}?purge=true`);
      setIsPurgeModalOpen(false);
      navigate('/admin');
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to purge workspace');
    } finally {
      setIsPurging(false);
    }
  };

  if (isLoading && !detail) {
    return (
      <div className="py-24 text-center text-text-muted text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-emerald mb-2" />
        <span>Loading workspace deep-dive telemetry...</span>
      </div>
    );
  }

  if (!detail && !isLoading) {
    return (
      <div className="p-8 text-center text-text-muted text-xs">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="font-bold text-text-primary text-sm">Tenant not found</p>
        <p className="mt-1">Workspace ID &quot;{tenantId}&quot; does not exist or has been removed.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/admin')}>
          Back to Fleet Overview
        </Button>
      </div>
    );
  }

  const tenant = detail.tenant;
  const stats = detail.stats;
  const admin = detail.admin;

  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.department?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.name?.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.status?.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.methodology?.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Back Link & Top Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="p-1.5 rounded-lg border border-border/80 text-text-secondary hover:text-text-primary hover:bg-surface-low transition-colors cursor-pointer"
            title="Back to fleet list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-text-primary tracking-tight">
                {tenant.name}
              </h2>
              <Badge variant={tenant.status === 'active' ? 'completed' : 'pending'} size="sm" dot>
                {tenant.status}
              </Badge>
              <Badge variant="neutral" size="sm">
                {tenant.plan || 'Free'} Plan
              </Badge>
            </div>
            <p className="text-xs font-mono text-text-muted mt-0.5">
              {tenant.slug}.worksphere.app &bull; ID: {tenant.tenantId} &bull; Created {new Date(tenant.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchTenantDetail}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<CreditCard className="w-3.5 h-3.5 text-blue-500" />}
            onClick={() => setIsPlanOpen(true)}
          >
            Plan & Quotas
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-brand-emerald" />}
            onClick={() => setIsFlagsOpen(true)}
          >
            Feature Flags
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileText className="w-3.5 h-3.5 text-purple-500" />}
            onClick={() => setIsNotesOpen(true)}
          >
            Admin Notes
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-white" />}
            onClick={handleImpersonate}
            disabled={isImpersonating || tenant.status === 'archived'}
          >
            Impersonate
          </Button>
        </div>
      </div>

      {/* Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <MetricCard
          label="SEATS ASSIGNED"
          value={`${stats.totalUsers} / ${tenant.limits?.maxUsers || 50}`}
          trend={`${stats.activeUsers} Active`}
          isPositiveTrend
          icon={<Users className="w-4 h-4 text-brand-emerald" />}
        />
        <MetricCard
          label="ACTIVE INITIATIVES"
          value={`${stats.totalProjects} / ${tenant.limits?.maxProjects || 20}`}
          trend={`${stats.projectBreakdown?.active || 0} In Progress`}
          icon={<Briefcase className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          label="TASK DELIVERABLES"
          value={stats.totalTasks}
          trend={`${stats.taskBreakdown?.done || 0} Delivered`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
        <MetricCard
          label="LOGGED EFFORT"
          value={`${stats.totalHoursLogged} hrs`}
          trend={`${stats.totalTimeEntries} entries`}
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          label="STORAGE CONSUMED"
          value={stats.storageFormatted || `${stats.storageMB} MB`}
          trend={`of ${tenant.limits?.maxStorageMB || 500} MB`}
          icon={<HardDrive className="w-4 h-4 text-purple-500" />}
        />
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-border/80 gap-2">
        {(
          [
            { key: 'overview', label: 'Workspace Intelligence', icon: Building2 },
            { key: 'members', label: `Seat Members (${members.length})`, icon: Users },
            { key: 'projects', label: `Projects Portfolio (${projects.length})`, icon: Briefcase },
            { key: 'danger', label: 'Settings & Governance', icon: ShieldAlert },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-brand-emerald text-brand-emerald font-bold'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Organization & Primary Admin Profile */}
          <Card className="p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
              Organization Credentials
            </h3>
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between pb-2 border-b border-border/60">
                <span className="text-text-muted">Domain Endpoint</span>
                <span className="font-mono text-brand-emerald font-semibold">
                  {tenant.slug}.worksphere.app
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border/60">
                <span className="text-text-muted">Timezone & Currency</span>
                <span className="text-text-primary font-medium">
                  {tenant.timezone} &bull; {tenant.currencySymbol} ({tenant.currency})
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border/60">
                <span className="text-text-muted">Country Jurisdiction</span>
                <span className="text-text-primary">{tenant.country || 'Global / Unspecified'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border/60">
                <span className="text-text-muted">Last Activity Recorded</span>
                <span className="font-mono text-[11px] text-text-primary">
                  {stats.lastActiveAt ? new Date(stats.lastActiveAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono mt-2">
              Primary Org Administrator
            </h3>
            {admin ? (
              <div className="p-3.5 rounded-xl bg-surface-low border border-border/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-emerald/20 text-brand-emerald font-bold flex items-center justify-center text-xs shrink-0">
                  {admin.name?.charAt(0) || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-text-primary truncate">{admin.name}</div>
                  <div className="text-[11px] font-mono text-text-muted truncate">{admin.email}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">{admin.department || 'Executive'}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No orgAdmin found</p>
            )}

            {tenant.adminNotes && (
              <div className="mt-2 p-3 rounded-xl bg-surface-low/80 border border-border/80 text-xs">
                <span className="font-semibold text-text-primary block mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-500" /> Internal Admin Notes:
                </span>
                <p className="text-text-secondary italic whitespace-pre-line">{tenant.adminNotes}</p>
              </div>
            )}
          </Card>

          {/* Middle & Right: Breakdown & 30-Day Activity Sparkline */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Methodology & Task Status Distribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4">
                <span className="text-xs font-bold text-text-primary block mb-3">
                  Methodology Distribution
                </span>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Agile / Scrum
                    </span>
                    <span className="font-mono font-bold text-text-primary">
                      {stats.projectBreakdown?.byMethodology?.agile || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Waterfall / Phases
                    </span>
                    <span className="font-mono font-bold text-text-primary">
                      {stats.projectBreakdown?.byMethodology?.waterfall || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Hybrid Flow
                    </span>
                    <span className="font-mono font-bold text-text-primary">
                      {stats.projectBreakdown?.byMethodology?.hybrid || 0}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <span className="text-xs font-bold text-text-primary block mb-3">
                  Task Execution Health
                </span>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Delivered (Done)
                    </span>
                    <span className="font-mono font-bold text-text-primary">
                      {stats.taskBreakdown?.done || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In Progress / Review
                    </span>
                    <span className="font-mono font-bold text-text-primary">
                      {stats.taskBreakdown?.inProgress || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Backlog &amp; To-Do
                    </span>
                    <span className="font-mono font-bold text-text-primary">
                      {stats.taskBreakdown?.toDo || 0}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* 30-Day Activity Sparkline Card */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">
                    30-Day Workspace Event Volume
                  </h4>
                  <p className="text-[11px] text-text-muted">
                    Daily mutations, deliverable updates, and user activities recorded in audit logs.
                  </p>
                </div>
                <span className="font-mono font-bold text-xs text-brand-emerald">
                  {timeline.reduce((acc, t) => acc + t.count, 0)} total events
                </span>
              </div>

              {timeline.length === 0 ? (
                <div className="py-8 text-center text-text-muted text-xs">
                  No activity events recorded in the last 30 days.
                </div>
              ) : (
                <div className="flex items-end gap-1.5 h-32 pt-4 px-2 border-b border-border/80">
                  {timeline.map((point) => {
                    const maxVal = Math.max(...timeline.map((p) => p.count), 1);
                    const pct = Math.max(10, Math.round((point.count / maxVal) * 100));
                    return (
                      <div
                        key={point.date}
                        className="flex-1 flex flex-col items-center gap-1 group relative"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-7 px-1.5 py-0.5 rounded bg-brand-evergreen text-white text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {point.date}: {point.count}
                        </div>
                        <div
                          style={{ height: `${pct}%` }}
                          className="w-full bg-brand-emerald/70 group-hover:bg-brand-emerald rounded-t-xs transition-all"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Members Directory */}
      {activeTab === 'members' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border/80 flex items-center justify-between gap-3">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search member name, email or role..."
                className="w-full h-8 pl-9 pr-3 text-xs rounded-lg bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
              />
            </div>
            <span className="text-xs font-mono text-text-muted">
              {filteredMembers.length} seat accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-low/50 text-[11px] font-mono uppercase tracking-wider text-text-muted">
                  <th className="py-2.5 px-4">Member Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Account Status</th>
                  <th className="py-2.5 px-4 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted">
                      No members found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.userId} className="hover:bg-surface-low/40 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-emerald/10 text-brand-emerald font-bold flex items-center justify-center text-[11px] shrink-0">
                            {member.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-text-primary block">{member.name}</span>
                            <span className="text-[10px] font-mono text-text-muted">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="neutral" size="sm">
                          {member.role}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">
                        {member.department || 'General'}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={member.isActive ? 'completed' : 'pending'} size="sm" dot>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[11px] text-text-muted">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Projects Portfolio */}
      {activeTab === 'projects' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border/80 flex items-center justify-between gap-3">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Search initiative project..."
                className="w-full h-8 pl-9 pr-3 text-xs rounded-lg bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
              />
            </div>
            <span className="text-xs font-mono text-text-muted">
              {filteredProjects.length} initiatives
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-low/50 text-[11px] font-mono uppercase tracking-wider text-text-muted">
                  <th className="py-2.5 px-4">Initiative Name</th>
                  <th className="py-2.5 px-3">Methodology</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Progress / Tasks</th>
                  <th className="py-2.5 px-3">Assigned Team</th>
                  <th className="py-2.5 px-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted">
                      No initiatives created in this workspace yet.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => (
                    <tr key={p.projectId} className="hover:bg-surface-low/40 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-text-primary">
                        {p.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="neutral" size="sm">
                          {p.methodology}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={p.status === 'Active' ? 'completed' : 'pending'} size="sm" dot>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-text-secondary">
                        {p.completedTaskCount} / {p.taskCount} deliverables
                      </td>
                      <td className="py-2.5 px-3 text-text-muted font-mono text-[11px]">
                        {p.memberCount} members
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[11px] text-text-muted">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Danger & Governance */}
      {activeTab === 'danger' && (
        <div className="flex flex-col gap-6 max-w-3xl">
          <Card className="p-5 border-amber-200 bg-amber-500/5">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-2">
              <Power className="w-4 h-4" /> Workspace Lifecycle State
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Suspending this workspace prevents all tenant members from logging in or mutating data.
              Their data remains intact and can be re-activated at any moment.
            </p>
            <Button
              variant={tenant.status === 'active' ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleStatusToggle}
            >
              {tenant.status === 'active' ? 'Suspend Workspace Access' : 'Reactivate Workspace'}
            </Button>
          </Card>

          <Card className="p-5 border-rose-300 bg-rose-500/5">
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-2">
              <Trash2 className="w-4 h-4 text-rose-600" /> Permanent Purge Zone
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Permanently purges this tenant workspace, along with all associated users, initiatives, deliverables,
              sprints, documents, files, and audit logs. This action is irreversible.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPurgeModalOpen(true)}
              className="border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              Purge Entire Workspace Data
            </Button>
          </Card>
        </div>
      )}

      {/* Feature Flags Drawer */}
      {isFlagsOpen && (
        <TenantFeatureFlagsDrawer
          isOpen={isFlagsOpen}
          onClose={() => setIsFlagsOpen(false)}
          tenantId={tenant.tenantId}
          tenantName={tenant.name}
          tenantSlug={tenant.slug}
          onFlagsUpdated={fetchTenantDetail}
        />
      )}

      {/* Notes Drawer */}
      {isNotesOpen && (
        <TenantNotesDrawer
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
          tenantId={tenant.tenantId}
          tenantName={tenant.name}
          onNotesSaved={fetchTenantDetail}
        />
      )}

      {/* Plan Drawer */}
      {isPlanOpen && (
        <TenantPlanDrawer
          isOpen={isPlanOpen}
          onClose={() => setIsPlanOpen(false)}
          tenant={tenant}
          onPlanUpdated={fetchTenantDetail}
        />
      )}

      {/* Purge Confirmation Modal */}
      {isPurgeModalOpen && (
        <Modal
          isOpen={isPurgeModalOpen}
          onClose={() => setIsPurgeModalOpen(false)}
          title="Confirm Workspace Data Purge"
          description="Irreversible operation that destroys all tenant partition documents."
          icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
          maxWidth="sm"
        >
          <div className="flex flex-col gap-3 py-2 text-xs">
            <p className="text-text-secondary">
              To confirm permanent deletion of <strong>{tenant.name}</strong>, type the tenant slug{' '}
              <code className="px-1.5 py-0.5 rounded bg-surface-low font-bold text-rose-700">{tenant.slug}</code> below:
            </p>
            <input
              type="text"
              value={purgeConfirmText}
              onChange={(e) => setPurgeConfirmText(e.target.value)}
              placeholder={tenant.slug}
              className="w-full h-9 px-3 rounded-lg bg-surface-low border border-rose-300 text-xs font-mono text-text-primary focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
              <Button variant="secondary" size="sm" onClick={() => setIsPurgeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={purgeConfirmText !== tenant.slug || isPurging}
                onClick={handlePurge}
                className="bg-rose-600 text-white hover:bg-rose-700 border-transparent"
              >
                {isPurging ? 'Purging...' : 'Permanently Purge'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TenantDetailView;
