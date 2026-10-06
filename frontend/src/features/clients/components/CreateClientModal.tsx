import React, { useState } from 'react';
import { Building2, Mail, Image, ShieldCheck, Loader2, Copy, Check } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useCreateClient } from '../../../hooks/useClients';
import { Client } from '../../../types';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const createClient = useCreateClient();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');

  // Portal settings
  const [allowOverview, setAllowOverview] = useState(true);
  const [allowTimeline, setAllowTimeline] = useState(true);
  const [allowDeliverables, setAllowDeliverables] = useState(true);
  const [allowFinancialSummary, setAllowFinancialSummary] = useState(false);

  const [createdClient, setCreatedClient] = useState<Client | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!createdClient) return;
    const link = `${window.location.origin}/portal/${createdClient.portalToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setName('');
    setCompany('');
    setPrimaryEmail('');
    setCompanyLogoUrl('');
    setCreatedClient(null);
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Client name is required');
      return;
    }

    setError('');
    try {
      const res = await createClient.mutateAsync({
        name: name.trim(),
        company: company.trim(),
        primaryEmail: primaryEmail.trim(),
        companyLogoUrl: companyLogoUrl.trim(),
        isPortalActive: true,
        portalSettings: {
          allowOverview,
          allowTimeline,
          allowDeliverables,
          allowFinancialSummary,
        },
      });
      setCreatedClient(res);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to create client');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdClient ? 'Client Created Successfully' : 'Add New Client'}
      maxWidth="lg"
    >
      {createdClient ? (
        <div className="flex flex-col gap-5 py-2">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
            <h4 className="font-semibold text-sm">
              Client & Portal Link Ready
            </h4>
            <p className="text-xs mt-1">
              Share the secure client portal link with {createdClient.name} ({createdClient.company || 'Client'}) to provide them live view of their projects.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-primary">
              Portal Access URL
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/portal/${createdClient.portalToken}`}
                className="font-mono text-xs select-all bg-surface-low"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-status-error-bg text-status-error-text text-xs border border-status-error-border">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Client Contact Name <span className="text-status-error-text">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-text-muted" />
                Company / Organization
              </label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-text-muted" />
                Primary Email
              </label>
              <Input
                type="email"
                value={primaryEmail}
                onChange={(e) => setPrimaryEmail(e.target.value)}
                placeholder="sarah@acme.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-text-muted" />
              Company Logo URL
            </label>
            <Input
              value={companyLogoUrl}
              onChange={(e) => setCompanyLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>

          {/* Portal Settings Section */}
          <div className="p-3.5 bg-surface-low rounded-xl border border-border flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-emerald" />
              <h5 className="font-semibold text-xs text-text-primary">
                Portal Permissions
              </h5>
            </div>
            <p className="text-[11px] text-text-muted">
              Choose what this client can see when viewing their portal link.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOverview}
                  onChange={(e) => setAllowOverview(e.target.checked)}
                  className="rounded text-brand-emerald focus:ring-brand-emerald"
                />
                <span>Overview & Progress</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowTimeline}
                  onChange={(e) => setAllowTimeline(e.target.checked)}
                  className="rounded text-brand-emerald focus:ring-brand-emerald"
                />
                <span>Milestones & Timeline</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDeliverables}
                  onChange={(e) => setAllowDeliverables(e.target.checked)}
                  className="rounded text-brand-emerald focus:ring-brand-emerald"
                />
                <span>Key Deliverables</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowFinancialSummary}
                  onChange={(e) => setAllowFinancialSummary(e.target.checked)}
                  className="rounded text-brand-emerald focus:ring-brand-emerald"
                />
                <span>Financial & Invoicing</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
            <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={createClient.isPending}
            >
              {createClient.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Client & Generate Portal'
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default CreateClientModal;
