import React from 'react';
import { BarChart3 } from 'lucide-react';

export interface VelocityDataPoint {
  day: string;
  completed: number;
  remaining: number;
}

interface ProjectAnalyticsCardProps {
  data?: VelocityDataPoint[];
  sprintName?: string;
}

export const ProjectAnalyticsCard: React.FC<ProjectAnalyticsCardProps> = ({
  data = [],
  sprintName,
}) => {
  const chartData =
    data.length > 0
      ? data
      : [
          { day: 'Mon', completed: 0, remaining: 0 },
          { day: 'Tue', completed: 0, remaining: 0 },
          { day: 'Wed', completed: 0, remaining: 0 },
          { day: 'Thu', completed: 0, remaining: 0 },
          { day: 'Fri', completed: 0, remaining: 0 },
          { day: 'Sat', completed: 0, remaining: 0 },
          { day: 'Sun', completed: 0, remaining: 0 },
        ];

  const maxVal = Math.max(...chartData.map((d) => d.completed + d.remaining), 10);

  return (
    <div className="p-5 rounded-xl bg-surface-card border border-border/80 shadow-xs flex flex-col justify-between h-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-low border border-border/60 flex items-center justify-center text-brand-emerald shadow-2xs">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary tracking-tight">
              Velocity & Throughput
            </h3>
            <span className="text-[11px] text-text-muted">
              {sprintName ? `${sprintName} Burnup Cadence` : '7-Day Velocity Burnup'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-emerald" />
            <span className="text-text-secondary">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-mint" />
            <span className="text-text-secondary">Planned</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="flex items-end justify-between gap-3 h-[140px] pt-4 px-2">
        {chartData.map((item, idx) => {
          const completedHeight = Math.min(100, (item.completed / maxVal) * 100);
          const remainingHeight = Math.min(100, (item.remaining / maxVal) * 100);

          return (
            <div
              key={`${item.day}-${idx}`}
              className="flex flex-col items-center gap-2 flex-1 h-full justify-end group"
            >
              <div className="w-full max-w-[24px] flex flex-col gap-0.5 items-center justify-end h-full">
                {/* Planned bar cap */}
                <div
                  style={{ height: `${Math.max(4, remainingHeight)}%` }}
                  className="w-full bg-brand-mint/30 rounded-t-sm transition-all duration-300 group-hover:bg-brand-mint/50"
                  title={`Planned: ${item.remaining} pts`}
                />
                {/* Completed bar cap */}
                <div
                  style={{ height: `${Math.max(4, completedHeight)}%` }}
                  className="w-full bg-brand-emerald rounded-t-sm transition-all duration-300 group-hover:bg-brand-primary"
                  title={`Completed: ${item.completed} pts`}
                />
              </div>
              <span className="text-[10px] font-mono font-semibold text-text-muted">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectAnalyticsCard;
