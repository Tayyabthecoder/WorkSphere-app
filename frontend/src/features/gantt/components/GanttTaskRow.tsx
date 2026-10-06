import React from 'react';
import { CheckSquare } from 'lucide-react';
import { Task } from '../../../types';
import { Badge } from '../../../components/ui/Badge';

interface GanttTaskRowProps {
  task: Task;
  isSelected?: boolean;
  onClick?: () => void;
}

export const GanttTaskRow: React.FC<GanttTaskRowProps> = ({
  task,
  isSelected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`h-10 px-3 flex items-center justify-between border-b border-border text-xs cursor-pointer transition-colors ${
        isSelected ? 'bg-brand-emerald/10' : 'hover:bg-surface-low'
      }`}
    >
      <div className="flex items-center gap-2 truncate pr-2">
        <CheckSquare className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <span className="truncate font-medium text-text-primary">{task.title}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge variant={task.status === 'Done' ? 'success' : 'neutral'} size="sm">
          {task.status}
        </Badge>
      </div>
    </div>
  );
};

export default GanttTaskRow;
