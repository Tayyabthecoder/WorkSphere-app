import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  DollarSign,
  KanbanSquare,
  Users,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { MetricCard } from '../../../components/dashboard/MetricCard';
import apiClient from '../../../api/client';

export const ProjectOverviewPanel: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    setIsLoading(true);
    Promise.all([
      apiClient.get(`/v1/projects/${projectId}`).catch(() => null),
      apiClient.get(`/v1/tasks?projectId=${projectId}&limit=500`).catch(() => null),
    ])
      .then(([projRes, taskRes]) => {
        if (projRes?.data?.data) {
          setProject(projRes.data.data);
        }
        if (taskRes?.data?.data) {
          setTasks(taskRes.data.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface-card rounded-xl border border-border" />
          ))}
        </div>
        <div className="h-64 bg-surface-card rounded-xl border border-border" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-text-muted">
        Project not found or no access.
      </div>
    );
  }

  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const done = tasks.filter((t) => t.status === 'Done').length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="TOTAL DELIVERABLES"
          value={total}
          trend={`${total} items`}
          icon={<CheckSquare className="w-4 h-4" />}
        />
        <MetricCard
          label="IN PROGRESS"
          value={inProgress}
          trend="Active execution"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          label="COMPLETED"
          value={done}
          trend={`${completionRate}% completion`}
          variant="primary"
          icon={<CheckSquare className="w-4 h-4 text-brand-mint" />}
        />
        <MetricCard
          label="PROJECT BUDGET"
          value={`$${(project.budget?.total ?? 0).toLocaleString()}`}
          trend={project.budget?.type || 'Fixed Scope'}
          icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Main Overview Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2-Cols: Project Statement & Quick Links */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-text-primary tracking-tight">
              Project Statement & Scope
            </h3>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              {project.description ||
                'No detailed scope statement specified yet. Update description in project settings.'}
            </p>

            <div className="mt-6 pt-5 border-t border-border/80 flex flex-wrap items-center gap-3">
              <Link to={`/projects/${project.projectId}/board`}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<KanbanSquare className="w-4 h-4" />}
                >
                  Open Kanban Board
                </Button>
              </Link>
              <Link to={`/projects/${project.projectId}/list`}>
                <Button variant="secondary" size="sm">
                  View Spreadsheet List
                </Button>
              </Link>
              <Link to={`/projects/${project.projectId}/timeline`}>
                <Button variant="outline" size="sm">
                  Gantt Timeline
                </Button>
              </Link>
            </div>
          </Card>

          {/* Project Phases (if present) */}
          {project.phases && project.phases.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-emerald" />
                  <h3 className="text-sm font-bold text-text-primary tracking-tight">
                    Project Lifecycle Phases
                  </h3>
                </div>
                <span className="text-xs text-text-muted font-mono">
                  {project.phases.length} Phases Defined
                </span>
              </div>

              <div className="flex flex-col divide-y divide-border/60">
                {project.phases.map((phase: any, idx: number) => (
                  <div
                    key={phase.id || idx}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-surface-low border border-border/80 flex items-center justify-center text-xs font-bold text-text-muted font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-text-primary">
                        {phase.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      {phase.startDate && phase.endDate && (
                        <span className="font-mono text-[11px]">
                          {new Date(phase.startDate).toLocaleDateString()} -{' '}
                          {new Date(phase.endDate).toLocaleDateString()}
                        </span>
                      )}
                      <Badge variant="neutral" size="sm">
                        Phase {idx + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Project Metadata & Team */}
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-text-primary tracking-tight mb-4">
              Project Parameters
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-text-muted">Methodology</span>
                <Badge variant="progress" size="sm">
                  {project.methodology || 'Agile'}
                </Badge>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-text-muted">Status</span>
                <Badge variant="completed" size="sm" dot>
                  {project.status || 'Active'}
                </Badge>
              </div>

              {project.startDate && (
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-text-muted">Start Date</span>
                  <span className="font-mono text-[11px] text-text-primary">
                    {new Date(project.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {project.endDate && (
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-text-muted">Target Deadline</span>
                  <span className="font-mono text-[11px] text-text-primary">
                    {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-text-muted">Project ID</span>
                <span className="font-mono text-[11px] text-text-muted">
                  {project.projectId}
                </span>
              </div>
            </div>
          </Card>

          {/* Recent Tasks List */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary tracking-tight">
                Recent Tasks
              </h3>
              <Link
                to={`/projects/${project.projectId}/list`}
                className="text-xs text-brand-emerald hover:underline flex items-center gap-1 font-semibold"
              >
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-border/60">
              {tasks.slice(0, 5).map((t) => (
                <div
                  key={t.taskId}
                  className="py-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <span className="font-medium text-text-primary truncate">
                    {t.title}
                  </span>
                  <Badge variant={t.status === 'Done' ? 'completed' : 'neutral'} size="sm">
                    {t.status}
                  </Badge>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="py-4 text-center text-xs text-text-muted">
                  No deliverables created yet.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverviewPanel;
