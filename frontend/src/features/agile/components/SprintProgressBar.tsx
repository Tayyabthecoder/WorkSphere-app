import React from 'react';

interface SprintProgressBarProps {
  completedPoints: number;
  totalPoints: number;
  completedTasks?: number;
  totalTasks?: number;
  showDetails?: boolean;
  className?: string;
}

export const SprintProgressBar: React.FC<SprintProgressBarProps> = ({
  completedPoints,
  totalPoints,
  completedTasks = 0,
  totalTasks = 0,
  showDetails = true,
  className = '',
}) => {
  const percent = totalPoints > 0 ? Math.min(100, Math.round((completedPoints / totalPoints) * 100)) : 0;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {showDetails && (
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            {completedPoints} / {totalPoints} pts ({percent}%)
          </span>
          {totalTasks > 0 && (
            <span>
              {completedTasks} of {totalTasks} tasks done
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-surface-low rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-emerald rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default SprintProgressBar;
