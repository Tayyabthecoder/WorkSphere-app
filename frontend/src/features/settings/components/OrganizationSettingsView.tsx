import React, { useState, useEffect } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Save,
  CheckCircle2,
  Users,
  Plus,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import {
  SUPPORTED_CURRENCIES,
  COUNTRIES,
  getCurrencyForCountry,
  CURRENCY_SYMBOLS,
} from '../../../utils/currency';
import { useCurrency } from '../../../store/CurrencyContext';
import { useThemeStore, THEME_ACCENTS } from '../../../store/theme';
import apiClient from '../../../api/client';

interface OrgData {
  tenantId: string;
  name: string;
  slug: string;
  status: string;
  logoUrl?: string;
  timezone: string;
  language: string;
  country?: string;
  currency: string;
  currencySymbol?: string;
  dateFormat: string;
  enforce2FA: boolean;
  restrictDomain: boolean;
  allowedDomain: string;
  usage?: {
    users: number;
    projects: number;
    storageGB: number;
  };
}

interface ClientItem {
  clientId: string;
  name: string;
  company?: string;
  primaryEmail?: string;
  portalToken: string;
  isPortalActive: boolean;
  projectCount?: number;
}

export const OrganizationSettingsView: React.FC = () => {
  const { setCurrency: setGlobalCurrency } = useCurrency();
  const [data, setData] = useState<OrgData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security' | 'clients'>('profile');
  const accent = useThemeStore((s) => s.accent);
  const setAccent = useThemeStore((s) => s.setAccent);

  // Form states
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [enforce2FA, setEnforce2FA] = useState(false);
  const [restrictDomain, setRestrictDomain] = useState(false);
  const [allowedDomain, setAllowedDomain] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Client Management states
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [isClientSubmitting, setIsClientSubmitting] = useState(false);

  const fetchOrgData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/v1/organization');
      if (res.data?.success && res.data.data) {
        const d: OrgData = res.data.data;
        setData(d);
        setName(d.name || '');
        setTimezone(d.timezone || 'America/New_York');
        setCountry(d.country || '');
        setCurrency(d.currency || 'USD');
        setCurrencySymbol(d.currencySymbol || '$');
        setDateFormat(d.dateFormat || 'MM/DD/YYYY');
        setEnforce2FA(!!d.enforce2FA);
        setRestrictDomain(!!d.restrictDomain);
        setAllowedDomain(d.allowedDomain || '');
      }
    } catch (err) {
      console.error('Failed to load organization settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await apiClient.get('/v1/clients');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setClients(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  useEffect(() => {
    fetchOrgData();
    fetchClients();
  }, []);

  const handleCountryChange = (selectedCountryName: string) => {
    setCountry(selectedCountryName);
    const resolved = getCurrencyForCountry(selectedCountryName);
    if (resolved) {
      setCurrency(resolved.code);
      setCurrencySymbol(resolved.symbol);
    }
  };

  const handleCurrencyChange = (selectedCode: string) => {
    setCurrency(selectedCode);
    const sym = (CURRENCY_SYMBOLS as any)[selectedCode] || '$';
    setCurrencySymbol(sym);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await apiClient.patch('/v1/organization', {
        name,
        timezone,
        country,
        currency,
        currencySymbol,
        dateFormat,
      });

      if (res.data?.success) {
        setSaveSuccess(true);
        setGlobalCurrency(currency);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update organization profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await apiClient.patch('/v1/organization', {
        enforce2FA,
        restrictDomain,
        allowedDomain,
      });

      if (res.data?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update security settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const portalUrl = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsClientSubmitting(true);
      const res = await apiClient.post('/v1/clients', {
        name: newClientName.trim(),
        company: newClientCompany.trim(),
        primaryEmail: newClientEmail.trim().toLowerCase(),
      });

      if (res.data?.success) {
        setIsCreateClientOpen(false);
        setNewClientName('');
        setNewClientCompany('');
        setNewClientEmail('');
        fetchClients();
      }
    } catch (err) {
      console.error('Failed to create client:', err);
    } finally {
      setIsClientSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Are you sure you want to deactivate and remove this client portal?')) return;
    try {
      await apiClient.delete(`/v1/clients/${clientId}`);
      setClients((prev) => prev.filter((c) => c.clientId !== clientId));
    } catch (err) {
      console.error('Failed to delete client:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-surface-dim rounded" />
        <div className="h-64 bg-surface-card rounded-xl border border-border" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-emerald" />
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Organization Settings
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure tenant branding, multi-currency localization, and access governance.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-brand-emerald bg-brand-emerald/10 px-3 py-1.5 rounded-lg border border-brand-emerald/20 font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Changes successfully saved</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-brand-emerald text-white shadow-2xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
          }`}
        >
          <Building2 className="w-4 h-4" />
          General Profile & Currency
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-brand-emerald text-white shadow-2xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Appearance & Theme
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'security'
              ? 'bg-brand-emerald text-white shadow-2xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security & Access Policy
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clients')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'clients'
              ? 'bg-brand-emerald text-white shadow-2xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
          }`}
        >
          <Users className="w-4 h-4" />
          Client Portals & CRM
        </button>
      </div>

      {/* Profile & Currency Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-6 max-w-3xl">
          <Card className="p-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-text-primary border-b border-border/80 pb-3">
              Workspace Identity
            </h3>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Organization Display Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="NovaTech Labs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Subdomain Slug
                </label>
                <div className="flex items-center gap-2">
                  <Input value={data?.slug || ''} disabled className="opacity-75 font-mono" />
                  <span className="text-xs font-mono text-text-muted shrink-0">.worksphere.app</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Tenant Partition ID
                </label>
                <Input value={data?.tenantId || ''} disabled className="opacity-75 font-mono" />
              </div>
            </div>
          </Card>

          <Card className="p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Localization & Multi-Currency System
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Select your primary operating country to auto-configure standard currency symbols.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
                <Sparkles className="w-3 h-3 text-brand-mint" />
                Live Sync Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Operating Country
                </label>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Base Currency & Symbol
                </label>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) &mdash; {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Workspace Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
                >
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Chicago">Central Time (US & Canada)</option>
                  <option value="America/Denver">Mountain Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="Europe/London">London (GMT / BST)</option>
                  <option value="Europe/Paris">Paris, Berlin, Amsterdam (CET)</option>
                  <option value="Asia/Tokyo">Tokyo, Osaka (JST)</option>
                  <option value="UTC">Universal Coordinated Time (UTC)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Date Format Display
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/24/2026)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 24/10/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isSaving}
              leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <form onSubmit={handleSaveSecurity} className="flex flex-col gap-6 max-w-3xl">
          <Card className="p-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-text-primary border-b border-border/80 pb-3">
              Authentication & Access Policies
            </h3>

            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-low border border-border/80">
              <div>
                <h4 className="text-xs font-bold text-text-primary">Enforce Two-Factor Authentication (2FA)</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Require all workspace users to register an authenticator app before accessing projects.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enforce2FA}
                onChange={(e) => setEnforce2FA(e.target.checked)}
                className="w-4 h-4 text-brand-emerald rounded border-border focus:ring-brand-emerald cursor-pointer"
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-low border border-border/80">
              <div className="flex-1">
                <h4 className="text-xs font-bold text-text-primary">Restrict Allowed Email Domains</h4>
                <p className="text-[11px] text-text-secondary mt-0.5 mb-2">
                  Only permit users with specific corporate email domains to accept workspace invitations.
                </p>
                {restrictDomain && (
                  <Input
                    value={allowedDomain}
                    onChange={(e) => setAllowedDomain(e.target.value)}
                    placeholder="e.g. novatech.io, novatech.com"
                    className="max-w-sm mt-2"
                  />
                )}
              </div>
              <input
                type="checkbox"
                checked={restrictDomain}
                onChange={(e) => setRestrictDomain(e.target.checked)}
                className="w-4 h-4 text-brand-emerald rounded border-border focus:ring-brand-emerald cursor-pointer"
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isSaving}
              leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              Update Security Policies
            </Button>
          </div>
        </form>
      )}

      {/* Appearance & Theme Tab */}
      {activeTab === 'appearance' && (
        <div className="flex flex-col gap-6 max-w-3xl">
          <Card className="p-6 flex flex-col gap-5">
            <div className="border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold text-text-primary">
                Workspace Accent & Visual Mood
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                The accent re-tints the whole workspace: navigation rails, active badges, primary buttons, and charts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEME_ACCENTS.map((t) => {
                const isSelected = accent === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAccent(t.id)}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-emerald bg-brand-emerald/5 ring-2 ring-brand-emerald/20 shadow-xs'
                        : 'border-border/80 bg-surface-card hover:bg-surface-low/50 hover:border-border'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white shadow-xs border border-white/20"
                      style={{ backgroundColor: t.color }}
                    >
                      {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">{t.label}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-brand-emerald text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                        {t.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 p-4 rounded-xl bg-surface-low border border-border/80 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-text-primary">Live Theme Preview</h4>
                <p className="text-[11px] text-text-secondary">Buttons, active pills, and focus borders re-tint instantly.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm">Primary Action</Button>
                <Badge variant="completed" size="sm" dot>Live Indicator</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Active Client Portals</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Share unauthenticated tokenized read-only links with external client stakeholders.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateClientOpen(true)}
            >
              Create Client Portal
            </Button>
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-low/50 text-[11px] font-mono uppercase text-text-muted">
                  <th className="py-3 px-4">Client Contact</th>
                  <th className="py-3 px-3">Company</th>
                  <th className="py-3 px-3">Portal Link</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-text-muted">
                      No client portals configured yet.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.clientId} className="hover:bg-surface-low/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-text-primary">
                        {client.name}
                        <div className="text-[11px] font-normal text-text-muted">
                          {client.primaryEmail || 'No email provided'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-text-secondary">
                        {client.company || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(client.portalToken)}
                          className="flex items-center gap-1.5 font-mono text-[11px] text-brand-emerald hover:underline cursor-pointer"
                        >
                          {copiedToken === client.portalToken ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-brand-emerald" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> /portal/{client.portalToken.slice(0, 10)}...
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={client.isPortalActive ? 'completed' : 'neutral'} size="sm" dot>
                          {client.isPortalActive ? 'Active Link' : 'Paused'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteClient(client.clientId)}
                          className="p-1 rounded text-text-muted hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete client portal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrganizationSettingsView;
