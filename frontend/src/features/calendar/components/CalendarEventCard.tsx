import React from 'react';
import { CheckSquare, Zap, Clock } from 'lucide-react';
import { Task, Sprint } from '../../../types';

interface CalendarEventCardProps {
  item:
    | { type: 'task'; data: Task }
    | { type: 'sprint'; data: Sprint };
  onClick: () => void;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({ item, onClick }) => {
  if (item.type === 'sprint') {
    const sprint = item.data;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="w-full px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-emerald-500/25 transition-colors truncate"
      >
        <Zap className="w-3 h-3 shrink-0 text-emerald-600" />
        <span className="truncate">{sprint.name}</span>
      </div>
    );
  }

  const task = item.data;

  const priorityStyles: Record<string, string> = {
    critical: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
    high: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
    medium: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
    low: 'bg-gray-500/10 border-gray-500/30 text-gray-700 dark:text-gray-400',
  };

  const style = priorityStyles[task.priority] || priorityStyles.medium;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full px-2 py-1 rounded border text-[11px] font-medium flex items-center justify-between gap-1.5 cursor-pointer hover:opacity-90 transition-opacity truncate shadow-2xs ${style}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <CheckSquare className="w-3 h-3 shrink-0 opacity-70" />
        <span className="truncate">{task.title}</span>
      </div>
      {task.status === 'Done' && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      )}
    </div>
  );
};

export default CalendarEventCard;
