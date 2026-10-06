import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Zap,
  Clock,
  ArrowRight,
  Sparkles,
  CheckSquare,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BentoGrid, BentoCol } from '../components/layout/BentoGrid';
import { MetricCard } from '../components/dashboard/MetricCard';
import { SprintProgressGauge } from '../components/dashboard/SprintProgressGauge';
import { ProjectAnalyticsCard } from '../components/dashboard/ProjectAnalyticsCard';
import { TeamCollabCard } from '../components/dashboard/TeamCollabCard';
import { DarkWaveTimeTracker } from '../components/dashboard/DarkWaveTimeTracker';
import { AnnouncementsPanel } from '../features/announcements/components/AnnouncementsPanel';
import { useAuthStore } from '../store/auth';
import apiClient from '../api/client';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await apiClient.get('/v1/dashboard/summary');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-64 bg-surface-dim rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface-card rounded-xl border border-border" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-96 bg-surface-card rounded-xl border border-border" />
          <div className="lg:col-span-4 h-96 bg-surface-card rounded-xl border border-border" />
        </div>
      </div>
    );
  }

  const activeSprint = data?.activeSprint;

  return (
    <div className="flex flex-col gap-6">
      {/* Workspace Announcements Banner */}
      <AnnouncementsPanel />

      {/* Header Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
              <Sparkles className="w-3 h-3 text-brand-mint" />
              {activeSprint?.name ? 'Sprint Active' : 'All Systems Nominal'}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Executive pulse for{' '}
            <span className="font-semibold text-text-primary">
              {user?.tenantId ? user.tenantId.replace('tnt_', '').toUpperCase() : 'WORKSPACE'}
            </span>{' '}
            workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/timesheet">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Clock className="w-3.5 h-3.5 text-text-muted" />}
            >
              Log Time
            </Button>
          </Link>
          <Link to="/projects">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FolderKanban className="w-3.5 h-3.5" />}
            >
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Reusable MetricCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="ACTIVE PROJECTS"
          value={data?.activeProjects ?? 0}
          trend={`${data?.activeProjects ?? 0} In Portfolio`}
          icon={<FolderKanban className="w-4 h-4" />}
        />
        <MetricCard
          label="TASKS DELIVERED"
          value={data?.deliveredTasks ?? 0}
          trend="100% Verified"
          isPositiveTrend
          icon={<CheckCircle2 className="w-4 h-4 text-brand-emerald" />}
        />
        <MetricCard
          label="FEATURED VELOCITY"
          value={`${data?.featuredVelocity ?? 0} pts`}
          trend={(data?.featuredVelocity ?? 0) > 0 ? 'Past 3 Sprints' : 'No sprint data'}
          variant="primary"
          icon={<Zap className="w-4 h-4 text-brand-mint" />}
        />
        <MetricCard
          label="HOURS TRACKED"
          value={`${data?.timeTrackedThisWeek ?? 0}h`}
          trend="Across Team"
          icon={<Clock className="w-4 h-4 text-purple-500" />}
        />
      </div>

      {/* Bento Layout Grid */}
      <BentoGrid className="p-0 max-w-none">
        {/* Left Column (8 cols) */}
        <BentoCol span={8}>
          {/* Active Sprint Progress Card */}
          {activeSprint ? (
            <Card className="p-5 ws-card relative overflow-hidden card-lift">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-mint animate-pulse" />
                    <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-brand-emerald">
                      Active Sprint
                    </span>
                    <span className="text-xs text-text-muted font-mono">•</span>
                    <span className="text-xs text-text-muted">
                      Ends {new Date(activeSprint.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary tracking-tight">
                    {activeSprint.name}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1.5 mb-4 line-clamp-2 leading-relaxed">
                    {activeSprint.goal || 'Execution phase in progress with continuous verification.'}
                  </p>
                  <div className="flex items-center gap-3">
                    <Link to="/sprints">
                      <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Sprint Board
                      </Button>
                    </Link>
                    <span className="text-xs text-text-muted font-mono">
                      {activeSprint.donePoints} of {activeSprint.totalPoints} Story Points
                    </span>
                  </div>
                </div>

                <div className="w-full md:w-auto shrink-0 flex justify-center">
                  <SprintProgressGauge
                    progressPct={activeSprint.progressPct}
                    donePoints={activeSprint.donePoints}
                    totalPoints={activeSprint.totalPoints}
                    statusLabel="Sprint Progress"
                  />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-5 border-dashed flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-low flex items-center justify-center text-text-muted">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">No Active Sprint</h4>
                  <p className="text-[11px] text-text-secondary">
                    Start a new sprint from the Projects or Sprints board.
                  </p>
                </div>
              </div>
              <Link to="/sprints">
                <Button variant="secondary" size="sm">
                  Go to Sprints
                </Button>
              </Link>
            </Card>
          )}

          {/* Project Analytics Card (Velocity Throughput) */}
          <ProjectAnalyticsCard
            data={data?.velocityBurnup || []}
            sprintName={activeSprint?.name}
          />

          {/* High-Priority Deliverables Stream */}
          <Card className="p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-brand-emerald" />
                <h3 className="text-sm font-bold text-text-primary">
                  High-Priority Deliverables
                </h3>
              </div>
              <Link
                to="/tasks"
                className="text-xs font-semibold text-brand-emerald hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-border/60">
              {data?.recentTasks && data.recentTasks.length > 0 ? (
                data.recentTasks.map((task: any) => (
                  <div
                    key={task.taskId}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-surface-low/50 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          task.priority === 'critical'
                            ? 'bg-status-error'
                            : task.priority === 'high'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-semibold text-text-primary truncate">
                          {task.title}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono truncate">
                          {task.taskId}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.storyPoints > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-low text-text-secondary border border-border">
                          {task.storyPoints} pts
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          task.status === 'Done'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : task.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-text-muted">
                  No deliverables scheduled yet.
                </div>
              )}
            </div>
          </Card>
        </BentoCol>

        {/* Right Column (4 cols) */}
        <BentoCol span={4}>
          {/* Animated DarkWave Focus Time Tracker */}
          <DarkWaveTimeTracker
            availableTasks={data?.recentTasks || []}
            sprintName={activeSprint?.name}
            onTimeLogged={fetchDashboard}
          />

          {/* Team Collaboration & Presence Card */}
          <TeamCollabCard members={data?.teamPresence || []} />
        </BentoCol>
      </BentoGrid>
    </div>
  );
};

export default DashboardPage;
