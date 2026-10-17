import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Power,
  KeyRound,
  Download,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  FileCode,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import apiClient from '../../../api/client';

export const UserLookupView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Password reset modal state
  const [resettingUser, setResettingUser] = useState<any | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // GDPR export modal state
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const fetchUsers = async (targetPage = page) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', '25');
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await apiClient.get(`/v1/admin/users?${params.toString()}`);
      if (res.data?.success) {
        setUsers(res.data.data.users || []);
        if (res.data.data.pagination) {
          setTotalPages(res.data.data.pagination.totalPages || 1);
          setTotalUsers(res.data.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter]);

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/v1/admin/users/${userId}/status`, { isActive: !currentStatus });
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to toggle account status');
    }
  };

  const handlePasswordReset = async () => {
    if (!resettingUser) return;
    try {
      setIsResetting(true);
      const res = await apiClient.post(`/v1/admin/users/${resettingUser.userId}/reset-password`);
      if (res.data?.success && res.data.data) {
        setTempPassword(res.data.data.temporaryPassword);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const handleGdprExport = async (user: any) => {
    try {
      setIsExporting(user.userId);
      const res = await apiClient.post(`/v1/admin/users/${user.userId}/gdpr-export`);
      if (res.data?.success && res.data.data) {
        const jsonContent = JSON.stringify(res.data.data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gdpr_export_${user.userId}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to export GDPR data package');
    } finally {
      setIsExporting(null);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-emerald" />
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Cross-Tenant User Directory &amp; GDPR
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Platform seat accounts, global search, password remediation, and GDPR data portability.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={() => fetchUsers(page)}
        >
          Refresh Roster
        </Button>
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
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
              placeholder="Search by name, email, or user ID..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs font-medium bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
          >
            <option value="all">All Roles</option>
            <option value="superAdmin">Super Admin</option>
            <option value="orgAdmin">Org Admin</option>
            <option value="manager">Manager</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs font-medium bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <Button variant="secondary" size="sm" onClick={() => fetchUsers(1)}>
          Search Roster
        </Button>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-low/50 text-[11px] font-mono uppercase tracking-wider text-text-muted">
                <th className="py-3 px-4">Account User</th>
                <th className="py-3 px-3">Fleet Organization</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    Loading cross-tenant account records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    No user accounts found matching the criteria.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.userId} className="hover:bg-surface-low/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-emerald/10 text-brand-emerald font-bold flex items-center justify-center text-[11px] shrink-0">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span className="font-semibold text-text-primary block">{user.name}</span>
                          <span className="font-mono text-[10px] text-text-muted">
                            {user.email} &bull; {user.userId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-text-primary block">{user.tenantName}</span>
                      <span className="font-mono text-[10px] text-text-muted">{user.tenantId}</span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="neutral" size="sm">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-text-secondary">
                      {user.department || 'General'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={user.isActive ? 'completed' : 'pending'} size="sm" dot>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Force Password Reset */}
                        <button
                          type="button"
                          onClick={() => {
                            setResettingUser(user);
                            setTempPassword(null);
                          }}
                          className="p-1.5 rounded-lg text-text-muted hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Force reset password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* GDPR Data Export */}
                        <button
                          type="button"
                          onClick={() => handleGdprExport(user)}
                          disabled={isExporting === user.userId}
                          className="p-1.5 rounded-lg text-text-muted hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="GDPR data portability JSON export"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Activate / Deactivate Toggle */}
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(user.userId, user.isActive)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            user.isActive
                              ? 'text-text-muted hover:text-rose-600 hover:bg-rose-50'
                              : 'text-text-muted hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={user.isActive ? 'Deactivate user account' : 'Reactivate user account'}
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

        {/* Pagination Controls */}
        <div className="p-3 border-t border-border/80 flex items-center justify-between text-xs text-text-muted bg-surface-low/30">
          <span>
            Page {page} of {totalPages} &bull; {totalUsers} registered users
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const prev = Math.max(1, page - 1);
                setPage(prev);
                fetchUsers(prev);
              }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                const next = Math.min(totalPages, page + 1);
                setPage(next);
                fetchUsers(next);
              }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Password Reset Modal */}
      {resettingUser && (
        <Modal
          isOpen={!!resettingUser}
          onClose={() => {
            setResettingUser(null);
            setTempPassword(null);
          }}
          title="Force Credential Reset"
          description={`Target Account: ${resettingUser.name} (${resettingUser.email})`}
          icon={<KeyRound className="w-4 h-4 text-amber-600" />}
          maxWidth="sm"
        >
          <div className="flex flex-col gap-4 py-2 text-xs">
            {!tempPassword ? (
              <>
                <p className="text-text-secondary">
                  Generating a new temporary password will invalidate the user&apos;s current password
                  immediately. You can copy the generated credential and provide it to the user securely.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setResettingUser(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePasswordReset}
                    disabled={isResetting}
                  >
                    {isResetting ? 'Resetting...' : 'Generate Temporary Password'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Password has been successfully updated!</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">
                    Temporary Credentials
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={tempPassword}
                      className="w-full h-9 px-3 rounded-lg bg-surface-low border border-border/80 font-mono text-xs text-text-primary"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyPassword}
                      leftIcon={isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    >
                      {isCopied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setResettingUser(null);
                      setTempPassword(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserLookupView;
