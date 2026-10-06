import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  children,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border/80 bg-surface-low/30 animate-in fade-in duration-200 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-surface-card border border-border/80 flex items-center justify-center text-text-muted shadow-subtle mb-3.5">
        <Icon className="w-6 h-6 text-brand-emerald/70" />
      </div>

      <h3 className="text-sm font-bold text-text-primary tracking-tight">{title}</h3>

      {description && (
        <p className="text-xs text-text-secondary max-w-sm mt-1 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default EmptyState;
