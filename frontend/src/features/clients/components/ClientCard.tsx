import React, { useState } from 'react';
import { Building2, Mail, ExternalLink, Copy, Check, MoreVertical, Edit2, Trash2, FolderKanban } from 'lucide-react';
import { Client } from '../../../types';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface ClientCardProps {
  client: Client;
  projectCount?: number;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
  onOpenDrawer: (client: Client) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  projectCount = 0,
  onEdit,
  onDelete,
  onOpenDrawer,
}) => {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopyPortalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const portalUrl = `${window.location.origin}/portal/${client.portalToken}`;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onOpenDrawer(client)}
      className="bg-surface-card border border-border rounded-xl p-5 hover:border-brand-emerald/40 transition-all shadow-xs cursor-pointer flex flex-col justify-between gap-4 group"
    >
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              name={client.company || client.name}
              src={client.companyLogoUrl}
              size="md"
            />
            <div>
              <h3 className="font-semibold text-text-primary text-sm group-hover:text-brand-emerald transition-colors">
                {client.name}
              </h3>
              {client.company && (
                <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-text-muted" />
                  <span>{client.company}</span>
                </p>
              )}
            </div>
          </div>

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-low rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-36 bg-surface-card border border-border rounded-lg shadow-lg py-1 z-20 text-xs"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(client);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-text-primary hover:bg-surface-low"
                >
                  <Edit2 className="w-3.5 h-3.5 text-text-muted" />
                  Edit Client
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(client.clientId);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-status-error-text hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        {client.primaryEmail && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted mt-3">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{client.primaryEmail}</span>
          </div>
        )}
      </div>

      {/* Info Row & Portal Status */}
      <div className="pt-3 border-t border-border flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-text-muted">
          <FolderKanban className="w-3.5 h-3.5" />
          <span>{projectCount} {projectCount === 1 ? 'project' : 'projects'}</span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Badge
            variant={client.isPortalActive ? 'success' : 'neutral'}
            size="sm"
          >
            {client.isPortalActive ? 'Portal Active' : 'Portal Disabled'}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPortalLink}
            title="Copy Client Portal Link"
            className="h-7 px-2 text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-text-muted mr-1" />
                Portal
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;
