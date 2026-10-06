import React from 'react';
import { TrendBadge } from '../ui/Badge';

export interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string;
  isPositiveTrend?: boolean;
  variant?: 'light' | 'primary' | 'emerald';
  icon?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  trend,
  isPositiveTrend = true,
  variant = 'light',
  icon,
  className = '',
}) => {
  const isDark = variant === 'primary' || variant === 'emerald';

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between h-[138px] card-lift ${
        isDark
          ? 'bg-gradient-to-br from-brand-emerald to-brand-primary text-white border-emerald-800/60 shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)]'
          : 'bg-surface-card text-text-primary border-border/80 shadow-xs hover:border-border'
      } ${className}`}
    >
      {/* Top row: Label + Action Icon */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
            isDark ? 'text-brand-emerald-light' : 'text-text-muted'
          }`}
        >
          {label}
        </span>
        {icon && (
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isDark
                ? 'bg-white/10 text-white'
                : 'bg-surface-low text-brand-emerald border border-border/60 shadow-2xs'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-2xl md:text-3xl font-bold tracking-tight font-mono tabular-nums my-0.5">
        {value}
      </div>

      {/* Bottom row: Trend chip */}
      <div className="flex items-center mt-auto">
        {trend && (
          <TrendBadge
            value={trend}
            isPositive={isPositiveTrend}
            className={
              isDark
                ? 'bg-white/10 text-brand-mint border border-white/10 font-mono tabular-nums'
                : 'font-mono tabular-nums'
            }
          />
        )}
      </div>
    </div>
  );
};

export default MetricCard;
