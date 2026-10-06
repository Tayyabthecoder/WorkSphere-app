import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Filter,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { TaskDetailDrawer } from '../../tasks/TaskDetailDrawer';
import apiClient from '../../../api/client';

export const ProjectListView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Task Detail Drawer state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchTasks = async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const res = await apiClient.get(`/v1/tasks?projectId=${projectId}&limit=500`);
      if (res.data?.success) {
        setTasks(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load project tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const handleQuickAdd = async () => {
    const title = prompt('Enter new task deliverable title:');
    if (!title?.trim() || !projectId) return;

    try {
      await apiClient.post('/v1/tasks', {
        projectId,
        title: title.trim(),
        status: 'To Do',
        priority: 'medium',
      });
      fetchTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title?.toLowerCase().includes(q) ||
        t.taskId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Controls / Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-card p-4 rounded-xl border border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deliverables..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs font-medium bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
          >
            <option value="ALL">All Statuses</option>
            <option value="Backlog">Backlog</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Done">Done</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs font-medium bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
          >
            <option value="ALL">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={handleQuickAdd}
        >
          Add Task
        </Button>
      </div>

      {/* Spreadsheet / Table View */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-low/50 text-[11px] font-mono uppercase tracking-wider text-text-muted">
                <th className="py-3 px-4">Task Deliverable</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Story Points</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-4 text-right">Task ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    No deliverables match the current filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr
                    key={task.taskId}
                    onClick={() => {
                      setSelectedTaskId(task.taskId);
                      setIsDrawerOpen(true);
                    }}
                    className="hover:bg-surface-low/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <CheckSquare className="w-4 h-4 text-brand-emerald shrink-0" />
                        <span className="font-semibold text-text-primary hover:text-brand-emerald transition-colors">
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          task.status === 'Done'
                            ? 'completed'
                            : task.status === 'In Progress'
                            ? 'progress'
                            : 'neutral'
                        }
                        size="sm"
                        dot
                      >
                        {task.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          task.priority === 'critical'
                            ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                            : task.priority === 'high'
                            ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                            : task.priority === 'medium'
                            ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                            : 'bg-surface-low text-text-muted border border-border/80'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-text-secondary">
                        {task.storyPoints ? `${task.storyPoints} pts` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text-secondary">
                      {task.dueDate ? (
                        <span className="font-mono text-[11px]">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-text-muted">
                      {task.taskId}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTaskId(null);
        }}
        onTaskUpdated={fetchTasks}
        onTaskDeleted={fetchTasks}
      />
    </div>
  );
};

export default ProjectListView;
