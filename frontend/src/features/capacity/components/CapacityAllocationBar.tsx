import React from 'react';

interface CapacityAllocationBarProps {
  allocated: number;
  capacity: number;
  unit?: string;
  showLabels?: boolean;
}

export const CapacityAllocationBar: React.FC<CapacityAllocationBarProps> = ({
  allocated,
  capacity,
  unit = 'pts',
  showLabels = true,
}) => {
  const percentage = capacity > 0 ? Math.round((allocated / capacity) * 100) : 0;

  // Status color
  const statusColor =
    percentage > 100
      ? 'bg-red-500'
      : percentage >= 80
      ? 'bg-amber-500'
      : 'bg-brand-emerald';

  const textColor =
    percentage > 100
      ? 'text-red-700 dark:text-red-400'
      : percentage >= 80
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-brand-emerald';

  return (
    <div className="flex flex-col gap-1 w-full">
      {showLabels && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-muted">
            {allocated} / {capacity} {unit}
          </span>
          <span className={`font-semibold ${textColor}`}>{percentage}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-surface-low rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${statusColor}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
};

export default CapacityAllocationBar;
