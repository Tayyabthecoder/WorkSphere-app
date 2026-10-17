import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Briefcase,
  Plus,
  Search,
  Power,
  RefreshCw,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Filter,
  SlidersHorizontal,
  FileText,
  Loader2,
  CreditCard,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { MetricCard } from '../../../components/dashboard/MetricCard';
import { TenantFeatureFlagsDrawer } from './TenantFeatureFlagsDrawer';
import { TenantNotesDrawer } from './TenantNotesDrawer';
import { TenantPlanDrawer } from './TenantPlanDrawer';
import apiClient from '../../../api/client';
import { useAuthStore } from '../../../store/auth';

export const AdminFleetView: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'archived'>('all');

  // Provisioning Modal State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('Password123!');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState('');

  // Feature Flags Drawer State
  const [flagsTenant, setFlagsTenant] = useState<any | null>(null);

  // Notes Drawer State
  const [notesTenant, setNotesTenant] = useState<any | null>(null);

  // Plan Drawer State
  const [planTenant, setPlanTenant] = useState<any | null>(null);

  const fetchPlatformData = async () => {
    try {
      setIsLoading(true);
      const [overviewRes, tenantsRes] = await Promise.all([
        apiClient.get('/v1/admin/overview'),
        apiClient.get('/v1/admin/tenants'),
      ]);

      if (overviewRes.data?.success && overviewRes.data.data) {
        setStats(overviewRes.data.data.stats);
      }

      if (tenantsRes.data?.success && tenantsRes.data.data) {
        setTenants(tenantsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const handleStatusToggle = async (tenantId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await apiClient.patch(`/v1/admin/tenants/${tenantId}`, { status: nextStatus });
      setTenants((prev) =>
        prev.map((t) => (t.tenantId === tenantId ? { ...t, status: nextStatus } : t))
      );
    } catch (err) {
      console.error('Failed to toggle tenant status:', err);
    }
  };

  const handleImpersonate = async (tenant: any) => {
    try {
      const currentToken = useAuthStore.getState().accessToken;
      const currentUser = useAuthStore.getState().user;
      const res = await apiClient.post(`/v1/admin/tenants/${tenant.tenantId}/impersonate`);
      if (res.data?.success && res.data.data) {
        const { accessToken, user } = res.data.data;
        if (currentToken) sessionStorage.setItem('superadmin_backup_token', currentToken);
        if (currentUser) sessionStorage.setItem('superadmin_backup_user', JSON.stringify(currentUser));
        sessionStorage.setItem('active_impersonation_token', accessToken);
        useAuthStore.getState().setAuth(user, accessToken);
        navigate('/dashboard');
      }
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to initiate impersonation session');
    }
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProvisioning(true);
      setProvisionError('');
      const res = await apiClient.post('/v1/admin/tenants', {
        name: newOrgName.trim(),
        slug: newOrgSlug.trim().toLowerCase(),
        adminName: newAdminName.trim(),
        adminEmail: newAdminEmail.trim().toLowerCase(),
        adminPassword: newAdminPassword,
      });

      if (res.data?.success) {
        setIsProvisionOpen(false);
        setNewOrgName('');
        setNewOrgSlug('');
        setNewAdminName('');
        setNewAdminEmail('');
        fetchPlatformData();
      }
    } catch (err: any) {
      setProvisionError(err.response?.data?.error?.message || 'Failed to provision tenant');
    } finally {
      setIsProvisioning(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.name?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q) ||
        t.adminEmail?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-emerald" />
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Fleet Overview & Organizations
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Platform multitenant management, lifecycle statuses, and tenant workspace provisioning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchPlatformData}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsProvisionOpen(true)}
          >
            Provision Organization
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="MANAGED TENANTS"
          value={stats?.totalTenants ?? tenants.length}
          trend={`${stats?.activeTenants ?? tenants.length} Active`}
          isPositiveTrend
          icon={<Building2 className="w-4 h-4 text-brand-emerald" />}
        />
        <MetricCard
          label="PLATFORM USERS"
          value={stats?.totalUsers ?? 0}
          trend={`${stats?.activeUsers ?? 0} Active`}
          icon={<Users className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          label="TOTAL DELIVERABLES"
          value={stats?.totalTasks ?? 0}
          trend="Across all fleets"
          icon={<Briefcase className="w-4 h-4 text-purple-500" />}
        />
        <MetricCard
          label="TOTAL STORAGE"
          value={
            stats?.storage?.formatted ||
            (stats?.storage?.dbDataFormatted
              ? stats.storage.dbDataFormatted
              : stats?.estimatedStorageMB !== undefined
              ? `${stats.estimatedStorageMB} MB`
              : '—')
          }
          trend={
            stats?.storage
              ? `DB: ${stats.storage.dbDataFormatted || stats.storage.dbFormatted || '0 B'} · Files: ${stats.storage.filesFormatted || '0 B'}`
              : 'Real-time telemetry'
          }
          icon={<Database className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organizations or admins..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>

          <div className="flex items-center gap-1">
            {(['all', 'active', 'suspended', 'archived'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === s
                    ? 'bg-brand-emerald text-white font-semibold'
                    : 'bg-surface-low text-text-secondary hover:text-text-primary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tenants Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-low/50 text-[11px] font-mono uppercase tracking-wider text-text-muted">
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Plan</th>
                <th className="py-3 px-3">Users</th>
                <th className="py-3 px-3">Projects</th>
                <th className="py-3 px-3">Org Admin</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted">
                    No organizations found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.tenantId} className="hover:bg-surface-low/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <Link
                          to={`/admin/tenants/${tenant.tenantId}`}
                          className="font-semibold text-text-primary hover:text-brand-emerald hover:underline transition-colors flex items-center gap-1 group"
                        >
                          <span>{tenant.name}</span>
                          <ExternalLink className="w-3 h-3 text-brand-emerald opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <span className="font-mono text-[10px] text-text-muted">
                          {tenant.slug}.worksphere.app ({tenant.tenantId})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={tenant.status === 'active' ? 'completed' : 'pending'}
                        size="sm"
                        dot
                      >
                        {tenant.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => setPlanTenant(tenant)}
                        className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-low hover:bg-surface-card text-text-primary border border-border/80 transition-colors cursor-pointer flex items-center gap-1"
                        title="Configure plan & quotas"
                      >
                        <CreditCard className="w-3 h-3 text-text-muted" />
                        <span>{tenant.plan || 'Free'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-text-primary">
                      {tenant.userCount} users
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-text-primary">
                      {tenant.projectCount} projects
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="text-text-primary font-medium">{tenant.adminName}</span>
                        <span className="text-[10px] text-text-muted font-mono">{tenant.adminEmail}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleImpersonate(tenant)}
                          disabled={tenant.status === 'archived'}
                          className="p-1.5 rounded-lg text-text-muted hover:text-brand-emerald hover:bg-surface-low transition-colors cursor-pointer"
                          title="Impersonate workspace as Platform Admin"
                        >
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlagsTenant(tenant)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-brand-emerald hover:bg-surface-low transition-colors cursor-pointer"
                          title="Configure feature flags"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotesTenant(tenant)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-brand-emerald hover:bg-surface-low transition-colors cursor-pointer"
                          title="Internal admin notes"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(tenant.tenantId, tenant.status)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            tenant.status === 'active'
                              ? 'text-text-muted hover:text-rose-600 hover:bg-rose-50'
                              : 'text-text-muted hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={tenant.status === 'active' ? 'Suspend workspace' : 'Activate workspace'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Feature Flags Drawer */}
      {flagsTenant && (
        <TenantFeatureFlagsDrawer
          isOpen={!!flagsTenant}
          onClose={() => setFlagsTenant(null)}
          tenantId={flagsTenant.tenantId}
          tenantName={flagsTenant.name}
          tenantSlug={flagsTenant.slug}
          onFlagsUpdated={fetchPlatformData}
        />
      )}

      {/* Notes Drawer */}
      {notesTenant && (
        <TenantNotesDrawer
          isOpen={!!notesTenant}
          onClose={() => setNotesTenant(null)}
          tenantId={notesTenant.tenantId}
          tenantName={notesTenant.name}
          onNotesSaved={fetchPlatformData}
        />
      )}

      {/* Plan Drawer */}
      {planTenant && (
        <TenantPlanDrawer
          isOpen={!!planTenant}
          onClose={() => setPlanTenant(null)}
          tenant={planTenant}
          onPlanUpdated={fetchPlatformData}
        />
      )}

      {/* Provisioning Modal */}
      {isProvisionOpen && (
        <Modal
          isOpen={isProvisionOpen}
          onClose={() => setIsProvisionOpen(false)}
          title="Provision New Organization Workspace"
          description="Create a dedicated tenant partition and primary administrator account."
          icon={<Building2 className="w-4 h-4 text-brand-emerald" />}
          maxWidth="md"
        >
          <form onSubmit={handleProvisionSubmit} className="flex flex-col gap-4 py-2">
            {provisionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {provisionError}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Organization Name
              </label>
              <Input
                value={newOrgName}
                onChange={(e) => {
                  setNewOrgName(e.target.value);
                  if (!newOrgSlug) {
                    setNewOrgSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')
                    );
                  }
                }}
                placeholder="e.g. Acme Systems"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Subdomain Slug
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase())}
                  placeholder="acme"
                  required
                />
                <span className="text-xs font-mono text-text-muted shrink-0">
                  .worksphere.app
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Primary Admin Name
                </label>
                <Input
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Primary Admin Email
                </label>
                <Input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@acme.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Default Password
              </label>
              <Input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsProvisionOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isProvisioning}
                leftIcon={isProvisioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
              >
                Create Workspace
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminFleetView;
