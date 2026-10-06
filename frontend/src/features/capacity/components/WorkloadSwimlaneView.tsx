import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Flame,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Briefcase,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { useTeam } from '../../../hooks/useTeam';
import { useTasks } from '../../../hooks/useTasks';
import { TaskDetailDrawer } from '../../tasks/TaskDetailDrawer';
import { Task, TeamMember } from '../../../types';

interface WorkloadSwimlaneViewProps {
  projectId?: string;
}

export const WorkloadSwimlaneView: React.FC<WorkloadSwimlaneViewProps> = ({ projectId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: team = [], isLoading: isLoadingTeam } = useTeam();
  const { data: tasks = [], isLoading: isLoadingTasks, refetch: refetchTasks } = useTasks(
    projectId ? { projectId } : undefined
  );

  const departments = useMemo(() => {
    const set = new Set<string>();
    team.forEach((m) => {
      if (m.department) set.add(m.department);
    });
    return Array.from(set);
  }, [team]);

  const memberWorkloads = useMemo(() => {
    return team.map((member) => {
      // Find tasks assigned to this member
      const memberTasks = tasks.filter((t) => {
        return Array.isArray(t.assignees) && t.assignees.includes(member.userId);
      });

      const inProgressCount = memberTasks.filter((t) => t.status === 'In Progress').length;
      const completedCount = memberTasks.filter((t) => t.status === 'Done').length;

      // Weekly default: 40 available hours
      const availableHours = 40;
      const committedHours = memberTasks
        .filter((t) => t.status !== 'Done')
        .reduce((sum, t) => sum + (t.estimatedHours || (t.storyPoints ? t.storyPoints * 2 : 4)), 0);

      const loadPct = Math.round((committedHours / Math.max(1, availableHours)) * 100);

      let status: 'optimal' | 'heavy' | 'overloaded' = 'optimal';
      if (loadPct > 100) status = 'overloaded';
      else if (loadPct >= 80) status = 'heavy';

      return {
        member,
        tasks: memberTasks,
        inProgressCount,
        completedCount,
        availableHours,
        committedHours,
        loadPct,
        status,
        isWipExceeded: inProgressCount > 3,
      };
    });
  }, [team, tasks]);

  const filteredWorkloads = useMemo(() => {
    return memberWorkloads.filter(({ member }) => {
      if (selectedDept !== 'all' && member.department !== selectedDept) return false;
      if (
        searchQuery &&
        !member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !member.email.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [memberWorkloads, selectedDept, searchQuery]);

  if (isLoadingTeam || isLoadingTasks) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-text-muted gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
        <p className="text-xs">Loading team workload swimlanes...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-card p-4 rounded-xl border border-border shadow-xs">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member by name/email..."
            className="pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Department:
          </span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-surface-low border border-border text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swimlane Rows */}
      <div className="flex flex-col gap-4">
        {filteredWorkloads.map(
          ({
            member,
            tasks: memberTasks,
            inProgressCount,
            completedCount,
            availableHours,
            committedHours,
            loadPct,
            status,
            isWipExceeded,
          }) => {
            return (
              <Card
                key={member.userId}
                className={`p-5 border transition-all shadow-xs flex flex-col md:flex-row gap-5 ${
                  status === 'overloaded'
                    ? 'border-status-error/40 bg-status-error-bg/10'
                    : 'border-border bg-surface-card'
                }`}
              >
                {/* Member Card Profile (Left column, 240px) */}
                <div className="w-full md:w-60 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-emerald/10 text-brand-emerald font-bold text-sm flex items-center justify-center shrink-0 border border-brand-emerald/20">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col truncate">
                      <h4 className="text-sm font-bold text-text-primary truncate">{member.name}</h4>
                      <span className="text-xs text-text-secondary capitalize">{member.role}</span>
                      {member.department && (
                        <span className="text-[10px] text-text-muted mt-0.5">{member.department}</span>
                      )}
                    </div>
                  </div>

                  {/* Capacity Gauge */}
                  <div className="flex flex-col gap-1.5 mt-4 pt-3 border-t border-border/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Workload Capacity</span>
                      <span
                        className={`font-mono font-bold ${
                          status === 'overloaded'
                            ? 'text-status-error-text'
                            : status === 'heavy'
                            ? 'text-amber-600'
                            : 'text-brand-emerald'
                        }`}
                      >
                        {loadPct}%
                      </span>
                    </div>

                    <div className="w-full bg-surface-low rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          status === 'overloaded'
                            ? 'bg-rose-500'
                            : status === 'heavy'
                            ? 'bg-amber-500'
                            : 'bg-brand-emerald'
                        }`}
                        style={{ width: `${Math.min(100, loadPct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-muted font-mono mt-1">
                      <span>{committedHours}h committed</span>
                      <span>{availableHours}h avail</span>
                    </div>

                    {/* WIP Limit Indicator */}
                    {isWipExceeded && (
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded-md mt-1 border border-rose-200 dark:border-rose-900/40">
                        <Flame className="w-3.5 h-3.5 shrink-0" />
                        <span>WIP Alert ({inProgressCount} in progress)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tasks Swimlane Track (Right, scrollable horizontal flow) */}
                <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-secondary">
                      Active Deliverables ({memberTasks.length})
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted font-mono">
                      <span>{inProgressCount} In Progress</span>
                      <span>•</span>
                      <span>{completedCount} Completed</span>
                    </div>
                  </div>

                  {memberTasks.length > 0 ? (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
                      {memberTasks.map((t) => (
                        <div
                          key={t.taskId}
                          onClick={() => {
                            setSelectedTaskId(t.taskId);
                            setIsDrawerOpen(true);
                          }}
                          className="w-56 shrink-0 p-3 bg-surface-card hover:bg-surface-low rounded-lg border border-border hover:border-brand-emerald/40 shadow-2xs flex flex-col justify-between gap-2.5 transition-all cursor-pointer group"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-text-muted uppercase">
                                {t.taskId.slice(-6)}
                              </span>
                              <Badge
                                variant={
                                  t.priority === 'critical'
                                    ? 'critical'
                                    : t.priority === 'high'
                                    ? 'high'
                                    : 'neutral'
                                }
                                size="sm"
                                className="capitalize text-[10px]"
                              >
                                {t.priority}
                              </Badge>
                            </div>
                            <h5 className="text-xs font-bold text-text-primary line-clamp-2 leading-snug group-hover:text-brand-emerald transition-colors">
                              {t.title}
                            </h5>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-text-muted">
                            <span
                              className={`font-semibold ${
                                t.status === 'Done'
                                  ? 'text-brand-emerald'
                                  : t.status === 'In Progress'
                                  ? 'text-amber-600'
                                  : 'text-text-secondary'
                              }`}
                            >
                              {t.status}
                            </span>
                            <span className="font-mono">
                              {t.estimatedHours
                                ? `${t.estimatedHours}h`
                                : t.storyPoints
                                ? `${t.storyPoints}pt`
                                : '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 border border-dashed border-border rounded-lg text-center text-xs text-text-muted flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-emerald/60" />
                      <span>No tasks assigned to this member</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          }
        )}

        {filteredWorkloads.length === 0 && (
          <div className="py-16 text-center text-xs text-text-muted bg-surface-card border border-dashed border-border rounded-xl">
            No team members found matching your search criteria.
          </div>
        )}
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTaskId(null);
        }}
        onTaskUpdated={() => refetchTasks()}
        onTaskDeleted={() => {
          setIsDrawerOpen(false);
          setSelectedTaskId(null);
          refetchTasks();
        }}
      />
    </div>
  );
};

export default WorkloadSwimlaneView;
