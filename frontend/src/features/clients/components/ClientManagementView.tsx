import React, { useState, useMemo } from 'react';
import { Plus, Search, Building2, ShieldCheck, FolderKanban, Loader2 } from 'lucide-react';
import { useClients, useDeleteClient } from '../../../hooks/useClients';
import { useProjects } from '../../../hooks/useProjects';
import { Client } from '../../../types';
import { ClientCard } from './ClientCard';
import { CreateClientModal } from './CreateClientModal';
import { EditClientModal } from './EditClientModal';
import { ClientProjectsDrawer } from './ClientProjectsDrawer';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/auth';
import { hasPermission } from '../../../lib/rbac';

export const ClientManagementView: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const canCreateClient = hasPermission(user?.role, 'client:create');
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { data: projects = [] } = useProjects();
  const deleteClient = useDeleteClient();

  const [search, setSearch] = useState('');
  const [filterPortal, setFilterPortal] = useState<'all' | 'active' | 'inactive'>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [drawerClient, setDrawerClient] = useState<Client | null>(null);

  // Map of client project counts
  const projectCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach((p) => {
      if (p.clientId) {
        map[p.clientId] = (map[p.clientId] || 0) + 1;
      }
    });
    return map;
  }, [projects]);

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.primaryEmail?.toLowerCase().includes(search.toLowerCase());

    const matchesPortal =
      filterPortal === 'all'
        ? true
        : filterPortal === 'active'
        ? c.isPortalActive
        : !c.isPortalActive;

    return matchesSearch && matchesPortal;
  });

  const handleDelete = async (clientId: string) => {
    if (window.confirm('Are you sure you want to remove this client? Their portal token will become inactive.')) {
      await deleteClient.mutateAsync(clientId);
    }
  };

  const activePortalsCount = clients.filter((c) => c.isPortalActive).length;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Clients & External Stakeholders</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-brand-emerald/10 text-brand-emerald rounded-full">
              CRM & Portals
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Manage client relationships and provision read-only client portals for external project tracking.
          </p>
        </div>

        {canCreateClient && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Client
          </Button>
        )}
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-text-primary">{clients.length}</div>
            <div className="text-xs text-text-muted">Total Clients</div>
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-text-primary">{activePortalsCount}</div>
            <div className="text-xs text-text-muted">Active Client Portals</div>
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-text-primary">{Object.keys(projectCountMap).length}</div>
            <div className="text-xs text-text-muted">Projects Associated</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients by name or company..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-card border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-emerald"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(['all', 'active', 'inactive'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterPortal(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterPortal === tab
                  ? 'bg-brand-emerald/10 text-brand-emerald font-semibold'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-low'
              }`}
            >
              {tab === 'all' ? 'All Portals' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {isLoadingClients ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
          <span className="text-xs">Loading clients...</span>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-card border border-dashed border-border rounded-xl text-center">
          <Building2 className="w-12 h-12 text-brand-emerald/40 mb-3" />
          <h3 className="text-sm font-semibold text-text-primary">No clients found</h3>
          <p className="text-xs text-text-muted max-w-sm mt-1 mb-4">
            {search
              ? 'No clients matched your search query.'
              : 'Add your first client to create dedicated portals and link projects.'}
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} className="text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.clientId}
              client={client}
              projectCount={projectCountMap[client.clientId] || 0}
              onEdit={(c) => setEditingClient(c)}
              onDelete={handleDelete}
              onOpenDrawer={(c) => setDrawerClient(c)}
            />
          ))}
        </div>
      )}

      {/* Modals & Drawer */}
      <CreateClientModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <EditClientModal
        client={editingClient}
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
      />

      <ClientProjectsDrawer
        client={drawerClient}
        isOpen={!!drawerClient}
        onClose={() => setDrawerClient(null)}
        onEdit={(c) => {
          setDrawerClient(null);
          setEditingClient(c);
        }}
      />
    </div>
  );
};

export default ClientManagementView;
