import React, { useState } from 'react';
import { Search, Plus, Filter, ArrowUpRight, CheckSquare } from 'lucide-react';
import { Task } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface BacklogPanelProps {
  tasks: Task[];
  activeSprintId?: string;
  onAddToSprint: (taskId: string, sprintId: string) => void;
  onCreateBacklogTask: (title: string, storyPoints?: number) => void;
  onTaskClick?: (task: Task) => void;
}

export const BacklogPanel: React.FC<BacklogPanelProps> = ({
  tasks,
  activeSprintId,
  onAddToSprint,
  onCreateBacklogTask,
  onTaskClick,
}) => {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newPoints, setNewPoints] = useState<number | ''>('');
  const [isAdding, setIsAdding] = useState(false);

  const backlogTasks = tasks.filter((t) => !t.sprintId);

  const filteredTasks = backlogTasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onCreateBacklogTask(newTaskTitle.trim(), typeof newPoints === 'number' ? newPoints : undefined);
    setNewTaskTitle('');
    setNewPoints('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col h-full bg-surface-card border border-border rounded-xl p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="font-semibold text-text-primary text-sm">Product Backlog</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {backlogTasks.length} unassigned {backlogTasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs h-8"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Item
        </Button>
      </div>

      {/* Inline Quick Add Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="my-3 p-3 bg-surface-low rounded-lg border border-border flex flex-col gap-2">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
            required
            className="text-xs"
          />
          <div className="flex items-center justify-between gap-2">
            <Input
              type="number"
              min={0}
              value={newPoints}
              onChange={(e) => setNewPoints(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Pts (e.g. 5)"
              className="w-24 text-xs"
            />
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="text-xs h-7">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="text-xs h-7">
                Add to Backlog
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-2 my-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search backlog..."
            className="w-full pl-8 pr-3 py-1.5 bg-surface-low border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-emerald"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-2 py-1.5 bg-surface-low border border-border rounded-lg text-xs text-text-secondary focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-[300px]">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-text-muted">
            <CheckSquare className="w-8 h-8 stroke-[1.5] mb-2 opacity-40" />
            <p className="text-xs">No backlog tasks found</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.taskId}
              onClick={() => onTaskClick?.(task)}
              className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface-low/50 hover:bg-surface-low hover:border-brand-emerald/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium text-text-primary truncate">
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {task.storyPoints !== undefined && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-card border border-border text-text-muted">
                    {task.storyPoints} pts
                  </span>
                )}
                {activeSprintId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToSprint(task.taskId, activeSprintId);
                    }}
                    title="Move to Active Sprint"
                    className="h-6 px-2 text-[10px] text-brand-emerald hover:bg-brand-emerald/10 border-brand-emerald/30"
                  >
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    To Sprint
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BacklogPanel;
