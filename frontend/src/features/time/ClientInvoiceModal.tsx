import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  Receipt,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useCurrency } from '../../store/CurrencyContext';
import apiClient from '../../api/client';

interface InvoiceEntry {
  taskId: string;
  taskTitle: string;
  projectName: string;
  duration: number; // in minutes
  isBillable: boolean;
  startTime: string;
}

interface ClientInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: InvoiceEntry[];
  tenantName?: string;
  weekRangeStr?: string;
}

export const ClientInvoiceModal: React.FC<ClientInvoiceModalProps> = ({
  isOpen,
  onClose,
  entries,
  tenantName = 'Workspace',
  weekRangeStr = 'Current Iteration',
}) => {
  const { currencySymbol } = useCurrency();
  const [clients, setClients] = useState<Array<{ clientId: string; name: string; company?: string; primaryEmail?: string }>>([]);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [hourlyRate, setHourlyRate] = useState(100);
  const [taxRatePct, setTaxRatePct] = useState(0);
  const [invoiceNumber] = useState(
    () => `WS-INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
  );

  useEffect(() => {
    if (!isOpen) return;
    apiClient
      .get('/v1/clients')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const clientList = res.data.data;
          setClients(clientList);
          const first = clientList[0];
          setClientName(first.company || first.name || '');
          setClientAddress(first.primaryEmail || '');
        }
      })
      .catch((err) => console.error('Failed to load clients for invoice:', err));
  }, [isOpen]);
  const [invoiceDate] = useState(() => new Date().toLocaleDateString());
  const [dueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString();
  });

  // Aggregate billable entries by task
  const aggregatedLineItems = useMemo(() => {
    const map = new Map<string, { title: string; project: string; minutes: number }>();

    entries.forEach((e) => {
      if (!e.isBillable) return;
      const key = `${e.projectName}::${e.taskTitle}`;
      const existing = map.get(key) || {
        title: e.taskTitle,
        project: e.projectName,
        minutes: 0,
      };
      existing.minutes += e.duration;
      map.set(key, existing);
    });

    return Array.from(map.values()).map((item) => {
      const hours = +(item.minutes / 60).toFixed(2);
      const amount = +(hours * hourlyRate).toFixed(2);
      return {
        ...item,
        hours,
        amount,
      };
    });
  }, [entries, hourlyRate]);

  // Financial totals
  const subtotal = useMemo(() => {
    return aggregatedLineItems.reduce((sum, item) => sum + item.amount, 0);
  }, [aggregatedLineItems]);

  const totalBillableHours = useMemo(() => {
    return +aggregatedLineItems.reduce((sum, item) => sum + item.hours, 0).toFixed(2);
  }, [aggregatedLineItems]);

  const taxAmount = +(subtotal * (taxRatePct / 100)).toFixed(2);
  const grandTotal = +(subtotal + taxAmount).toFixed(2);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-surface-card rounded-xl border border-border/80 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Bar (Hidden during Print) */}
        <div className="p-4 border-b border-border/80 bg-surface-low flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shadow-2xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-tight">
                Client Invoice Generator
              </h3>
              <p className="text-xs text-text-secondary">
                Auto-generated from approved billable timesheet records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print / Save PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-high transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Bar (Hidden during Print) */}
        <div className={`p-4 bg-surface-low/50 border-b border-border/80 grid grid-cols-1 ${clients.length > 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-3 text-xs print:hidden`}>
          {clients.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1">
                Saved Client
              </label>
              <select
                onChange={(e) => {
                  const selected = clients.find((c) => c.clientId === e.target.value);
                  if (selected) {
                    setClientName(selected.company || selected.name);
                    setClientAddress(selected.primaryEmail || '');
                  }
                }}
                className="w-full p-2 bg-surface-card border border-border rounded-md text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald text-xs truncate"
              >
                {clients.map((c) => (
                  <option key={c.clientId} value={c.clientId}>
                    {c.company || c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1">
              Client Name
            </label>
            <input
              type="text"
              placeholder="e.g. Client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full p-2 bg-surface-card border border-border rounded-md text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1">
              Client Address / Email
            </label>
            <input
              type="text"
              placeholder="e.g. billing@client.com"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              className="w-full p-2 bg-surface-card border border-border rounded-md text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1">
              Hourly Rate ({currencySymbol})
            </label>
            <input
              type="number"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full p-2 bg-surface-card border border-border rounded-md text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1">
              Tax Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={taxRatePct}
              onChange={(e) => setTaxRatePct(Number(e.target.value))}
              className="w-full p-2 bg-surface-card border border-border rounded-md text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald font-mono"
            />
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="p-8 md:p-12 overflow-y-auto print:p-0 print:overflow-visible flex flex-col gap-8 bg-surface-card text-text-primary">
          {/* Document Header */}
          <div className="flex items-start justify-between border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-emerald flex items-center justify-center text-white font-black text-sm">
                  WS
                </div>
                <span className="text-xl font-bold tracking-tight text-text-primary">
                  {tenantName}
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                Professional Engineering &amp; Management Services
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 mb-2">
                INVOICE
              </span>
              <p className="text-xs font-mono font-semibold text-text-primary">
                {invoiceNumber}
              </p>
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-surface-low border border-border/60 text-xs">
            <div>
              <span className="block text-[11px] text-text-muted font-medium mb-0.5">
                Billed To:
              </span>
              <p className="font-bold text-text-primary">{clientName}</p>
              <p className="text-text-secondary text-[11px] mt-0.5">{clientAddress}</p>
            </div>
            <div>
              <span className="block text-[11px] text-text-muted font-medium mb-0.5">
                Billing Cycle:
              </span>
              <p className="font-semibold text-text-primary">{weekRangeStr}</p>
            </div>
            <div>
              <span className="block text-[11px] text-text-muted font-medium mb-0.5">
                Invoice Date:
              </span>
              <p className="font-semibold text-text-primary">{invoiceDate}</p>
            </div>
            <div>
              <span className="block text-[11px] text-text-muted font-medium mb-0.5">
                Payment Due:
              </span>
              <p className="font-semibold text-brand-emerald">{dueDate}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-border/80 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-low border-b border-border/80 text-text-muted font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Task Deliverable</th>
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-4 text-right">Billable Hours</th>
                  <th className="py-2.5 px-4 text-right">Rate</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {aggregatedLineItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-low/40">
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {item.project}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {item.hours.toFixed(2)}h
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-text-muted">
                      {currencySymbol}{hourlyRate}/h
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-text-primary">
                      {currencySymbol}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {aggregatedLineItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted">
                      No billable time records found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-64 flex flex-col gap-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/60 text-text-secondary">
                <span>Subtotal ({totalBillableHours} hrs):</span>
                <span className="font-mono font-semibold text-text-primary">
                  {currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60 text-text-secondary">
                <span>Tax ({taxRatePct}%):</span>
                <span className="font-mono font-semibold text-text-primary">
                  {currencySymbol}{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold text-text-primary">
                <span>Total Due:</span>
                <span className="font-mono text-brand-emerald">
                  {currencySymbol}{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Terms & Instructions */}
          <div className="border-t border-border pt-6 text-[11px] text-text-muted leading-relaxed">
            <p className="font-semibold text-text-secondary mb-1">Payment Instructions:</p>
            <p>
              Please remit payment within 30 days of invoice date via ACH or wire transfer.
              For billing inquiries, contact accounting@{tenantName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientInvoiceModal;
