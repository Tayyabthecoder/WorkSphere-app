import React, { useState, useEffect } from 'react';
import { X, Receipt, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CURRENCY_SYMBOLS, SUPPORTED_CURRENCIES } from '../../utils/currency';
import { useCurrency } from '../../store/CurrencyContext';
import apiClient from '../../api/client';

interface LogExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseLogged: () => void;
  initialProjectId?: string;
}

interface ProjectOption {
  projectId: string;
  name: string;
}

export const LogExpenseModal: React.FC<LogExpenseModalProps> = ({
  isOpen,
  onClose,
  onExpenseLogged,
  initialProjectId,
}) => {
  const { currency: defaultCurrency } = useCurrency();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState<'Labor' | 'Tools' | 'Travel' | 'Other'>('Tools');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    apiClient
      .get('/v1/projects')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setProjects(res.data.data);
          if (!selectedProjectId && res.data.data.length > 0) {
            setSelectedProjectId(res.data.data[0].projectId);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount');
      return;
    }

    if (!selectedProjectId) {
      setError('Please select a project');
      return;
    }

    if (!vendor.trim()) {
      setError('Vendor name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post('/v1/expenses', {
        projectId: selectedProjectId,
        amount: numAmount,
        currency,
        vendor: vendor.trim(),
        category,
        date,
        description: description.trim(),
      });

      onExpenseLogged();
      onClose();
      setAmount('');
      setVendor('');
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to log expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-card border border-border/80 rounded-xl p-6 shadow-2xl w-full max-w-md flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shadow-2xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary tracking-tight">
                Log New Expense
              </h3>
              <p className="text-xs text-text-secondary">
                Record expenditure against project budget
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Project */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-surface-low border border-border/80 text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald"
              required
            >
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted font-mono">
                  {(CURRENCY_SYMBOLS as any)[currency] || '$'}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7 text-xs font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg bg-surface-low border border-border/80 text-text-primary font-mono font-semibold outline-none focus:ring-1 focus:ring-brand-emerald"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as 'Labor' | 'Tools' | 'Travel' | 'Other')
                }
                className="w-full text-xs p-2.5 rounded-lg bg-surface-low border border-border/80 text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald"
              >
                <option value="Labor">Labor</option>
                <option value="Tools">Tools &amp; Software</option>
                <option value="Travel">Travel &amp; Lodging</option>
                <option value="Other">Other Expenses</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Date *
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Vendor / Merchant *
            </label>
            <Input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g., GitHub Enterprise, Amazon Web Services"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Notes / Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or receipt invoice ID..."
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg bg-surface-low border border-border/80 text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-brand-emerald resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg text-xs gap-1.5 shadow-2xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Receipt className="w-3.5 h-3.5" />
              )}
              <span>Record Expense</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogExpenseModal;
