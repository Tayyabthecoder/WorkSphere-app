import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  AlertTriangle,
  Receipt,
  TrendingUp,
  CreditCard,
  PieChart,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { LogExpenseModal } from '../LogExpenseModal';
import { CURRENCY_SYMBOLS, formatCurrency, convertCurrency } from '../../../utils/currency';
import { useCurrency } from '../../../store/CurrencyContext';
import apiClient from '../../../api/client';

type ExpenseCategory = 'Labor' | 'Tools' | 'Travel' | 'Other';

interface ProjectBudgetBreakdown {
  projectId: string;
  name: string;
  colorLabel: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentUtilized: number;
  thresholdStatus: 'normal' | 'warning' | 'critical';
  currency: string;
}

interface BudgetSummaryData {
  allocatedBudget: number;
  actualSpend: number;
  remainingBudget: number;
  percentUtilized: number;
  thresholdStatus: 'normal' | 'warning' | 'critical';
  categoryBreakdown: Record<ExpenseCategory, number>;
  projectBreakdowns: ProjectBudgetBreakdown[];
}

interface ExpenseItem {
  expenseId: string;
  projectId: string;
  projectName: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  date: string;
  vendor: string;
  category: ExpenseCategory;
  description?: string;
}

export const BudgetTrackerView: React.FC = () => {
  const { currency: globalCurrency } = useCurrency();
  const [summary, setSummary] = useState<BudgetSummaryData | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState(globalCurrency);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setSelectedCurrency(globalCurrency);
  }, [globalCurrency]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [summaryRes, expensesRes] = await Promise.all([
        apiClient.get('/v1/budget/summary'),
        apiClient.get('/v1/expenses'),
      ]);

      if (summaryRes.data?.success) setSummary(summaryRes.data.data);
      if (expensesRes.data?.success) setExpenses(expensesRes.data.data.expenses || []);
    } catch (err) {
      console.error('Failed to load financial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await apiClient.delete(`/v1/expenses/${expenseId}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === 'ALL') return expenses;
    return expenses.filter((e) => e.category === categoryFilter);
  }, [expenses, categoryFilter]);

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-surface-dim rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface-card rounded-xl border border-border" />
          ))}
        </div>
      </div>
    );
  }

  const convertedAllocated = convertCurrency(summary.allocatedBudget, 'USD', selectedCurrency);
  const convertedSpend = convertCurrency(summary.actualSpend, 'USD', selectedCurrency);
  const convertedRemaining = convertCurrency(summary.remainingBudget, 'USD', selectedCurrency);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-emerald" />
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Budget, Cost & Expenses
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Monitor portfolio allocations, actual expenditure burn-down, and log receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsModalOpen(true)}
          >
            Log Project Expense
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-text-muted font-mono uppercase">
            Total Allocated Budget
          </span>
          <div className="text-2xl font-bold font-mono tracking-tight text-text-primary mt-2">
            {formatCurrency(convertedAllocated, selectedCurrency)}
          </div>
          <span className="text-[11px] text-text-muted mt-1 font-mono">
            Fixed scope baseline
          </span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-text-muted font-mono uppercase">
            Actual Expenditures
          </span>
          <div className="text-2xl font-bold font-mono tracking-tight text-text-primary mt-2">
            {formatCurrency(convertedSpend, selectedCurrency)}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] font-mono text-brand-emerald font-semibold">
              {summary.percentUtilized}% utilized
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-text-muted font-mono uppercase">
            Remaining Runway
          </span>
          <div className="text-2xl font-bold font-mono tracking-tight text-text-primary mt-2">
            {formatCurrency(convertedRemaining, selectedCurrency)}
          </div>
          <span className="text-[11px] text-emerald-600 font-mono mt-1 font-semibold">
            {100 - summary.percentUtilized}% reserve remaining
          </span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-text-muted font-mono uppercase">
            Threshold Alert
          </span>
          <div className="mt-2">
            <Badge
              variant={
                summary.thresholdStatus === 'critical'
                  ? 'critical'
                  : summary.thresholdStatus === 'warning'
                  ? 'warning'
                  : 'completed'
              }
              size="md"
              dot
            >
              {summary.thresholdStatus === 'critical'
                ? 'Budget Deficit Alert'
                : summary.thresholdStatus === 'warning'
                ? 'Approaching Limit (>80%)'
                : 'Optimal Allocation'}
            </Badge>
          </div>
          <span className="text-[11px] text-text-muted font-mono mt-2">
            Variance monitored
          </span>
        </Card>
      </div>

      {/* Project Breakdown Cards & Category Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-4">
              <h3 className="text-sm font-bold text-text-primary">
                Active Projects Budget Burn-Down
              </h3>
              <span className="text-xs font-mono text-text-muted">
                {summary.projectBreakdowns.length} Projects
              </span>
            </div>

            <div className="flex flex-col divide-y divide-border/60">
              {summary.projectBreakdowns.map((proj) => (
                <div key={proj.projectId} className="py-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">{proj.name}</span>
                    <span className="font-mono text-text-secondary">
                      {formatCurrency(convertCurrency(proj.spent, 'USD', selectedCurrency), selectedCurrency)} /{' '}
                      {formatCurrency(convertCurrency(proj.allocated, 'USD', selectedCurrency), selectedCurrency)}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-surface-low rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        proj.percentUtilized > 90
                          ? 'bg-rose-500'
                          : proj.percentUtilized > 75
                          ? 'bg-amber-500'
                          : 'bg-brand-emerald'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, proj.percentUtilized))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Category Breakdown */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-4">
              <h3 className="text-sm font-bold text-text-primary">Category Allocation</h3>
              <PieChart className="w-4 h-4 text-brand-emerald" />
            </div>

            <div className="flex flex-col gap-3">
              {(Object.keys(summary.categoryBreakdown) as ExpenseCategory[]).map((cat) => {
                const amt = summary.categoryBreakdown[cat] || 0;
                const converted = convertCurrency(amt, 'USD', selectedCurrency);
                const pct = summary.actualSpend > 0 ? Math.round((amt / summary.actualSpend) * 100) : 0;

                return (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary font-medium">{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-text-primary">
                        {formatCurrency(converted, selectedCurrency)}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Expense Log Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-emerald" />
            <h3 className="text-sm font-bold text-text-primary">Expense Audit Registry</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
            >
              <option value="ALL">All Categories</option>
              <option value="Labor">Labor</option>
              <option value="Tools">Tools</option>
              <option value="Travel">Travel</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-low/50 text-[11px] font-mono uppercase text-text-muted">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Project</th>
                <th className="py-3 px-3">Vendor / Recipient</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    No expense records matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.expenseId} className="hover:bg-surface-low/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-text-muted">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-medium text-text-primary">
                      {exp.projectName || exp.projectId}
                    </td>
                    <td className="py-3 px-3 text-text-secondary">
                      {exp.vendor || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-low text-text-secondary border border-border/80">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-text-primary">
                      {formatCurrency(
                        convertCurrency(exp.amount, exp.currency, selectedCurrency),
                        selectedCurrency
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.expenseId)}
                        className="p-1 rounded text-text-muted hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Log Expense Modal */}
      <LogExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExpenseLogged={fetchData}
      />
    </div>
  );
};

export default BudgetTrackerView;
