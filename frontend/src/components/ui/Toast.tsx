'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  success: {
    bg: 'bg-surface-card',
    border: 'border-brand-emerald/40',
    icon: CheckCircle2,
  },
  error: {
    bg: 'bg-surface-card',
    border: 'border-status-error/40',
    icon: AlertCircle,
  },
  info: {
    bg: 'bg-surface-card',
    border: 'border-brand-mint/40',
    icon: Info,
  },
  warning: {
    bg: 'bg-surface-card',
    border: 'border-amber-400/40',
    icon: AlertTriangle,
  },
};

const iconColors: Record<ToastType, string> = {
  success: 'text-brand-emerald',
  error: 'text-status-error',
  info: 'text-brand-mint-dark',
  warning: 'text-amber-500',
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const config = toastStyles[toast.type] || toastStyles.info;
  const Icon = config.icon;
  const iconColor = iconColors[toast.type] || 'text-brand-emerald';

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${config.border} ${config.bg} shadow-xl max-w-sm w-full animate-in slide-in-from-bottom-3 duration-200`}
    >
      <div className={`shrink-0 mt-0.5 ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-text-primary tracking-tight">{toast.title}</h4>
        {toast.message && (
          <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{toast.message}</p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 text-xs font-bold text-brand-emerald hover:underline focus:outline-none"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
