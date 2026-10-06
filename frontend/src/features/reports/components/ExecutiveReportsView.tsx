import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  CheckCircle2,
  DollarSign,
  Zap,
  Clock,
  AlertTriangle,
  FolderKanban,
  Download,
  Printer,
  ChevronDown,
  Layers,
  Users,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { MetricCard } from '../../../components/dashboard/MetricCard';
import { SprintProgressGauge } from '../../../components/dashboard/SprintProgressGauge';
import { ActivityHeatmap } from '../../../components/dashboard/ActivityHeatmap';
import { useCurrency } from '../../../store/CurrencyContext';
import apiClient from '../../../api/client';

// Custom Fernly styled tooltips
const FernlyChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-card border border-border/80 shadow-md rounded-xl p-2.5 text-xs font-mono">
        {label && <p className="font-semibold text-text-primary mb-1.5">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.payload?.fill }} />
              <span className="text-text-muted text-[11px]">{entry.name}:</span>
            </div>
            <span className="font-bold text-text-primary tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ExecutiveReportsView: React.FC = () => {
  const { currencySymbol, formatCurrency } = useCurrency();
  const [timeHorizon, setTimeHorizon] = useState<'sprint' | 'month' | 'quarter'>('month');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [projectsList, setProjectsList] = useState<Array<{ projectId: string; name: string }>>([]);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<'tasks' | 'time' | 'expenses' | 'summary'>('tasks');
  const [horizontalGraphView, setHorizontalGraphView] = useState<'workload' | 'budgets'>('workload');

  const exportLabels: Record<'tasks' | 'time' | 'expenses' | 'summary', string> = {
    tasks: 'Tasks & Deliverables',
    time: 'Timesheet Logs',
    expenses: 'Expense Ledger',
    summary: 'Portfolio Summary',
  };

  // Load project filters
  useEffect(() => {
    apiClient
      .get('/v1/projects')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setProjectsList(res.data.data.map((p: any) => ({ projectId: p.projectId, name: p.name })));
        }
      })
      .catch((err) => console.error('Failed to load projects list:', err));
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = { timeHorizon };
      if (selectedProjectId !== 'ALL') {
        params.projectId = selectedProjectId;
      }
      const res = await apiClient.get('/v1/reports/summary', { params });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reports data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [timeHorizon, selectedProjectId]);

  const handleExportCSV = async (type: 'tasks' | 'time' | 'expenses' | 'summary' = selectedExportType) => {
    try {
      setIsExporting(true);
      setIsExportMenuOpen(false);
      const res = await apiClient.get(`/v1/reports/export?type=${type}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `worksphere-${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Prepare Donut/Circle Graph Data
  const circleGraphData = useMemo(() => {
    if (!data?.kpis) return [];
    const { totalTasks = 0, completedTasks = 0, inProgressTasks = 0, overdueCount = 0 } = data.kpis;
    const todoTasks = Math.max(0, totalTasks - completedTasks - inProgressTasks - overdueCount);

    return [
      { name: 'Completed', value: completedTasks, color: '#1B4D3E' },
      { name: 'In Progress', value: inProgressTasks, color: '#34D399' },
      { name: 'Overdue', value: overdueCount, color: '#EF4444' },
      { name: 'To Do', value: todoTasks, color: '#94A3B8' },
    ].filter((item) => item.value > 0);
  }, [data?.kpis]);

  if (isLoading || !data) {
    return (
      <div className="p-16 max-w-7xl mx-auto flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-emerald border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-text-muted font-medium font-mono">Aggregating workspace analytics...</p>
      </div>
    );
  }

  const {
    kpis,
    velocityTrend = [],
    budgetVsActual = [],
    resourceUtilization = [],
    atRiskTasks = [],
  } = data;

  const latestSprint = velocityTrend[velocityTrend.length - 1];
  const sprintProgress =
    latestSprint && latestSprint.plannedPoints > 0
      ? Math.round((latestSprint.deliveredPoints / latestSprint.plannedPoints) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full print:p-0">
      {/* ==================================================================== */}
      {/* 1. HEADER (Matches wireframe top bar)                                */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/80 no-print">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-emerald" />
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Analytics
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Operational telemetry, resource capacity, and sprint delivery velocity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 bg-surface-low px-2.5 py-1 rounded-xl border border-border/80">
            <FolderKanban className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-text-primary focus:outline-none cursor-pointer pr-1"
              aria-label="Filter by Project"
            >
              <option value="ALL">All Projects</option>
              {projectsList.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Horizon Segmented Control */}
          <SegmentedControl
            options={[
              { id: 'sprint', label: 'Sprint' },
              { id: 'month', label: 'Month' },
              { id: 'quarter', label: 'Quarter' },
            ]}
            value={timeHorizon}
            onChange={(val) => setTimeHorizon(val as 'sprint' | 'month' | 'quarter')}
            size="sm"
          />

          {/* Export Menu */}
          <div className="relative">
            <div className="flex items-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExportCSV(selectedExportType)}
                disabled={isExporting}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="rounded-r-none border-r-0"
              >
                {isExporting ? 'Exporting...' : `Export ${exportLabels[selectedExportType]}`}
              </Button>
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                disabled={isExporting}
                className="h-8 px-2 rounded-r-lg border border-border bg-surface-card hover:bg-surface-low text-text-muted hover:text-text-primary transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                title="Select Export Format"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-surface-card border border-border/80 shadow-lg py-1.5 z-50">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold">
                  Choose Dataset
                </div>
                {(['tasks', 'time', 'expenses', 'summary'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedExportType(type);
                      handleExportCSV(type);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-surface-low transition-colors cursor-pointer ${
                      selectedExportType === type ? 'text-brand-emerald font-semibold' : 'text-text-primary'
                    }`}
                  >
                    <span>{exportLabels[type]}</span>
                    {selectedExportType === type && <CheckCircle2 className="w-3 h-3 text-brand-emerald" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print
          </Button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. MAIN CONTENT (Structured exactly per user diagram)                */}
      {/* ==================================================================== */}
      <div className="flex flex-col gap-6">
        {/* ------------------------------------------------------------------ */}
        {/* 2.1 KPI CARDS (Horizontal row spanning full width)                 */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="ON-TIME DELIVERY"
            value={`${kpis?.onTimeDeliveryRate ?? 0}%`}
            trend={`${kpis?.completedTasks ?? 0} Completed Tasks`}
            isPositiveTrend={(kpis?.onTimeDeliveryRate ?? 0) >= 80}
            icon={<CheckCircle2 className="w-4 h-4 text-brand-emerald" />}
          />
          <MetricCard
            label="BUDGET UTILIZATION"
            value={`${kpis?.budgetVariance ?? 0}%`}
            trend={`Total: ${formatCurrency(kpis?.totalBudget ?? 0)}`}
            isPositiveTrend={(kpis?.budgetVariance ?? 0) <= 95}
            icon={<DollarSign className="w-4 h-4 text-blue-500" />}
          />
          <MetricCard
            label="AVERAGE VELOCITY"
            value={`${kpis?.averageVelocity ?? 0} pts`}
            trend={`${kpis?.activeProjects ?? 0} Active Projects`}
            variant="primary"
            icon={<Zap className="w-4 h-4 text-brand-mint" />}
          />
          <MetricCard
            label="BILLABLE EFFICIENCY"
            value={`${kpis?.billableRatio ?? 0}%`}
            trend={`${kpis?.totalHoursLogged ?? 0}h Logged`}
            isPositiveTrend={(kpis?.billableRatio ?? 0) >= 75}
            icon={<Clock className="w-4 h-4 text-purple-500" />}
          />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2.2 ROW 1: Horizontal Graphs (Wide) | Semi-circle Graphs (Narrow)  */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Horizontal Graphs (Left - 8 Cols) */}
          <div className="lg:col-span-8 flex flex-col">
            <Card className="p-5 flex flex-col justify-between h-full card-lift">
              <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-emerald" />
                  <h3 className="text-sm font-bold text-text-primary">Horizontal Graphs</h3>
                  <span className="text-xs text-text-muted font-normal">
                    ({horizontalGraphView === 'workload' ? 'Team Workload & Capacity' : 'Project Budget Allocations'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <SegmentedControl
                    options={[
                      { id: 'workload', label: 'Workload' },
                      { id: 'budgets', label: 'Budgets' },
                    ]}
                    value={horizontalGraphView}
                    onChange={(val) => setHorizontalGraphView(val as any)}
                    size="sm"
                  />
                </div>
              </div>

              {/* Horizontal Bar Visualizations */}
              <div className="h-[260px] w-full">
                {horizontalGraphView === 'workload' ? (
                  resourceUtilization.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={resourceUtilization}
                        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                        <XAxis type="number" domain={[0, 120]} unit="%" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="memberName" tick={{ fontSize: 11 }} width={90} />
                        <Tooltip content={<FernlyChartTooltip />} />
                        <Bar
                          dataKey="utilizationPct"
                          name="Utilization"
                          radius={[0, 4, 4, 0]}
                        >
                          {resourceUtilization.map((entry: any, index: number) => {
                            const fill =
                              entry.status === 'overloaded'
                                ? '#EF4444'
                                : entry.status === 'heavy'
                                ? '#F59E0B'
                                : 'var(--brand-emerald, #1B4D3E)';
                            return <Cell key={`cell-${index}`} fill={fill} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-text-muted gap-1">
                      <Users className="w-6 h-6 text-text-muted/40" />
                      <span>No member workload recorded for this horizon.</span>
                    </div>
                  )
                ) : (
                  budgetVsActual.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={budgetVsActual}
                        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="projectName" tick={{ fontSize: 11 }} width={90} />
                        <Tooltip content={<FernlyChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="budget" name="Budget" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="actual" name="Spend" fill="var(--brand-emerald, #1B4D3E)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-text-muted gap-1">
                      <DollarSign className="w-6 h-6 text-text-muted/40" />
                      <span>No project budget data configured.</span>
                    </div>
                  )
                )}
              </div>
            </Card>
          </div>

          {/* Semi-circle Graphs (Right - 4 Cols) */}
          <div className="lg:col-span-4 flex flex-col">
            <Card className="p-5 flex flex-col items-center justify-between h-full card-lift text-center">
              <div className="w-full flex items-center justify-between pb-3 border-b border-border/80 mb-2 text-left">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-emerald" />
                  <h3 className="text-sm font-bold text-text-primary">Semi-circle Graphs</h3>
                </div>
                <span className="text-[11px] font-mono font-semibold text-brand-emerald">
                  {latestSprint?.sprintName || 'Sprint Cycle'}
                </span>
              </div>

              {/* Semi-circle Arc Gauge */}
              <div className="py-2 w-full flex justify-center">
                <SprintProgressGauge
                  progressPct={sprintProgress}
                  donePoints={latestSprint?.deliveredPoints ?? 0}
                  totalPoints={latestSprint?.plannedPoints ?? 0}
                  statusLabel="Sprint Velocity"
                />
              </div>

              <div className="w-full pt-2 border-t border-border/60 text-xs text-text-secondary">
                Delivered <strong className="text-text-primary font-mono">{latestSprint?.deliveredPoints ?? 0}</strong> of{' '}
                <strong className="text-text-primary font-mono">{latestSprint?.plannedPoints ?? 0}</strong> committed story points.
              </div>
            </Card>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2.3 ROW 2: Circle Graphs (Narrow) | Section (Wide)                 */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Circle Graphs (Left - 4 Cols) */}
          <div className="lg:col-span-4 flex flex-col">
            <Card className="p-5 flex flex-col items-center justify-between h-full card-lift">
              <div className="w-full flex items-center justify-between pb-3 border-b border-border/80 mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-emerald" />
                  <h3 className="text-sm font-bold text-text-primary">Circle Graphs</h3>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  {kpis?.totalTasks ?? 0} Total
                </span>
              </div>

              {/* Donut / Circular Visualization with Centered Count */}
              <div className="relative w-full h-[180px] flex items-center justify-center">
                {circleGraphData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={circleGraphData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {circleGraphData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<FernlyChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                      <span className="text-2xl font-bold font-mono text-text-primary tabular-nums">
                        {kpis?.totalTasks ?? 0}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                        Tasks
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-text-muted">No task status data</div>
                )}
              </div>

              {/* Legend Grid Below Circle Graph */}
              <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs font-mono">
                {circleGraphData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-text-muted text-[11px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-text-primary tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Section: Cadence & Activity Distribution (Right - 8 Cols) */}
          <div className="lg:col-span-8 flex flex-col">
            <ActivityHeatmap
              data={data?.activityHeatmap || []}
              weeks={24}
              sectionLabel="Section"
              title="Cadence & Activity Distribution"
              icon={<Calendar className="w-4 h-4 text-brand-emerald shrink-0" />}
              className="h-full flex flex-col justify-between p-5"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2.4 ROW 3: Other Sections (Full width bottom container)            */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col gap-5">
          <Card className="p-5 flex flex-col card-lift">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-text-primary">Other Sections</h3>
                <span className="text-xs text-text-muted font-normal">
                  (At-Risk Deliverables Watchlist)
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-rose-500">
                {atRiskTasks.length} Critical / Overdue Items
              </span>
            </div>

            {/* At-Risk Deliverables Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
                  At-Risk Deliverables Watchlist
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 bg-surface-low/50 text-[11px] font-mono uppercase tracking-wider text-text-muted">
                      <th className="py-2.5 px-3">Deliverable</th>
                      <th className="py-2.5 px-3">Project</th>
                      <th className="py-2.5 px-3">Status / Reason</th>
                      <th className="py-2.5 px-3">Assignee</th>
                      <th className="py-2.5 px-3 text-right">Target Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {atRiskTasks.length > 0 ? (
                      atRiskTasks.map((task: any) => (
                        <tr key={task.taskId} className="hover:bg-surface-low/50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-text-primary">{task.title}</td>
                          <td className="py-2.5 px-3 text-text-secondary">{task.projectName || task.projectId}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/40 font-mono">
                              {task.riskReason || (task.daysOverdue ? `${task.daysOverdue}d Overdue` : 'Overdue')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-text-secondary">{task.assigneeName || 'Unassigned'}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-text-muted">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-xs text-text-muted">
                          All portfolio deliverables are currently on schedule.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveReportsView;
