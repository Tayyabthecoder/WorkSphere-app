import React, { useMemo } from 'react';

export interface ActivityHeatmapDay {
  date: string; // ISO date 'YYYY-MM-DD'
  count: number;
}

interface ActivityHeatmapProps {
  data?: ActivityHeatmapDay[];
  weeks?: number;
  totalContributions?: number;
  className?: string;
  sectionLabel?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showDetails?: boolean;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data = [],
  weeks = 20,
  totalContributions,
  className = '',
  sectionLabel,
  title = 'Cadence & Activity Distribution',
  subtitle,
  icon,
  showDetails = true,
}) => {
  // Generate date matrix: 7 rows (days Sun-Sat or Mon-Sun), `weeks` columns
  const { grid, monthLabels, computedTotal, stats } = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + (6 - dayOfWeek));

    // Lookup map from prop data
    const countMap = new Map<string, number>();
    data.forEach((d) => countMap.set(d.date, d.count));

    // Direct lookup from database activity data (returns 0 if no events on that day)
    const getCount = (dateStr: string) => countMap.get(dateStr) || 0;

    let sum = 0;
    let activeDaysCount = 0;
    let maxSingleDay = 0;
    const matrix: { date: string; count: number; dayIndex: number; formatted: string }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < weeks; w++) {
      const weekCol: { date: string; count: number; dayIndex: number; formatted: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + w * 7 + d);
        const iso = cellDate.toISOString().split('T')[0];
        const count = getCount(iso);
        sum += count;
        if (count > 0) activeDaysCount++;
        if (count > maxSingleDay) maxSingleDay = count;

        weekCol.push({
          date: iso,
          count,
          dayIndex: d,
          formatted: cellDate.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        });

        // Track month label on top row (Sunday/Monday)
        if (d === 0 && cellDate.getMonth() !== lastMonth) {
          lastMonth = cellDate.getMonth();
          months.push({
            label: cellDate.toLocaleDateString(undefined, { month: 'short' }),
            weekIndex: w,
          });
        }
      }
      matrix.push(weekCol);
    }

    const totalEvents = totalContributions !== undefined ? totalContributions : sum;
    const avgPerWeek = weeks > 0 ? Math.round(totalEvents / weeks) : 0;
    const consistencyPct = totalDays > 0 ? Math.round((activeDaysCount / totalDays) * 100) : 0;

    return {
      grid: matrix,
      monthLabels: months,
      computedTotal: totalEvents,
      stats: {
        totalDays,
        activeDaysCount,
        maxSingleDay,
        avgPerWeek,
        consistencyPct,
      },
    };
  }, [data, weeks, totalContributions]);

  // Color intensity token mapper matching Fernly Forest/Emerald palette
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-surface-low border-border/50 text-transparent';
    if (count <= 2) return 'bg-emerald-500/25 border-emerald-500/35';
    if (count <= 5) return 'bg-emerald-500/50 border-emerald-500/60';
    if (count <= 8) return 'bg-emerald-600/80 border-emerald-600';
    return 'bg-brand-emerald border-brand-emerald shadow-2xs';
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div
      className={`p-4 rounded-xl bg-surface-card border border-border/80 shadow-xs card-lift ${className}`}
    >
      {/* Top Header: Total & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <div className="flex items-center gap-1.5">
              {sectionLabel ? (
                <>
                  <span className="text-sm font-bold text-text-primary">{sectionLabel}</span>
                  <span className="text-xs text-text-muted font-normal">({title})</span>
                </>
              ) : (
                <span className="text-sm font-bold text-text-primary">{title}</span>
              )}
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
              {computedTotal.toLocaleString()} Events
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            {subtitle || `Verified actions, commits, deliverable updates, and reviews across the past ${weeks} weeks.`}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted shrink-0 self-start sm:self-auto">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-surface-low border border-border/60" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/25 border border-emerald-500/35" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/50 border border-emerald-500/60" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600/80 border border-emerald-600" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-brand-emerald border border-brand-emerald" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Grid container with overflow-x-auto for small screens */}
      <div className="overflow-x-auto scrollbar-thin py-1 flex-1 flex flex-col justify-center">
        <div className="w-full flex items-start gap-2 min-w-[500px]">
          {/* Y-axis day-of-week labels */}
          <div className="flex flex-col gap-1 sm:gap-1.5 w-6 sm:w-7 text-[9px] font-mono text-text-muted select-none text-right pr-1 pt-5 shrink-0">
            {dayLabels.map((lbl, idx) => (
              <div
                key={idx}
                className="w-full aspect-square min-h-[10px] max-h-[18px] flex items-center justify-end leading-none"
              >
                {lbl}
              </div>
            ))}
          </div>

          {/* Weeks and Month Labels Area */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Month labels bar */}
            <div className="relative w-full h-4 mb-1 text-[10px] font-mono text-text-muted">
              {monthLabels.map((m, idx) => (
                <span
                  key={idx}
                  className="absolute transform -translate-x-1/2 first:translate-x-0"
                  style={{ left: `${Math.min(95, Math.max(0, (m.weekIndex / weeks) * 100))}%` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Weeks columns matrix */}
            <div className="flex items-center gap-1 sm:gap-1.5 w-full">
              {grid.map((week, wIdx) => (
                <div key={wIdx} className="flex-1 min-w-[10px] sm:min-w-[12px] flex flex-col gap-1 sm:gap-1.5">
                  {week.map((cell, dIdx) => (
                    <div
                      key={dIdx}
                      title={`${cell.formatted}: ${cell.count} action${cell.count === 1 ? '' : 's'}`}
                      className={`w-full aspect-square min-h-[10px] max-h-[18px] rounded-[3px] border transition-transform duration-100 hover:scale-135 hover:z-10 cursor-pointer ${getIntensityClass(
                        cell.count
                      )}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Metrics Boxes below heatmap */}
      {showDetails && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 mt-3 border-t border-border/60">
          <div className="p-2.5 rounded-lg bg-surface-low/60 border border-border/60 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Avg Cadence</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-base font-bold font-mono text-text-primary tabular-nums">{stats.avgPerWeek}</span>
              <span className="text-[10px] text-text-muted">events/wk</span>
            </div>
            <span className="text-[10px] text-brand-emerald font-mono mt-0.5">Rolling {weeks}-wk pace</span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-low/60 border border-border/60 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Peak Intensity</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-base font-bold font-mono text-text-primary tabular-nums">{stats.maxSingleDay}</span>
              <span className="text-[10px] text-text-muted">actions/day</span>
            </div>
            <span className="text-[10px] text-brand-emerald font-mono mt-0.5">Max daily volume</span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-low/60 border border-border/60 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Consistency</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-base font-bold font-mono text-text-primary tabular-nums">{stats.consistencyPct}%</span>
              <span className="text-[10px] text-text-muted">active days</span>
            </div>
            <span className="text-[10px] text-brand-emerald font-mono mt-0.5">{stats.activeDaysCount} of {stats.totalDays} days</span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-low/60 border border-border/60 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Cadence Status</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-base font-bold font-mono ${stats.activeDaysCount > 0 ? 'text-brand-emerald' : 'text-text-muted'}`}>
                {stats.activeDaysCount > 0 ? 'Active' : 'Idle'}
              </span>
            </div>
            <span className={`text-[10px] font-mono mt-0.5 ${stats.activeDaysCount > 0 ? 'text-brand-emerald' : 'text-text-muted'}`}>
              {stats.activeDaysCount > 0 ? 'Continuous delivery' : 'No recorded activity'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityHeatmap;
