import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Mail,
  DollarSign,
  FolderKanban,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Client, Project } from '../../../types';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useProjects } from '../../../hooks/useProjects';
import { useUpdateClient } from '../../../hooks/useClients';

interface ClientProjectsDrawerProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
}

export const ClientProjectsDrawer: React.FC<ClientProjectsDrawerProps> = ({
  client,
  isOpen,
  onClose,
  onEdit,
}) => {
  const navigate = useNavigate();
  const { data: allProjects = [] } = useProjects();
  const updateClient = useUpdateClient();

  const [copied, setCopied] = useState(false);

  if (!isOpen || !client) return null;

  const clientProjects = allProjects.filter((p) => p.clientId === client.clientId);

  const totalBudget = clientProjects.reduce((sum, p) => sum + (p.budget?.total || 0), 0);
  const totalSpent = clientProjects.reduce((sum, p) => sum + (p.budget?.spent || 0), 0);

  const handleCopyPortal = () => {
    const link = `${window.location.origin}/portal/${client.portalToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePortal = async () => {
    await updateClient.mutateAsync({
      clientId: client.clientId,
      isPortalActive: !client.isPortalActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-surface-card border-l border-border h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-border flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={client.company || client.name} src={client.companyLogoUrl} size="md" />
            <div>
              <h3 className="font-bold text-text-primary text-base">{client.name}</h3>
              {client.company && (
                <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{client.company}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6 text-xs">
          {/* Contact Details */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-text-muted tracking-wider uppercase text-[10px]">
              Contact Info
            </span>
            <div className="p-3 bg-surface-low rounded-lg border border-border flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-text-primary">
                <Mail className="w-3.5 h-3.5 text-text-muted" />
                <span>{client.primaryEmail || 'No email provided'}</span>
              </div>
            </div>
          </div>

          {/* Portal Access Box */}
          <div className="p-4 rounded-xl bg-surface-low border border-border flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-emerald" />
                <span className="font-semibold text-text-primary text-xs">Client Portal</span>
              </div>
              <Badge variant={client.isPortalActive ? 'success' : 'neutral'} size="sm">
                {client.isPortalActive ? 'Active' : 'Disabled'}
              </Badge>
            </div>

            <p className="text-[11px] text-text-muted">
              Clients access a dedicated read-only dashboard without needing login credentials.
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPortal}
                className="w-full text-xs h-8"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                    Copied Portal Link
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy Portal Link
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleTogglePortal}
                className="text-xs h-8 shrink-0 text-text-secondary"
              >
                {client.isPortalActive ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-text-muted tracking-wider uppercase text-[10px]">
              Financial Summary
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-surface-low rounded-lg border border-border flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Total Budget</span>
                <span className="text-sm font-bold text-text-primary">
                  ${totalBudget.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-surface-low rounded-lg border border-border flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Total Spent</span>
                <span className="text-sm font-bold text-brand-emerald">
                  ${totalSpent.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Projects */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-muted tracking-wider uppercase text-[10px]">
                Linked Projects ({clientProjects.length})
              </span>
            </div>

            {clientProjects.length === 0 ? (
              <div className="p-4 bg-surface-low rounded-lg border border-dashed border-border text-center text-text-muted text-xs">
                No projects assigned to this client yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {clientProjects.map((project) => (
                  <div
                    key={project.projectId}
                    onClick={() => {
                      onClose();
                      navigate(`/projects/${project.projectId}`);
                    }}
                    className="p-3 bg-surface-card rounded-lg border border-border hover:border-brand-emerald/40 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderKanban className="w-4 h-4 text-brand-emerald shrink-0" />
                      <div>
                        <h4 className="font-medium text-text-primary text-xs">{project.name}</h4>
                        <span className="text-[10px] text-text-muted capitalize">
                          {project.status}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(client);
            }}
            className="text-xs"
          >
            Edit Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientProjectsDrawer;
