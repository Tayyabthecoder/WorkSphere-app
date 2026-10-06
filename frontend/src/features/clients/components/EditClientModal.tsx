import React, { useState, useEffect } from 'react';
import { Building2, Mail, Image, ShieldCheck, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useUpdateClient } from '../../../hooks/useClients';
import { Client } from '../../../types';

interface EditClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  client,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const updateClient = useUpdateClient();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [isPortalActive, setIsPortalActive] = useState(true);

  // Portal settings
  const [allowOverview, setAllowOverview] = useState(true);
  const [allowTimeline, setAllowTimeline] = useState(true);
  const [allowDeliverables, setAllowDeliverables] = useState(true);
  const [allowFinancialSummary, setAllowFinancialSummary] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setCompany(client.company || '');
      setPrimaryEmail(client.primaryEmail || '');
      setCompanyLogoUrl(client.companyLogoUrl || '');
      setIsPortalActive(client.isPortalActive ?? true);
      if (client.portalSettings) {
        setAllowOverview(client.portalSettings.allowOverview ?? true);
        setAllowTimeline(client.portalSettings.allowTimeline ?? true);
        setAllowDeliverables(client.portalSettings.allowDeliverables ?? true);
        setAllowFinancialSummary(client.portalSettings.allowFinancialSummary ?? false);
      }
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Client name is required');
      return;
    }

    setError('');
    try {
      await updateClient.mutateAsync({
        clientId: client.clientId,
        name: name.trim(),
        company: company.trim(),
        primaryEmail: primaryEmail.trim(),
        companyLogoUrl: companyLogoUrl.trim(),
        isPortalActive,
        portalSettings: {
          allowOverview,
          allowTimeline,
          allowDeliverables,
          allowFinancialSummary,
        },
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to update client');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Client Details" maxWidth="lg">
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
          />
        </div>

        {/* Portal Activation Switch */}
        <div className="flex items-center justify-between p-3 bg-surface-low rounded-xl border border-border">
          <div>
            <h5 className="text-xs font-semibold text-text-primary">
              Client Portal Access
            </h5>
            <p className="text-[11px] text-text-muted">
              Enable or temporarily disable access to this client's portal link.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPortalActive}
              onChange={(e) => setIsPortalActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-emerald"></div>
          </label>
        </div>

        {/* Portal Settings Section */}
        <div className="p-3.5 bg-surface-low rounded-xl border border-border flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-emerald" />
            <h5 className="font-semibold text-xs text-text-primary">
              Portal Permissions
            </h5>
          </div>

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
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={updateClient.isPending}
          >
            {updateClient.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditClientModal;
