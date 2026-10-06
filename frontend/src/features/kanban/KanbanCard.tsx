import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Hash } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';

interface KanbanCardProps {
  task: any;
  onClick: (taskId: string) => void;
  isDraggingOverlay?: boolean;
  activeViewer?: {
    userId: string;
    name: string;
    avatarUrl?: string;
  };
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  onClick,
  isDraggingOverlay = false,
  activeViewer,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.taskId,
    data: { task },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const priorityColors: Record<string, string> = {
    critical: 'border-l-status-error shadow-red-100',
    high: 'border-l-amber-500 shadow-amber-100',
    medium: 'border-l-blue-500 shadow-blue-100',
    low: 'border-l-slate-400 shadow-gray-100',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task.taskId)}
      className={`p-3.5 rounded-lg bg-white border border-border/80 border-l-2 shadow-subtle hover:shadow-card hover:border-brand-emerald/40 transition-all cursor-grab active:cursor-grabbing select-none flex flex-col gap-2 ${
        priorityColors[task.priority || 'medium']
      } ${isDraggingOverlay ? 'rotate-1 scale-105 shadow-2xl border-brand-emerald' : ''} ${
        activeViewer ? 'ring-2 ring-brand-emerald/60 shadow-md bg-brand-emerald/[0.02]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
            {task.priority || 'medium'}
          </span>
          {activeViewer && (
            <span
              className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-brand-emerald/10 text-brand-emerald font-medium animate-pulse"
              title={`${activeViewer.name} is currently inspecting this task`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
              {activeViewer.name.split(' ')[0]} viewing
            </span>
          )}
        </div>
        {task.storyPoints ? (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono tabular-nums font-semibold px-1.5 py-0.5 rounded-md bg-surface-low border border-border/60 text-brand-emerald">
            <Hash className="w-3 h-3" />
            {task.storyPoints}
          </span>
        ) : null}
      </div>

      <h4 className="text-xs font-bold text-text-primary leading-snug tracking-tight line-clamp-2">
        {task.title}
      </h4>

      <div className="pt-2 border-t border-border/80 flex items-center justify-between text-[11px] text-text-muted">
        {task.dueDate ? (
          <div className="flex items-center gap-1 font-mono tabular-nums">
            <Calendar className="w-3.5 h-3.5 text-text-muted" />
            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        ) : (
          <span className="text-[10px] text-text-muted">No deadline</span>
        )}

        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {task.assigneeProfiles && task.assigneeProfiles.length > 0
            ? task.assigneeProfiles.map((p: any, idx: number) => (
                <Avatar
                  key={idx}
                  name={p.name || p.userId}
                  src={p.avatarUrl}
                  size="sm"
                  title={p.name || p.userId}
                />
              ))
            : task.assignees?.map((userId: string, idx: number) => (
                <Avatar key={idx} name={userId} size="sm" title={userId} />
              ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
