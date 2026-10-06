import React, { useState, useEffect } from 'react';
import { Layers, GitFork, Workflow, Sparkles, DollarSign, Calendar, Briefcase } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/ToastContext';
import { useCurrency } from '../../store/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';
import apiClient from '../../api/client';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { toast } = useToast();
  const { currency: defaultCurrency } = useCurrency();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientList, setClientList] = useState<Array<{ clientId: string; name: string; company?: string }>>([]);
  const [methodology, setMethodology] = useState<'Agile' | 'Waterfall' | 'Hybrid'>('Agile');
  const [budgetTotal, setBudgetTotal] = useState<number>(50000);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [colorLabel, setColorLabel] = useState('#1B4D3E');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCurrency(defaultCurrency);
      apiClient
        .get('/v1/clients')
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setClientList(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, defaultCurrency]);

  if (!isOpen) return null;

  const methodologyOptions = [
    {
      id: 'Agile',
      title: 'Agile / Scrum',
      desc: 'Sprints, product backlog, story points, and automated burn-down charts.',
      icon: Layers,
    },
    {
      id: 'Waterfall',
      title: 'Waterfall',
      desc: 'Sequential phases, milestone markers, and critical path Gantt timelines.',
      icon: GitFork,
    },
    {
      id: 'Hybrid',
      title: 'Hybrid Methodology',
      desc: 'Combines sprint-based iterations with phase-gated milestones.',
      icon: Workflow,
    },
  ];

  const colorOptions = ['#1B4D3E', '#006C4B', '#151C27', '#D97706', '#2563EB', '#7C3AED'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/v1/projects', {
        name,
        description,
        methodology,
        budgetTotal: Number(budgetTotal) || 0,
        currency,
        colorLabel,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        clientId: clientId || undefined,
      });

      if (!res.data?.success) {
        setError(res.data?.error?.message || 'Failed to create project');
        setIsLoading(false);
        return;
      }

      toast.success('Project created successfully', {
        message: `Project "${name}" is now active.`,
      });
      onProjectCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      description="Configure project settings and workflow"
      icon={<Sparkles className="w-4 h-4 text-brand-mint" />}
      maxWidth="xl"
    >
      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-50 text-status-error text-xs border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Project Name"
          placeholder="e.g. Phoenix Mobile Platform"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-onSurface tracking-wide">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="Outline project objectives and scope..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-lg bg-white border border-border/80 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15"
          />
        </div>

        {clientList.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-onSurface tracking-wide flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-text-muted" />
                Client Account (Optional)
              </span>
              <span className="text-[10px] text-text-muted font-normal">Grants portal access</span>
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-white border border-border/80 text-xs text-text-primary focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15"
            >
              <option value="">Internal Project (No Client Assigned)</option>
              {clientList.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-onSurface tracking-wide">
            Project Methodology
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {methodologyOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = methodology === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMethodology(opt.id as 'Agile' | 'Waterfall' | 'Hybrid')}
                  className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-brand-emerald bg-brand-emerald/5 shadow-2xs ring-1 ring-brand-emerald/20'
                      : 'border-border/80 bg-surface-low/50 hover:bg-surface-low'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mb-2 ${
                      isSelected ? 'text-brand-emerald' : 'text-text-secondary'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-text-primary tracking-tight">{opt.title}</div>
                    <div className="text-[10px] text-text-secondary mt-1 line-clamp-2">
                      {opt.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Total Budget"
            type="number"
            min="0"
            placeholder="50000"
            value={budgetTotal}
            onChange={(e) => setBudgetTotal(Number(e.target.value))}
            leftIcon={<DollarSign className="w-4 h-4" />}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-onSurface tracking-wide">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-white border border-border/80 text-xs font-mono text-text-primary focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
          <Input
            label="Target End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-text-onSurface">Accent Color:</span>
          <div className="flex items-center gap-2">
            {colorOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColorLabel(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                  colorLabel === c ? 'scale-125 ring-2 ring-offset-2 ring-brand-emerald' : 'opacity-80'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
