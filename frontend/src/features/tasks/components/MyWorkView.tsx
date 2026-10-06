import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  AlertCircle,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  Inbox,
  Filter,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { TaskDetailDrawer } from '../TaskDetailDrawer';
import { useAuthStore } from '../../../store/auth';
import apiClient from '../../../api/client';

type TabType = 'all' | 'overdue' | 'today' | 'upcoming' | 'completed';

export const MyWorkView: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/v1/tasks?limit=500');
      if (res.data?.success) {
        setTasks(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const { myTasks, overdueCount, todayCount, upcomingCount, completedCount } = useMemo(() => {
    const relevant = tasks.filter((t) =>
      user?.role === 'orgAdmin' || user?.role === 'superAdmin'
        ? true
        : t.assignees?.includes(user?.userId)
    );

    let overdue = 0;
    let today = 0;
    let upcoming = 0;
    let completed = 0;

    for (const t of relevant) {
      if (t.status === 'Done') {
        completed++;
        continue;
      }
      if (!t.dueDate) continue;

      const due = new Date(t.dueDate);
      const dueStr = due.toISOString().slice(0, 10);

      if (dueStr < todayStr) overdue++;
      else if (dueStr === todayStr) today++;
      else upcoming++;
    }

    return {
      myTasks: relevant,
      overdueCount: overdue,
      todayCount: today,
      upcomingCount: upcoming,
      completedCount: completed,
    };
  }, [tasks, user, todayStr]);

  const displayedTasks = useMemo(() => {
    return myTasks.filter((t) => {
      if (activeTab === 'overdue') {
        if (t.status === 'Done' || !t.dueDate) return false;
        return new Date(t.dueDate).toISOString().slice(0, 10) < todayStr;
      }
      if (activeTab === 'today') {
        if (t.status === 'Done' || !t.dueDate) return false;
        return new Date(t.dueDate).toISOString().slice(0, 10) === todayStr;
      }
      if (activeTab === 'upcoming') {
        if (t.status === 'Done' || !t.dueDate) return false;
        return new Date(t.dueDate).toISOString().slice(0, 10) > todayStr;
      }
      if (activeTab === 'completed') {
        return t.status === 'Done';
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.taskId.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [myTasks, activeTab, searchQuery, todayStr]);

  const handleToggleTask = async (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = task.status === 'Done' ? 'To Do' : 'Done';
    try {
      await apiClient.patch(`/v1/tasks/${task.taskId}/status`, { status: nextStatus });
      setTasks((prev) =>
        prev.map((t) => (t.taskId === task.taskId ? { ...t, status: nextStatus } : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">My Work & Deliverables</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Focus view for all assigned work across active projects.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search deliverables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-surface-card border border-border/80 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald shadow-2xs"
          />
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Assigned Work</span>
            <Inbox className="w-4 h-4 text-brand-emerald" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text-primary">{myTasks.length}</span>
            <span className="text-[11px] text-text-muted">Total tasks</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Due Today</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700">{todayCount}</span>
            <span className="text-[11px] text-text-muted">High focus</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700">Overdue</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-red-700">{overdueCount}</span>
            <span className="text-[11px] text-red-600 font-semibold">Immediate action</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700">{completedCount}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Completed</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/80 pb-2 overflow-x-auto">
        {(
          [
            { id: 'all', label: 'All Tasks', count: myTasks.length },
            { id: 'overdue', label: 'Overdue', count: overdueCount },
            { id: 'today', label: 'Due Today', count: todayCount },
            { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
            { id: 'completed', label: 'Completed', count: completedCount },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-brand-emerald text-white shadow-2xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-surface-dim text-text-muted'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Deliverables List */}
      <Card className="overflow-hidden border border-border/80">
        <div className="divide-y divide-border/60">
          {displayedTasks.length > 0 ? (
            displayedTasks.map((t) => (
              <div
                key={t.taskId}
                onClick={() => {
                  setSelectedTaskId(t.taskId);
                  setIsDrawerOpen(true);
                }}
                className="p-3.5 flex items-center justify-between gap-4 hover:bg-surface-low/50 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={t.status === 'Done'}
                    onChange={() => {}}
                    onClick={(e) => handleToggleTask(t, e)}
                    className="w-4 h-4 rounded border-border text-brand-emerald focus:ring-brand-emerald cursor-pointer shrink-0"
                  />
                  <div className="flex flex-col truncate">
                    <span
                      className={`text-xs font-bold truncate ${
                        t.status === 'Done' ? 'line-through text-text-muted' : 'text-text-primary'
                      }`}
                    >
                      {t.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-muted font-mono">
                      <span>{t.taskId}</span>
                      {t.dueDate && (
                        <span className="flex items-center gap-1 text-[10px]">
                          <Calendar className="w-3 h-3" />
                          {new Date(t.dueDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {t.storyPoints > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-low text-text-secondary border border-border">
                      {t.storyPoints} pts
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      t.priority === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : t.priority === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {t.priority}
                  </span>
                  <Badge
                    variant={
                      t.status === 'Done'
                        ? 'completed'
                        : t.status === 'In Progress'
                        ? 'progress'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {t.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-brand-mint mb-2" />
              <h4 className="text-sm font-bold text-text-primary">All caught up!</h4>
              <p className="text-xs text-text-muted mt-0.5">No tasks match your selected filter criteria.</p>
            </div>
          )}
        </div>
      </Card>

      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onTaskUpdated={fetchTasks}
        onTaskDeleted={fetchTasks}
      />
    </div>
  );
};

export default MyWorkView;
