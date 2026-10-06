import React, { useState, useMemo } from 'react';
import {
  Plus,
  Zap,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Play,
  Check,
  LayoutList,
  LayoutGrid,
  Loader2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { TaskDetailDrawer } from '../../tasks/TaskDetailDrawer';
import { CreateSprintModal } from './CreateSprintModal';
import { SprintBurndownChart } from './SprintBurndownChart';
import { VelocityChart, SprintVelocityData } from './VelocityChart';
import { useSprints, useUpdateSprint } from '../../../hooks/useSprints';
import { useTasks, useUpdateTask, useCreateTask } from '../../../hooks/useTasks';
import { Task, Sprint } from '../../../types';

interface BacklogViewProps {
  projectId: string;
  projectName?: string;
}

export const BacklogView: React.FC<BacklogViewProps> = ({ projectId, projectName }) => {
  const { data: sprints = [], isLoading: isLoadingSprints, refetch: refetchSprints } = useSprints(projectId);
  const { data: tasks = [], isLoading: isLoadingTasks, refetch: refetchTasks } = useTasks({ projectId });

  const updateTask = useUpdateTask();
  const updateSprint = useUpdateSprint();
  const createTask = useCreateTask();

  // UI State
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});

  // Quick Add Backlog Task
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPoints, setQuickPoints] = useState(3);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // AI Copilot state
  const [showAiCopilot, setShowAiCopilot] = useState(true);
  const [isBalancingScope, setIsBalancingScope] = useState(false);

  // Density control state
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Sprints partitioned
  const activeSprint = useMemo(() => {
    return sprints.find((s) => s.status === 'active');
  }, [sprints]);

  const planningSprints = useMemo(() => {
    return sprints.filter((s) => s.status === 'planning');
  }, [sprints]);

  const completedSprints = useMemo(() => {
    return sprints.filter((s) => s.status === 'completed');
  }, [sprints]);

  // Backlog tasks (no sprint assigned)
  const backlogTasks = useMemo(() => {
    return tasks.filter((t) => !t.sprintId);
  }, [tasks]);

  const totalBacklogPoints = useMemo(() => {
    return backlogTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  }, [backlogTasks]);

  // Historical velocity data for chart
  const velocityData: SprintVelocityData[] = useMemo(() => {
    return sprints.map((s) => {
      const sTasks = tasks.filter((t) => t.sprintId === s.sprintId);
      const completedPts = sTasks
        .filter((t) => t.status === 'Done')
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const totalPts = sTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      return {
        sprintId: s.sprintId,
        name: s.name,
        committedPoints: s.capacityPoints || totalPts || 20,
        completedPoints: completedPts,
      };
    });
  }, [sprints, tasks]);

  // AI Capacity & Scope Prediction
  const aiScopeAnalysis = useMemo(() => {
    const completed = sprints.filter((s) => s.status === 'completed');
    const rollingAvgVelocity =
      completed.length > 0
        ? Math.round(
            completed.slice(-3).reduce((acc, s) => {
              const pts = tasks
                .filter((t) => t.sprintId === s.sprintId && t.status === 'Done')
                .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
              return acc + pts;
            }, 0) / Math.min(3, completed.length)
          )
        : 24;

    const targetSprint = activeSprint || planningSprints[0] || null;
    if (!targetSprint) {
      return {
        hasTarget: false,
        rollingAvgVelocity,
        targetSprintName: '',
        committedPoints: 0,
        capacityPoints: rollingAvgVelocity,
        loadPct: 0,
        status: 'optimal' as const,
        recommendation: 'Plan a sprint to activate AI capacity forecasting.',
        deferralCandidates: [] as Task[],
      };
    }

    const sprintTasks = tasks.filter((t) => t.sprintId === targetSprint.sprintId);
    const committedPoints = sprintTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
    const capacityPoints = targetSprint.capacityPoints || rollingAvgVelocity;
    const loadPct = Math.round((committedPoints / Math.max(1, capacityPoints)) * 100);

    const deferralCandidates = sprintTasks
      .filter((t) => t.status === 'To Do' || t.status === 'Backlog')
      .sort((a, b) => {
        const priorityScore: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        return (priorityScore[a.priority] || 2) - (priorityScore[b.priority] || 2);
      });

    let status: 'optimal' | 'warning' | 'critical' = 'optimal';
    let recommendation = '';

    if (loadPct > 120) {
      status = 'critical';
      recommendation = `Sprint is overloaded at ${loadPct}% capacity (${committedPoints}/${capacityPoints} pts). Team rolling velocity is ${rollingAvgVelocity} pts. We recommend deferring ${
        deferralCandidates.length > 0 ? `"${deferralCandidates[0].title}"` : 'low-priority items'
      } to avoid sprint spillover.`;
    } else if (loadPct > 105) {
      status = 'warning';
      recommendation = `Sprint commitment is slightly high at ${loadPct}% capacity (${committedPoints}/${capacityPoints} pts). Velocity risk is moderate.`;
    } else if (loadPct < 75 && committedPoints > 0) {
      status = 'optimal';
      recommendation = `Team is currently at ${loadPct}% utilization (${committedPoints}/${capacityPoints} pts). You have capacity to pull in ~${
        capacityPoints - committedPoints
      } story points from the backlog.`;
    } else {
      status = 'optimal';
      recommendation = `Commitment is well balanced at ${loadPct}% (${committedPoints}/${capacityPoints} pts) against team velocity (${rollingAvgVelocity} pts). Sprint trajectory is healthy.`;
    }

    return {
      hasTarget: true,
      targetSprint,
      targetSprintName: targetSprint.name,
      rollingAvgVelocity,
      committedPoints,
      capacityPoints,
      loadPct,
      status,
      recommendation,
      deferralCandidates,
    };
  }, [sprints, activeSprint, planningSprints, tasks]);

  // Move task between sprint and backlog
  const handleMoveTask = async (taskId: string, targetSprintId: string | null) => {
    await updateTask.mutateAsync({ taskId, sprintId: targetSprintId });
  };

  // Start or Complete Sprint
  const handleSprintStatusChange = async (
    sprintId: string,
    newStatus: 'active' | 'completed' | 'planning'
  ) => {
    await updateSprint.mutateAsync({ sprintId, status: newStatus });
    refetchSprints();
  };

  // Quick Add Task into Backlog
  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setIsAddingTask(true);
    try {
      await createTask.mutateAsync({
        projectId,
        title: quickTitle.trim(),
        status: 'Backlog',
        priority: 'medium',
        storyPoints: Number(quickPoints) || 0,
        sprintId: null,
      });
      setQuickTitle('');
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleAutoBalanceScope = async () => {
    if (!aiScopeAnalysis.deferralCandidates.length) return;
    setIsBalancingScope(true);
    try {
      const candidate = aiScopeAnalysis.deferralCandidates[0];
      await handleMoveTask(candidate.taskId, null);
    } finally {
      setIsBalancingScope(false);
    }
  };

  const toggleCollapse = (sprintId: string) => {
    setCollapsedSprints((prev) => ({ ...prev, [sprintId]: !prev[sprintId] }));
  };

  if (isLoadingSprints || isLoadingTasks) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-text-muted gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
        <span className="text-xs">Loading agile sprint workspace...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 w-full">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Sprint Planning & Backlog
            </h2>
            {projectName && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-emerald/10 text-brand-emerald">
                {projectName}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage agile iterations, burn-down trajectories, and user stories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Density Switcher */}
          <button
            type="button"
            onClick={() => setDensity((d) => (d === 'comfortable' ? 'compact' : 'comfortable'))}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-border bg-surface-card hover:bg-surface-low text-text-secondary text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
            title={density === 'comfortable' ? 'Switch to Compact view' : 'Switch to Comfortable view'}
          >
            {density === 'comfortable' ? (
              <LayoutList className="w-3.5 h-3.5 text-text-muted" />
            ) : (
              <LayoutGrid className="w-3.5 h-3.5 text-text-muted" />
            )}
            <span className="hidden sm:inline capitalize font-medium">{density}</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAiCopilot((prev) => !prev)}
            className={`text-xs gap-1.5 transition-all ${
              showAiCopilot
                ? 'bg-brand-emerald text-white border-brand-emerald shadow-2xs'
                : 'text-brand-emerald border-brand-emerald/30 hover:bg-brand-emerald/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </Button>

          <Button
            onClick={() => setIsCreateSprintOpen(true)}
            size="sm"
            className="text-xs gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Plan Sprint</span>
          </Button>
        </div>
      </div>

      {/* AI Sprint Scope & Capacity Copilot Card */}
      {showAiCopilot && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white border border-emerald-900/60 shadow-lg flex flex-col gap-4 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">AI Sprint Scope & Capacity Copilot</h3>
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                    Predictive Engine
                  </span>
                </div>
                <p className="text-xs text-white/70 mt-0.5">
                  Analyzing capacity against rolling velocity benchmark (
                  <span className="font-mono tabular-nums">{aiScopeAnalysis.rollingAvgVelocity}</span> pts/sprint)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 border border-white/10 text-xs">
                <span className="text-white/70">Target:</span>
                <span className="font-bold text-white">{aiScopeAnalysis.targetSprintName || 'Portfolio'}</span>
              </div>
              {aiScopeAnalysis.status === 'critical' && aiScopeAnalysis.deferralCandidates.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAutoBalanceScope}
                  disabled={isBalancingScope}
                  className="bg-amber-500 hover:bg-amber-600 text-white border-amber-400 text-xs gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isBalancingScope ? 'Balancing...' : 'Auto-Balance Scope'}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Metrics & Capacity Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-white/10 z-10">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Committed Scope</span>
              <span className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                {aiScopeAnalysis.committedPoints} pts
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Team Capacity</span>
              <span className="text-lg font-bold font-mono tabular-nums text-emerald-300 mt-0.5">
                {aiScopeAnalysis.capacityPoints} pts
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Rolling Velocity</span>
              <span className="text-lg font-bold font-mono tabular-nums text-amber-300 mt-0.5">
                {aiScopeAnalysis.rollingAvgVelocity} pts
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Capacity Load</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      aiScopeAnalysis.loadPct > 115
                        ? 'bg-rose-500'
                        : aiScopeAnalysis.loadPct > 100
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, aiScopeAnalysis.loadPct)}%` }}
                  />
                </div>
                <span className="text-xs font-mono tabular-nums font-bold">{aiScopeAnalysis.loadPct}%</span>
              </div>
            </div>
          </div>

          {/* AI Recommendation Message */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 flex items-start gap-2.5 z-10">
            <AlertCircle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                aiScopeAnalysis.status === 'critical' ? 'text-rose-400' : 'text-emerald-300'
              }`}
            />
            <span>{aiScopeAnalysis.recommendation}</span>
          </div>
        </div>
      )}

      {/* Analytics Charts Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeSprint ? (
          <SprintBurndownChart sprint={activeSprint} tasks={tasks} />
        ) : (
          <div className="bg-surface-card rounded-xl p-6 border border-border shadow-2xs flex flex-col items-center justify-center text-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-low text-text-muted flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-text-primary">No Active Sprint</h4>
            <p className="text-xs text-text-secondary max-w-sm">
              Start an upcoming sprint or plan a new iteration to activate the live burn-down chart.
            </p>
          </div>
        )}

        <VelocityChart sprints={velocityData} />
      </div>

      {/* SPRINT LIST & BACKLOG CONTAINERS */}
      <div className="flex flex-col gap-6">
        {/* ACTIVE SPRINT CONTAINER */}
        {activeSprint && (
          <div className="bg-surface-card rounded-xl border border-brand-emerald/40 shadow-card overflow-hidden">
            {/* Active Sprint Header Bar */}
            <div className="p-4 bg-brand-emerald text-white flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-tight">{activeSprint.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-950 font-mono text-[10px] font-bold uppercase tracking-wider">
                      Active Sprint
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-0.5 font-mono">
                    <span className="tabular-nums">{new Date(activeSprint.startDate).toLocaleDateString()}</span> –{' '}
                    <span className="tabular-nums">{new Date(activeSprint.endDate).toLocaleDateString()}</span> •{' '}
                    <span className="font-sans">{activeSprint.goal || 'No goal set'}</span>
                  </p>
                </div>
              </div>

              {/* Progress & Complete Controls */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold font-mono tabular-nums text-emerald-200">
                    {tasks
                      .filter((t) => t.sprintId === activeSprint.sprintId && t.status === 'Done')
                      .reduce((sum, t) => sum + (t.storyPoints || 0), 0)}{' '}
                    / {activeSprint.capacityPoints || 0} pts
                  </span>
                  <div className="w-28 h-1.5 rounded-full bg-black/30 overflow-hidden mt-1">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          ((tasks
                            .filter((t) => t.sprintId === activeSprint.sprintId && t.status === 'Done')
                            .reduce((sum, t) => sum + (t.storyPoints || 0), 0) /
                            Math.max(1, activeSprint.capacityPoints || 1)) *
                            100)
                        )}%`,
                      }}
                      className="h-full bg-emerald-300 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSprintStatusChange(activeSprint.sprintId, 'completed')}
                  className="text-xs bg-white text-brand-emerald hover:bg-white/90 border-0 shadow-2xs font-semibold"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>Complete Sprint</span>
                </Button>
              </div>
            </div>

            {/* Active Sprint Tasks */}
            <div className="p-3.5 flex flex-col gap-2 bg-surface-card">
              {tasks
                .filter((t) => t.sprintId === activeSprint.sprintId)
                .map((task) => (
                  <div
                    key={task.taskId}
                    onClick={() => {
                      setSelectedTaskId(task.taskId);
                      setIsDrawerOpen(true);
                    }}
                    className={`flex items-center justify-between ${
                      density === 'compact' ? 'py-1.5 px-3' : 'p-3'
                    } rounded-lg bg-surface-low hover:bg-surface-card border border-border hover:border-brand-emerald/40 cursor-pointer transition-all shadow-2xs group`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden pr-3">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          task.priority === 'critical'
                            ? 'bg-status-error'
                            : task.priority === 'high'
                            ? 'bg-amber-500'
                            : 'bg-brand-emerald'
                        }`}
                      />
                      <span className="text-xs font-semibold text-text-primary truncate">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Badge
                        variant={task.status === 'Done' ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {task.status}
                      </Badge>

                      {task.storyPoints ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-brand-emerald/10 text-brand-emerald font-mono tabular-nums text-xs font-bold border border-brand-emerald/20">
                          {task.storyPoints} pt
                        </span>
                      ) : null}

                      {/* Move to Backlog action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveTask(task.taskId, null);
                        }}
                        className="text-[11px] font-medium text-text-muted hover:text-text-primary px-2 py-1 rounded-md bg-surface-card border border-border shadow-2xs"
                        title="Move to Product Backlog"
                      >
                        To Backlog
                      </button>
                    </div>
                  </div>
                ))}

              {tasks.filter((t) => t.sprintId === activeSprint.sprintId).length === 0 && (
                <div className="py-6 text-center text-xs text-text-muted">
                  No tasks assigned to this sprint yet. Use the dropdown in the backlog below to allocate tasks.
                </div>
              )}
            </div>
          </div>
        )}

        {/* PLANNING SPRINTS CONTAINERS */}
        {planningSprints.map((sprint) => {
          const sprintTasks = tasks.filter((t) => t.sprintId === sprint.sprintId);
          const sprintPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
          const isCollapsed = collapsedSprints[sprint.sprintId];

          return (
            <div
              key={sprint.sprintId}
              className="bg-surface-card rounded-xl border border-border shadow-card overflow-hidden"
            >
              <div className="p-3.5 bg-surface-low border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => toggleCollapse(sprint.sprintId)}
                    className="p-1 rounded-md text-text-muted hover:text-text-primary"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <h3 className="text-sm font-bold text-text-primary tracking-tight">{sprint.name}</h3>
                  <span className="text-xs font-mono tabular-nums text-text-muted">
                    ({sprintTasks.length} tasks • {sprintPoints} / {sprint.capacityPoints} pts)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSprintStatusChange(sprint.sprintId, 'active')}
                    className="text-xs text-brand-emerald border-brand-emerald/30 hover:bg-brand-emerald/10"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    <span>Start Sprint</span>
                  </Button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-3.5 flex flex-col gap-2">
                  {sprintTasks.map((task) => (
                    <div
                      key={task.taskId}
                      onClick={() => {
                        setSelectedTaskId(task.taskId);
                        setIsDrawerOpen(true);
                      }}
                      className={`flex items-center justify-between ${
                        density === 'compact' ? 'py-1.5 px-3' : 'p-2.5'
                      } rounded-lg bg-surface-low/60 hover:bg-surface-card border border-border cursor-pointer transition-all shadow-2xs`}
                    >
                      <span className="text-xs font-medium text-text-primary truncate">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2">
                        {task.storyPoints ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-brand-emerald/10 text-brand-emerald font-mono tabular-nums text-xs font-bold border border-brand-emerald/20">
                            {task.storyPoints} pt
                          </span>
                        ) : null}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveTask(task.taskId, null);
                          }}
                          className="text-[10px] text-text-muted hover:text-text-primary px-2 py-0.5 rounded-md bg-surface-card border border-border"
                        >
                          To Backlog
                        </button>
                      </div>
                    </div>
                  ))}

                  {sprintTasks.length === 0 && (
                    <div className="py-4 text-center text-xs text-text-muted">
                      Move user stories from the backlog to plan this sprint iteration.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* PRODUCT BACKLOG POOL */}
        <div className="bg-surface-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-low border border-border flex items-center justify-center text-text-secondary shadow-2xs">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-tight">Product Backlog</h3>
                <p className="text-xs text-text-secondary font-mono">
                  <span className="tabular-nums">{backlogTasks.length}</span> unassigned user stories •{' '}
                  <span className="tabular-nums">{totalBacklogPoints}</span> total story points
                </p>
              </div>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleQuickAddTask} className="flex items-center gap-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="+ Add story to backlog..."
                className="text-xs px-3 py-1.5 rounded-lg bg-surface-low border border-border text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-brand-emerald outline-none w-56 sm:w-72"
              />
              <input
                type="number"
                min="0"
                value={quickPoints}
                onChange={(e) => setQuickPoints(Number(e.target.value))}
                className="text-xs w-14 px-2 py-1.5 text-center rounded-lg bg-surface-low border border-border text-text-primary font-mono tabular-nums font-bold outline-none"
                title="Story points"
              />
              <Button
                type="submit"
                disabled={isAddingTask || !quickTitle.trim()}
                size="sm"
                className="text-xs"
              >
                Add
              </Button>
            </form>
          </div>

          {/* Backlog Tasks List */}
          <div className="p-3.5 flex flex-col gap-2">
            {backlogTasks.map((task) => (
              <div
                key={task.taskId}
                onClick={() => {
                  setSelectedTaskId(task.taskId);
                  setIsDrawerOpen(true);
                }}
                className={`flex items-center justify-between ${
                  density === 'compact' ? 'py-1.5 px-3' : 'p-3'
                } rounded-lg bg-surface-card hover:bg-surface-low border border-border hover:border-brand-emerald/40 cursor-pointer transition-all shadow-2xs group`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden pr-3">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      task.priority === 'critical'
                        ? 'bg-status-error'
                        : task.priority === 'high'
                        ? 'bg-amber-500'
                        : 'bg-brand-emerald'
                    }`}
                  />
                  <span className="text-xs font-medium text-text-primary truncate">
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {task.storyPoints ? (
                    <span className="px-2 py-0.5 rounded-md bg-brand-emerald/10 text-brand-emerald font-mono tabular-nums text-xs font-bold border border-brand-emerald/20">
                      {task.storyPoints} pt
                    </span>
                  ) : null}

                  {/* Move to Sprint Actions */}
                  {sprints.length > 0 && (
                    <select
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        if (e.target.value) handleMoveTask(task.taskId, e.target.value);
                      }}
                      defaultValue=""
                      className="text-[11px] font-medium text-text-secondary px-2.5 py-1 rounded-lg bg-surface-low border border-border outline-none hover:border-brand-emerald"
                    >
                      <option value="" disabled>
                        Move to Sprint...
                      </option>
                      {sprints
                        .filter((s) => s.status !== 'completed')
                        .map((s) => (
                          <option key={s.sprintId} value={s.sprintId}>
                            {s.name} ({s.status})
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>
            ))}

            {backlogTasks.length === 0 && (
              <div className="py-8 text-center text-xs text-text-muted flex flex-col items-center gap-2">
                <Layers className="w-8 h-8 opacity-40" />
                <span className="font-semibold text-text-primary">Product Backlog is Clean</span>
                <p className="max-w-sm">
                  All tasks are allocated to sprint cycles. Use the form above to quickly capture new user stories.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <CreateSprintModal
        projectId={projectId}
        isOpen={isCreateSprintOpen}
        onClose={() => setIsCreateSprintOpen(false)}
        onSuccess={() => {
          refetchSprints();
          refetchTasks();
        }}
      />

      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTaskId(null);
        }}
        onTaskUpdated={() => {
          refetchTasks();
          refetchSprints();
        }}
        onTaskDeleted={() => {
          setIsDrawerOpen(false);
          setSelectedTaskId(null);
          refetchTasks();
          refetchSprints();
        }}
      />
    </div>
  );
};

export default BacklogView;
