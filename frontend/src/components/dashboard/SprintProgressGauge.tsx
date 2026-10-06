import React from 'react';

interface SprintProgressGaugeProps {
  progressPct: number;
  donePoints?: number;
  totalPoints?: number;
  statusLabel?: string;
  size?: 'sm' | 'md';
}

export const SprintProgressGauge: React.FC<SprintProgressGaugeProps> = ({
  progressPct = 0,
  donePoints = 0,
  totalPoints = 0,
  statusLabel = 'Sprint Execution',
  size = 'md',
}) => {
  const normalizedPct = Math.min(100, Math.max(0, Math.round(progressPct)));
  const pendingPct = 100 - normalizedPct;

  // With pathLength=100 on an arc, strokeDasharray defines the visible slice
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="relative w-full max-w-[240px] aspect-[260/140] flex items-end justify-center">
        <svg
          viewBox="0 0 260 142"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Fernly signature diagonal hatch pattern for pending/planned capacity */}
            <pattern
              id="gaugeHatch"
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
            >
              <rect width="6" height="6" fill="transparent" />
              <path
                d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2"
                stroke="currentColor"
                strokeWidth="1.2"
                className="text-border"
              />
            </pattern>

            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--brand-emerald, #1B4D3E)" />
              <stop offset="100%" stopColor="var(--brand-mint, #34D399)" />
            </linearGradient>
          </defs>

          {/* Background Track with subtle diagonal hatch pattern */}
          <path
            d="M32 120a98 98 0 0 1 196 0"
            pathLength="100"
            fill="none"
            stroke="url(#gaugeHatch)"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Underlay base border ring */}
          <path
            d="M32 120a98 98 0 0 1 196 0"
            pathLength="100"
            fill="none"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            className="text-surface-low/80 dark:text-surface-high/30"
          />

          {/* Completed Segment Arc */}
          {normalizedPct > 0 && (
            <path
              d="M32 120a98 98 0 0 1 196 0"
              pathLength="100"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="16"
              strokeDasharray={`${normalizedPct} 100`}
              strokeDashoffset="0"
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>

        {/* Centered Large Metric Readout inside arc */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 select-none pointer-events-none">
          <span className="text-3xl md:text-4xl font-bold font-mono tracking-tight text-text-primary tabular-nums">
            {normalizedPct}%
          </span>
          <span className="text-[11px] font-semibold text-text-muted mt-0.5 tracking-tight uppercase font-mono">
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Legend & Points Summary */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald shrink-0" />
          <span className="text-text-secondary">Delivered</span>
          <span className="font-mono text-text-primary font-semibold">({donePoints} pts)</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm bg-surface-dim border border-border shrink-0" />
          <span className="text-text-muted">Remaining</span>
          <span className="font-mono text-text-muted font-semibold">
            ({Math.max(0, totalPoints - donePoints)} pts)
          </span>
        </div>
      </div>
    </div>
  );
};

export default SprintProgressGauge;
