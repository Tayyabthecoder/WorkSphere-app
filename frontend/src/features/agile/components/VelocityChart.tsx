import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';

export interface SprintVelocityData {
  sprintId: string;
  name: string;
  committedPoints: number;
  completedPoints: number;
}

interface VelocityChartProps {
  sprints: SprintVelocityData[];
}

export const VelocityChart: React.FC<VelocityChartProps> = ({ sprints }) => {
  const { maxVal, avgVelocity } = useMemo(() => {
    let max = 20;
    let totalCompleted = 0;

    sprints.forEach((s) => {
      if (s.committedPoints > max) max = s.committedPoints;
      if (s.completedPoints > max) max = s.completedPoints;
      totalCompleted += s.completedPoints;
    });

    const avg = sprints.length > 0 ? Math.round(totalCompleted / sprints.length) : 0;
    return { maxVal: Math.ceil(max * 1.2), avgVelocity: avg };
  }, [sprints]);

  const width = 500;
  const height = 200;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const barWidth = Math.min(22, graphWidth / Math.max(1, sprints.length * 3));

  return (
    <div className="bg-surface-card rounded-xl p-5 border border-border/80 shadow-card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 text-brand-emerald flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary tracking-tight">Team Velocity</h4>
            <p className="text-[11px] text-text-secondary">
              Committed vs. Completed points per sprint
            </p>
          </div>
        </div>

        {/* Avg Velocity Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 text-xs font-medium">
          <span>Avg:</span>
          <span className="font-mono tabular-nums font-bold text-sm">{avgVelocity} pts / sprint</span>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative w-full overflow-hidden flex items-center justify-center">
        {sprints.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">
            No completed sprints to compute velocity yet.
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-h-[200px] select-none">
            {/* Grid lines */}
            {[0, 0.5, 1].map((ratio) => {
              const y = height - paddingY - ratio * graphHeight;
              const val = Math.round(ratio * maxVal);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="9"
                    fill="#9CA3AF"
                    fontWeight="600"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {sprints.map((sprint, i) => {
              const slotWidth = graphWidth / sprints.length;
              const groupCenterX = paddingX + i * slotWidth + slotWidth / 2;

              const committedH = (sprint.committedPoints / maxVal) * graphHeight;
              const completedH = (sprint.completedPoints / maxVal) * graphHeight;

              const committedX = groupCenterX - barWidth - 2;
              const completedX = groupCenterX + 2;

              const committedY = height - paddingY - committedH;
              const completedY = height - paddingY - completedH;

              return (
                <g key={sprint.sprintId} className="group cursor-pointer">
                  {/* Committed Bar */}
                  <rect
                    x={committedX}
                    y={committedY}
                    width={barWidth}
                    height={Math.max(4, committedH)}
                    rx={2}
                    fill="#34D399"
                    fillOpacity="0.5"
                    className="transition-all duration-150 group-hover:brightness-95"
                  />

                  {/* Completed Bar */}
                  <rect
                    x={completedX}
                    y={completedY}
                    width={barWidth}
                    height={Math.max(4, completedH)}
                    rx={2}
                    fill="#1B4D3E"
                    className="transition-all duration-150 group-hover:brightness-110"
                  />

                  {/* Sprint Name Label */}
                  <text
                    x={groupCenterX}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#6B7280"
                    fontWeight="600"
                  >
                    {sprint.name}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs border-t border-border/80 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#34D399] opacity-70 border border-brand-mint" />
          <span className="text-text-secondary">Committed Points</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-brand-emerald" />
          <span className="font-semibold text-brand-emerald">Completed Points</span>
        </div>
      </div>
    </div>
  );
};

export default VelocityChart;
