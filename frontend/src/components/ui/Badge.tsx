import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'completed'
    | 'progress'
    | 'pending'
    | 'neutral'
    | 'critical'
    | 'high'
    | 'medium'
    | 'low'
    | 'success'
    | 'warning'
    | 'error';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-md tracking-tight',
    md: 'text-xs px-2.5 py-0.5 font-medium rounded-md tracking-tight',
  };

  const variantStyles: Record<string, string> = {
    completed: 'bg-emerald-500/15 text-brand-emerald border border-emerald-500/30',
    success: 'bg-emerald-500/15 text-brand-emerald border border-emerald-500/30',
    progress: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    pending: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    neutral: 'bg-surface-low text-text-secondary border border-border/80',
    critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
    error: 'bg-red-500/15 text-red-400 border border-red-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    high: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    medium: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    low: 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  };

  const dotColors: Record<string, string> = {
    completed: 'bg-brand-emerald',
    success: 'bg-brand-emerald',
    progress: 'bg-amber-500',
    pending: 'bg-rose-500',
    neutral: 'bg-gray-400',
    critical: 'bg-red-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    high: 'bg-amber-500',
    medium: 'bg-blue-500',
    low: 'bg-gray-400',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 whitespace-nowrap',
          sizeStyles[size],
          variantStyles[variant] || variantStyles.neutral,
          className
        )
      )}
      {...props}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant] || dotColors.neutral)} />}
      {children}
    </span>
  );
};

export interface TrendBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number | string;
  isPositive?: boolean;
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({
  value,
  isPositive = true,
  className,
  ...props
}) => {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border tracking-tight',
          isPositive
            ? 'bg-emerald-500/15 text-brand-emerald border-emerald-500/30'
            : 'bg-red-500/15 text-red-400 border-red-500/30',
          className
        )
      )}
      {...props}
    >
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {value}
    </span>
  );
};

export default Badge;
