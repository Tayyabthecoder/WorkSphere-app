import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Download,
  Filter,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Building2,
  FileCode,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import apiClient from '../../../api/client';

interface AuditLog {
  logId: string;
  tenantId: string;
  projectId?: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export const AuditLogExplorerView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [tenantFilter, setTenantFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');

  // Selected Log for JSON Metadata Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Tenants list for dropdown
  const [tenantsList, setTenantsList] = useState<Array<{ tenantId: string; name: string }>>([]);

  const fetchTenants = async () => {
    try {
      const res = await apiClient.get('/v1/admin/tenants');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setTenantsList(
          res.data.data.map((t: any) => ({
            tenantId: t.tenantId,
            name: t.name,
          }))
        );
      }
    } catch {
      // Ignore
    }
  };

  const fetchLogs = async (targetPage = page) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('page', targetPage.toString());
      params.set('limit', '25');

      if (tenantFilter && tenantFilter !== 'all') params.set('tenantId', tenantFilter);
      if (actionFilter.trim()) params.set('action', actionFilter.trim());
      if (entityTypeFilter && entityTypeFilter !== 'all') params.set('entityType', entityTypeFilter);

      const res = await apiClient.get(`/v1/admin/audit-log?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
        if (res.data.data.pagination) {
          setTotalPages(res.data.data.pagination.totalPages || 1);
          setTotalCount(res.data.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [tenantFilter, entityTypeFilter]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['logId', 'tenantId', 'userId', 'action', 'entityType', 'entityId', 'createdAt'];
    const rows = logs.map((l) => [
      l.logId,
      l.tenantId,
      l.userId,
      l.action,
      l.entityType,
      l.entityId,
      new Date(l.createdAt).toISOString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-emerald" />
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Audit Log Explorer
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Immutable cross-tenant activity audit stream &bull; {totalCount} Recorded Events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => fetchLogs(page)}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Action search */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs(1)}
              placeholder="Search action keyword..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
            />
          </div>

          {/* Tenant Selector */}
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs font-medium bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
          >
            <option value="all">All Tenants</option>
            {tenantsList.map((t) => (
              <option key={t.tenantId} value={t.tenantId}>
                {t.name} ({t.tenantId})
              </option>
            ))}
          </select>

          {/* Entity Type Filter */}
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs font-medium bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
          >
            <option value="all">All Entity Types</option>
            <option value="project">Project</option>
            <option value="task">Task</option>
            <option value="user">User</option>
            <option value="tenant">Tenant</option>
            <option value="budget">Budget</option>
            <option value="document">Document</option>
          </select>
        </div>

        <Button variant="secondary" size="sm" onClick={() => fetchLogs(1)}>
          Apply Filters
        </Button>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-low/50 text-[11px] font-mono uppercase tracking-wider text-text-muted">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Tenant ID</th>
                <th className="py-3 px-3">Actor / User</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Entity Target</th>
                <th className="py-3 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    No activity logs recorded matching the criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.logId} className="hover:bg-surface-low/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-text-secondary">
                      {log.tenantId}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-text-primary">
                      {log.userId}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
                          {log.action}
                        </span>
                        {(log.metadata?.impersonatedBy || (log as any).impersonatedBy) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-700 border border-amber-300">
                            IMPERSONATED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-text-secondary">
                      <span className="font-semibold text-text-primary">{log.entityType}</span>
                      <span className="font-mono text-[10px] text-text-muted ml-1">
                        ({log.entityId})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-low hover:bg-surface-card border border-border/80 text-[11px] font-medium text-brand-emerald transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View JSON
                        </button>
                      ) : (
                        <span className="text-text-muted text-[11px]">Empty</span>
                      )}
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
            Page {page} of {totalPages} &bull; {totalCount} total events
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const prev = Math.max(1, page - 1);
                setPage(prev);
                fetchLogs(prev);
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
                fetchLogs(next);
              }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* JSON Metadata Viewer Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Metadata Payload"
          description={`Log ID: ${selectedLog.logId} • ${selectedLog.action}`}
          icon={<FileCode className="w-4 h-4 text-brand-emerald" />}
          maxWidth="lg"
        >
          <div className="flex flex-col gap-3 py-2">
            <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[400px]">
              <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AuditLogExplorerView;
