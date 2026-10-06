import React from 'react';
import { CheckSquare, ArrowDownLeft, MoreHorizontal } from 'lucide-react';
import { Task } from '../../../types';
import { Badge } from '../../../components/ui/Badge';

interface SprintTaskRowProps {
  task: Task;
  onMoveToBacklog: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  onClick?: () => void;
}

export const SprintTaskRow: React.FC<SprintTaskRowProps> = ({
  task,
  onMoveToBacklog,
  onStatusChange,
  onClick,
}) => {
  const priorityColors: Record<string, string> = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    low: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-lg bg-surface-card border border-border hover:border-brand-emerald/40 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <CheckSquare className="w-4 h-4 text-text-muted shrink-0" />
        <span className="text-xs font-medium text-text-primary truncate">
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.storyPoints !== undefined && (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-low border border-border text-text-secondary">
            {task.storyPoints} pts
          </span>
        )}

        <span
          className={`px-2 py-0.5 rounded text-[10px] font-medium border capitalize ${
            priorityColors[task.priority] || priorityColors.medium
          }`}
        >
          {task.priority}
        </span>

        {onStatusChange ? (
          <select
            value={task.status}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange(task.taskId, e.target.value as Task['status']);
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] bg-surface-low border border-border rounded px-1.5 py-0.5 text-text-primary focus:outline-none"
          >
            <option value="Backlog">Backlog</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Done">Done</option>
          </select>
        ) : (
          <Badge variant={task.status === 'Done' ? 'success' : 'neutral'} size="sm">
            {task.status}
          </Badge>
        )}

        <button
          title="Move to Backlog"
          onClick={(e) => {
            e.stopPropagation();
            onMoveToBacklog(task.taskId);
          }}
          className="p-1 rounded text-text-muted hover:text-amber-600 hover:bg-amber-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default SprintTaskRow;
