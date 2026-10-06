import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { Sprint, Task } from '../../../types';

interface SprintBurndownChartProps {
  sprint: Sprint;
  tasks: Task[];
}

export const SprintBurndownChart: React.FC<SprintBurndownChartProps> = ({ sprint, tasks }) => {
  const { chartData, totalPoints, remainingPoints, isBehind } = useMemo(() => {
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const diffTime = end.getTime() - start.getTime();
    const numDays = Math.max(5, Math.min(30, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1));

    const sprintTasks = tasks.filter((t) => t.sprintId === sprint.sprintId);
    const total = Math.max(
      sprint.capacityPoints || 0,
      sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    );

    const completed = sprintTasks
      .filter((t) => t.status === 'Done')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const remaining = Math.max(0, total - completed);

    const now = new Date();
    const dataPoints = [];

    for (let day = 0; day < numDays; day++) {
      const currentDayDate = new Date(start);
      currentDayDate.setDate(currentDayDate.getDate() + day);

      const dayLabel = currentDayDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      // Ideal descent
      const ideal = Math.max(0, Math.round(total - (total / Math.max(1, numDays - 1)) * day));

      // Actual points (simulated curve leading up to current remaining)
      let actual: number | null = null;
      if (currentDayDate <= now || day === 0) {
        if (day === 0) {
          actual = total;
        } else {
          // Progress ratio through passed days
          const passedDays = Math.max(1, Math.min(numDays, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))));
          const progressFactor = day / passedDays;
          actual = Math.round(total - (total - remaining) * progressFactor);
        }
      }

      dataPoints.push({
        day: dayLabel,
        ideal,
        actual,
      });
    }

    // Determine if behind ideal pace
    const currentIdeal = dataPoints.find((p) => p.actual !== null)?.ideal ?? 0;
    const behind = remaining > currentIdeal;

    return {
      chartData: dataPoints,
      totalPoints: total,
      remainingPoints: remaining,
      isBehind: behind,
    };
  }, [sprint, tasks]);

  return (
    <div className="bg-surface-card border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-brand-emerald" />
            Sprint Burndown: {sprint.name}
          </h4>
          <p className="text-xs text-text-muted mt-0.5">
            Ideal vs actual remaining story points
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isBehind ? (
            <span className="flex items-center gap-1 text-status-warning-text bg-amber-500/10 px-2.5 py-1 rounded-full font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> Behind Schedule
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> On Track
            </span>
          )}
          <span className="text-text-muted">
            Remaining: <strong className="text-text-primary">{remainingPoints} / {totalPoints} pts</strong>
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} tickLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area
              type="monotone"
              dataKey="ideal"
              name="Ideal Burndown"
              stroke="#9ca3af"
              strokeDasharray="4 4"
              fill="transparent"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual Remaining"
              stroke="#059669"
              fill="url(#actualGradient)"
              strokeWidth={2}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SprintBurndownChart;
